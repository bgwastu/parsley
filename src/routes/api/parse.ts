import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { z } from "zod";
import { parseDocument } from "@/lib/ai/parse";
import { generateSchemaFromDocument } from "@/lib/ai/schema-gen";
import {
	aj,
	demoRateLimit,
	toArcjetRequest,
	userProvidedRateLimit,
} from "@/lib/server/arcjet";
import { OPENROUTER_API_KEY } from "@/lib/server/env";
import {
	bufferToBase64DataUrl,
	validateFileSize,
	validateFileSizeForDemo,
	validateFileType,
} from "@/lib/server/file-utils";
import { decryptPDFServer } from "@/lib/server/pdf";
import {
	type ApiErrorResponse,
	type ApiOutputFormat,
	ApiOutputFormatSchema,
	AppSettingsSchema,
	PageRangeSchema,
	SchemaDefinitionSchema,
} from "@/types/api";
import type { OutputFormat, SchemaDefinition } from "@/types/output";

const ParseRequestSchema = z.object({
	settings: AppSettingsSchema,
	file: z.instanceof(File),
	outputFormat: ApiOutputFormatSchema,
	schema: SchemaDefinitionSchema.optional(),
	pdfPassword: z.string().optional(),
	pdfRange: PageRangeSchema.optional(),
});

function parseFormData(formData: FormData) {
	const provider = formData.get("provider");
	const fileEntry = formData.get("file");
	const outputFormatStr = formData.get("outputFormat");
	const schemaStr = formData.get("schema");
	const pdfPasswordStr = formData.get("pdfPassword");
	const customPrompt = formData.get("customPrompt");
	const pageRangeStartStr = formData.get("pageRangeStart");
	const pageRangeEndStr = formData.get("pageRangeEnd");

	if (!provider || !fileEntry || !outputFormatStr) {
		throw new Error(
			"Missing required fields: provider, file, and outputFormat are required",
		);
	}

	if (typeof provider !== "string" || typeof outputFormatStr !== "string") {
		throw new Error("provider and outputFormat must be strings");
	}

	if (!(fileEntry instanceof File)) {
		throw new Error("file must be a File");
	}

	const pageRange = {
		start: pageRangeStartStr && typeof pageRangeStartStr === "string" ? Number.parseInt(pageRangeStartStr, 10) : 1,
		end: pageRangeEndStr && typeof pageRangeEndStr === "string" && pageRangeEndStr !== "" ? Number.parseInt(pageRangeEndStr, 10) : null,
	};

	let settingsJson: unknown;
	if (provider === "google") {
		const googleApiKey = formData.get("googleApiKey");
		const googleModel = formData.get("googleModel");

		if (!googleApiKey || typeof googleApiKey !== "string") {
			throw new Error("googleApiKey is required for Google provider");
		}
		if (!googleModel || typeof googleModel !== "string") {
			throw new Error("googleModel is required for Google provider");
		}

		settingsJson = {
			provider: "google",
			googleApiKey,
			googleModel,
			customPrompt: customPrompt && typeof customPrompt === "string" ? customPrompt : "",
			pageRange,
		};
	} else if (provider === "openrouter") {
		const openrouterApiKey = formData.get("openrouterApiKey");
		const openrouterModel = formData.get("openrouterModel");

		if (!openrouterApiKey || typeof openrouterApiKey !== "string") {
			throw new Error("openrouterApiKey is required for OpenRouter provider");
		}
		if (!openrouterModel || typeof openrouterModel !== "string") {
			throw new Error("openrouterModel is required for OpenRouter provider");
		}

		settingsJson = {
			provider: "openrouter",
			openrouterApiKey,
			openrouterModel,
			customPrompt: customPrompt && typeof customPrompt === "string" ? customPrompt : "",
			pageRange,
		};
	} else if (provider === "demo") {
		throw new Error("Demo provider is not available for API usage. Please use 'google' or 'openrouter' with your own API key.");
	} else {
		throw new Error("Invalid provider. Must be 'google' or 'openrouter'");
	}

	let schemaJson: unknown;
	if (schemaStr && typeof schemaStr === "string") {
		try {
			schemaJson = JSON.parse(schemaStr);
		} catch {
			throw new Error("Invalid JSON in schema field");
		}
	}

	return ParseRequestSchema.parse({
		settings: settingsJson,
		file: fileEntry,
		outputFormat: outputFormatStr,
		schema: schemaJson,
		pdfPassword:
			pdfPasswordStr && typeof pdfPasswordStr === "string"
				? pdfPasswordStr
				: undefined,
		pdfRange: pageRange,
	});
}

function convertApiOutputFormat(apiFormat: ApiOutputFormat): {
	format: OutputFormat;
	jsonType?: "object" | "array";
} {
	switch (apiFormat) {
		case "json-object":
			return { format: "json", jsonType: "object" };
		case "json-array":
			return { format: "json", jsonType: "array" };
		case "csv":
			return { format: "csv" };
	}
}

async function handleParseRequest(
	formData: FormData,
): Promise<unknown | ApiErrorResponse> {
	try {
		const validatedData = parseFormData(formData);
		const { settings, file, outputFormat, schema, pdfPassword, pdfRange } =
			validatedData;

		const fileBuffer = Buffer.from(await file.arrayBuffer());
		const mimeType = file.type || "application/octet-stream";
		const filename = file.name || "document";

		if (settings.provider === "demo") {
			validateFileSizeForDemo(fileBuffer.length);
		} else {
			validateFileSize(fileBuffer.length);
		}
		validateFileType(mimeType);

		let documentData: string;

		if (mimeType === "application/pdf" && pdfPassword) {
			documentData = await decryptPDFServer(
				fileBuffer,
				pdfPassword,
				pdfRange,
			);
		} else {
			documentData = bufferToBase64DataUrl(fileBuffer, mimeType);
		}

		const { format, jsonType } = convertApiOutputFormat(outputFormat);

		const modelConfig = {
			provider: settings.provider,
			modelId:
				settings.provider === "google"
					? settings.googleModel
					: settings.provider === "openrouter"
						? settings.openrouterModel
						: undefined,
			apiKey:
				settings.provider === "google"
					? settings.googleApiKey
					: settings.provider === "openrouter"
						? settings.openrouterApiKey
						: OPENROUTER_API_KEY,
		};

		let finalSchema: SchemaDefinition;
		if (!schema) {
			finalSchema = await generateSchemaFromDocument({
				documentData,
				format,
				...modelConfig,
				filename,
				mimeType,
				jsonType,
			});
		} else {
			finalSchema = schema;
		}

		const result = await parseDocument({
			documentData,
			mimeType,
			schema: finalSchema,
			...modelConfig,
			customPrompt: settings.customPrompt,
			filename,
		});

		// Return data directly
		return result.data;
	} catch (error) {
		console.error("API error:", error);

		let errorType = "api_error";
		let message = "An unexpected error occurred";

		if (error instanceof z.ZodError) {
			const issues = error.issues.map((issue) => {
				const path = issue.path.join(".");
				return `${path}: ${issue.message}`;
			});
			message = `Validation error: ${issues.join(", ")}`;
			errorType = "validation_error";
		} else if (error instanceof Error) {
			message = error.message;

			if (message.includes("validation") || message.includes("schema")) {
				errorType = "validation_error";
			} else if (
				message.includes("document") ||
				message.includes("PDF") ||
				message.includes("decrypt")
			) {
				errorType = "document_processing_error";
			}
		}

		return {
			success: false,
			error: {
				message,
				type: errorType,
			},
		};
	}
}

export const Route = createFileRoute("/api/parse")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const formData = await request.formData();
				const provider = formData.get("provider");

				const decision = await aj
					.withRule(
						provider === "demo" ? demoRateLimit : userProvidedRateLimit,
					)
					.protect(toArcjetRequest(request));

				if (decision.isDenied()) {
					if (decision.reason.isRateLimit()) {
						return json(
							{
								success: false,
								error: {
									message:
										provider === "demo"
											? "Rate limit exceeded. Demo provider allows 3 documents per day. Consider using your own API key for unlimited access."
											: "Rate limit exceeded. Please try again later.",
									type: "rate_limit_error",
								},
							},
							{ status: 429 },
						);
					}

					if (decision.reason.isBot()) {
						return json(
							{
								success: false,
								error: {
									message: "Request blocked: automated client detected.",
									type: "bot_detection_error",
								},
							},
							{ status: 403 },
						);
					}

					return json(
						{
							success: false,
							error: {
								message: "Request blocked by security rules.",
								type: "security_error",
							},
						},
						{ status: 403 },
					);
				}

				const result = await handleParseRequest(formData);
				const isError =
					result &&
					typeof result === "object" &&
					"success" in result &&
					result.success === false;
				return json(result, {
					status: isError ? 400 : 200,
				});
			},
		},
	},
});
