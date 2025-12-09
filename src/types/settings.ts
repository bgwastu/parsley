export interface AppSettings {
	provider: "openrouter" | "google";
	openrouterApiKey: string;
	openrouterModel: string;
	googleApiKey: string;
	customPrompt: string;
	pageRange: PageRange;
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
