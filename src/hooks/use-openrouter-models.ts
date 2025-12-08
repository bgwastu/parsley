import { useEffect, useState } from "react";
import { fetchModels } from "@/lib/openrouter";
import type { OpenRouterModel } from "@/types/settings";

const CACHE_TTL = 5 * 60 * 1000;

interface Cache {
	models: OpenRouterModel[];
	timestamp: number;
}

const modelsCache = new Map<string, Cache>();

export function useOpenRouterModels(apiKey: string | null) {
	const [models, setModels] = useState<OpenRouterModel[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!apiKey) {
			setModels([]);
			return;
		}

		const cached = modelsCache.get(apiKey);
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
			setModels(cached.models);
			return;
		}

		setLoading(true);
		setError(null);

		fetchModels(apiKey)
			.then((fetchedModels) => {
				modelsCache.set(apiKey, {
					models: fetchedModels,
					timestamp: Date.now(),
				});
				setModels(fetchedModels);
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Failed to fetch models");
			})
			.finally(() => {
				setLoading(false);
			});
	}, [apiKey]);

	return { models, loading, error };
}
