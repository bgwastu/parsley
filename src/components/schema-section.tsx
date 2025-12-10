import {
	ChevronDown,
	ChevronUp,
	Loader2,
	Plus,
	Sparkles,
	Trash2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import type {
	CsvSchemaColumn,
	JsonSchemaField,
	OutputFormat,
	SchemaDefinition,
} from "@/types/output";

interface SchemaSectionProps {
	format: OutputFormat;
	schema: SchemaDefinition | null;
	onChange: (schema: SchemaDefinition) => void;
	onGenerateSchema: () => void;
	isGenerating: boolean;
	hasDocument: boolean;
	isConfigured: boolean;
}

const jsonTemplates: Record<string, JsonSchemaField[]> = {
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

const csvTemplates: Record<string, CsvSchemaColumn[]> = {
	custom: [],
	transactionList: [
		{ name: "date", type: "date", required: true },
		{ name: "description", type: "string", required: true },
		{ name: "amount", type: "number", required: true },
		{ name: "category", type: "string", required: false },
		{ name: "reference", type: "string", required: false },
	],
	productCatalog: [
		{ name: "sku", type: "string", required: true },
		{ name: "name", type: "string", required: true },
		{ name: "price", type: "number", required: true },
		{ name: "quantity", type: "number", required: true },
		{ name: "inStock", type: "boolean", required: true },
	],
	contactList: [
		{ name: "name", type: "string", required: true },
		{ name: "email", type: "string", required: true },
		{ name: "phone", type: "string", required: false },
		{ name: "company", type: "string", required: false },
		{ name: "address", type: "string", required: false },
	],
};

export function SchemaSection({
	format,
	schema,
	onChange,
	onGenerateSchema,
	isGenerating,
	hasDocument,
	isConfigured,
}: SchemaSectionProps) {
	const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(
		new Set(),
	);

	const isJson = format === "json";

	const jsonType =
		isJson && schema?.format === "json"
			? (schema.jsonType ?? "array")
			: "array";
	const items = isJson
		? schema?.format === "json"
			? schema.fields
			: []
		: schema?.format === "csv"
			? schema.columns
			: [];

	const setJsonType = (newJsonType: "object" | "array") => {
		if (!isJson) return;
		onChange({
			format: "json",
			jsonType: newJsonType,
			fields: newJsonType === "array" ? [] : (items as JsonSchemaField[]),
		});
	};

	const setItems = (newItems: JsonSchemaField[] | CsvSchemaColumn[]) => {
		if (isJson) {
			onChange({
				format: "json",
				jsonType,
				fields: newItems as JsonSchemaField[],
			});
		} else {
			onChange({
				format: "csv",
				columns: newItems as CsvSchemaColumn[],
			});
		}
	};

	const addItem = () => {
		const newItem = isJson
			? { name: "", type: "string" as const, required: true }
			: { name: "", type: "string" as const, required: true };
		setItems([...items, newItem]);
	};

	const removeItem = (index: number) => {
		setItems(items.filter((_, i) => i !== index));
	};

	const updateItem = (
		index: number,
		updates: Partial<JsonSchemaField | CsvSchemaColumn>,
	) => {
		const updated = [...items];
		updated[index] = { ...updated[index], ...updates };
		setItems(updated);
	};

	const loadTemplate = (templateName: string) => {
		if (isJson) {
			onChange({
				format: "json",
				jsonType: "array",
				fields: jsonTemplates[templateName],
			});
		} else {
			onChange({
				format: "csv",
				columns: csvTemplates[templateName],
			});
		}
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

	const duplicateNames = items
		.map((item) => item.name)
		.filter((name, index, arr) => name && arr.indexOf(name) !== index);

	const title = isJson ? "JSON Schema Definition" : "CSV Column Definition";
	const itemLabel = isJson ? "Field" : "Column";
	const itemPlaceholder = isJson ? "fieldName" : "columnName";

	const renderEmptyState = () => (
		<div className="flex flex-col items-center justify-center py-8 space-y-4">
			<p className="text-center text-muted-foreground text-sm">
				No {itemLabel.toLowerCase()}s defined. Add {itemLabel.toLowerCase()}s
				manually or generate from document.
			</p>
			<div className="flex gap-3">
				<Button variant="outline" size="sm" onClick={addItem}>
					<Plus className="h-4 w-4 mr-1" />
					Add {itemLabel}
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
						disabled={isGenerating || !isConfigured}
					>
						<Sparkles className="h-4 w-4 mr-1" />
						{isGenerating ? "Generating..." : "Generate with AI"}
					</Button>
				)}
			</div>
		</div>
	);

	const renderItem = (
		item: JsonSchemaField | CsvSchemaColumn,
		index: number,
	) => {
		const isArrayType = isJson && (item as JsonSchemaField).type === "array";

		return (
			<div key={index} className="space-y-2">
				<div className="flex items-end gap-2">
					<div className="flex-1 space-y-1">
						<Label htmlFor={`item-name-${index}`} className="text-xs">
							{itemLabel} Name
						</Label>
						<Input
							id={`item-name-${index}`}
							value={item.name}
							onChange={(e) => updateItem(index, { name: e.target.value })}
							placeholder={itemPlaceholder}
							className={
								duplicateNames.includes(item.name) && item.name
									? "border-destructive"
									: ""
							}
						/>
					</div>
					<div className="w-32 space-y-1">
						<Label htmlFor={`item-type-${index}`} className="text-xs">
							Type
						</Label>
						<Select
							value={item.type}
							onValueChange={(value) =>
								updateItem(index, {
									type: value as JsonSchemaField["type"],
								})
							}
						>
							<SelectTrigger id={`item-type-${index}`}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="string">String</SelectItem>
								<SelectItem value="number">Number</SelectItem>
								<SelectItem value="boolean">Boolean</SelectItem>
								<SelectItem value="date">Date</SelectItem>
								{isJson && <SelectItem value="array">Array</SelectItem>}
							</SelectContent>
						</Select>
					</div>
					{isArrayType && (
						<div className="w-28 space-y-1">
							<Label htmlFor={`array-type-${index}`} className="text-xs">
								Item Type
							</Label>
							<Select
								value={(item as JsonSchemaField).arrayItemType || "string"}
								onValueChange={(value) =>
									updateItem(index, {
										arrayItemType: value as JsonSchemaField["arrayItemType"],
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
						onClick={() => removeItem(index)}
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
							Description
						</span>
					</Button>
				</div>
				{expandedDescriptions.has(index) && (
					<div className="space-y-1">
						<Input
							id={`item-desc-${index}`}
							value={item.description || ""}
							onChange={(e) =>
								updateItem(index, { description: e.target.value })
							}
							placeholder={`Brief description of this ${itemLabel.toLowerCase()}`}
							className="text-sm"
						/>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="relative">
			{isGenerating && (
				<div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<span className="ml-2 text-sm">Generating schema...</span>
				</div>
			)}

			<div className={cn(isGenerating && "pointer-events-none opacity-60")}>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h3 className="font-medium text-sm">{title}</h3>
							{isJson && (
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">Object</span>
									<Switch
										checked={jsonType === "array"}
										onCheckedChange={(checked) =>
											setJsonType(checked ? "array" : "object")
										}
									/>
									<span className="text-xs text-muted-foreground">Array</span>
								</div>
							)}
						</div>
						{items.length > 0 && (isJson ? jsonType === "object" : true) && (
							<Select onValueChange={loadTemplate} defaultValue="custom">
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Template" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="custom">Custom</SelectItem>
									{isJson ? (
										<>
											<SelectItem value="invoice">Invoice</SelectItem>
											<SelectItem value="bankStatement">
												Bank Statement
											</SelectItem>
										</>
									) : (
										<>
											<SelectItem value="transactionList">
												Transaction List
											</SelectItem>
											<SelectItem value="productCatalog">
												Product Catalog
											</SelectItem>
											<SelectItem value="contactList">Contact List</SelectItem>
										</>
									)}
								</SelectContent>
							</Select>
						)}
					</div>

					<div className="border rounded-lg p-4 space-y-3">
						{items.length === 0 ? (
							renderEmptyState()
						) : (
							<>
								{items.map((item, index) => renderItem(item, index))}
								<Button
									variant="outline"
									size="sm"
									onClick={addItem}
									className="w-full"
								>
									<Plus className="h-4 w-4 mr-1" />
									Add {itemLabel}
								</Button>
							</>
						)}
					</div>

					{duplicateNames.length > 0 && (
						<p className="text-destructive text-sm">
							Duplicate {itemLabel.toLowerCase()} names:{" "}
							{duplicateNames.join(", ")}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
