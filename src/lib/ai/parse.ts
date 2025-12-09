import type { FilePart, ImagePart, TextPart } from "ai";
import { generateObject } from "ai";
import type { z } from "zod";
import type { GenerationOutput } from "@/types/app-state";
import type { SchemaDefinition } from "@/types/output";
import { buildCsvZodSchema, jsonToCsvRows } from "../csv";
import { buildJsonZodSchema } from "../json";
import { getParsePrompt } from "./prompts";
import { createModel, type ModelConfig } from "./providers";

export interface ParseDocumentOptions extends ModelConfig {
	documentData: string | string[];
	mimeType: string;
	schema: SchemaDefinition;
	customPrompt?: string;
	pdfEngine?: "native" | "mistral-ocr";
	filename?: string;
}

/**
 * Extracts base64 data from data URL
 */
function extractBase64(dataUrl: string): string {
	if (dataUrl.startsWith("data:")) {
		const commaIndex = dataUrl.indexOf(",");
		return commaIndex !== -1 ? dataUrl.substring(commaIndex + 1) : dataUrl;
	}
	return dataUrl;
}

export async function parseDocument({
	documentData,
	mimeType,
	schema,
	provider,
	modelId,
	apiKey,
	customPrompt,
	pdfEngine,
	filename,
}: ParseDocumentOptions): Promise<GenerationOutput> {
	const jsonType = schema.format === "json" ? schema.jsonType : undefined;
	const prompt = getParsePrompt(schema.format, customPrompt, jsonType);

	const documentDataArray = Array.isArray(documentData)
		? documentData
		: [documentData];

	const isPDF = mimeType === "application/pdf";

	const content: Array<TextPart | ImagePart | FilePart> = [
		{ type: "text", text: prompt },
	];

	// Handle PDFs with OpenRouter - use file type for native, or image for mistral-ocr
	if (provider === "openrouter" && isPDF && filename) {
		if (pdfEngine === "native") {
			// Use FilePart for native file support
			const fileData = documentDataArray[0];
			const base64Data = extractBase64(fileData);
			content.push({
				type: "file",
				data: `data:${mimeType};base64,${base64Data}`,
				mediaType: mimeType,
				filename,
			});
		} else {
			// For mistral-ocr, use image format (will be handled by plugin)
			for (const dataItem of documentDataArray) {
				const pdfData = dataItem.startsWith("data:")
					? dataItem
					: `data:application/pdf;base64,${extractBase64(dataItem)}`;
				content.push({
					type: "image",
					image: pdfData,
				});
			}
		}
	} else {
		// For non-PDF images or other providers
		for (const dataItem of documentDataArray) {
			content.push({
				type: "image",
				image: dataItem,
			});
		}
	}

	// Build plugins for mistral-ocr if needed
	const plugins =
		provider === "openrouter" &&
		isPDF &&
		pdfEngine === "mistral-ocr" &&
		filename
			? [
					{
						id: "file-parser",
						pdf: {
							engine: "mistral-ocr",
						},
					},
				]
			: undefined;

	const model = createModel({
		provider,
		modelId,
		apiKey,
		plugins,
	});

	let zodSchema: z.ZodSchema;
	switch (schema.format) {
		case "json":
			zodSchema = buildJsonZodSchema(schema);
			break;
		case "csv":
			zodSchema = buildCsvZodSchema(schema.columns);
			break;
	}

	// Build generateObject options
	const generateOptions: Parameters<typeof generateObject>[0] = {
		model,
		schema: zodSchema,
		messages: [
			{
				role: "user",
				content,
			},
		],
	};

	// Add plugins for mistral-ocr if using OpenRouter
	if (plugins && provider === "openrouter") {
		// biome-ignore lint/suspicious/noExplicitAny: OpenRouter experimental_providerMetadata is not typed in AI SDK
		(generateOptions as any).experimental_providerMetadata = {
			plugins,
		};
	}

	const result = await generateObject(generateOptions);

	switch (schema.format) {
		case "json":
			return {
				format: "json",
				data:
					schema.jsonType === "array"
						? (result.object as unknown[])
						: (result.object as object),
			};
		case "csv": {
			const dataArray = result.object as object[];
			const rows = jsonToCsvRows(dataArray);
			return {
				format: "csv",
				data: dataArray,
				rows,
			};
		}
	}
}
