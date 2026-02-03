import { beforeAll } from "vitest";
import { isNativeAvailable, loadWasmCrypto } from "@kundera-sn/kundera-ts/crypto";

beforeAll(async () => {
  if (isNativeAvailable()) return;
  await loadWasmCrypto();
});
