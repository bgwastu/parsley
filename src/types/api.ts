import { z } from "zod";
import { CsvSchemaColumnZodSchema } from "@/lib/csv";
import { JsonSchemaFieldZodSchema } from "@/lib/json";
import type { OutputFormat, SchemaDefinition } from "./output";
import type { AppSettings, PageRange } from "./settings";

export const PageRangeSchema = z.object({
	start: z.number().int().min(1),
	end: z.number().int().min(1).nullable(),
});

const GoogleSettingsSchema = z.object({
	provider: z.literal("google"),
	googleApiKey: z.string().min(1, "Google API key is required"),
	googleModel: z.string().min(1, "Google model is required"),
	customPrompt: z.string().default(""),
	pageRange: PageRangeSchema,
});

const OpenRouterSettingsSchema = z.object({
	provider: z.literal("openrouter"),
	openrouterApiKey: z.string().min(1, "OpenRouter API key is required"),
	openrouterModel: z.string().min(1, "OpenRouter model is required"),
	customPrompt: z.string().default(""),
	pageRange: PageRangeSchema,
});

export const AppSettingsSchema = z.discriminatedUnion("provider", [
	GoogleSettingsSchema,
	OpenRouterSettingsSchema,
]);

export const ApiOutputFormatSchema = z.enum(["json-object", "json-array", "csv"]);

export const JsonSchemaDefinitionSchema = z.object({
	format: z.literal("json"),
	jsonType: z.enum(["object", "array"]),
	fields: z.array(JsonSchemaFieldZodSchema),
});

export const CsvSchemaDefinitionSchema = z.object({
	format: z.literal("csv"),
	columns: z.array(CsvSchemaColumnZodSchema),
});

export const SchemaDefinitionSchema = z.union([
	JsonSchemaDefinitionSchema,
	CsvSchemaDefinitionSchema,
]);

export const ApiErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		message: z.string(),
		type: z.string().optional(),
		fields: z.array(z.string()).optional(),
	}),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export type ApiSettings = z.infer<typeof AppSettingsSchema>;
export type ApiOutputFormat = z.infer<typeof ApiOutputFormatSchema>;

export interface ParseApiRequest {
	settings: AppSettings | ApiSettings;
	file: File | Buffer;
	outputFormat: OutputFormat | ApiOutputFormat;
	schema?: SchemaDefinition;
	pdfPassword?: string;
	pdfRange?: PageRange;
}
