import { z } from "zod";
import type { AppSettings } from "@/types/settings";

const STORAGE_KEY = "parsley-settings";

const PageRangeSchema = z.object({
	start: z.number().min(1),
	end: z.number().min(1).nullable(),
});

export const AppSettingsSchema = z.object({
	provider: z.enum(["openrouter", "google"]),
	openrouterApiKey: z.string(),
	openrouterModel: z.string(),
	googleApiKey: z.string(),
	customPrompt: z.string(),
	pageRange: PageRangeSchema,
	outputFormat: z.enum(["json", "csv"]),
});

export const defaultSettings: AppSettings = {
	provider: "google",
	openrouterApiKey: "",
	openrouterModel: "",
	googleApiKey: "",
	customPrompt: "",
	pageRange: {
		start: 1,
		end: null,
	},
	outputFormat: "json",
};

export function loadSettings(): AppSettings {
	if (typeof window === "undefined") {
		return defaultSettings;
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return defaultSettings;
		}

		const parsed = JSON.parse(stored);
		const validated = AppSettingsSchema.parse(parsed);
		return validated;
	} catch (error) {
		console.error("Failed to load settings:", error);
		return defaultSettings;
	}
}

export function saveSettings(settings: AppSettings): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		const validated = AppSettingsSchema.parse(settings);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
	} catch (error) {
		console.error("Failed to save settings:", error);
	}
}

export function validateSettings(settings: Partial<AppSettings>): {
	isValid: boolean;
	errors: string[];
} {
	try {
		AppSettingsSchema.parse(settings);
		return { isValid: true, errors: [] };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				isValid: false,
				errors: error.errors.map(
					(err) => `${err.path.join(".")}: ${err.message}`,
				),
			};
		}
		return { isValid: false, errors: ["Unknown validation error"] };
	}
}
