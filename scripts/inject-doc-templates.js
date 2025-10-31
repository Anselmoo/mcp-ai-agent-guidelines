#!/usr/bin/env node

/**
 * inject-doc-templates.js
 * 
 * Automatically injects header and footer templates into documentation files.
 * This ensures consistent branding and navigation across all docs.
 * 
 * Usage:
 *   node scripts/inject-doc-templates.js docs/YOUR_DOC.md
 *   node scripts/inject-doc-templates.js --all          # Process all docs
 *   node scripts/inject-doc-templates.js --dry-run      # Preview changes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const docsDir = join(rootDir, 'docs');
const templatesDir = join(docsDir, '.templates');

// Template markers
const HEADER_MARKER = '<!-- AUTO-GENERATED HEADER - DO NOT EDIT -->';
const FOOTER_MARKER = '<!-- AUTO-GENERATED FOOTER - DO NOT EDIT -->';
const HEADER_END_MARKER = '<!-- END AUTO-GENERATED HEADER -->';
const FOOTER_END_MARKER = '<!-- END AUTO-GENERATED FOOTER -->';

/**
 * Load template content and adjust paths
 */
function loadTemplate(templateName, docPath) {
  const templatePath = join(templatesDir, templateName);
  let content = readFileSync(templatePath, 'utf-8');
  
  // Calculate relative path from doc to templates
  const relPath = relative(dirname(docPath), templatesDir);
  
  // Adjust relative paths in template based on document location
  // This is a simple implementation - you may need to enhance it
  return content;
}

/**
 * Check if file already has templates
 */
function hasTemplate(content, marker) {
  return content.includes(marker);
}

/**
 * Inject header template
 */
function injectHeader(content, docPath) {
  const header = loadTemplate('header.html', docPath);
  const wrappedHeader = `${HEADER_MARKER}\n${header}\n${HEADER_END_MARKER}\n\n`;
  
  if (hasTemplate(content, HEADER_MARKER)) {
    // Replace existing header
    const regex = new RegExp(
      `${HEADER_MARKER}[\\s\\S]*?${HEADER_END_MARKER}`,
      'g'
    );
    return content.replace(regex, wrappedHeader.trim());
  } else {
    // Add header at the beginning
    return wrappedHeader + content;
  }
}

/**
 * Inject footer template
 */
function injectFooter(content, docPath) {
  const footer = loadTemplate('footer.html', docPath);
  const wrappedFooter = `\n\n${FOOTER_MARKER}\n${footer}\n${FOOTER_END_MARKER}`;
  
  if (hasTemplate(content, FOOTER_MARKER)) {
    // Replace existing footer
    const regex = new RegExp(
      `${FOOTER_MARKER}[\\s\\S]*?${FOOTER_END_MARKER}`,
      'g'
    );
    return content.replace(regex, wrappedFooter.trim());
  } else {
    // Add footer at the end
    return content + wrappedFooter;
  }
}

/**
 * Process a single file
 */
function processFile(filePath, dryRun = false) {
  console.log(`Processing: ${relative(rootDir, filePath)}`);
  
  const content = readFileSync(filePath, 'utf-8');
  let updated = content;
  
  // Inject header and footer
  updated = injectHeader(updated, filePath);
  updated = injectFooter(updated, filePath);
  
  if (content === updated) {
    console.log('  ✓ No changes needed');
    return false;
  }
  
  if (dryRun) {
    console.log('  ℹ Would update (dry-run mode)');
    return false;
  }
  
  writeFileSync(filePath, updated, 'utf-8');
  console.log('  ✓ Updated');
  return true;
}

/**
 * Get all markdown files in docs directory
 */
function getAllDocsFiles() {
  const files = [];
  
  function walk(dir) {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip templates directory
        if (item !== '.templates') {
          walk(fullPath);
        }
      } else if (item.endsWith('.md') && item !== 'README.md') {
        // Skip the main docs index
        files.push(fullPath);
      }
    }
  }
  
  walk(docsDir);
  return files;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/inject-doc-templates.js <file|--all> [--dry-run]');
    console.log('\nOptions:');
    console.log('  <file>       Path to specific markdown file');
    console.log('  --all        Process all documentation files');
    console.log('  --dry-run    Preview changes without writing');
    console.log('\nExamples:');
    console.log('  node scripts/inject-doc-templates.js docs/AI_INTERACTION_TIPS.md');
    console.log('  node scripts/inject-doc-templates.js --all');
    console.log('  node scripts/inject-doc-templates.js --all --dry-run');
    process.exit(1);
  }
  
  const dryRun = args.includes('--dry-run');
  const processAll = args.includes('--all');
  
  console.log('🎨 Documentation Template Injector\n');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }
  
  let filesProcessed = 0;
  let filesUpdated = 0;
  
  if (processAll) {
    const files = getAllDocsFiles();
    console.log(`Found ${files.length} documentation files\n`);
    
    for (const file of files) {
      filesProcessed++;
      if (processFile(file, dryRun)) {
        filesUpdated++;
      }
    }
  } else {
    const filePath = join(rootDir, args[0]);
    filesProcessed = 1;
    if (processFile(filePath, dryRun)) {
      filesUpdated = 1;
    }
  }
  
  console.log(`\n✨ Done! Processed ${filesProcessed} files, updated ${filesUpdated}`);
  
  if (dryRun && filesUpdated > 0) {
    console.log('\nRun without --dry-run to apply changes');
  }
}

main();
