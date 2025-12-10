const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
	"image/jpg",
];

export function bufferToBase64DataUrl(buffer: Buffer, mimeType: string): string {
	const base64 = buffer.toString("base64");
	return `data:${mimeType};base64,${base64}`;
}

export function validateFileType(mimeType: string): void {
	if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
		throw new Error(
			`Unsupported file type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
		);
	}
}

export function validateFileSize(size: number): void {
	if (size > MAX_FILE_SIZE) {
		throw new Error(
			`File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
		);
	}
}
