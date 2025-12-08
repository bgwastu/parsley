import { useCallback, useReducer } from "react";
import type {
	AppState,
	GenerationError,
	GenerationOutput,
} from "@/types/app-state";
import type { OutputFormat, SchemaDefinition } from "@/types/output";
import type { AppSettings, PageRange } from "@/types/settings";
import { useSettings } from "./use-settings";

type AppAction =
	| { type: "SET_DOCUMENT"; payload: { file: File | null } }
	| { type: "SET_PAGE_RANGE"; payload: PageRange }
	| { type: "SET_PDF_PASSWORD"; payload: string }
	| { type: "SET_PASSWORD_VALIDATING"; payload: boolean }
	| { type: "SET_OUTPUT_FORMAT"; payload: OutputFormat }
	| { type: "SET_SCHEMA"; payload: SchemaDefinition | null }
	| { type: "SET_SETTINGS"; payload: AppSettings }
	| { type: "START_SCHEMA_GENERATION" }
	| { type: "FINISH_SCHEMA_GENERATION"; payload: SchemaDefinition }
	| { type: "START_PARSING" }
	| { type: "FINISH_PARSING"; payload: GenerationOutput }
	| { type: "SET_ERROR"; payload: GenerationError }
	| { type: "CLEAR_ERROR" }
	| { type: "SET_SETTINGS_OPEN"; payload: boolean }
	| {
			type: "SHOW_PASSWORD_DIALOG";
			payload: { resolve: (pwd: string) => void; reject: () => void };
	  }
	| { type: "HIDE_PASSWORD_DIALOG" }
	| { type: "SET_PASSWORD_ERROR"; payload: string }
	| { type: "SET_JSON_PAGE"; payload: number }
	| { type: "SET_CSV_PAGE"; payload: number }
	| { type: "SET_CSV_PAGE_SIZE"; payload: number };

function appReducer(state: AppState, action: AppAction): AppState {
	switch (action.type) {
		case "SET_DOCUMENT":
			return {
				...state,
				document: {
					...state.document,
					file: action.payload.file,
					// Clear password when file changes
					password: action.payload.file ? state.document.password : undefined,
				},
			};

		case "SET_PAGE_RANGE":
			return {
				...state,
				document: { ...state.document, pageRange: action.payload },
			};

		case "SET_PDF_PASSWORD":
			return {
				...state,
				document: { ...state.document, password: action.payload },
			};

		case "SET_PASSWORD_VALIDATING":
			return {
				...state,
				ui: {
					...state.ui,
					passwordDialog: state.ui.passwordDialog
						? {
								...state.ui.passwordDialog,
								isValidating: action.payload,
							}
						: null,
				},
			};

		case "SET_OUTPUT_FORMAT":
			return {
				...state,
				outputFormat: action.payload,
				schema: null,
				// Don't clear output or pagination state when switching formats
			};

		case "SET_SCHEMA":
			return {
				...state,
				schema: action.payload,
			};

		case "SET_SETTINGS":
			return {
				...state,
				settings: action.payload,
			};

		case "START_SCHEMA_GENERATION":
			return {
				...state,
				generation: {
					...state.generation,
					isGeneratingSchema: true,
					error: null,
				},
			};

		case "FINISH_SCHEMA_GENERATION":
			return {
				...state,
				schema: action.payload,
				generation: {
					...state.generation,
					isGeneratingSchema: false,
				},
			};

		case "START_PARSING":
			return {
				...state,
				generation: {
					...state.generation,
					isParsing: true,
					error: null,
				},
				output: null,
			};

		case "FINISH_PARSING":
			return {
				...state,
				output: action.payload,
				generation: {
					...state.generation,
					isParsing: false,
				},
			};

		case "SET_ERROR":
			return {
				...state,
				generation: {
					...state.generation,
					isGeneratingSchema: false,
					isParsing: false,
					error: action.payload,
				},
			};

		case "CLEAR_ERROR":
			return {
				...state,
				generation: {
					...state.generation,
					error: null,
				},
			};

		case "SET_SETTINGS_OPEN":
			return {
				...state,
				ui: {
					...state.ui,
					settingsOpen: action.payload,
				},
			};

		case "SHOW_PASSWORD_DIALOG":
			return {
				...state,
				ui: {
					...state.ui,
					passwordDialog: {
						isOpen: true,
						resolve: action.payload.resolve,
						reject: action.payload.reject,
					},
				},
			};

		case "HIDE_PASSWORD_DIALOG":
			return {
				...state,
				ui: {
					...state.ui,
					passwordDialog: null,
				},
			};

		case "SET_PASSWORD_ERROR":
			return {
				...state,
				ui: {
					...state.ui,
					passwordDialog: state.ui.passwordDialog
						? {
								...state.ui.passwordDialog,
								error: action.payload,
							}
						: null,
				},
			};

		case "SET_JSON_PAGE":
			return {
				...state,
				outputViewState: {
					...state.outputViewState,
					jsonPage: action.payload,
				},
			};

		case "SET_CSV_PAGE":
			return {
				...state,
				outputViewState: {
					...state.outputViewState,
					csvPage: action.payload,
				},
			};

		case "SET_CSV_PAGE_SIZE":
			return {
				...state,
				outputViewState: {
					...state.outputViewState,
					csvPageSize: action.payload,
				},
			};

		default:
			return state;
	}
}

function createInitialState(settings: AppSettings): AppState {
	return {
		document: {
			file: null,
			pageRange: settings.pageRange,
		},
		outputFormat: "json",
		schema: null,
		generation: {
			isGeneratingSchema: false,
			isParsing: false,
			error: null,
		},
		output: null,
		settings,
		ui: {
			settingsOpen: false,
			passwordDialog: null,
		},
		outputViewState: {
			jsonPage: 1,
			csvPage: 1,
			csvPageSize: 10,
		},
	};
}

export function useAppState() {
	const [settings] = useSettings();
	const [state, dispatch] = useReducer(
		appReducer,
		settings,
		createInitialState,
	);

	const actions = {
		setDocument: useCallback((file: File | null) => {
			dispatch({ type: "SET_DOCUMENT", payload: { file } });
		}, []),

		setPageRange: useCallback((pageRange: PageRange) => {
			dispatch({ type: "SET_PAGE_RANGE", payload: pageRange });
		}, []),

		setOutputFormat: useCallback((format: OutputFormat) => {
			dispatch({ type: "SET_OUTPUT_FORMAT", payload: format });
		}, []),

		setSchema: useCallback((schema: SchemaDefinition | null) => {
			dispatch({ type: "SET_SCHEMA", payload: schema });
		}, []),

		setSettings: useCallback((settings: AppSettings) => {
			dispatch({ type: "SET_SETTINGS", payload: settings });
		}, []),

		startSchemaGeneration: useCallback(() => {
			dispatch({ type: "START_SCHEMA_GENERATION" });
		}, []),

		finishSchemaGeneration: useCallback((schema: SchemaDefinition) => {
			dispatch({ type: "FINISH_SCHEMA_GENERATION", payload: schema });
		}, []),

		startParsing: useCallback(() => {
			dispatch({ type: "START_PARSING" });
		}, []),

		finishParsing: useCallback((output: GenerationOutput) => {
			dispatch({ type: "FINISH_PARSING", payload: output });
		}, []),

		setError: useCallback((error: GenerationError) => {
			dispatch({ type: "SET_ERROR", payload: error });
		}, []),

		clearError: useCallback(() => {
			dispatch({ type: "CLEAR_ERROR" });
		}, []),

		setSettingsOpen: useCallback((open: boolean) => {
			dispatch({ type: "SET_SETTINGS_OPEN", payload: open });
		}, []),

		showPasswordDialog: useCallback(
			(resolve: (pwd: string) => void, reject: () => void) => {
				dispatch({
					type: "SHOW_PASSWORD_DIALOG",
					payload: { resolve, reject },
				});
			},
			[],
		),

		hidePasswordDialog: useCallback(() => {
			dispatch({ type: "HIDE_PASSWORD_DIALOG" });
		}, []),

		setPasswordError: useCallback((error: string) => {
			dispatch({ type: "SET_PASSWORD_ERROR", payload: error });
		}, []),

		setPdfPassword: useCallback((password: string) => {
			dispatch({ type: "SET_PDF_PASSWORD", payload: password });
		}, []),

		setPasswordValidating: useCallback((isValidating: boolean) => {
			dispatch({ type: "SET_PASSWORD_VALIDATING", payload: isValidating });
		}, []),

		setJsonPage: useCallback((page: number) => {
			dispatch({ type: "SET_JSON_PAGE", payload: page });
		}, []),

		setCsvPage: useCallback((page: number) => {
			dispatch({ type: "SET_CSV_PAGE", payload: page });
		}, []),

		setCsvPageSize: useCallback((pageSize: number) => {
			dispatch({ type: "SET_CSV_PAGE_SIZE", payload: pageSize });
		}, []),
	};

	return { state, actions };
}
