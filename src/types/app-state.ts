import type { OutputFormat, SchemaDefinition } from "./output";
import type { AppSettings, PageRange } from "./settings";

export interface AppState {
	document: {
		file: File | null;
		pageRange: PageRange;
		password?: string; // Store password for password-protected PDFs
	};
	outputFormat: OutputFormat;
	schemas: {
		json: SchemaDefinition | null;
		csv: SchemaDefinition | null;
	};
	generation: {
		isGeneratingSchema: boolean;
		isParsing: boolean;
		error: GenerationError | null;
	};
	output: GenerationOutput | null;
	settings: AppSettings;
	ui: {
		settingsOpen: boolean;
		passwordDialog: PasswordDialogState | null;
		apiDialogOpen: boolean;
	};
	outputViewState: {
		jsonPage: number;
		csvPage: number;
		csvPageSize: number;
	};
}

export type GenerationError =
	| { type: "api_error"; message: string; code?: string }
	| { type: "network_error"; message: string }
	| { type: "validation_error"; message: string; fields?: string[] }
	| { type: "document_processing_error"; message: string }
	| { type: "template_error"; message: string };

export type GenerationOutput =
	| { format: "json"; data: object | unknown[] }
	| { format: "csv"; data: object[]; rows: string[][] };

export interface PasswordDialogState {
	isOpen: boolean;
	error?: string;
	isValidating?: boolean;
	resolve: (password: string) => void;
	reject: () => void;
}
