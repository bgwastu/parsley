import type { GoogleModel } from "@/types/settings";

interface GoogleApiModel {
	name: string;
	displayName: string;
	description?: string;
	supportedGenerationMethods?: string[];
}

interface GoogleApiResponse {
	models?: GoogleApiModel[];
}

/**
 * Fetches available Google Gemini models from the API
 */
export async function fetchGoogleModels(apiKey: string): Promise<GoogleModel[]> {
	try {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
		);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch models: ${response.status} ${response.statusText}`,
			);
		}

		const data: GoogleApiResponse = await response.json();

		if (!data.models || !Array.isArray(data.models)) {
			throw new Error("Invalid response format from Google API");
		}

		// Filter for models that support generateContent (multimodal models)
		// and map to our GoogleModel format
		const models = data.models
			.filter(
				(model) =>
					model.supportedGenerationMethods?.includes("generateContent") &&
					model.name.startsWith("models/"),
			)
			.map((model) => {
				// Extract model ID from "models/gemini-1.5-flash" format
				const modelId = model.name.replace("models/", "");
				return {
					id: modelId,
					name: model.displayName || modelId,
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name));

		return models;
	} catch (error) {
		console.error("Failed to fetch Google models:", error);
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to fetch models from Google API",
		);
	}
}
