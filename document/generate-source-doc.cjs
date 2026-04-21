/**
 * Generates a single HTML document containing all project source code.
 * Excludes: node_modules, dist, .git, config files, media, lock files.
 * Run: node document/generate-source-doc.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(__dirname, 'source-code.html');

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'document', '.tempmediaStorage', '.gemini', '.antigravity'
]);

const EXCLUDE_FILES = new Set([
  'package-lock.json', 'yarn.lock', '.gitignore', '.eslintrc.cjs',
  '.prettierrc', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js',
  'tsconfig.json', 'jsconfig.json', '.env', '.env.local', '.antigravityignore',
  '.paseto-ed25519.pem'
]);

const EXCLUDE_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.lock', '.map',
  '.woff', '.woff2', '.ttf', '.eot', '.gif', '.bmp', '.mp4', '.mp3'
]);

function walk(dir, prefix = '') {
  const entries = [];
  let items;
  try { items = fs.readdirSync(dir); } catch { return entries; }
  items.sort();
  for (const name of items) {
    const full = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      if (EXCLUDE_DIRS.has(name)) continue;
      entries.push(...walk(full, rel));
    } else {
      if (EXCLUDE_FILES.has(name)) continue;
      if (EXCLUDE_EXT.has(path.extname(name).toLowerCase())) continue;
      entries.push({ rel, full, size: stat.size });
    }
  }
  return entries;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function langFromExt(ext) {
  const map = {
    '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
    '.css': 'css', '.html': 'html', '.json': 'json', '.md': 'markdown', '.sh': 'bash'
  };
  return map[ext] || 'plaintext';
}

// Build
console.log('Scanning project...');
const files = walk(ROOT);
console.log(`Found ${files.length} source files.`);

// Build directory tree
const tree = {};
for (const f of files) {
  const parts = f.rel.split('/');
  let node = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!node[parts[i]]) node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = f.size;
}

function renderTree(obj, indent = 0) {
  let out = '';
  const entries = Object.entries(obj).sort(([a, va], [b, vb]) => {
    const aDir = typeof va === 'object';
    const bDir = typeof vb === 'object';
    if (aDir !== bDir) return aDir ? -1 : 1;
    return a.localeCompare(b);
  });
  for (const [name, val] of entries) {
    const pad = '│   '.repeat(indent);
    if (typeof val === 'object') {
      out += `${pad}├── 📁 ${name}/\n`;
      out += renderTree(val, indent + 1);
    } else {
      const kb = (val / 1024).toFixed(1);
      out += `${pad}├── 📄 ${name}  (${kb} KB)\n`;
    }
  }
  return out;
}

const treeStr = renderTree(tree);

// Build TOC and content sections
let toc = '';
let content = '';
let idx = 0;

// Group files by directory
const groups = {};
for (const f of files) {
  const dir = path.dirname(f.rel) || '.';
  if (!groups[dir]) groups[dir] = [];
  groups[dir].push(f);
}

for (const [dir, dirFiles] of Object.entries(groups).sort(([a],[b]) => a.localeCompare(b))) {
  toc += `<li style="margin-top:8px;font-weight:700;color:#0f766e">📁 ${dir === '.' ? 'Root' : dir}</li>\n<ul>\n`;
  for (const f of dirFiles) {
    idx++;
    const name = path.basename(f.rel);
    toc += `  <li><a href="#file-${idx}">${name}</a> <span style="color:#94a3b8;font-size:11px">(${(f.size/1024).toFixed(1)} KB)</span></li>\n`;
    
    let code = '';
    try { code = fs.readFileSync(f.full, 'utf8'); } catch { code = '// Could not read file'; }
    
    const ext = path.extname(name).toLowerCase();
    
    content += `
<section class="file-section" id="file-${idx}">
  <div class="file-header">
    <span class="file-path">${escapeHtml(f.rel)}</span>
    <span class="file-size">${(f.size/1024).toFixed(1)} KB · ${code.split('\n').length} lines</span>
  </div>
  <pre class="code-block"><code>${escapeHtml(code)}</code></pre>
</section>\n`;
  }
  toc += `</ul>\n`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Auctus — Complete Source Code Documentation</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6}
.header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f766e 100%);color:#fff;padding:40px 30px;text-align:center}
.header h1{font-size:32px;font-weight:900;letter-spacing:3px}
.header p{font-size:14px;color:#94a3b8;margin-top:8px}
.header .meta{display:flex;justify-content:center;gap:24px;margin-top:16px;font-size:12px;color:#67e8f9}
.container{max-width:1200px;margin:0 auto;padding:20px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;margin:20px 0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.card-title{padding:16px 24px;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#0f766e;border-bottom:1px solid #e2e8f0;background:#f0fdfa}
.tree-block{padding:20px 24px;font-family:'Cascadia Code','Fira Code',monospace;font-size:12px;line-height:1.8;white-space:pre;overflow-x:auto;background:#fafafa;color:#334155}
.toc{padding:20px 24px}
.toc ul{list-style:none;padding-left:16px}
.toc li{font-size:13px;line-height:2}
.toc a{color:#0369a1;text-decoration:none;font-weight:500}
.toc a:hover{text-decoration:underline;color:#0f766e}
.file-section{margin:20px 0}
.file-header{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;background:linear-gradient(90deg,#0f172a,#1e293b);color:#fff;border-radius:12px 12px 0 0;position:sticky;top:0;z-index:10}
.file-path{font-family:'Cascadia Code','Fira Code',monospace;font-size:13px;font-weight:700;color:#67e8f9}
.file-size{font-size:11px;color:#94a3b8;font-weight:600}
.code-block{margin:0;padding:20px;background:#0f172a;color:#e2e8f0;font-family:'Cascadia Code','Fira Code',monospace;font-size:12px;line-height:1.7;overflow-x:auto;border-radius:0 0 12px 12px;white-space:pre;tab-size:2}
.footer{text-align:center;padding:30px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;margin-top:40px}
@media print{
  .file-header{position:static;break-inside:avoid}
  .code-block{white-space:pre-wrap;word-break:break-all;font-size:9px}
  .card{break-inside:avoid}
}
</style>
</head>
<body>

<div class="header">
  <h1>AUCTUS.</h1>
  <p>Complete Source Code Documentation — Auction Management System</p>
  <div class="meta">
    <span>📂 ${files.length} Files</span>
    <span>📊 ${(files.reduce((s,f)=>s+f.size,0)/1024).toFixed(0)} KB Total</span>
    <span>📅 Generated: ${new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</span>
  </div>
</div>

<div class="container">

  <div class="card">
    <div class="card-title">📁 Directory Structure</div>
    <div class="tree-block">${escapeHtml(treeStr)}</div>
  </div>

  <div class="card">
    <div class="card-title">📑 Table of Contents</div>
    <div class="toc">
      <ul>${toc}</ul>
    </div>
  </div>

  <div class="card">
    <div class="card-title">💻 Source Code</div>
    <div style="padding:10px">
      ${content}
    </div>
  </div>

</div>

<div class="footer">
  &copy; 2026 Auctus Auction Platform. Source code compiled for academic documentation.
</div>

</body>
</html>`;

fs.writeFileSync(OUTPUT, html, 'utf8');
console.log(`✅ Generated: ${OUTPUT}`);
console.log(`   ${files.length} files, ${(Buffer.byteLength(html)/1024/1024).toFixed(1)} MB output.`);
