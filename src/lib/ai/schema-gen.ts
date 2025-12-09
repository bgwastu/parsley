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

	// Handle PDFs with OpenRouter - always use native file support
	if (provider === "openrouter" && isPDF && filename) {
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
		// For non-PDF images or other providers
		for (const dataItem of documentDataArray) {
			content.push({
				type: "image",
				image: dataItem,
			});
		}
	}

	const model = createModel({
		provider,
		modelId,
		apiKey,
	});

	switch (format) {
		case "json": {
			const result = await generateObject({
				model,
				messages: [
					{
						role: "user",
						content,
					},
				],
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
				model,
				messages: [
					{
						role: "user",
						content,
					},
				],
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
