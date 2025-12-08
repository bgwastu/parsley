import { Parser } from "@json2csv/plainjs";

export function jsonToCsv(data: object | object[]): string {
	try {
		const dataArray = Array.isArray(data) ? data : [data];
		const parser = new Parser();
		return parser.parse(dataArray);
	} catch (error) {
		throw new Error(
			`Failed to convert JSON to CSV: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

export function jsonToCsvRows(data: object[]): string[][] {
	if (data.length === 0) return [];

	const keys = Object.keys(data[0]);
	const rows: string[][] = [keys];

	for (const item of data) {
		const row = keys.map((key) => {
			const value = (item as Record<string, unknown>)[key];
			return value !== undefined && value !== null ? String(value) : "";
		});
		rows.push(row);
	}

	return rows;
}
