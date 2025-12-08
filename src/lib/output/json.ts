export function formatJson(data: object, pretty = true): string {
	return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

export function downloadJson(data: object, filename: string): void {
	const jsonString = formatJson(data);
	const blob = new Blob([jsonString], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
