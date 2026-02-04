#!/usr/bin/env bun

/**
 * Verify Documentation Links
 *
 * This script checks that all internal links in MDX documentation files
 * point to existing pages.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DOCS_DIR = resolve(__dirname, '../docs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Recursively find all files with given extensions
 */
function findFiles(dir, extensions) {
  const files = [];

  function traverse(currentDir) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (item !== 'node_modules') {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = item.split('.').pop();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Extract internal links from MDX content
 * Matches: href="/path/to/page" or [text](/path/to/page)
 */
function extractInternalLinks(content) {
  const links = new Set();

  // Match href="/..." in MDX components like <Card href="/...">
  const hrefPattern = /href=["']([^"']+)["']/g;
  let match;
  while ((match = hrefPattern.exec(content)) !== null) {
    const link = match[1];
    // Only internal links (starting with /)
    if (link.startsWith('/') && !link.startsWith('http')) {
      links.add(link);
    }
  }

  // Match [text](/path) markdown links
  const markdownPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = markdownPattern.exec(content)) !== null) {
    const link = match[2];
    // Only internal links (starting with /)
    if (link.startsWith('/') && !link.startsWith('http')) {
      links.add(link);
    }
  }

  return Array.from(links);
}

/**
 * Check if a link path exists as a file
 */
function linkExists(link) {
  // Remove leading slash and try various extensions
  const relativePath = link.startsWith('/') ? link.slice(1) : link;

  // Try exact path, .mdx, and .md extensions
  const possiblePaths = [
    join(DOCS_DIR, relativePath),
    join(DOCS_DIR, `${relativePath}.mdx`),
    join(DOCS_DIR, `${relativePath}.md`),
    join(DOCS_DIR, relativePath, 'index.mdx'),
    join(DOCS_DIR, relativePath, 'index.md'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return { exists: true, resolvedPath: path };
    }
  }

  return { exists: false, resolvedPath: null };
}

/**
 * Verify all links in a documentation file
 */
function verifyFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const links = extractInternalLinks(content);
  const broken = [];

  for (const link of links) {
    // Skip external links and anchors
    if (link.startsWith('http') || link.includes('#')) {
      continue;
    }

    const result = linkExists(link);
    if (!result.exists) {
      broken.push(link);
    }
  }

  return { links, broken };
}

/**
 * Main verification function
 */
function verifyAllLinks() {
  log('\n📚 Verifying documentation links...\n', 'blue');

  // Find all MDX/MD files
  const files = findFiles(DOCS_DIR, ['mdx', 'md']).filter(
    (f) => !f.includes('README.md')
  );

  log(`Found ${files.length} documentation files\n`, 'gray');

  let totalLinks = 0;
  let totalBroken = 0;
  const brokenByFile = new Map();

  // Verify each file
  for (const file of files) {
    const relativePath = file.replace(DOCS_DIR + '/', '');
    const { links, broken } = verifyFile(file);

    totalLinks += links.length;

    if (broken.length > 0) {
      totalBroken += broken.length;
      brokenByFile.set(relativePath, broken);
    }
  }

  // Report results
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'gray');

  if (totalBroken === 0) {
    log('✅ All links are valid!', 'green');
    log(`\nChecked ${totalLinks} links across ${files.length} files.`, 'gray');
  } else {
    log(`❌ Found ${totalBroken} broken links:\n`, 'red');

    for (const [file, broken] of brokenByFile.entries()) {
      log(`\n📄 ${file}`, 'yellow');
      for (const link of broken) {
        log(`   ❌ ${link}`, 'red');
      }
    }

    log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'gray');
    log(`Total: ${totalBroken} broken links in ${brokenByFile.size} files`, 'red');

    process.exit(1);
  }
}

// Run verification
try {
  verifyAllLinks();
} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}
