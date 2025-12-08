export function readFileAsBase64(file: File): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
			} else {
				reject(
					new Error(
						"Unexpected result type when reading file as Base64. Expected string.",
					),
				);
			}
		};
		reader.onerror = (error) => {
			reject(error ?? new Error("Unknown file read error"));
		};
		reader.readAsDataURL(file);
	});
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as ArrayBuffer);
		reader.onerror = (error) =>
			reject(error ?? new Error("Unknown file read error"));
		reader.readAsArrayBuffer(file);
	});
}

export function downloadFile(
	content: string,
	filename: string,
	mimeType: string,
): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
