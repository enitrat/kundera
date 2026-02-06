import { beforeAll } from "vitest";
import { isNativeAvailable, loadWasmCrypto } from "../crypto/index";

beforeAll(async () => {
	if (isNativeAvailable()) return;
	await loadWasmCrypto();
});
