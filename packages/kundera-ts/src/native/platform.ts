/**
 * Platform Detection and Native Library Paths
 *
 * Detects runtime (Bun vs Node), platform (darwin/linux/win32),
 * and provides paths to native libraries.
 */

import { join, dirname } from "path";
import { existsSync } from "fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

// ============ Platform Detection ============

export type Platform = "darwin" | "linux" | "win32";
export type Arch = "x64" | "arm64";
export type Runtime = "bun" | "node";

/**
 * Get current platform
 */
export function getPlatform(): Platform {
	const p = process.platform;
	if (p === "darwin" || p === "linux" || p === "win32") {
		return p;
	}
	throw new Error(`Unsupported platform: ${p}`);
}

/**
 * Get current architecture
 */
export function getArch(): Arch {
	const a = process.arch;
	if (a === "x64" || a === "arm64") {
		return a;
	}
	throw new Error(`Unsupported architecture: ${a}`);
}

/**
 * Detect current runtime (Bun or Node.js)
 */
export function getRuntime(): Runtime {
	// @ts-ignore - Bun global
	if (typeof Bun !== "undefined") {
		return "bun";
	}
	return "node";
}

/**
 * Check if running in Bun
 */
export function isBun(): boolean {
	return getRuntime() === "bun";
}

/**
 * Check if running in Node.js
 */
export function isNode(): boolean {
	return getRuntime() === "node";
}

// ============ Library Naming ============

/**
 * Get native library file extension for current platform
 */
export function getNativeExtension(): string {
	const platform = getPlatform();
	switch (platform) {
		case "darwin":
			return ".dylib";
		case "win32":
			return ".dll";
		case "linux":
		default:
			return ".so";
	}
}

/**
 * Get native library filename for current platform
 */
export function getNativeLibName(): string {
	const platform = getPlatform();
	const ext = getNativeExtension();
	if (platform === "win32") {
		return `starknet_crypto_ffi${ext}`;
	}
	return `libstarknet_crypto_ffi${ext}`;
}

/**
 * Get platform-specific subdirectory name (e.g., darwin-arm64)
 */
export function getPlatformDir(): string {
	return `${getPlatform()}-${getArch()}`;
}

// ============ Library Path Resolution ============

/**
 * Get the path to the native library, searching multiple locations.
 * Returns null if not found.
 */
export function getNativeLibPath(): string | null {
	const libName = getNativeLibName();
	const platformDir = getPlatformDir();

	// Search paths in order of preference
	const searchPaths = [
		// 1. Development: target/release (repo root)
		join(process.cwd(), "target", "release", libName),

		// 2. Monorepo: when running from packages/kundera-ts/
		join(process.cwd(), "..", "..", "target", "release", libName),

		// 3. Platform-specific: native/<platform>-<arch>/
		join(process.cwd(), "native", platformDir, libName),

		// 4. Relative to this module (installed package)
		join(
			dirname(fileURLToPath(import.meta.url)),
			"..",
			"..",
			"native",
			platformDir,
			libName,
		),

		// 5. System paths
		join("/usr/local/lib", libName),
	];

	// Try optional platform package: kundera-sn-<platform>-<arch>
	try {
		const platformPkg = `kundera-sn-${platformDir}`;
		const pkgPath = require.resolve(platformPkg);
		if (pkgPath) {
			const pkgLibPath = join(dirname(pkgPath), libName);
			searchPaths.unshift(pkgLibPath);
		}
	} catch {
		// Platform package not installed, continue with other paths
	}

	for (const path of searchPaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	return null;
}

/**
 * Get all search paths for debugging
 */
export function getSearchPaths(): string[] {
	const libName = getNativeLibName();
	const platformDir = getPlatformDir();

	return [
		join(process.cwd(), "target", "release", libName),
		join(process.cwd(), "..", "..", "target", "release", libName),
		join(process.cwd(), "native", platformDir, libName),
		join(process.cwd(), "native", libName),
		join("/usr/local/lib", libName),
	];
}
