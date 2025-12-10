import type { OutputFormat, SchemaDefinition } from "@/types/output";
import type { AppSettings, PageRange } from "@/types/settings";

interface CommandOptions {
	settings: AppSettings;
	document: {
		file: File | null;
		password?: string;
		pageRange: PageRange;
	};
	schema: SchemaDefinition | null;
	outputFormat: OutputFormat;
	includeApiKey?: boolean;
}

export type CommandFormat = "curl" | "httpie" | "n8n";

function convertToApiOutputFormat(
	format: OutputFormat,
	schema: SchemaDefinition | null,
): string {
	if (format === "json" && schema?.format === "json") {
		return schema.jsonType === "array" ? "json-array" : "json-object";
	}
	if (format === "csv") {
		return "csv";
	}
	return "json-object";
}

function escapeJsonForShell(json: string): string {
	return json.replace(/'/g, "'\\''");
}

function escapeJsonForHttpie(json: string): string {
	return json.replace(/"/g, '\\"');
}

function getApiKey(settings: AppSettings, includeApiKey: boolean): string {
	if (!includeApiKey) {
		return settings.provider === "google" ? "YOUR_GOOGLE_API_KEY" : "YOUR_OPENROUTER_API_KEY";
	}
	return settings.provider === "google" ? settings.googleApiKey : settings.openrouterApiKey;
}

function getOrigin(): string {
	return typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
}

export function generateCurlCommand(options: CommandOptions): string {
	const { settings, document, schema, outputFormat, includeApiKey = false } = options;

	const parts: string[] = [];
	const apiKey = getApiKey(settings, includeApiKey);

	parts.push(`-F 'provider=${settings.provider}'`);

	if (settings.provider === "google") {
		parts.push(`-F 'googleApiKey=${apiKey}'`);
		parts.push(`-F 'googleModel=${settings.googleModel}'`);
	} else {
		parts.push(`-F 'openrouterApiKey=${apiKey}'`);
		parts.push(`-F 'openrouterModel=${settings.openrouterModel}'`);
	}

	if (settings.customPrompt) {
		parts.push(`-F 'customPrompt=${escapeJsonForShell(settings.customPrompt)}'`);
	}

	if (settings.pageRange.start !== 1) {
		parts.push(`-F 'pageRangeStart=${settings.pageRange.start}'`);
	}

	if (settings.pageRange.end !== null) {
		parts.push(`-F 'pageRangeEnd=${settings.pageRange.end}'`);
	}

	if (document.file) {
		parts.push(`-F 'file=@${document.file.name}'`);
	} else {
		parts.push(`-F 'file=@/path/to/your/document.pdf'`);
	}

	const apiOutputFormat = convertToApiOutputFormat(outputFormat, schema);
	parts.push(`-F 'outputFormat=${apiOutputFormat}'`);

	if (schema) {
		const schemaJson = JSON.stringify(schema);
		parts.push(`-F 'schema=${escapeJsonForShell(schemaJson)}'`);
	}

	if (document.password) {
		parts.push(`-F 'pdfPassword=${escapeJsonForShell(document.password)}'`);
	}

	const origin = getOrigin();

	return `curl -X POST \\
  ${origin}/api/parse \\
  ${parts.join(" \\\n  ")}`;
}

export function generateHttpieCommand(options: CommandOptions): string {
	const { settings, document, schema, outputFormat, includeApiKey = false } = options;

	const parts: string[] = [];
	const apiKey = getApiKey(settings, includeApiKey);

	parts.push(`provider=${settings.provider}`);

	if (settings.provider === "google") {
		parts.push(`googleApiKey=${apiKey}`);
		parts.push(`googleModel=${settings.googleModel}`);
	} else {
		parts.push(`openrouterApiKey=${apiKey}`);
		parts.push(`openrouterModel=${settings.openrouterModel}`);
	}

	if (settings.customPrompt) {
		parts.push(`customPrompt="${escapeJsonForHttpie(settings.customPrompt)}"`);
	}

	if (settings.pageRange.start !== 1) {
		parts.push(`pageRangeStart=${settings.pageRange.start}`);
	}

	if (settings.pageRange.end !== null) {
		parts.push(`pageRangeEnd=${settings.pageRange.end}`);
	}

	if (document.file) {
		parts.push(`file@${document.file.name}`);
	} else {
		parts.push(`file@/path/to/your/document.pdf`);
	}

	const apiOutputFormat = convertToApiOutputFormat(outputFormat, schema);
	parts.push(`outputFormat=${apiOutputFormat}`);

	if (schema) {
		const schemaJson = JSON.stringify(schema);
		parts.push(`schema="${escapeJsonForHttpie(schemaJson)}"`);
	}

	if (document.password) {
		parts.push(`pdfPassword="${escapeJsonForHttpie(document.password)}"`);
	}

	const origin = getOrigin();

	return `http POST ${origin}/api/parse ${parts.join(" ")}`;
}

export function generateN8nWorkflow(options: CommandOptions): string {
	const { settings, document, schema, outputFormat, includeApiKey = false } = options;

	const apiKey = getApiKey(settings, includeApiKey);
	const origin = getOrigin();
	const apiOutputFormat = convertToApiOutputFormat(outputFormat, schema);

	const parameters: Array<{ name: string; value: string; binaryData?: boolean }> = [
		{ name: "provider", value: settings.provider },
		{ name: "outputFormat", value: apiOutputFormat },
	];

	if (settings.provider === "google") {
		parameters.push({ name: "googleApiKey", value: apiKey });
		parameters.push({ name: "googleModel", value: settings.googleModel });
	} else {
		parameters.push({ name: "openrouterApiKey", value: apiKey });
		parameters.push({ name: "openrouterModel", value: settings.openrouterModel });
	}

	if (settings.customPrompt) {
		parameters.push({ name: "customPrompt", value: settings.customPrompt });
	}

	if (settings.pageRange.start !== 1) {
		parameters.push({ name: "pageRangeStart", value: settings.pageRange.start.toString() });
	}

	if (settings.pageRange.end !== null) {
		parameters.push({ name: "pageRangeEnd", value: settings.pageRange.end.toString() });
	}

	if (document.password) {
		parameters.push({ name: "pdfPassword", value: document.password });
	}

	if (schema) {
		parameters.push({ name: "schema", value: JSON.stringify(schema) });
	}

	parameters.push({
		name: "file",
		value: document.file ? document.file.name : "/path/to/your/document.pdf",
		binaryData: true,
	});

	return JSON.stringify(
		{
			name: "Parsley API Request",
			nodes: [
				{
					parameters: {
						url: `${origin}/api/parse`,
						options: {
							bodyContentType: "multipart-form-data",
							bodyParameters: {
								parameters,
							},
						},
						authentication: "none",
						requestMethod: "POST",
					},
					id: "http-request",
					name: "HTTP Request",
					type: "n8n-nodes-base.httpRequest",
					typeVersion: 1,
					position: [250, 300],
				},
			],
			connections: {},
			active: false,
			settings: {},
			versionId: "1",
		},
		null,
		2,
	);
}

export function generateCommand(
	format: CommandFormat,
	options: CommandOptions,
): string {
	switch (format) {
		case "curl":
			return generateCurlCommand(options);
		case "httpie":
			return generateHttpieCommand(options);
		case "n8n":
			return generateN8nWorkflow(options);
		default:
			return generateCurlCommand(options);
	}
}
