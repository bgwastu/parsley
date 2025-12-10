export interface AppSettings {
	provider: "openrouter" | "google" | "demo";
	openrouterApiKey: string;
	openrouterModel: string;
	googleApiKey: string;
	googleModel: string;
	customPrompt: string;
	pageRange: PageRange;
	outputFormat: "json" | "csv";
}

export interface PageRange {
	start: number;
	end: number | null;
}

export interface OpenRouterModel {
	id: string;
	name: string;
	inputModalities: string[];
	pricing: { prompt: string; completion: string };
}

export interface GoogleModel {
	id: string;
	name: string;
}
