/**
 * Generates a clean Word (.docx) with plain source code — like copy-pasted from editor.
 * Run: node document/generate-source-docx.cjs
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, ShadingType, PageBreak,
  Header, Footer
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(__dirname, 'Auctus-SourceCode.docx');

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

console.log('Scanning project...');
const files = walk(ROOT);
console.log(`Found ${files.length} source files.`);

const totalSize = files.reduce((s, f) => s + f.size, 0);
const generatedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const children = [];

// ---- TITLE PAGE ----
children.push(
  new Paragraph({ spacing: { before: 3000 } }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'AUCTUS.', bold: true, size: 72, font: 'Calibri', color: '0F766E' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Auction Management System', size: 32, font: 'Calibri', color: '334155' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: 'Complete Source Code', size: 28, font: 'Calibri', color: '64748B', italics: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: `${files.length} Files  •  ${(totalSize / 1024).toFixed(0)} KB  •  ${generatedDate}`, size: 20, font: 'Calibri', color: '94A3B8' })]
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// ---- TABLE OF CONTENTS ----
children.push(
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 300 },
    children: [new TextRun({ text: 'Table of Contents', bold: true, size: 28, font: 'Calibri' })]
  })
);

const groups = {};
for (const f of files) {
  const dir = path.dirname(f.rel) || '.';
  if (!groups[dir]) groups[dir] = [];
  groups[dir].push(f);
}

let idx = 0;
for (const [dir, dirFiles] of Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))) {
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: dir === '.' ? '/ (Root)' : dir + '/', bold: true, size: 22, font: 'Calibri', color: '0F766E' })]
    })
  );
  for (const f of dirFiles) {
    idx++;
    children.push(
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 30 },
        children: [
          new TextRun({ text: `${idx}.  ${path.basename(f.rel)}`, size: 20, font: 'Calibri' }),
        ]
      })
    );
  }
}

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---- SOURCE CODE ----
idx = 0;
for (const f of files) {
  idx++;
  let code = '';
  try { code = fs.readFileSync(f.full, 'utf8'); } catch { code = '// Could not read file'; }

  // File name heading
  children.push(
    new Paragraph({
      spacing: { before: 300, after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F766E' }
      },
      children: [
        new TextRun({ text: `${idx}.  `, size: 22, font: 'Calibri', color: '94A3B8', bold: true }),
        new TextRun({ text: f.rel, size: 22, font: 'Calibri', bold: true, color: '0F766E' }),
      ]
    })
  );

  // Plain code — each line as a paragraph with Consolas font
  const lines = code.split('\n');
  for (const line of lines) {
    children.push(
      new Paragraph({
        spacing: { after: 0, line: 276 },
        children: [
          new TextRun({
            text: line || ' ',
            size: 16,
            font: 'Consolas',
            color: '1E293B'
          })
        ]
      })
    );
  }

  // Page break after each file
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

// Build document
const doc = new Document({
  creator: 'Auctus Platform',
  title: 'Auctus - Complete Source Code',
  sections: [{
    properties: {
      page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'AUCTUS. — Source Code', size: 14, font: 'Calibri', color: '94A3B8', italics: true })]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '© 2026 Auctus Auction Platform', size: 14, font: 'Calibri', color: '94A3B8' })]
          })
        ]
      })
    },
    children
  }]
});

console.log('Generating Word document...');
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`✅ Generated: ${OUTPUT}`);
  console.log(`   ${files.length} files, ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);
}).catch(err => {
  console.error('Failed:', err);
});
