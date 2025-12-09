import { z } from "zod";
import type { JsonSchemaField, SchemaDefinition } from "@/types/output";

export function formatJson(data: object, pretty = true): string {
	return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

export function downloadJson(data: object, filename: string): void {
	const jsonString = formatJson(data);
	const blob = new Blob([jsonString], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

function buildFieldSchema(field: JsonSchemaField): z.ZodTypeAny {
	let fieldSchema: z.ZodTypeAny;

	switch (field.type) {
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
		case "array":
			switch (field.arrayItemType) {
				case "number":
					fieldSchema = z.array(z.number());
					break;
				case "boolean":
					fieldSchema = z.array(z.boolean());
					break;
				default:
					fieldSchema = z.array(z.string());
			}
			break;
		default:
			fieldSchema = z.any();
	}

	if (!field.required) {
		fieldSchema = fieldSchema.optional();
	}

	return fieldSchema;
}

function buildJsonZodSchemaFromFields(fields: JsonSchemaField[]): z.ZodSchema {
	const shape: Record<string, z.ZodTypeAny> = {};

	for (const field of fields) {
		if (!field.name) continue;
		shape[field.name] = buildFieldSchema(field);
	}

	return z.object(shape);
}

export function buildJsonZodSchema(
	schema: SchemaDefinition & { format: "json" },
): z.ZodSchema {
	if (schema.jsonType === "array") {
		return z.array(buildJsonZodSchemaFromFields(schema.fields));
	}
	return buildJsonZodSchemaFromFields(schema.fields);
}

export const JsonSchemaFieldZodSchema: z.ZodType<JsonSchemaField> = z.object({
	name: z.string(),
	type: z.enum(["string", "number", "boolean", "date", "array"]),
	required: z.boolean(),
	description: z.string().optional(),
	arrayItemType: z.enum(["string", "number", "boolean"]).optional(),
}) as z.ZodType<JsonSchemaField>;

export const JsonSchemaResponseSchema = z.object({
	fields: z.array(JsonSchemaFieldZodSchema),
});
