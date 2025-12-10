import { PDFDocument } from "@cantoo/pdf-lib";
import type { PageRange } from "@/types/settings";

export async function decryptPDFServer(
	buffer: Buffer,
	password: string,
	pageRange?: PageRange,
): Promise<string> {
	try {
		const pdfDoc = await PDFDocument.load(buffer, {
			ignoreEncryption: true,
			password,
		});

		let finalDoc = pdfDoc;

		if (pageRange) {
			const totalPages = pdfDoc.getPageCount();
			const startPage = Math.max(1, pageRange.start) - 1;
			const endPage = pageRange.end
				? Math.min(pageRange.end, totalPages) - 1
				: totalPages - 1;

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

		const decryptedPdfBytes = await finalDoc.save();
		const base64 = Buffer.from(decryptedPdfBytes).toString("base64");
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
