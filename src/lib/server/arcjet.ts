// ABOUTME: Arcjet security adapter for TanStack Start with Nitro
// ABOUTME: Provides rate limiting and bot protection for API routes

import arcjet, { shield, tokenBucket } from "@arcjet/node";
import { ARCJET_KEY } from "./env";

export const aj = arcjet({
	key: ARCJET_KEY,
	characteristics: ["ip.src"],
	rules: [shield({ mode: "LIVE" })],
});

export const demoRateLimit = tokenBucket({
	mode: "LIVE",
	refillRate: 3,
	interval: "24h",
	capacity: 3,
});

export const userProvidedRateLimit = tokenBucket({
	mode: "LIVE",
	refillRate: 60,
	interval: "1m",
	capacity: 60,
});

export function toArcjetRequest(request: Request) {
	return {
		ip:
			request.headers.get("x-forwarded-for")?.split(",")[0] ||
			request.headers.get("x-real-ip") ||
			"127.0.0.1",
		method: request.method,
		protocol: "https",
		host: request.headers.get("host") || "",
		path: new URL(request.url).pathname,
		headers: Object.fromEntries(request.headers.entries()),
	};
}
