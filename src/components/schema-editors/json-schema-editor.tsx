import { ChevronDown, ChevronUp, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { JsonSchemaField, SchemaDefinition } from "@/types/output";

interface JsonSchemaEditorProps {
	schema: SchemaDefinition | null;
	onChange: (schema: SchemaDefinition) => void;
	onGenerateSchema: () => void;
	isGenerating: boolean;
	hasDocument: boolean;
}

const templates: Record<string, JsonSchemaField[]> = {
	custom: [],
	invoice: [
		{ name: "invoiceNumber", type: "string", required: true },
		{ name: "date", type: "date", required: true },
		{ name: "vendor", type: "string", required: true },
		{ name: "total", type: "number", required: true },
		{ name: "items", type: "array", required: true, arrayItemType: "string" },
	],
	bankStatement: [
		{ name: "accountNumber", type: "string", required: true },
		{ name: "accountHolder", type: "string", required: true },
		{ name: "statementDate", type: "date", required: true },
		{ name: "openingBalance", type: "number", required: true },
		{ name: "closingBalance", type: "number", required: true },
		{
			name: "transactions",
			type: "array",
			required: true,
			arrayItemType: "string",
		},
	],
};

export function JsonSchemaEditor({
	schema,
	onChange,
	onGenerateSchema,
	isGenerating,
	hasDocument,
}: JsonSchemaEditorProps) {
	const jsonType = schema?.format === "json" ? schema.jsonType ?? "object" : "object";
	const fields = schema?.format === "json" ? schema.fields : [];
	const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(
		new Set(),
	);

	const setJsonType = (newJsonType: "object" | "array") => {
		if (newJsonType === "array") {
			onChange({ 
				format: "json", 
				jsonType: "array",
				fields: []
			});
		} else {
			onChange({ 
				format: "json", 
				jsonType: "object",
				fields: fields.length > 0 ? fields : []
			});
		}
	};

	const setFields = (newFields: JsonSchemaField[]) => {
		onChange({ 
			format: "json", 
			jsonType,
			fields: newFields
		});
	};

	const addField = () => {
		setFields([...fields, { name: "", type: "string", required: true }]);
	};

	const removeField = (index: number) => {
		setFields(fields.filter((_, i) => i !== index));
	};

	const updateField = (index: number, updates: Partial<JsonSchemaField>) => {
		const updated = [...fields];
		updated[index] = { ...updated[index], ...updates };
		setFields(updated);
	};

	const loadTemplate = (templateName: string) => {
		onChange({
			format: "json",
			jsonType: "object",
			fields: templates[templateName],
		});
	};

	const toggleDescription = (index: number) => {
		const newExpanded = new Set(expandedDescriptions);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedDescriptions(newExpanded);
	};

	const duplicateNames = fields
		.map((f) => f.name)
		.filter((name, index, arr) => name && arr.indexOf(name) !== index);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h3 className="font-medium text-sm">JSON Schema Definition</h3>
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">Object</span>
						<Switch
							checked={jsonType === "array"}
							onCheckedChange={(checked) => setJsonType(checked ? "array" : "object")}
						/>
						<span className="text-xs text-muted-foreground">Array</span>
					</div>
				</div>
				{jsonType === "object" && fields.length > 0 && (
					<Select onValueChange={loadTemplate} defaultValue="custom">
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Template" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="custom">Custom</SelectItem>
							<SelectItem value="invoice">Invoice</SelectItem>
							<SelectItem value="bankStatement">Bank Statement</SelectItem>
						</SelectContent>
					</Select>
				)}
			</div>

			<div className="border rounded-lg p-4 space-y-3">
				{jsonType === "array" ? (
					<>
						{fields.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 space-y-4">
								<p className="text-center text-muted-foreground text-sm">
									No fields defined for array items. Add fields manually or generate from document.
								</p>
								<div className="flex gap-3">
									<Button variant="outline" size="sm" onClick={addField}>
										<Plus className="h-4 w-4 mr-1" />
										Add Field
									</Button>
									{onGenerateSchema && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												if (!hasDocument) {
													toast.error("Please upload a document first");
												} else {
													onGenerateSchema();
												}
											}}
											disabled={isGenerating}
										>
											<Sparkles className="h-4 w-4 mr-1" />
											{isGenerating ? "Generating..." : "Generate with AI"}
										</Button>
									)}
								</div>
							</div>
						) : (
							fields.map((field, index) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: fields don't have stable IDs during editing
											key={index}
											className="space-y-2 pb-3 border-b last:border-b-0"
										>
											<div className="flex items-end gap-2">
												<div className="flex-1 space-y-1">
													<Label htmlFor={`field-name-${index}`} className="text-xs">
														Name
													</Label>
													<Input
														id={`field-name-${index}`}
														value={field.name}
														onChange={(e) =>
															updateField(index, { name: e.target.value })
														}
														placeholder="fieldName"
														className={
															duplicateNames.includes(field.name) && field.name
																? "border-destructive"
																: ""
														}
													/>
												</div>
												<div className="w-32 space-y-1">
													<Label htmlFor={`field-type-${index}`} className="text-xs">
														Type
													</Label>
													<Select
														value={field.type}
														onValueChange={(value) =>
															updateField(index, {
																type: value as JsonSchemaField["type"],
															})
														}
													>
														<SelectTrigger id={`field-type-${index}`}>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="string">String</SelectItem>
															<SelectItem value="number">Number</SelectItem>
															<SelectItem value="boolean">Boolean</SelectItem>
															<SelectItem value="date">Date</SelectItem>
															<SelectItem value="array">Array</SelectItem>
															<SelectItem value="object">Object</SelectItem>
														</SelectContent>
													</Select>
												</div>
												{field.type === "array" && (
													<div className="w-28 space-y-1">
														<Label htmlFor={`array-type-${index}`} className="text-xs">
															Item Type
														</Label>
														<Select
															value={field.arrayItemType || "string"}
															onValueChange={(value) =>
																updateField(index, {
																	arrayItemType:
																		value as JsonSchemaField["arrayItemType"],
																})
															}
														>
															<SelectTrigger id={`array-type-${index}`}>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="string">String</SelectItem>
																<SelectItem value="number">Number</SelectItem>
																<SelectItem value="boolean">Boolean</SelectItem>
															</SelectContent>
														</Select>
													</div>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() => removeField(index)}
													className="h-9"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => toggleDescription(index)}
													className="h-7 px-2"
												>
													{expandedDescriptions.has(index) ? (
														<ChevronUp className="h-3 w-3 mr-1" />
													) : (
														<ChevronDown className="h-3 w-3 mr-1" />
													)}
													<span className="text-xs">
														{expandedDescriptions.has(index) ? "Hide" : "Add"}{" "}
														Description
													</span>
												</Button>
											</div>
											{expandedDescriptions.has(index) && (
												<div className="space-y-1">
													<Input
														id={`field-desc-${index}`}
														value={field.description || ""}
														onChange={(e) =>
															updateField(index, { description: e.target.value })
														}
														placeholder="Brief description of this field"
														className="text-sm"
													/>
												</div>
											)}
										</div>
									))
								)}
								{fields.length > 0 && (
									<Button
										variant="outline"
										size="sm"
										onClick={addField}
										className="w-full"
									>
										<Plus className="h-4 w-4 mr-1" />
										Add Field
									</Button>
								)}
							</>
						) : (
							fields.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8 space-y-4">
						<p className="text-center text-muted-foreground text-sm">
							No fields defined. Add fields manually or generate from document.
						</p>
						<div className="flex gap-3">
							<Button variant="outline" size="sm" onClick={addField}>
								<Plus className="h-4 w-4 mr-1" />
								Add Field
							</Button>
							{onGenerateSchema && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										if (!hasDocument) {
											toast.error("Please upload a document first");
										} else {
											onGenerateSchema();
										}
									}}
									disabled={isGenerating}
								>
									<Sparkles className="h-4 w-4 mr-1" />
									{isGenerating ? "Generating..." : "Generate with AI"}
								</Button>
							)}
								</div>
							</div>
						) : (
							<>
								{fields.map((field, index) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: fields don't have stable IDs during editing
										key={index}
										className="space-y-2 pb-3 border-b last:border-b-0"
									>
							<div className="flex items-end gap-2">
								<div className="flex-1 space-y-1">
									<Label htmlFor={`field-name-${index}`} className="text-xs">
										Name
									</Label>
									<Input
										id={`field-name-${index}`}
										value={field.name}
										onChange={(e) =>
											updateField(index, { name: e.target.value })
										}
										placeholder="fieldName"
										className={
											duplicateNames.includes(field.name) && field.name
												? "border-destructive"
												: ""
										}
									/>
								</div>
								<div className="w-32 space-y-1">
									<Label htmlFor={`field-type-${index}`} className="text-xs">
										Type
									</Label>
									<Select
										value={field.type}
										onValueChange={(value) =>
											updateField(index, {
												type: value as JsonSchemaField["type"],
											})
										}
									>
										<SelectTrigger id={`field-type-${index}`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="string">String</SelectItem>
											<SelectItem value="number">Number</SelectItem>
											<SelectItem value="boolean">Boolean</SelectItem>
											<SelectItem value="date">Date</SelectItem>
											<SelectItem value="array">Array</SelectItem>
											<SelectItem value="object">Object</SelectItem>
										</SelectContent>
									</Select>
								</div>
								{field.type === "array" && (
									<div className="w-28 space-y-1">
										<Label htmlFor={`array-type-${index}`} className="text-xs">
											Item Type
										</Label>
										<Select
											value={field.arrayItemType || "string"}
											onValueChange={(value) =>
												updateField(index, {
													arrayItemType:
														value as JsonSchemaField["arrayItemType"],
												})
											}
										>
											<SelectTrigger id={`array-type-${index}`}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="string">String</SelectItem>
												<SelectItem value="number">Number</SelectItem>
												<SelectItem value="boolean">Boolean</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => removeField(index)}
									className="h-9"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => toggleDescription(index)}
									className="h-7 px-2"
								>
									{expandedDescriptions.has(index) ? (
										<ChevronUp className="h-3 w-3 mr-1" />
									) : (
										<ChevronDown className="h-3 w-3 mr-1" />
									)}
									<span className="text-xs">
										{expandedDescriptions.has(index) ? "Hide" : "Add"}{" "}
										Description
									</span>
								</Button>
							</div>
							{expandedDescriptions.has(index) && (
								<div className="space-y-1">
									<Input
										id={`field-desc-${index}`}
										value={field.description || ""}
										onChange={(e) =>
											updateField(index, { description: e.target.value })
										}
										placeholder="Brief description of this field"
										className="text-sm"
									/>
								</div>
									)}
								</div>
							))}
								{fields.length > 0 && (
									<Button
										variant="outline"
										size="sm"
										onClick={addField}
										className="w-full"
									>
										<Plus className="h-4 w-4 mr-1" />
										Add Field
									</Button>
								)}
							</>
						)
					)
				}
			</div>

			{duplicateNames.length > 0 && (
				<p className="text-destructive text-sm">
					Duplicate field names: {duplicateNames.join(", ")}
				</p>
			)}
		</div>
	);
}
