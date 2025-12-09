import { PDFDocument } from "@cantoo/pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import type { PageRange } from "@/types/settings";

if (typeof window !== "undefined") {
	pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
		"pdfjs-dist/build/pdf.worker.min.mjs",
		import.meta.url,
	).toString();
}

export async function validatePDFPassword(
	arrayBuffer: ArrayBuffer,
	password?: string,
): Promise<boolean> {
	try {
		const clonedBuffer = arrayBuffer.slice(0);
		const loadingTask = pdfjsLib.getDocument({
			data: clonedBuffer,
			password,
		});
		await loadingTask.promise;
		return true;
	} catch (error: unknown) {
		if (error && typeof error === "object" && "name" in error) {
			if (error.name === "PasswordException") {
				return false;
			}
		}
		throw error;
	}
}

export async function decryptPDF(
	arrayBuffer: ArrayBuffer,
	password: string,
	pageRange?: PageRange,
): Promise<string> {
	try {
		// Load encrypted document with @cantoo/pdf-lib
		const pdfDoc = await PDFDocument.load(arrayBuffer, {
			ignoreEncryption: true,
			password,
		});

		let finalDoc = pdfDoc;

		// If page range is specified, create a new PDF with only those pages
		if (pageRange) {
			const totalPages = pdfDoc.getPageCount();
			const startPage = Math.max(1, pageRange.start) - 1; // Convert to 0-indexed
			const endPage = pageRange.end
				? Math.min(pageRange.end, totalPages) - 1
				: totalPages - 1;

			// Only create a new document if we're not using all pages
			if (startPage > 0 || endPage < totalPages - 1) {
				finalDoc = await PDFDocument.create();
				const pagesToCopy = await finalDoc.copyPages(
					pdfDoc,
					Array.from(
						{ length: endPage - startPage + 1 },
						(_, i) => startPage + i,
					),
				);

				for (const page of pagesToCopy) {
					finalDoc.addPage(page);
				}
			}
		}

		// Save the decrypted PDF
		const decryptedPdfBytes = await finalDoc.save();
		const base64 = btoa(
			String.fromCharCode(...new Uint8Array(decryptedPdfBytes)),
		);
		return `data:application/pdf;base64,${base64}`;
	} catch (error: unknown) {
		console.error("PDF decryption error:", error);

		if (error && typeof error === "object") {
			if ("message" in error && typeof error.message === "string") {
				console.error("Error message:", error.message);

				if (
					error.message.includes("password") ||
					error.message.includes("Password")
				) {
					throw new Error("Invalid PDF password");
				}
				if (
					error.message.includes("encrypted") ||
					error.message.includes("Encrypted")
				) {
					throw new Error(
						"This PDF uses an encryption method that is not supported.",
					);
				}
			}
		}

		throw new Error(
			`Failed to decrypt PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
