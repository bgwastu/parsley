import { createFileRoute } from "@tanstack/react-router";
import { Code, Settings } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { ApiDialog } from "@/components/api-dialog";
import { AppLogo } from "@/components/app-logo";
import { DocumentUpload } from "@/components/document-upload";
import { FormatSelector } from "@/components/format-selector";
import { GenerateButton } from "@/components/generate-button";
import { OutputDisplay } from "@/components/output-display";
import { PasswordDialog } from "@/components/password-dialog";
import { SchemaSection } from "@/components/schema-section";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app-state";
import { useSettings } from "@/hooks/use-settings";
import { parseDocument } from "@/lib/ai/parse";
import { generateSchemaFromDocument } from "@/lib/ai/schema-gen";
import {
	readFileAsArrayBuffer,
	readFileAsBase64,
} from "@/lib/client/file-utils";
import { decryptPDF, validatePDFPassword } from "@/lib/client/pdf";

export const Route = createFileRoute("/")({
	component: App,
	ssr: false,
	head: () => ({
		meta: [
			{
				property: "og:url",
				content: "https://parsley.wastu.net",
			},
			{
				property: "og:image",
				content: "/og.jpg",
			},
			{
				property: "og:title",
				content: "Parsley",
			},
			{
				property: "og:description",
				content: "Turn any document into structured data, instantly",
			},
			{
				name: "twitter:url",
				content: "https://parsley.wastu.net",
			},
			{
				name: "twitter:image",
				content: "/og.jpg",
			},
			{
				name: "twitter:title",
				content: "Parsley",
			},
			{
				name: "twitter:description",
				content: "Turn any document into structured data, instantly",
			},
		],
	}),
});

function App() {
	const [settings, setSettings] = useSettings();
	const { state, actions } = useAppState();

	useEffect(() => {
		const isConfigured =
			(settings.provider === "google" &&
				settings.googleApiKey &&
				settings.googleModel) ||
			(settings.provider === "openrouter" &&
				settings.openrouterApiKey &&
				settings.openrouterModel);

		if (!isConfigured) {
			actions.setSettingsOpen(true);
		}
	}, [
		settings.provider,
		settings.googleApiKey,
		settings.googleModel,
		settings.openrouterApiKey,
		settings.openrouterModel,
		actions.setSettingsOpen,
	]);

	useEffect(() => {
		actions.setSettings(settings);
	}, [settings, actions.setSettings]);

	// Show Sonner toast when errors are set in state
	useEffect(() => {
		if (state.generation.error) {
			const error = state.generation.error;
			let errorMessage = error.message;

			if (error.type === "validation_error" && error.fields) {
				errorMessage = `${error.message}\nFields: ${error.fields.join(", ")}`;
			}

			toast.error(errorMessage);
		}
	}, [state.generation.error]);

	const showPasswordDialog = (): Promise<string> => {
		return new Promise((resolve, reject) => {
			actions.showPasswordDialog(resolve, reject);
		});
	};

	const handlePasswordSubmit = async (password: string) => {
		if (!state.ui.passwordDialog?.resolve || !state.document.file) {
			return;
		}

		actions.setPasswordValidating(true);
		actions.setPasswordError("");

		try {
			const arrayBuffer = await readFileAsArrayBuffer(state.document.file);
			const isValid = await validatePDFPassword(arrayBuffer, password);

			if (!isValid) {
				actions.setPasswordError("Incorrect password. Please try again.");
				actions.setPasswordValidating(false);
				return;
			}

			actions.setPdfPassword(password);
			actions.setPasswordValidating(false);
			if (state.ui.passwordDialog?.resolve) {
				state.ui.passwordDialog.resolve(password);
			}
			actions.hidePasswordDialog();
		} catch {
			actions.setPasswordError("Failed to validate password.");
			actions.setPasswordValidating(false);
		}
	};

	const handlePasswordCancel = () => {
		if (state.ui.passwordDialog?.reject) {
			state.ui.passwordDialog.reject();
		}
		actions.hidePasswordDialog();
		actions.setDocument(null);
		actions.setPdfPassword("");
		actions.setError({
			type: "document_processing_error",
			message: "PDF parsing cancelled",
		});
	};

	const handleFileUploaded = async (file: File) => {
		if (file.type === "application/pdf") {
			try {
				const arrayBuffer = await readFileAsArrayBuffer(file);
				const isValid = await validatePDFPassword(
					arrayBuffer,
					state.document.password,
				);

				if (!isValid) {
					// PDF is password-protected, show password dialog
					if (state.document.password) {
						actions.setPdfPassword("");
					}
					await showPasswordDialog();
				}
			} catch {
				// Password dialog will handle the error
			}
		}
	};

	const handleGenerateSchema = async () => {
		if (!state.document.file) {
			toast.error("Please upload a document first");
			return;
		}

		actions.startSchemaGeneration();

		try {
			let documentData: string | string[];

			if (
				state.document.file.type === "application/pdf" &&
				state.document.password
			) {
				// Password-protected PDF: decrypt it first
				const arrayBuffer = await readFileAsArrayBuffer(state.document.file);
				documentData = await decryptPDF(
					arrayBuffer,
					state.document.password,
					state.document.pageRange,
				);
			} else {
				// Non-password PDF or image: send raw file data
				documentData = await readFileAsBase64(state.document.file);
			}

			const currentSchema = state.schemas[state.outputFormat];
			const currentJsonType =
				state.outputFormat === "json" && currentSchema?.format === "json"
					? currentSchema.jsonType
					: undefined;

			const generatedSchema = await generateSchemaFromDocument({
				documentData,
				format: state.outputFormat,
				provider: settings.provider,
				modelId:
					settings.provider === "google"
						? settings.googleModel
						: settings.openrouterModel,
				apiKey:
					settings.provider === "google"
						? settings.googleApiKey
						: settings.openrouterApiKey,
				filename: state.document.file.name,
				mimeType: state.document.file.type,
				jsonType: currentJsonType,
			});

			// Preserve jsonType if currently in array mode
			const finalSchema =
				generatedSchema.format === "json" &&
				currentSchema?.format === "json" &&
				currentSchema.jsonType === "array"
					? { ...generatedSchema, jsonType: "array" as const }
					: generatedSchema;

			actions.finishSchemaGeneration(finalSchema);
			const fieldCount =
				generatedSchema.format === "json"
					? generatedSchema.fields.length
					: generatedSchema.columns.length;
			toast.success(`Generated schema with ${fieldCount} fields`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to generate schema";
			actions.setError({
				type: "api_error",
				message: errorMessage,
			});
		}
	};

	const handleParse = async () => {
		if (!state.document.file) {
			toast.error("Please upload a document");
			return;
		}
		const schema = state.schemas[state.outputFormat];
		if (!schema) {
			toast.error("Please define a schema");
			return;
		}

		const duplicateNames =
			schema.format === "json"
				? schema.fields
						.map((f) => f.name)
						.filter((name, index, arr) => name && arr.indexOf(name) !== index)
				: schema.columns
						.map((c) => c.name)
						.filter((name, index, arr) => name && arr.indexOf(name) !== index);

		if (duplicateNames.length > 0) {
			toast.error(`Duplicate field names: ${duplicateNames.join(", ")}`);
			return;
		}

		actions.startParsing();

		try {
			let documentData: string | string[];

			if (
				state.document.file.type === "application/pdf" &&
				state.document.password
			) {
				// Password-protected PDF: decrypt it first
				const arrayBuffer = await readFileAsArrayBuffer(state.document.file);
				documentData = await decryptPDF(
					arrayBuffer,
					state.document.password,
					state.document.pageRange,
				);
			} else {
				// Non-password PDF or image: send raw file data
				documentData = await readFileAsBase64(state.document.file);
			}

			const result = await parseDocument({
				documentData,
				mimeType: state.document.file.type,
				schema,
				provider: settings.provider,
				modelId:
					settings.provider === "google"
						? settings.googleModel
						: settings.openrouterModel,
				apiKey:
					settings.provider === "google"
						? settings.googleApiKey
						: settings.openrouterApiKey,
				customPrompt: settings.customPrompt,
				filename: state.document.file.name,
			});

			actions.finishParsing(result);
			toast.success("Document parsed successfully");
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to parse document";
			actions.setError({
				type: "api_error",
				message: errorMessage,
			});
		}
	};

	const isConfigured = Boolean(
		(settings.provider === "google" &&
			settings.googleApiKey &&
			settings.googleModel) ||
			(settings.provider === "openrouter" &&
				settings.openrouterApiKey &&
				settings.openrouterModel),
	);

	return (
		<main className="container mx-auto p-6 w-full max-w-3xl">
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<AppLogo />
						<div>
							<h1 className="font-bold text-3xl">Parsley</h1>
							<p className="text-muted-foreground">
								Turn any document into structured data, instantly
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => actions.setApiDialogOpen(true)}
						>
							<Code className="h-4 w-4 mr-1" />
							API
						</Button>

						<div className="relative">
							<Button
								variant="outline"
								size="sm"
								onClick={() => actions.setSettingsOpen(true)}
							>
								<Settings className="h-4 w-4 mr-1" />
								Settings
							</Button>
							{!isConfigured && (
								<span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-background" />
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<DocumentUpload
					value={state.document.file}
					onChange={actions.setDocument}
					pageRange={state.document.pageRange}
					onPageRangeChange={actions.setPageRange}
					onFileUploaded={handleFileUploaded}
				/>

				<FormatSelector
					value={state.outputFormat}
					onChange={actions.setOutputFormat}
					disabled={state.generation.isParsing}
				/>

				<SchemaSection
					format={state.outputFormat}
					schema={state.schemas[state.outputFormat]}
					onChange={(schema) => actions.setSchema(state.outputFormat, schema)}
					onGenerateSchema={handleGenerateSchema}
					isGenerating={state.generation.isGeneratingSchema}
					hasDocument={state.document.file !== null}
					isConfigured={isConfigured}
				/>

				<GenerateButton
					onClick={handleParse}
					isLoading={state.generation.isParsing}
					disabled={
						state.generation.isParsing ||
						!isConfigured ||
						state.schemas[state.outputFormat] === null
					}
					hasDocument={state.document.file !== null}
					hasSchema={state.schemas[state.outputFormat] !== null}
				/>

				{state.output && (
					<OutputDisplay
						output={state.output}
						jsonPage={state.outputViewState.jsonPage}
						csvPage={state.outputViewState.csvPage}
						csvPageSize={state.outputViewState.csvPageSize}
						onJsonPageChange={actions.setJsonPage}
						onCsvPageChange={actions.setCsvPage}
						onCsvPageSizeChange={actions.setCsvPageSize}
					/>
				)}
			</div>

			<SettingsDialog
				open={state.ui.settingsOpen}
				onOpenChange={actions.setSettingsOpen}
				settings={settings}
				onSettingsChange={setSettings}
			/>

			<ApiDialog
				open={state.ui.apiDialogOpen}
				onOpenChange={actions.setApiDialogOpen}
				settings={state.settings}
				document={state.document}
				schema={state.schemas[state.outputFormat]}
				outputFormat={state.outputFormat}
			/>

			<PasswordDialog
				open={state.ui.passwordDialog?.isOpen ?? false}
				onSubmit={handlePasswordSubmit}
				onCancel={handlePasswordCancel}
				error={state.ui.passwordDialog?.error}
				isValidating={state.ui.passwordDialog?.isValidating ?? false}
			/>
		</main>
	);
}
