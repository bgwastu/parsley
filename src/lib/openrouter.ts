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

		const mappedModels = imageCapableModels.map(
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

		// Sort models to show Claude, Google, and OpenAI models on top
		return mappedModels.sort((a, b) => {
			const aName = a.name.toLowerCase();
			const bName = b.name.toLowerCase();
			const aId = a.id.toLowerCase();
			const bId = b.id.toLowerCase();

			// Check if model is from Claude, Google, or OpenAI
			const aIsPriority =
				aName.includes("claude") ||
				aName.includes("google") ||
				aId.includes("google") ||
				aName.includes("gpt") ||
				aId.includes("openai");
			const bIsPriority =
				bName.includes("claude") ||
				bName.includes("google") ||
				bId.includes("google") ||
				bName.includes("gpt") ||
				bId.includes("openai");

			// Priority models come first
			if (aIsPriority && !bIsPriority) return -1;
			if (!aIsPriority && bIsPriority) return 1;

			// Within priority or non-priority groups, sort alphabetically
			return aName.localeCompare(bName);
		});
	} catch (error) {
		console.error("Failed to fetch OpenRouter models:", error);
		throw new Error("Failed to fetch models from OpenRouter");
	}
}

export function createOpenRouterProvider(apiKey: string) {
	return createOpenRouter({
		apiKey,
		headers: {
			"HTTP-Referer": "https://parsley.wastu.net",
			"X-Title": "Parsley - Document Parser",
		},
	});
}
