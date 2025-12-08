import * as pdfjsLib from "pdfjs-dist";
import type { PageRange } from "@/types/settings";

if (typeof window !== "undefined") {
	pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
		"pdfjs-dist/build/pdf.worker.min.mjs",
		import.meta.url,
	).toString();
}

export async function processPDF(
	arrayBuffer: ArrayBuffer,
	pageRange: PageRange = { start: 1, end: null },
	password?: string,
	onPasswordNeeded?: () => Promise<string>,
): Promise<string[]> {
	// Clone the ArrayBuffer to prevent detachment issues
	// pdfjs may transfer the buffer, making it unusable for subsequent calls
	const clonedBuffer = arrayBuffer.slice(0);
	
	try {
		const loadingTask = pdfjsLib.getDocument({
			data: clonedBuffer,
			password,
		});

		const pdfDocument = await loadingTask.promise;
		const numPages = pdfDocument.numPages;

		const startPage = Math.max(1, pageRange.start);
		const endPage = pageRange.end
			? Math.min(pageRange.end, numPages)
			: numPages;

		const base64Images: string[] = [];

		for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
			const page = await pdfDocument.getPage(pageNum);
			const viewport = page.getViewport({ scale: 2.0 });

			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");

			if (!context) {
				throw new Error("Failed to get canvas context");
			}

			canvas.height = viewport.height;
			canvas.width = viewport.width;

			await page.render({
				canvasContext: context,
				viewport,
			}).promise;

			const base64 = canvas.toDataURL("image/png");
			base64Images.push(base64);
		}

		return base64Images;
	} catch (error: unknown) {
		if (error && typeof error === "object" && "name" in error) {
			if (error.name === "PasswordException") {
				if (onPasswordNeeded) {
					const userPassword = await onPasswordNeeded();
					// Clone the original buffer again for the retry
					const retryBuffer = arrayBuffer.slice(0);
					return processPDF(retryBuffer, pageRange, userPassword);
				}
				throw new Error("PDF is password protected");
			}

			if (error.name === "InvalidPDFException") {
				throw new Error("Invalid PDF file");
			}
		}

		throw error;
	}
}
