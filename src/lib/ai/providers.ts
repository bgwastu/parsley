import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

export interface ModelConfig {
	provider: "openrouter" | "google" | "demo";
	modelId?: string;
	apiKey: string;
}

export function createModel(config: ModelConfig): LanguageModel {
	if (config.provider === "google") {
		if (!config.modelId) {
			throw new Error("Model ID is required for Google provider");
		}
		const googleProvider = createGoogleGenerativeAI({
			apiKey: config.apiKey,
		});
		return googleProvider(config.modelId);
	}

	if (config.provider === "demo") {
		throw new Error(
			"Demo mode must use /api/demo/parse endpoint. Direct model creation is not supported for demo provider.",
		);
	}

	if (!config.modelId) {
		throw new Error("Model ID is required for OpenRouter provider");
	}

	const openrouterProvider = createOpenRouter({
		apiKey: config.apiKey,
		headers: {
			"HTTP-Referer": "https://parsley.wastu.net",
			"X-Title": "Parsley - Document Parser",
		},
	});
	return openrouterProvider(config.modelId);
}
