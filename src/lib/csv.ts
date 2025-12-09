import { Parser } from "@json2csv/plainjs";
import { z } from "zod";
import type { CsvSchemaColumn } from "@/types/output";

export function jsonToCsv(data: object | object[]): string {
	try {
		const dataArray = Array.isArray(data) ? data : [data];
		const parser = new Parser();
		return parser.parse(dataArray);
	} catch (error) {
		throw new Error(
			`Failed to convert JSON to CSV: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

export function jsonToCsvRows(data: object[]): string[][] {
	if (data.length === 0) return [];

	const keys = Object.keys(data[0]);
	const rows: string[][] = [keys];

	for (const item of data) {
		const row = keys.map((key) => {
			const value = (item as Record<string, unknown>)[key];
			return value !== undefined && value !== null ? String(value) : "";
		});
		rows.push(row);
	}

	return rows;
}

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
