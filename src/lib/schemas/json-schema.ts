import { z } from "zod";
import type { JsonSchemaField, SchemaDefinition } from "@/types/output";

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
		case "object":
			if (field.children && field.children.length > 0) {
				fieldSchema = buildJsonZodSchemaFromFields(field.children);
			} else {
				fieldSchema = z.object({});
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

export function buildJsonZodSchema(schema: SchemaDefinition & { format: "json" }): z.ZodSchema {
	if (schema.jsonType === "array") {
		// Array of objects - use fields to define the object structure
		return z.array(buildJsonZodSchemaFromFields(schema.fields));
	}
	// Object format
	return buildJsonZodSchemaFromFields(schema.fields);
}

// Define the schema without lazy evaluation to work with Google AI Studio
// Google's API doesn't handle z.lazy() properly when converting to JSON Schema
// We use z.any() for the children array to avoid recursive reference issues
export const JsonSchemaFieldZodSchema: z.ZodType<JsonSchemaField> = z.object({
	name: z.string(),
	type: z.enum(["string", "number", "boolean", "date", "array", "object"]),
	required: z.boolean(),
	description: z.string().optional(),
	arrayItemType: z.enum(["string", "number", "boolean"]).optional(),
	children: z.array(z.any()).optional(), // Use z.any() instead of lazy to avoid Google API issues
}) as z.ZodType<JsonSchemaField>;

export const JsonSchemaResponseSchema = z.object({
	fields: z.array(JsonSchemaFieldZodSchema),
});
