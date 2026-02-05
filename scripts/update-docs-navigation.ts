#!/usr/bin/env npx tsx
/**
 * Update docs.json navigation with generated API docs
 */

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";

const GENERATED_API_DIR = "docs/generated-api";
const DOCS_JSON_PATH = "docs/docs.json";

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
 * Recursively collect all .mdx files from a directory
 */
async function collectMdxFiles(dirPath: string): Promise<string[]> {
	const files: string[] = [];
	const entries = await readdir(dirPath);

	for (const entry of entries) {
		const fullPath = join(dirPath, entry);
		const stats = await stat(fullPath);

		if (stats.isDirectory()) {
			files.push(...(await collectMdxFiles(fullPath)));
		} else if (entry.endsWith(".mdx")) {
			// Convert to docs-relative path without extension
			const relativePath = relative("docs", fullPath).replace(/\.mdx$/, "");
			files.push(relativePath);
		}
	}

	return files;
}

/**
 * Group files by their parent directory for nested navigation
 */
function groupFilesByDirectory(files: string[]): Map<string, string[]> {
	const groups = new Map<string, string[]>();

	for (const file of files) {
		const parts = file.split("/");
		// Skip the "generated-api" prefix for grouping
		if (parts.length >= 2 && parts[0] === "generated-api") {
			const groupKey = parts.length > 2 ? parts[1] : "root";
			if (!groups.has(groupKey)) {
				groups.set(groupKey, []);
			}
			groups.get(groupKey)!.push(file);
		}
	}

	return groups;
}

/**
 * Create navigation structure from grouped files
 */
function createNavigation(groups: Map<string, string[]>): NavPage {
	const pages: (string | NavPage)[] = [];

	// Add root files first (like index.mdx)
	const rootFiles = groups.get("root") || [];
	for (const file of rootFiles.sort()) {
		pages.push(file);
	}

	// Add grouped sections
	const sortedGroups = Array.from(groups.entries())
		.filter(([key]) => key !== "root")
		.sort(([a], [b]) => a.localeCompare(b));

	for (const [groupName, groupFiles] of sortedGroups) {
		// Capitalize group name for display
		const displayName = groupName.charAt(0).toUpperCase() + groupName.slice(1);

		pages.push({
			group: displayName,
			pages: groupFiles.sort(),
		});
	}

	return {
		group: "Generated API",
		icon: "code",
		pages,
	};
}

async function main() {
	// Check if generated-api exists
	try {
		await stat(GENERATED_API_DIR);
	} catch {
		console.error(`Directory ${GENERATED_API_DIR} does not exist. Run typedoc first.`);
		process.exit(1);
	}

	// Read current docs.json
	const docsContent = await readFile(DOCS_JSON_PATH, "utf-8");
	const docsJson: DocsJson = JSON.parse(docsContent);

	// Collect all generated MDX files
	const mdxFiles = await collectMdxFiles(GENERATED_API_DIR);
	console.log(`Found ${mdxFiles.length} generated MDX files`);

	// Group files and create navigation
	const groups = groupFilesByDirectory(mdxFiles);
	const generatedNav = createNavigation(groups);

	// Find the Documentation anchor
	const docAnchor = docsJson.navigation.anchors.find((a) => a.anchor === "Documentation");
	if (!docAnchor) {
		console.error("Could not find Documentation anchor in docs.json");
		process.exit(1);
	}

	// Remove existing "Generated API" group if present
	docAnchor.groups = docAnchor.groups.filter((g) => g.group !== "Generated API");

	// Add the new Generated API section at the end
	docAnchor.groups.push(generatedNav);

	// Write updated docs.json
	await writeFile(DOCS_JSON_PATH, JSON.stringify(docsJson, null, 2) + "\n");
	console.log("Updated docs.json with generated API navigation");
}

main().catch(console.error);
