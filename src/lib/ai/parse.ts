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

	let zodSchema: z.ZodSchema;
	switch (schema.format) {
		case "json":
			zodSchema = buildJsonZodSchema(schema);
			break;
		case "csv":
			zodSchema = buildCsvZodSchema(schema.columns);
			break;
	}

	let result: { object: unknown };
	try {
		result = await generateObject({
			model,
			schema: zodSchema,
			messages: [
				{
					role: "user",
					content,
				},
			],
		});
	} catch (error) {
		// Provide more helpful error messages for schema validation failures
		if (error instanceof Error) {
			if (error.message.includes("schema") || error.message.includes("validation")) {
				throw new Error(
					`Schema validation failed: The AI response did not match the expected schema. This might happen if:\n- The document doesn't contain data matching your schema\n- Date formats don't match expected format\n- Required fields are missing\n\nOriginal error: ${error.message}`,
				);
			}
		}
		throw error;
	}

	switch (schema.format) {
		case "json": {
			let jsonData: object | unknown[];
			if (schema.jsonType === "array") {
				// Ensure we always return an array for jsonType === "array"
				jsonData = Array.isArray(result.object)
					? result.object
					: [result.object];
			} else {
				jsonData = result.object as object;
			}
			return {
				format: "json",
				data: jsonData,
			};
		}
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
