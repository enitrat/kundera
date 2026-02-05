#!/usr/bin/env npx tsx
/**
 * Setup docs symlinks and discover package documentation
 *
 * This script:
 * 1. Creates symlinks from docs/ to package docs (e.g., docs/typescript/skills → packages/kundera-ts/docs/skills)
 * 2. Discovers all .mdx files in linked package docs
 * 3. Updates docs.json navigation with discovered pages
 */

import { existsSync, lstatSync, symlinkSync, unlinkSync } from "node:fs";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const DOCS_ROOT = "docs";
const DOCS_JSON_PATH = "docs/docs.json";

/**
 * Package doc sources to symlink into docs/
 * Format: { linkPath: targetPath }
 * - linkPath: where the symlink should appear in docs/ (relative to docs/)
 * - targetPath: where the actual files are (relative to repo root)
 */
const PACKAGE_DOC_SOURCES: Record<string, string> = {
  "typescript/skills": "packages/kundera-ts/docs/skills",
  // Add more package doc sources here as needed:
  // "effect/skills": "packages/kundera-effect/docs/skills",
};

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
 * Ensure symlink exists, creating or updating as needed
 */
function ensureSymlink(linkPath: string, targetPath: string): void {
  const fullLinkPath = join(DOCS_ROOT, linkPath);
  // Calculate relative path from link location to target
  const linkDir = dirname(fullLinkPath);
  const relativeTarget = relative(linkDir, targetPath);

  // Check if target exists
  if (!existsSync(targetPath)) {
    console.warn(`⚠️  Target does not exist: ${targetPath}`);
    return;
  }

  // Check if link already exists
  if (existsSync(fullLinkPath)) {
    const stats = lstatSync(fullLinkPath);
    if (stats.isSymbolicLink()) {
      // Already a symlink - remove and recreate to ensure correct target
      unlinkSync(fullLinkPath);
    } else {
      console.warn(`⚠️  ${fullLinkPath} exists but is not a symlink. Skipping.`);
      return;
    }
  }

  // Create symlink
  symlinkSync(relativeTarget, fullLinkPath);
  console.log(`✓ Symlink: ${fullLinkPath} → ${relativeTarget}`);
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

  for (const [linkPath, targetPath] of Object.entries(PACKAGE_DOC_SOURCES)) {
    const fullLinkPath = join(DOCS_ROOT, linkPath);
    const files = await collectMdxFiles(fullLinkPath);

    if (files.length > 0) {
      discovered.set(linkPath, files);
      console.log(`✓ Discovered ${files.length} pages in ${linkPath}`);
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
 * Update navigation for a specific section with discovered pages
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

  // Get current pages in that group
  const { group } = result;
  const existingPages = new Set(
    group.pages.filter((p): p is string => typeof p === "string")
  );

  // Add any new pages
  let added = 0;
  for (const page of pages) {
    if (!existingPages.has(page)) {
      group.pages.push(page);
      added++;
    }
  }

  if (added > 0) {
    // Sort pages within group
    group.pages = group.pages.sort((a, b) => {
      const aStr = typeof a === "string" ? a : a.group || "";
      const bStr = typeof b === "string" ? b : b.group || "";
      return aStr.localeCompare(bStr);
    });
    console.log(`✓ Added ${added} new pages to ${linkPath} navigation`);
  }
}

async function main() {
  console.log("\n📚 Setting up docs...\n");

  // Step 1: Ensure symlinks
  console.log("Creating symlinks:");
  for (const [linkPath, targetPath] of Object.entries(PACKAGE_DOC_SOURCES)) {
    ensureSymlink(linkPath, targetPath);
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
