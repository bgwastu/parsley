// ABOUTME: Server-side environment variable utilities
// ABOUTME: Safely access and validate runtime environment variables

export function getServerEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

export function getOptionalServerEnv(key: string): string | undefined {
	return process.env[key];
}

export const OPENROUTER_API_KEY = getServerEnv("OPENROUTER_API_KEY");
export const ARCJET_KEY = getOptionalServerEnv("ARCJET_KEY");
export const NODE_ENV = process.env.NODE_ENV || "development";
export const isDevelopment = NODE_ENV === "development";
