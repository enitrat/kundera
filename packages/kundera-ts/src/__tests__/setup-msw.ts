/**
 * MSW Setup for RPC Integration Tests
 *
 * Intercepts HTTP requests and serves recorded mainnet fixtures.
 * Matches on JSON-RPC `method` field in request body.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, "..", "..", "fixtures", "rpc");

/** Map of method -> fixture filename (for methods where filename differs from method) */
const FILENAME_OVERRIDES: Record<string, string> = {
	starknet_getTransactionByHash: "getTransactionByHash_invoke",
};

function fixtureForMethod(method: string): unknown | null {
	const filename =
		FILENAME_OVERRIDES[method] ?? method.replace("starknet_", "");
	const filepath = join(FIXTURE_DIR, `${filename}.json`);
	if (!existsSync(filepath)) return null;
	return JSON.parse(readFileSync(filepath, "utf-8"));
}

const handlers = [
	http.post("*/rpc*", async ({ request }) => {
		const body = (await request.json()) as {
			method: string;
			id: number;
			params?: unknown;
		};
		const fixture = fixtureForMethod(body.method);
		if (!fixture) {
			return HttpResponse.json(
				{
					jsonrpc: "2.0",
					id: body.id,
					error: {
						code: -32601,
						message: `No fixture for method: ${body.method}`,
					},
				},
				{ status: 200 },
			);
		}
		return HttpResponse.json(fixture);
	}),
];

export const mswServer = setupServer(...handlers);
