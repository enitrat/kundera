import { copyFileSync, existsSync, lstatSync, mkdirSync, readlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
try {
  const stat = lstatSync(wasmLinkPath);
  if (stat.isSymbolicLink()) {
    const linkTarget = readlinkSync(wasmLinkPath);
    wasmTargetDir = resolve(packageDir, linkTarget);
  }
} catch (error) {
  if (!error || error.code !== "ENOENT") {
    throw error;
  }
}

try {
  mkdirSync(wasmTargetDir, { recursive: true });
} catch (error) {
  if (error && error.code === "ENOENT") {
    mkdirSync(dirname(wasmTargetDir), { recursive: true });
    mkdirSync(wasmTargetDir, { recursive: true });
  } else {
    throw error;
  }
}
copyFileSync(wasmSourcePath, resolve(wasmTargetDir, "crypto.wasm"));
