import type { FilePart, ImagePart, TextPart } from "ai";
import { generateObject } from "ai";
import type {
	CsvSchemaColumn,
	JsonSchemaField,
	OutputFormat,
	SchemaDefinition,
} from "@/types/output";
import { CsvSchemaResponseSchema } from "../csv";
import { JsonSchemaResponseSchema } from "../json";
import {
	getSchemaGenerationPrompt,
	type SchemaGenerationContext,
} from "./prompts";
import { createModel, type ModelConfig } from "./providers";

export interface GenerateSchemaOptions extends ModelConfig {
	documentData: string | string[];
	format: OutputFormat;
	filename?: string;
	mimeType?: string;
	jsonType?: "object" | "array";
	pdfEngine?: "native" | "mistral-ocr";
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

export async function generateSchemaFromDocument({
	documentData,
	format,
	provider,
	modelId,
	apiKey,
	filename,
	mimeType,
	jsonType,
	pdfEngine,
}: GenerateSchemaOptions): Promise<SchemaDefinition> {
	const context: SchemaGenerationContext = {
		filename,
		mimeType,
		jsonType,
	};
	const prompt = getSchemaGenerationPrompt(format, context);

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

	// Build generateObject options
	const generateOptions: Parameters<typeof generateObject>[0] = {
		model,
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

	switch (format) {
		case "json": {
			const result = await generateObject({
				...generateOptions,
				schema: JsonSchemaResponseSchema,
			});
			const response = Array.isArray(result.object)
				? (result.object[0] as { fields: JsonSchemaField[] })
				: (result.object as { fields: JsonSchemaField[] });
			return {
				format: "json",
				jsonType: "object",
				fields: response.fields,
			};
		}
		case "csv": {
			const result = await generateObject({
				...generateOptions,
				schema: CsvSchemaResponseSchema,
			});
			const response = Array.isArray(result.object)
				? (result.object[0] as { columns: CsvSchemaColumn[] })
				: (result.object as { columns: CsvSchemaColumn[] });
			return {
				format: "csv",
				columns: response.columns,
			};
		}
	}
}
