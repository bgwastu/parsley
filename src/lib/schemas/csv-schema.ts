import { z } from "zod";
import type { CsvSchemaColumn } from "@/types/output";

export function buildCsvZodSchema(columns: CsvSchemaColumn[]): z.ZodSchema {
	const shape: Record<string, z.ZodTypeAny> = {};

	for (const column of columns) {
		if (!column.name) continue;

		let fieldSchema: z.ZodTypeAny;

		switch (column.type) {
			case "string":
				fieldSchema = z.string();
				break;
			case "number":
				fieldSchema = z.number();
				break;
			case "boolean":
				fieldSchema = z.boolean();
				break;
			case "date":
				fieldSchema = z.string().datetime();
				break;
		}

		if (!column.required) {
			fieldSchema = fieldSchema.optional();
		}

		shape[column.name] = fieldSchema;
	}

	return z.array(z.object(shape));
}

export const CsvSchemaColumnZodSchema = z.object({
	name: z.string(),
	type: z.enum(["string", "number", "boolean", "date"]),
	required: z.boolean(),
	description: z.string().optional(),
});

export const CsvSchemaResponseSchema = z.object({
	columns: z.array(CsvSchemaColumnZodSchema),
});
