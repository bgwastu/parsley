// ABOUTME: Demo document parsing API endpoint for server-side AI requests
// ABOUTME: Parses documents using server-managed API key with rate limiting

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { z } from "zod";
import { parseDocument } from "@/lib/ai/parse";
import { demoParseRateLimit, protectWithArcjet } from "@/lib/server/arcjet";
import { OPENROUTER_API_KEY } from "@/lib/server/env";
import {
	bufferToBase64DataUrl,
	validateFileSize,
	validateFileType,
} from "@/lib/server/file-utils";
import { decryptPDFServer } from "@/lib/server/pdf";
import {
	type ApiErrorResponse,
	type ApiOutputFormat,
	ApiOutputFormatSchema,
	PageRangeSchema,
	SchemaDefinitionSchema,
} from "@/types/api";
import type { OutputFormat } from "@/types/output";

const DemoParseRequestSchema = z.object({
	file: z.instanceof(File),
	outputFormat: ApiOutputFormatSchema,
	schema: SchemaDefinitionSchema,
	customPrompt: z.string().optional(),
	pdfPassword: z.string().optional(),
	pdfRange: PageRangeSchema.optional(),
});

function parseDemoFormData(formData: FormData) {
	const fileEntry = formData.get("file");
	const outputFormatStr = formData.get("outputFormat");
	const schemaStr = formData.get("schema");
	const customPrompt = formData.get("customPrompt");
	const pdfPasswordStr = formData.get("pdfPassword");
	const pageRangeStartStr = formData.get("pageRangeStart");
	const pageRangeEndStr = formData.get("pageRangeEnd");

	if (!fileEntry || !outputFormatStr || !schemaStr) {
		throw new Error(
			"Missing required fields: file, outputFormat, and schema are required",
		);
	}

	if (typeof outputFormatStr !== "string" || typeof schemaStr !== "string") {
		throw new Error("outputFormat and schema must be strings");
	}

	if (!(fileEntry instanceof File)) {
		throw new Error("file must be a File");
	}

	const pageRange = {
		start:
			pageRangeStartStr && typeof pageRangeStartStr === "string"
				? Number.parseInt(pageRangeStartStr, 10)
				: 1,
		end:
			pageRangeEndStr &&
			typeof pageRangeEndStr === "string" &&
			pageRangeEndStr !== ""
				? Number.parseInt(pageRangeEndStr, 10)
				: null,
	};

	let schemaJson: unknown;
	try {
		schemaJson = JSON.parse(schemaStr);
	} catch {
		throw new Error("Invalid JSON in schema field");
	}

	return DemoParseRequestSchema.parse({
		file: fileEntry,
		outputFormat: outputFormatStr,
		schema: schemaJson,
		customPrompt:
			customPrompt && typeof customPrompt === "string" ? customPrompt : "",
		pdfPassword:
			pdfPasswordStr && typeof pdfPasswordStr === "string"
				? pdfPasswordStr
				: undefined,
		pdfRange: pageRange,
	});
}

async function handleDemoParse(
	formData: FormData,
): Promise<unknown | ApiErrorResponse> {
	try {
		const validatedData = parseDemoFormData(formData);
		const { file, schema, customPrompt, pdfPassword, pdfRange } =
			validatedData;

		const fileBuffer = Buffer.from(await file.arrayBuffer());
		const mimeType = file.type || "application/octet-stream";
		const filename = file.name || "document";

		validateFileSize(fileBuffer.length);
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

		const result = await parseDocument({
			documentData,
			mimeType,
			schema,
			provider: "openrouter",
			modelId: "google/gemini-2.5-flash-lite",
			apiKey: OPENROUTER_API_KEY,
			customPrompt,
			filename,
		});

		return result;
	} catch (error) {
		console.error("Demo parse error:", error);

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

export const Route = createFileRoute("/api/demo-parse")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const formData = await request.formData();

				const decision = await protectWithArcjet(request, demoParseRateLimit);

				if (decision.isDenied()) {
					if (decision.reason.isRateLimit()) {
						return json(
							{
								success: false,
								error: {
									message:
										"Demo parsing limit reached (3/day). Add your own API key in Settings for unlimited access.",
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

				const result = await handleDemoParse(formData);
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
