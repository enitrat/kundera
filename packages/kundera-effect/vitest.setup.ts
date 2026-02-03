import { beforeAll } from "vitest";
import { isNativeAvailable, loadWasmCrypto } from "kundera-sn/crypto";

beforeAll(async () => {
  if (isNativeAvailable()) return;
  await loadWasmCrypto();
});
