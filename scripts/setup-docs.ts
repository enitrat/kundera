#!/usr/bin/env npx tsx
/**
 * Setup docs by copying package documentation into docs/
 *
 * This script:
 * 1. Copies .mdx files from package docs into docs/ (e.g., packages/kundera-ts/docs/ → docs/typescript/)
 * 2. Discovers all .mdx files in copied package docs
 * 3. Updates docs.json navigation with discovered pages
 *
 * Source of truth: packages/kundera-ts/docs/
 * Mintlify serves from: docs/typescript/
 */

import { existsSync, mkdirSync, lstatSync, readdirSync, statSync, copyFileSync, rmSync } from "node:fs";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const DOCS_ROOT = "docs";
const DOCS_JSON_PATH = "docs/docs.json";

/**
 * Package doc sources to copy into docs/
 * Format: { destPath: sourcePath }
 * - destPath: where files should appear in docs/ (relative to docs/)
 * - sourcePath: where the actual source files are (relative to repo root)
 */
const PACKAGE_DOC_SOURCES: Record<string, string> = {
  "typescript": "packages/kundera-ts/docs",
  "effect": "packages/kundera-effect/docs",
};

/**
 * File extensions to copy (only documentation files)
 */
const COPY_EXTENSIONS = new Set([".mdx"]);

interface NavPage {
  group?: string;
  icon?: string;
  pages: (string | NavPage)[];
}

interface DocsJson {
  navigation: {
    anchors: Array<{
      anchor: string;
      icon: string;
      groups: NavPage[];
    }>;
    global: unknown;
  };
  [key: string]: unknown;
}

/**
 * Recursively copy .mdx files from source to destination
 */
function copyDocs(srcDir: string, destDir: string): number {
  if (!existsSync(srcDir)) {
    console.warn(`⚠️  Source does not exist: ${srcDir}`);
    return 0;
  }

  mkdirSync(destDir, { recursive: true });

  let copied = 0;
  const entries = readdirSync(srcDir);

  for (const entry of entries) {
    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    const stats = lstatSync(srcPath);

    if (stats.isDirectory()) {
      copied += copyDocs(srcPath, destPath);
    } else if (COPY_EXTENSIONS.has(extOf(entry))) {
      // Only copy if source is newer or dest doesn't exist
      if (!existsSync(destPath) || stats.mtimeMs > lstatSync(destPath).mtimeMs) {
        copyFileSync(srcPath, destPath);
        copied++;
      }
    }
  }

  return copied;
}

function extOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot);
}

/**
 * Recursively collect all .mdx files from a directory
 */
async function collectMdxFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  if (!existsSync(dirPath)) {
    return files;
  }

  const entries = await readdir(dirPath);

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      files.push(...(await collectMdxFiles(fullPath)));
    } else if (entry.endsWith(".mdx")) {
      // Convert to docs-relative path without extension
      const relativePath = relative(DOCS_ROOT, fullPath).replace(/\.mdx$/, "");
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Discover all pages in package docs and group by section
 */
async function discoverPackagePages(): Promise<Map<string, string[]>> {
  const discovered = new Map<string, string[]>();

  for (const [destPath] of Object.entries(PACKAGE_DOC_SOURCES)) {
    const fullDestPath = join(DOCS_ROOT, destPath);
    const files = await collectMdxFiles(fullDestPath);

    if (files.length > 0) {
      discovered.set(destPath, files);
      console.log(`✓ Discovered ${files.length} pages in ${destPath}`);
    }
  }

  return discovered;
}

/**
 * Find a nav group by path prefix in docs.json
 */
function findNavGroup(
  groups: NavPage[],
  pathPrefix: string
): { group: NavPage; parent: NavPage[] } | null {
  for (const group of groups) {
    if (group.pages) {
      for (const page of group.pages) {
        if (typeof page === "string" && page.startsWith(pathPrefix)) {
          return { group, parent: groups };
        }
        if (typeof page === "object" && page.pages) {
          const found = findNavGroup([page], pathPrefix);
          if (found) return found;
        }
      }
    }
  }
  return null;
}

/**
 * Recursively collect all page strings from a nav structure
 */
function collectAllPages(pages: (string | NavPage)[]): Set<string> {
  const result = new Set<string>();
  for (const page of pages) {
    if (typeof page === "string") {
      result.add(page);
    } else if (page.pages) {
      for (const p of collectAllPages(page.pages)) {
        result.add(p);
      }
    }
  }
  return result;
}

/**
 * Update navigation for a specific section with discovered pages.
 * Only adds pages that don't already exist anywhere in the section (including nested groups).
 */
function updateNavSection(docsJson: DocsJson, linkPath: string, pages: string[]): void {
  const docAnchor = docsJson.navigation.anchors.find((a) => a.anchor === "Documentation");
  if (!docAnchor) return;

  // Find existing group that contains pages with this prefix
  const result = findNavGroup(docAnchor.groups, linkPath);
  if (!result) {
    console.warn(`⚠️  No nav group found for ${linkPath}. Add manually to docs.json.`);
    return;
  }

  // Recursively collect ALL existing pages (including nested groups)
  const { group } = result;
  const existingPages = collectAllPages(group.pages);

  // Add only truly new pages
  let added = 0;
  for (const page of pages) {
    if (!existingPages.has(page)) {
      group.pages.push(page);
      added++;
    }
  }

  if (added > 0) {
    console.log(`✓ Added ${added} new pages to ${linkPath} navigation`);
  }
}

async function main() {
  console.log("\n📚 Setting up docs...\n");

  // Step 1: Copy package docs into docs/
  console.log("Copying package docs:");
  for (const [destPath, sourcePath] of Object.entries(PACKAGE_DOC_SOURCES)) {
    const fullDest = join(DOCS_ROOT, destPath);
    const copied = copyDocs(sourcePath, fullDest);
    if (copied > 0) {
      console.log(`✓ Copied ${copied} files: ${sourcePath} → ${fullDest}`);
    } else {
      console.log(`✓ ${destPath}: all files up to date`);
    }
  }

  // Step 2: Discover pages
  console.log("\nDiscovering pages:");
  const discoveredPages = await discoverPackagePages();

  // Step 3: Update docs.json (optional - only if pages found)
  if (discoveredPages.size > 0) {
    console.log("\nUpdating docs.json:");
    const docsContent = await readFile(DOCS_JSON_PATH, "utf-8");
    const docsJson: DocsJson = JSON.parse(docsContent);

    for (const [linkPath, pages] of discoveredPages) {
      updateNavSection(docsJson, linkPath, pages);
    }

    await writeFile(DOCS_JSON_PATH, JSON.stringify(docsJson, null, 2) + "\n");
  }

  console.log("\n✅ Docs setup complete\n");
}

main().catch(console.error);
