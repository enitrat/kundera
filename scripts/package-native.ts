#!/usr/bin/env bun
/**
 * Package Native Libraries
 *
 * Copies the built native library from target/release to the appropriate
 * platform-specific directory in native/<platform>-<arch>/.
 *
 * Usage:
 *   bun run scripts/package-native.ts
 *   bun run scripts/package-native.ts --all  # Package for all built platforms
 */

import { join, dirname } from 'path';
import { existsSync, mkdirSync, copyFileSync } from 'fs';

// Platform configurations
const PLATFORMS = {
  'darwin-arm64': {
    libName: 'libstarknet_crypto_ffi.dylib',
    targetTriple: 'aarch64-apple-darwin',
  },
  'darwin-x64': {
    libName: 'libstarknet_crypto_ffi.dylib',
    targetTriple: 'x86_64-apple-darwin',
  },
  'linux-x64': {
    libName: 'libstarknet_crypto_ffi.so',
    targetTriple: 'x86_64-unknown-linux-gnu',
  },
  'linux-arm64': {
    libName: 'libstarknet_crypto_ffi.so',
    targetTriple: 'aarch64-unknown-linux-gnu',
  },
  'win32-x64': {
    libName: 'starknet_crypto_ffi.dll',
    targetTriple: 'x86_64-pc-windows-msvc',
  },
} as const;

type PlatformKey = keyof typeof PLATFORMS;

function getCurrentPlatform(): PlatformKey {
  const platform = process.platform;
  const arch = process.arch;
  const key = `${platform}-${arch}` as PlatformKey;
  if (!(key in PLATFORMS)) {
    throw new Error(`Unsupported platform: ${key}`);
  }
  return key;
}

function packageForPlatform(
  platformKey: PlatformKey,
  projectRoot: string,
  outputRoot: string
): boolean {
  const config = PLATFORMS[platformKey];

  // Source paths to check
  const sourcePaths = [
    // Native build (current platform)
    join(projectRoot, 'target', 'release', config.libName),
    // Cross-compiled build
    join(projectRoot, 'target', config.targetTriple, 'release', config.libName),
  ];

  let sourcePath: string | null = null;
  for (const path of sourcePaths) {
    if (existsSync(path)) {
      sourcePath = path;
      break;
    }
  }

  if (!sourcePath) {
    console.log(`  [skip] ${platformKey}: library not found`);
    return false;
  }

  // Destination
  const destDir = join(outputRoot, 'native', platformKey);
  const destPath = join(destDir, config.libName);

  // Create directory if needed
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  // Copy the library
  copyFileSync(sourcePath, destPath);
  console.log(`  [done] ${platformKey}: ${sourcePath} -> ${destPath}`);
  return true;
}

function parseOutDir(args: string[]): string | null {
  const outIndex = args.indexOf('--out');
  if (outIndex === -1) return null;
  const outDir = args[outIndex + 1];
  if (!outDir) {
    throw new Error('--out requires a path');
  }
  return outDir;
}

function main() {
  const projectRoot = join(dirname(import.meta.path), '..');
  const args = process.argv.slice(2);
  const outDirFromArgs = parseOutDir(args);
  const outputRoot =
    outDirFromArgs ?? process.env.KUNDERA_NATIVE_OUT ?? projectRoot;
  const packageAll = args.includes('--all');

  console.log('Packaging native libraries...\n');

  if (packageAll) {
    // Package all platforms that have built libraries
    console.log('Mode: all platforms\n');
    let packaged = 0;
    for (const platformKey of Object.keys(PLATFORMS) as PlatformKey[]) {
      if (packageForPlatform(platformKey, projectRoot, outputRoot)) {
        packaged++;
      }
    }
    console.log(`\nPackaged ${packaged} platform(s)`);
  } else {
    // Package current platform only
    const currentPlatform = getCurrentPlatform();
    console.log(`Mode: current platform (${currentPlatform})\n`);

    if (!packageForPlatform(currentPlatform, projectRoot, outputRoot)) {
      console.error(`\nError: Native library not found for ${currentPlatform}`);
      console.error('Build with: cargo build --release');
      process.exit(1);
    }

    console.log('\nDone!');
  }
}

main();
