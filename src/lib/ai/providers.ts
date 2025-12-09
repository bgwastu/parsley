import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

export interface ModelConfig {
	provider: "openrouter" | "google";
	modelId?: string;
	apiKey: string;
}

export function createModel(config: ModelConfig): LanguageModel {
	if (config.provider === "google") {
		const googleProvider = createGoogleGenerativeAI({
			apiKey: config.apiKey,
		});
		return googleProvider("gemini-2.0-flash-exp");
	}

	if (!config.modelId) {
		throw new Error("Model ID is required for OpenRouter provider");
	}

	const openrouterProvider = createOpenRouter({
		apiKey: config.apiKey,
	});
	return openrouterProvider(config.modelId);
}
