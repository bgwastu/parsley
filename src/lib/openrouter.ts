import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { OpenRouter } from "@openrouter/sdk";
import type { OpenRouterModel } from "@/types/settings";

export async function fetchModels(apiKey: string): Promise<OpenRouterModel[]> {
	try {
		const client = new OpenRouter({
			apiKey,
		});

		const response = await client.models.list();

		const imageCapableModels = response.data.filter(
			(model: {
				architecture?: {
					inputModalities?: string[];
				};
			}) => {
				return model.architecture?.inputModalities?.includes("image");
			},
		);

		return imageCapableModels.map(
			(model: {
				id: string;
				name: string;
				architecture?: {
					inputModalities?: string[];
				};
				pricing?: {
					prompt?: string;
					completion?: string;
				};
			}) => ({
				id: model.id,
				name: model.name,
				inputModalities: model.architecture?.inputModalities || [],
				pricing: {
					prompt: model.pricing?.prompt || "0",
					completion: model.pricing?.completion || "0",
				},
			}),
		);
	} catch (error) {
		console.error("Failed to fetch OpenRouter models:", error);
		throw new Error("Failed to fetch models from OpenRouter");
	}
}

export function createOpenRouterProvider(apiKey: string) {
	return createOpenRouter({
		apiKey,
	});
}
