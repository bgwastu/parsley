export type OutputFormat = "json" | "csv";

export interface JsonSchemaField {
	name: string;
	type: "string" | "number" | "boolean" | "date" | "array" | "object";
	required: boolean;
	description?: string;
	arrayItemType?: "string" | "number" | "boolean";
	children?: JsonSchemaField[];
}

export interface CsvSchemaColumn {
	name: string;
	type: "string" | "number" | "boolean" | "date";
	required: boolean;
	description?: string;
}

export type SchemaDefinition =
	| { format: "json"; jsonType: "object" | "array"; fields: JsonSchemaField[] }
	| { format: "csv"; columns: CsvSchemaColumn[] };
