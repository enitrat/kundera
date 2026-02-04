#!/usr/bin/env bun

/**
 * Fix Documentation Links
 *
 * This script automatically fixes broken internal links in MDX files
 * by adding the correct path prefixes (typescript/, effect/, etc.)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DOCS_DIR = join(__dirname, '../docs');

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
 * Recursively find all MDX/MD files
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
 * Determine the correct prefix for a link based on the file's location
 */
function getCorrectPrefix(filePath, link) {
  const relativePath = relative(DOCS_DIR, filePath);
  const fileDir = dirname(relativePath);

  // Determine which section the file is in
  let prefix = '';

  if (fileDir.startsWith('effect/')) {
    // Files in effect/ should use /effect/ prefix
    prefix = '/effect';
  } else if (fileDir.startsWith('typescript/')) {
    // Files in typescript/ should use /typescript/ prefix
    prefix = '/typescript';
  } else if (fileDir === 'shared' || fileDir === 'guides' || fileDir === 'getting-started' ||
             fileDir.startsWith('shared/') || fileDir.startsWith('guides/') || fileDir.startsWith('getting-started/')) {
    // Shared, guides, and getting-started can link to both, so check the link target
    if (link.startsWith('/primitives') || link.startsWith('/api') || link.startsWith('/skills') ||
        link.startsWith('/concepts') || link.startsWith('/overview') || link.startsWith('/getting-started')) {
      // These are TypeScript paths
      prefix = '/typescript';
    } else if (link.startsWith('/services') || link.startsWith('/modules')) {
      // These are Effect paths
      prefix = '/effect';
    } else if (link.startsWith('/abi') || link.startsWith('/crypto') || link.startsWith('/jsonrpc') ||
               link.startsWith('/serde') || link.startsWith('/transport')) {
      // Could be either - for shared docs, prefer typescript for API references
      prefix = '/typescript';
    } else if (link.startsWith('/guides/')) {
      // Guides within guides stay as /guides/
      prefix = '';
    }
  } else if (fileDir.startsWith('typescript/overview') || fileDir === 'typescript') {
    // TypeScript overview files
    prefix = '/typescript';
  }

  return prefix;
}

/**
 * Fix links in a file
 */
function fixLinksInFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let fixCount = 0;

  // Fix href="/..." links
  content = content.replace(/href=["']\/([^"']+)["']/g, (match, path) => {
    if (path.startsWith('http') || path.startsWith('shared/') ||
        path.startsWith('effect/') || path.startsWith('typescript/')) {
      // Already has correct prefix or is external
      return match;
    }

    // Don't modify /guides/ and /getting-started/ - they're correct as-is
    if (path.startsWith('guides/') || path.startsWith('getting-started/')) {
      return match;
    }

    const prefix = getCorrectPrefix(filePath, `/${path}`);
    if (prefix) {
      fixCount++;
      modified = true;
      return `href="${prefix}/${path}"`;
    }

    return match;
  });

  // Fix [text](/...) markdown links
  content = content.replace(/\[([^\]]+)\]\(\/([^)]+)\)/g, (match, text, path) => {
    if (path.startsWith('http') || path.startsWith('shared/') ||
        path.startsWith('effect/') || path.startsWith('typescript/')) {
      // Already has correct prefix or is external
      return match;
    }

    // Don't modify /guides/ and /getting-started/ - they're correct as-is
    if (path.startsWith('guides/') || path.startsWith('getting-started/')) {
      return match;
    }

    const prefix = getCorrectPrefix(filePath, `/${path}`);
    if (prefix) {
      fixCount++;
      modified = true;
      return `[${text}](${prefix}/${path})`;
    }

    return match;
  });

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
  }

  return { modified, fixCount };
}

/**
 * Main function
 */
function fixAllLinks() {
  log('\n🔧 Fixing documentation links...\n', 'blue');

  const files = findFiles(DOCS_DIR, ['mdx', 'md']).filter(
    (f) => !f.includes('README.md')
  );

  log(`Found ${files.length} documentation files\n`, 'gray');

  let totalFixed = 0;
  let filesModified = 0;

  for (const file of files) {
    const relativePath = relative(DOCS_DIR, file);
    const { modified, fixCount } = fixLinksInFile(file);

    if (modified) {
      filesModified++;
      totalFixed += fixCount;
      log(`✓ ${relativePath} (${fixCount} links fixed)`, 'green');
    }
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'gray');

  if (totalFixed === 0) {
    log('✅ No links needed fixing!', 'green');
  } else {
    log(`✅ Fixed ${totalFixed} links in ${filesModified} files`, 'green');
  }
}

// Run
try {
  fixAllLinks();
} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}
