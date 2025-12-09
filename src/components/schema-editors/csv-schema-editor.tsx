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
import type { CsvSchemaColumn, SchemaDefinition } from "@/types/output";

interface CsvSchemaEditorProps {
	schema: SchemaDefinition | null;
	onChange: (schema: SchemaDefinition) => void;
	onGenerateSchema: () => void;
	isGenerating: boolean;
	hasDocument: boolean;
	isConfigured: boolean;
}

const templates: Record<string, CsvSchemaColumn[]> = {
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

export function CsvSchemaEditor({
	schema,
	onChange,
	onGenerateSchema,
	isGenerating,
	hasDocument,
	isConfigured,
}: CsvSchemaEditorProps) {
	const columns = schema?.format === "csv" ? schema.columns : [];
	const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(
		new Set(),
	);

	const setColumns = (newColumns: CsvSchemaColumn[]) => {
		onChange({ format: "csv", columns: newColumns });
	};

	const addColumn = () => {
		setColumns([...columns, { name: "", type: "string", required: true }]);
	};

	const removeColumn = (index: number) => {
		setColumns(columns.filter((_, i) => i !== index));
	};

	const updateColumn = (index: number, updates: Partial<CsvSchemaColumn>) => {
		const updated = [...columns];
		updated[index] = { ...updated[index], ...updates };
		setColumns(updated);
	};

	const loadTemplate = (templateName: string) => {
		setColumns(templates[templateName]);
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

	const duplicateNames = columns
		.map((c) => c.name)
		.filter((name, index, arr) => name && arr.indexOf(name) !== index);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-sm">CSV Column Definition</h3>
				{columns.length > 0 && (
					<Select onValueChange={loadTemplate} defaultValue="custom">
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Template" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="custom">Custom</SelectItem>
							<SelectItem value="transactionList">Transaction List</SelectItem>
							<SelectItem value="productCatalog">Product Catalog</SelectItem>
							<SelectItem value="contactList">Contact List</SelectItem>
						</SelectContent>
					</Select>
				)}
			</div>

			<div className="border rounded-lg p-4 space-y-3">
				{columns.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 space-y-4">
						<p className="text-center text-muted-foreground text-sm">
							No columns defined. Add columns manually or generate from
							document.
						</p>
						<div className="flex gap-3">
							<Button variant="outline" size="sm" onClick={addColumn}>
								<Plus className="h-4 w-4 mr-1" />
								Add Column
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
				) : (
					columns.map((column, index) => (
						<div
							key={index}
							className="space-y-2 pb-3 border-b last:border-b-0"
						>
							<div className="flex items-end gap-2">
								<div className="flex-1 space-y-1">
									<Label htmlFor={`column-name-${index}`} className="text-xs">
										Column Name
									</Label>
									<Input
										id={`column-name-${index}`}
										value={column.name}
										onChange={(e) =>
											updateColumn(index, { name: e.target.value })
										}
										placeholder="columnName"
										className={
											duplicateNames.includes(column.name) && column.name
												? "border-destructive"
												: ""
										}
									/>
								</div>
								<div className="w-32 space-y-1">
									<Label htmlFor={`column-type-${index}`} className="text-xs">
										Type
									</Label>
									<Select
										value={column.type}
										onValueChange={(value) =>
											updateColumn(index, {
												type: value as CsvSchemaColumn["type"],
											})
										}
									>
										<SelectTrigger id={`column-type-${index}`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="string">String</SelectItem>
											<SelectItem value="number">Number</SelectItem>
											<SelectItem value="boolean">Boolean</SelectItem>
											<SelectItem value="date">Date</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => removeColumn(index)}
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
										id={`column-desc-${index}`}
										value={column.description || ""}
										onChange={(e) =>
											updateColumn(index, { description: e.target.value })
										}
										placeholder="Brief description of this column"
										className="text-sm"
									/>
								</div>
							)}
						</div>
					))
				)}

				{columns.length > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={addColumn}
						className="w-full"
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Column
					</Button>
				)}
			</div>

			{duplicateNames.length > 0 && (
				<p className="text-destructive text-sm">
					Duplicate column names: {duplicateNames.join(", ")}
				</p>
			)}
		</div>
	);
}
