import type { GenerationOutput } from "@/types/app-state";
import { CsvTableOutput } from "./output/csv-table-output";
import { JsonOutput } from "./output/json-output";

interface OutputDisplayProps {
	output: GenerationOutput;
	jsonPage: number;
	csvPage: number;
	csvPageSize: number;
	onJsonPageChange: (page: number) => void;
	onCsvPageChange: (page: number) => void;
	onCsvPageSizeChange: (pageSize: number) => void;
}

export function OutputDisplay({
	output,
	jsonPage,
	csvPage,
	csvPageSize,
	onJsonPageChange,
	onCsvPageChange,
	onCsvPageSizeChange,
}: OutputDisplayProps) {
	switch (output.format) {
		case "json":
			return (
				<JsonOutput
					data={output.data}
					currentPage={jsonPage}
					onPageChange={onJsonPageChange}
				/>
			);
		case "csv":
			return (
				<CsvTableOutput
					data={output.data}
					currentPage={csvPage}
					pageSize={csvPageSize}
					onPageChange={onCsvPageChange}
					onPageSizeChange={onCsvPageSizeChange}
				/>
			);
	}
}
