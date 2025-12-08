import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OutputFormat } from "@/types/output";

interface FormatSelectorProps {
	value: OutputFormat;
	onChange: (format: OutputFormat) => void;
	disabled?: boolean;
}

export function FormatSelector({
	value,
	onChange,
	disabled,
}: FormatSelectorProps) {
	return (
		<div className="space-y-2">
			<h3 className="text-sm font-medium">Output Format</h3>
			<Tabs value={value} onValueChange={(v) => onChange(v as OutputFormat)}>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="json" disabled={disabled}>
						JSON
					</TabsTrigger>
					<TabsTrigger value="csv" disabled={disabled}>
						CSV
					</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>
	);
}
