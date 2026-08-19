'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['.git', 'node_modules']);
const REPORT_DIR = path.join(ROOT, 'reports');
const JSON_REPORT = path.join(REPORT_DIR, 'project-inventory.json');
const MD_REPORT = path.join(REPORT_DIR, 'project-inventory.md');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (rel === 'reports/project-inventory.json' || rel === 'reports/project-inventory.md') continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.has(name)) walk(full, out);
    } else if (stat.isFile()) {
      out.push({ path: rel, bytes: stat.size, ext: (path.extname(name).toLowerCase() || '[no-ext]') });
    }
  }
  return out;
}

function human(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(2) + ' MB';
  return (bytes / 1024 ** 3).toFixed(2) + ' GB';
}

const files = walk(ROOT).sort((a, b) => a.path.localeCompare(b.path));
const totalBytes = files.reduce((s, f) => s + f.bytes, 0);
const byExt = {};
for (const f of files) {
  byExt[f.ext] ||= { files: 0, bytes: 0 };
  byExt[f.ext].files += 1;
  byExt[f.ext].bytes += f.bytes;
}

const index = files.find(f => f.path === 'index.html') || null;
let indexLines = null;
if (index) indexLines = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').split(/\r?\n/).length;

const largest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 25);
const report = {
  generatedAt: new Date().toISOString(),
  branch: process.env.GITHUB_REF_NAME || null,
  commit: process.env.GITHUB_SHA || null,
  fileCount: files.length,
  totalBytes,
  totalHuman: human(totalBytes),
  indexHtml: index ? { bytes: index.bytes, human: human(index.bytes), lines: indexLines } : null,
  byExtension: Object.fromEntries(Object.entries(byExt).sort((a, b) => b[1].bytes - a[1].bytes)),
  largestFiles: largest,
  files
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2) + '\n');

let md = '# QiblaAstro Project Inventory\n\n';
md += `Generated: ${report.generatedAt}\n\n`;
md += `- Branch: ${report.branch || 'local'}\n`;
md += `- Commit: ${report.commit || 'local'}\n`;
md += `- Files: **${report.fileCount}**\n`;
md += `- Total working-tree size: **${report.totalHuman}** (${report.totalBytes.toLocaleString()} bytes)\n`;
if (report.indexHtml) md += `- index.html: **${report.indexHtml.human}** (${report.indexHtml.bytes.toLocaleString()} bytes), **${report.indexHtml.lines.toLocaleString()} lines**\n`;
md += '\n## By extension\n\n| Type | Files | Size |\n|---|---:|---:|\n';
for (const [ext, v] of Object.entries(report.byExtension)) md += `| ${ext} | ${v.files} | ${human(v.bytes)} |\n`;
md += '\n## Largest files\n\n| File | Size |\n|---|---:|\n';
for (const f of largest) md += `| ${f.path} | ${human(f.bytes)} |\n`;
fs.writeFileSync(MD_REPORT, md);

console.log(md);
