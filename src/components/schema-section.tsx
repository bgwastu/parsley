import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OutputFormat, SchemaDefinition } from "@/types/output";
import { CsvSchemaEditor } from "./schema-editors/csv-schema-editor";
import { JsonSchemaEditor } from "./schema-editors/json-schema-editor";

interface SchemaSectionProps {
	format: OutputFormat;
	schema: SchemaDefinition | null;
	onChange: (schema: SchemaDefinition) => void;
	onGenerateSchema: () => void;
	isGenerating: boolean;
	hasDocument: boolean;
	isConfigured: boolean;
}

export function SchemaSection({
	format,
	schema,
	onChange,
	onGenerateSchema,
	isGenerating,
	hasDocument,
	isConfigured,
}: SchemaSectionProps) {
	return (
		<div className="relative">
			{isGenerating && (
				<div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<span className="ml-2 text-sm">Generating schema...</span>
				</div>
			)}

			<div className={cn(isGenerating && "pointer-events-none opacity-60")}>
				{format === "json" && (
					<JsonSchemaEditor
						schema={schema?.format === "json" ? schema : null}
						onChange={onChange}
						onGenerateSchema={onGenerateSchema}
						isGenerating={isGenerating}
						hasDocument={hasDocument}
						isConfigured={isConfigured}
					/>
				)}
				{format === "csv" && (
					<CsvSchemaEditor
						schema={schema?.format === "csv" ? schema : null}
						onChange={onChange}
						onGenerateSchema={onGenerateSchema}
						isGenerating={isGenerating}
						hasDocument={hasDocument}
						isConfigured={isConfigured}
					/>
				)}
			</div>
		</div>
	);
}
