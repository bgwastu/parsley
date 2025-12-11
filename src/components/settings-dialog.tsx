import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useGoogleModels } from "@/hooks/use-google-models";
import { useOpenRouterModels } from "@/hooks/use-openrouter-models";
import type { AppSettings } from "@/types/settings";

interface SettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	settings: AppSettings;
	onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsDialog({
	open,
	onOpenChange,
	settings,
	onSettingsChange,
}: SettingsDialogProps) {
	const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
	const demoId = useId();
	const googleId = useId();
	const openrouterId = useId();
	const googleApiKeyId = useId();
	const openrouterApiKeyId = useId();
	const modelId = useId();
	const customPromptId = useId();

	// Reset local settings when dialog opens or when settings prop changes
	useEffect(() => {
		if (open) {
			setLocalSettings(settings);
		}
	}, [open, settings]);

	const { models: openrouterModels, loading: openrouterLoading, error: openrouterError } = useOpenRouterModels(
		localSettings.provider === "openrouter" ? localSettings.openrouterApiKey : null,
	);

	const { models: googleModels, loading: googleLoading, error: googleError } = useGoogleModels(
		localSettings.provider === "google" ? localSettings.googleApiKey : null,
	);

	const handleSave = () => {
		onSettingsChange(localSettings);
		onOpenChange(false);
	};

	const isDemo = localSettings.provider === "demo";
	const isGoogle = localSettings.provider === "google";
	const isOpenRouter = localSettings.provider === "openrouter";

	const hasGoogleCredentials = Boolean(localSettings.googleApiKey && localSettings.googleModel);
	const hasOpenRouterCredentials = Boolean(localSettings.openrouterApiKey && localSettings.openrouterModel);

	const canSave = isDemo || (isGoogle && hasGoogleCredentials) || (isOpenRouter && hasOpenRouterCredentials);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
					<DialogDescription>
						Configure AI provider and parsing options
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="space-y-3">
						<Label>AI Provider</Label>
						<RadioGroup
							value={localSettings.provider}
							onValueChange={(value) =>
								setLocalSettings({
									...localSettings,
									provider: value as "openrouter" | "google" | "demo",
								})
							}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="demo" id={demoId} />
								<Label htmlFor={demoId} className="cursor-pointer">
									Demo (Free, Rate Limited)
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="google" id={googleId} />
								<Label htmlFor={googleId} className="cursor-pointer">
									Google Gemini
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="openrouter" id={openrouterId} />
								<Label htmlFor={openrouterId} className="cursor-pointer">
									OpenRouter
								</Label>
							</div>
						</RadioGroup>
					</div>

					{localSettings.provider === "demo" ? (
						<div className="rounded-lg border border-border bg-muted/50 p-3">
							<p className="text-sm text-muted-foreground">
								<strong className="text-foreground">Demo Mode:</strong>{" "}
								Uses a shared API key with rate limiting (3 documents per day, 1MB file limit).
								For unlimited access, use your own API key with Google or OpenRouter.
							</p>
						</div>
					) : localSettings.provider === "google" ? (
						<>
							<div className="space-y-2">
								<Label htmlFor={googleApiKeyId}>Google API Key</Label>
								<Input
									id={googleApiKeyId}
									type="password"
									value={localSettings.googleApiKey}
									onChange={(e) =>
										setLocalSettings({
											...localSettings,
											googleApiKey: e.target.value,
										})
									}
									placeholder="Enter your Google AI API key"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={modelId}>Model</Label>
								{googleLoading ? (
									<Combobox
										options={[{ value: "loading", label: "Loading models..." }]}
										value="loading"
										disabled={true}
										placeholder="Loading models..."
									/>
								) : googleError ? (
									<Combobox
										options={[{ value: "error", label: googleError }]}
										value="error"
										disabled={true}
										placeholder={googleError}
									/>
								) : googleModels.length === 0 ? (
									<Combobox
										options={[{ value: "empty", label: "No models available" }]}
										value="empty"
										disabled={true}
										placeholder="No models available"
									/>
								) : (
									<Combobox
										id={modelId}
										options={googleModels.map((model) => ({
											value: model.id,
											label: model.name,
										}))}
										value={localSettings.googleModel}
										onValueChange={(value) =>
											setLocalSettings({
												...localSettings,
												googleModel: value,
											})
										}
										disabled={!localSettings.googleApiKey || googleLoading}
										placeholder="Select a model"
										searchPlaceholder="Search models..."
										emptyText="No models found."
									/>
								)}
								{googleModels.length > 0 && (
									<p className="text-muted-foreground text-xs">
										{googleModels.length} models available
									</p>
								)}
							</div>
						</>
					) : (
						<>
							<div className="space-y-2">
								<Label htmlFor={openrouterApiKeyId}>OpenRouter API Key</Label>
								<Input
									id={openrouterApiKeyId}
									type="password"
									value={localSettings.openrouterApiKey}
									onChange={(e) =>
										setLocalSettings({
											...localSettings,
											openrouterApiKey: e.target.value,
										})
									}
									placeholder="Enter your OpenRouter API key"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={modelId}>Model</Label>
								{openrouterLoading ? (
									<Combobox
										options={[{ value: "loading", label: "Loading models..." }]}
										value="loading"
										disabled={true}
										placeholder="Loading models..."
									/>
								) : openrouterError ? (
									<Combobox
										options={[{ value: "error", label: openrouterError }]}
										value="error"
										disabled={true}
										placeholder={openrouterError}
									/>
								) : openrouterModels.length === 0 ? (
									<Combobox
										options={[{ value: "empty", label: "No models available" }]}
										value="empty"
										disabled={true}
										placeholder="No models available"
									/>
								) : (
									<Combobox
										id={modelId}
										options={openrouterModels.map((model) => ({
											value: model.id,
											label: model.name,
										}))}
										value={localSettings.openrouterModel}
										onValueChange={(value) =>
											setLocalSettings({
												...localSettings,
												openrouterModel: value,
											})
										}
										disabled={!localSettings.openrouterApiKey || openrouterLoading}
										placeholder="Select a model"
										searchPlaceholder="Search models..."
										emptyText="No models found."
									/>
								)}
								{openrouterModels.length > 0 && (
									<p className="text-muted-foreground text-xs">
										{openrouterModels.length} image-capable models available
									</p>
								)}
							</div>

							<div className="rounded-lg border border-border bg-muted/50 p-3">
								<p className="text-sm text-muted-foreground">
									<strong className="text-foreground">PDF Processing:</strong>{" "}
									OpenRouter automatically processes PDFs using native support
									when available, with automatic fallback to Mistral OCR for
									scanned documents.{" "}
									<a
										href="https://openrouter.ai/docs/guides/overview/multimodal/pdfs"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline"
									>
										Learn more
									</a>
								</p>
							</div>
						</>
					)}

					<div className="space-y-2">
						<Label htmlFor={customPromptId}>Custom Prompt (Optional)</Label>
						<Textarea
							id={customPromptId}
							value={localSettings.customPrompt}
							onChange={(e) =>
								setLocalSettings({
									...localSettings,
									customPrompt: e.target.value,
								})
							}
							placeholder="Add additional instructions for the AI..."
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button onClick={handleSave} disabled={!canSave}>Save Settings</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
