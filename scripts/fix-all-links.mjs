#!/usr/bin/env bun

/**
 * Comprehensive Link Fixer
 *
 * Fixes all remaining broken links with specific rules:
 * 1. TypeScript files: /getting-started/ → /typescript/getting-started/
 * 2. Effect files: /primitives → /effect/primitives
 * 3. Effect files: /services/ → /effect/services/
 * 4. TypeScript files: /guides/abi/ → /typescript/guides/abi/
 * 5. All files: /typescript/services → /effect/services
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DOCS_DIR = join(__dirname, '../docs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findFiles(dir, extensions) {
  const files = [];
  function traverse(currentDir) {
    const items = readdirSync(currentDir);
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (item !== 'node_modules') traverse(fullPath);
      } else if (stat.isFile()) {
        const ext = item.split('.').pop();
        if (extensions.includes(ext)) files.push(fullPath);
      }
    }
  }
  traverse(dir);
  return files;
}

function fixLinksInFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const relativePath = relative(DOCS_DIR, filePath);
  const fileDir = dirname(relativePath);
  let modified = false;
  let fixCount = 0;

  // Determine file context
  const isTypescript = fileDir.startsWith('typescript/');
  const isEffect = fileDir.startsWith('effect/');
  const isShared = fileDir.startsWith('shared/') || fileDir.startsWith('guides/') || fileDir.startsWith('getting-started/');

  // Fix href and markdown links together
  const linkPattern = /(?:href=["']|(?:\[[^\]]+\]\())\/([^"'\)]+)(?:["']|\))/g;

  content = content.replace(linkPattern, (match, path) => {
    const originalPath = `/${path}`;
    let newPath = originalPath;

    // Rule 1: /typescript/services → /effect/services (doesn't exist)
    if (path.startsWith('typescript/services')) {
      newPath = path.replace('typescript/services', 'effect/services');
      fixCount++;
      modified = true;
    }
    // Rule 2: TypeScript files - /getting-started/ → /typescript/getting-started/ (for non-root getting-started content)
    else if (isTypescript && path.match(/^getting-started\/(branded-types|agentic-coding|runtime-implementations)/)) {
      newPath = `/typescript/${path}`;
      fixCount++;
      modified = true;
    }
    // Rule 3: TypeScript files - /guides/abi/ → /typescript/guides/abi/
    else if (isTypescript && path.startsWith('guides/abi/')) {
      newPath = `/typescript/${path}`;
      fixCount++;
      modified = true;
    }
    // Rule 4: TypeScript files - /guides/provider/ → /typescript/guides/provider/
    else if (isTypescript && path.startsWith('guides/provider/')) {
      newPath = `/typescript/${path}`;
      fixCount++;
      modified = true;
    }
    // Rule 5: Effect files - bare module paths need /effect/ prefix
    else if (isEffect && path.match(/^(primitives|abi|crypto|jsonrpc|serde|transport)($|\/)/)) {
      newPath = `/effect/${path}`;
      fixCount++;
      modified = true;
    }
    // Rule 5b: Effect services paths need /effect/ prefix
    else if (isEffect && path.match(/^services($|\/)/)) {
      newPath = `/effect/${path}`;
      fixCount++;
      modified = true;
    }
    // Rule 6: Shared files - /concepts/ → /typescript/concepts/
    else if (isShared && path.startsWith('concepts/')) {
      newPath = `/typescript/${path}`;
      fixCount++;
      modified = true;
    }
    // Rule 7: Shared files - /overview/ → /typescript/overview/
    else if (isShared && path.startsWith('overview/')) {
      newPath = `/typescript/${path}`;
      fixCount++;
      modified = true;
    }

    if (newPath !== originalPath) {
      // Reconstruct the match with the new path
      if (match.startsWith('href=')) {
        const quote = match[5]; // Get the quote character
        return `href=${quote}${newPath}${quote}`;
      } else {
        // Markdown link [text](path)
        const text = match.match(/\[([^\]]+)\]/)[1];
        return `[${text}](${newPath})`;
      }
    }

    return match;
  });

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
  }

  return { modified, fixCount };
}

function fixAllLinks() {
  log('\n🔧 Fixing all remaining broken links...\n', 'blue');

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

try {
  fixAllLinks();
} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}
