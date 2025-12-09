import { useId } from "react";
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
	const googleId = useId();
	const openrouterId = useId();
	const googleApiKeyId = useId();
	const openrouterApiKeyId = useId();
	const modelId = useId();
	const pdfEngineId = useId();
	const customPromptId = useId();

	const { models, loading, error } = useOpenRouterModels(
		settings.provider === "openrouter" ? settings.openrouterApiKey : null,
	);

	const handleSave = () => {
		onOpenChange(false);
	};

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
							value={settings.provider}
							onValueChange={(value) =>
								onSettingsChange({
									...settings,
									provider: value as "openrouter" | "google",
								})
							}
						>
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

					{settings.provider === "google" ? (
						<div className="space-y-2">
							<Label htmlFor={googleApiKeyId}>Google API Key</Label>
							<Input
								id={googleApiKeyId}
								type="password"
								value={settings.googleApiKey}
								onChange={(e) =>
									onSettingsChange({
										...settings,
										googleApiKey: e.target.value,
									})
								}
								placeholder="Enter your Google AI API key"
							/>
						</div>
					) : (
						<>
							<div className="space-y-2">
								<Label htmlFor={openrouterApiKeyId}>OpenRouter API Key</Label>
								<Input
									id={openrouterApiKeyId}
									type="password"
									value={settings.openrouterApiKey}
									onChange={(e) =>
										onSettingsChange({
											...settings,
											openrouterApiKey: e.target.value,
										})
									}
									placeholder="Enter your OpenRouter API key"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={modelId}>Model</Label>
								{loading ? (
									<Combobox
										options={[{ value: "loading", label: "Loading models..." }]}
										value="loading"
										disabled={true}
										placeholder="Loading models..."
									/>
								) : error ? (
									<Combobox
										options={[{ value: "error", label: error }]}
										value="error"
										disabled={true}
										placeholder={error}
									/>
								) : models.length === 0 ? (
									<Combobox
										options={[{ value: "empty", label: "No models available" }]}
										value="empty"
										disabled={true}
										placeholder="No models available"
									/>
								) : (
									<Combobox
										id={modelId}
										options={models.map((model) => ({
											value: model.id,
											label: model.name,
										}))}
										value={settings.openrouterModel}
										onValueChange={(value) =>
											onSettingsChange({
												...settings,
												openrouterModel: value,
											})
										}
										disabled={!settings.openrouterApiKey || loading}
										placeholder="Select a model"
										searchPlaceholder="Search models..."
										emptyText="No models found."
									/>
								)}
								{models.length > 0 && (
									<p className="text-muted-foreground text-xs">
										{models.length} image-capable models available
									</p>
								)}
							</div>

							<div className="space-y-3">
								<Label>PDF Processing Engine</Label>
								<RadioGroup
									value={settings.pdfEngine}
									onValueChange={(value) =>
										onSettingsChange({
											...settings,
											pdfEngine: value as "native" | "mistral-ocr",
										})
									}
								>
									<div className="flex items-start space-x-2">
										<RadioGroupItem
											value="native"
											id={`${pdfEngineId}-native`}
										/>
										<div className="flex-1">
											<Label
												htmlFor={`${pdfEngineId}-native`}
												className="cursor-pointer font-medium"
											>
												Native
											</Label>
											<p className="text-muted-foreground text-xs mt-0.5">
												Only available for models that support file input
												natively (charged as input tokens)
											</p>
										</div>
									</div>
									<div className="flex items-start space-x-2">
										<RadioGroupItem
											value="mistral-ocr"
											id={`${pdfEngineId}-mistral`}
										/>
										<div className="flex-1">
											<Label
												htmlFor={`${pdfEngineId}-mistral`}
												className="cursor-pointer font-medium"
											>
												Mistral OCR
											</Label>
											<p className="text-muted-foreground text-xs mt-0.5">
												Best for scanned documents or PDFs with images ($2 per
												1,000 pages)
											</p>
										</div>
									</div>
								</RadioGroup>
							</div>
						</>
					)}

					<div className="space-y-2">
						<Label htmlFor={customPromptId}>Custom Prompt (Optional)</Label>
						<Textarea
							id={customPromptId}
							value={settings.customPrompt}
							onChange={(e) =>
								onSettingsChange({
									...settings,
									customPrompt: e.target.value,
								})
							}
							placeholder="Add additional instructions for the AI..."
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button onClick={handleSave}>Save Settings</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
