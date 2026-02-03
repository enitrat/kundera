import { copyFileSync, existsSync, lstatSync, mkdirSync, readlinkSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const packageDir = resolve(scriptDir, "..");
const wasmLinkPath = resolve(packageDir, "wasm");

const wasmSourcePath = resolve(
  packageDir,
  "..",
  "..",
  "target",
  "wasm32-wasip1",
  "release",
  "starknet_crypto_ffi.wasm",
);

if (!existsSync(wasmSourcePath)) {
  throw new Error(`WASM build artifact not found at ${wasmSourcePath}`);
}

let wasmTargetDir = wasmLinkPath;
if (existsSync(wasmLinkPath)) {
  const stat = lstatSync(wasmLinkPath);
  if (stat.isSymbolicLink()) {
    const linkTarget = readlinkSync(wasmLinkPath);
    wasmTargetDir = resolve(packageDir, linkTarget);
  }
}

mkdirSync(wasmTargetDir, { recursive: true });
copyFileSync(wasmSourcePath, resolve(wasmTargetDir, "crypto.wasm"));
