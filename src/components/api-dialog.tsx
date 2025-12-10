import { Check, Code, Copy, Lock } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	type CommandFormat,
	generateCommand,
} from "@/lib/curl-generator";
import type { OutputFormat, SchemaDefinition } from "@/types/output";
import type { AppSettings, PageRange } from "@/types/settings";

interface ApiDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	settings: AppSettings;
	document: {
		file: File | null;
		password?: string;
		pageRange: PageRange;
	};
	schema: SchemaDefinition | null;
	outputFormat: OutputFormat;
}

function ParamDoc({
	name,
	type,
	required,
	description,
}: {
	name: string;
	type: string;
	required?: boolean;
	description: string;
}) {
	return (
		<div className="flex gap-2 text-xs">
			<code className="font-mono text-blue-600 dark:text-blue-400">
				{name}
			</code>
			<span className="text-muted-foreground">
				({type})
				{required && <span className="text-red-500 ml-1">*</span>}
			</span>
			<span className="text-muted-foreground">- {description}</span>
		</div>
	);
}

function CodeBlockWithCopy({
	code,
	language = "bash",
}: {
	code: string;
	language?: string;
}) {
	const [copied, setCopied] = useState(false);
	const [highlightedCode, setHighlightedCode] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	useEffect(() => {
		const loadHighlightedCode = async () => {
			try {
				const { codeToHtml } = await import("shiki");

				const html = await codeToHtml(code, {
					lang: language,
					themes: {
						light: "vitesse-light",
						dark: "vitesse-dark",
					},
				});

				setHighlightedCode(html);
				setIsLoading(false);
			} catch (error) {
				console.error("Failed to highlight code:", error);
				setIsLoading(false);
			}
		};

		loadHighlightedCode();
	}, [code, language]);

	return (
		<div className="relative rounded-md border overflow-hidden">
			<Button
				variant="ghost"
				size="icon"
				onClick={handleCopy}
				className="absolute right-2 top-2 h-8 w-8 shrink-0 z-10"
			>
				{copied ? (
					<Check className="h-4 w-4 text-muted-foreground" />
				) : (
					<Copy className="h-4 w-4 text-muted-foreground" />
				)}
			</Button>
			{isLoading ? (
				<pre className="p-3 pr-12 bg-muted text-xs font-mono whitespace-pre-wrap break-all overflow-x-auto">
					{code}
				</pre>
			) : (
				<div
					className="[&_pre]:p-3 [&_pre]:pr-12 [&_pre]:text-xs [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_pre]:!bg-background dark:[&_.shiki]:!text-[var(--shiki-dark)] dark:[&_.shiki]:!bg-[var(--shiki-dark-bg)] dark:[&_.shiki_span]:!text-[var(--shiki-dark)]"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: This is a valid use case for this component
					dangerouslySetInnerHTML={{ __html: highlightedCode }}
				/>
			)}
		</div>
	);
}

export function ApiDialog({
	open,
	onOpenChange,
	settings,
	document,
	schema,
	outputFormat,
}: ApiDialogProps) {
	const [commandFormat, setCommandFormat] = useState<CommandFormat>("curl");
	const [includeApiKey, setIncludeApiKey] = useState(false);
	const includeApiKeyId = useId();

	const command = generateCommand(commandFormat, {
		settings,
		document,
		schema,
		outputFormat,
		includeApiKey,
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Code className="h-5 w-5" />
						API Access
					</DialogTitle>
					<DialogDescription className="text-left">
						Use this endpoint to parse documents programmatically
					</DialogDescription>
				</DialogHeader>

				{/* Privacy Information */}
				<div className="bg-muted/50 border border-muted rounded-lg p-4 mb-4">
					<div className="flex items-start gap-3">
						<Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
						<div className="space-y-1 text-sm">
							<p className="font-medium">Private & Secure</p>
							<p className="text-muted-foreground">
								Your API keys and documents are never logged or stored on our
								servers. This app is fully open source and can be self-hosted
								for complete control.{" "}
								<a
									href="https://github.com/bgwastu/parsley"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									View source
								</a>
							</p>
						</div>
					</div>
				</div>

				<Tabs defaultValue="convert" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="convert">Convert</TabsTrigger>
						<TabsTrigger value="documentation">API Documentation</TabsTrigger>
					</TabsList>

					<TabsContent value="documentation" className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Endpoint</Label>
							<code className="block p-3 bg-muted rounded-md text-sm font-mono">
								POST /api/parse
							</code>
						</div>

						<div className="space-y-2">
							<Label>Request Parameters</Label>
							<div className="border rounded-md overflow-x-auto">
								<table className="w-full text-xs">
									<thead className="bg-muted">
										<tr>
											<th className="text-left p-2 font-medium">Parameter</th>
											<th className="text-left p-2 font-medium">Type</th>
											<th className="text-left p-2 font-medium">Required</th>
											<th className="text-left p-2 font-medium">Description</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													provider
												</code>
											</td>
											<td className="p-2 text-muted-foreground">string</td>
											<td className="p-2">
												<span className="text-red-500">Yes</span>
											</td>
											<td className="p-2 text-muted-foreground">
												AI provider: 'google' or 'openrouter' (demo not available for API)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													googleApiKey
												</code>
											</td>
											<td className="p-2 text-muted-foreground">string</td>
											<td className="p-2">
												{settings.provider === "google" ? (
													<span className="text-red-500">Yes</span>
												) : (
													<span className="text-muted-foreground">No</span>
												)}
											</td>
											<td className="p-2 text-muted-foreground">
												Google API key (required if provider=google)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													googleModel
												</code>
											</td>
											<td className="p-2 text-muted-foreground">string</td>
											<td className="p-2">
												{settings.provider === "google" ? (
													<span className="text-red-500">Yes</span>
												) : (
													<span className="text-muted-foreground">No</span>
												)}
											</td>
											<td className="p-2 text-muted-foreground">
												Google model name (required if provider=google)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													openrouterApiKey
												</code>
											</td>
											<td className="p-2 text-muted-foreground">string</td>
											<td className="p-2">
												{settings.provider === "openrouter" ? (
													<span className="text-red-500">Yes</span>
												) : (
													<span className="text-muted-foreground">No</span>
												)}
											</td>
											<td className="p-2 text-muted-foreground">
												OpenRouter API key (required if provider=openrouter)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													openrouterModel
												</code>
											</td>
											<td className="p-2 text-muted-foreground">string</td>
											<td className="p-2">
												{settings.provider === "openrouter" ? (
													<span className="text-red-500">Yes</span>
												) : (
													<span className="text-muted-foreground">No</span>
												)}
											</td>
											<td className="p-2 text-muted-foreground">
												OpenRouter model name (required if provider=openrouter)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													customPrompt
												</code>
											</td>
											<td className="p-2 text-muted-foreground">string</td>
											<td className="p-2 text-muted-foreground">No</td>
											<td className="p-2 text-muted-foreground">
												Custom prompt to add to extraction (optional)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													pageRangeStart
												</code>
											</td>
											<td className="p-2 text-muted-foreground">number</td>
											<td className="p-2 text-muted-foreground">No</td>
											<td className="p-2 text-muted-foreground">
												Starting page number for PDF extraction (default: 1)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													pageRangeEnd
												</code>
											</td>
											<td className="p-2 text-muted-foreground">number</td>
											<td className="p-2 text-muted-foreground">No</td>
											<td className="p-2 text-muted-foreground">
												Ending page number for PDF extraction (optional)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													file
												</code>
											</td>
											<td className="p-2 text-muted-foreground">file</td>
											<td className="p-2">
												<span className="text-red-500">Yes</span>
											</td>
											<td className="p-2 text-muted-foreground">
												Document to parse (PDF, PNG, JPG)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													outputFormat
												</code>
											</td>
											<td className="p-2 text-muted-foreground">string</td>
											<td className="p-2">
												<span className="text-red-500">Yes</span>
											</td>
											<td className="p-2 text-muted-foreground">
												Output format: 'json-object', 'json-array', or 'csv'
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													schema
												</code>
											</td>
											<td className="p-2 text-muted-foreground">JSON string</td>
											<td className="p-2 text-muted-foreground">No</td>
											<td className="p-2 text-muted-foreground">
												Schema definition (auto-generated if omitted)
											</td>
										</tr>
										<tr>
											<td className="p-2">
												<code className="font-mono text-blue-600 dark:text-blue-400">
													pdfPassword
												</code>
											</td>
											<td className="p-2 text-muted-foreground">string</td>
											<td className="p-2 text-muted-foreground">No</td>
											<td className="p-2 text-muted-foreground">
												Password for encrypted PDFs
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Response Format</Label>
							<div className="space-y-2">
								<div>
									<p className="text-sm font-medium mb-1">Success (200):</p>
									<CodeBlockWithCopy
										code={`// For json-object format:
{ "field1": "value1", "field2": "value2" }

// For json-array format:
[{ "field1": "value1" }, { "field2": "value2" }]

// For csv format:
[{ "column1": "value1", "column2": "value2" }]`}
										language="javascript"
									/>
								</div>
								<div>
									<p className="text-sm font-medium mb-1">Error (400):</p>
									<CodeBlockWithCopy
										code={`{
  "success": false,
  "error": {
    "message": "Error description",
    "type": "validation_error | api_error | document_processing_error"
  }
}`}
										language="json"
									/>
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="convert" className="space-y-4 py-4">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label>Format</Label>
								<ToggleGroup
									type="single"
									value={commandFormat}
									onValueChange={(value) => {
										if (value) setCommandFormat(value as CommandFormat);
									}}
									variant="outline"
								>
									<ToggleGroupItem value="curl" aria-label="cURL">
										cURL
									</ToggleGroupItem>
									<ToggleGroupItem value="httpie" aria-label="HTTPie">
										HTTPie
									</ToggleGroupItem>
								</ToggleGroup>
							</div>

							<div className="flex items-center gap-2">
								<Checkbox
									id={includeApiKeyId}
									checked={includeApiKey}
									onCheckedChange={(checked) =>
										setIncludeApiKey(checked === true)
									}
								/>
								<Label
									htmlFor={includeApiKeyId}
									className="text-sm font-normal cursor-pointer"
								>
									Include API key in command
								</Label>
							</div>

							<div className="space-y-2">
								<Label>
									{commandFormat === "curl"
										? "cURL Command"
										: "HTTPie Command"}
								</Label>
								<CodeBlockWithCopy code={command} />
								{!includeApiKey && (
									<p className="text-xs text-muted-foreground">
										Replace{" "}
										{settings.provider === "google"
											? "YOUR_GOOGLE_API_KEY"
											: "YOUR_OPENROUTER_API_KEY"}{" "}
										with your actual API key
									</p>
								)}
							</div>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)}>Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
