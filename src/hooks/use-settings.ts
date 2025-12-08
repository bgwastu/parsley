import { useState } from "react";
import { loadSettings, saveSettings } from "@/lib/settings";
import type { AppSettings } from "@/types/settings";

export function useSettings() {
	const [settings, setSettingsState] = useState<AppSettings>(() =>
		loadSettings(),
	);

	const setSettings = (
		newSettings: AppSettings | ((prev: AppSettings) => AppSettings),
	) => {
		setSettingsState((prev) => {
			const updated =
				typeof newSettings === "function" ? newSettings(prev) : newSettings;
			saveSettings(updated);
			return updated;
		});
	};

	return [settings, setSettings] as const;
}
