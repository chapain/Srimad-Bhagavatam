#!/usr/bin/env node
/* Generate the app's per-chapter review-status table from the manifest.
 *
 * Only status metadata is copied into assets/app.js (status, a short source
 * label, the pinned revision id and the chapter URL). No source text and no
 * translation is ever written into the app by this script.
 *
 * Usage: node tools/gen-review-status.js [--check]
 *   --check  fail if assets/app.js is out of date instead of rewriting it
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'assets', 'app.js');
const MANIFEST = path.join(ROOT, 'docs', 'content-review-manifest.json');
const PLACEHOLDER = '__REVIEW_STATUS__';

const SHORT = {
  source_checked: 'अध्याय-स्तरीय स्रोत-जाँच',
  editorially_approved: 'स्रोत-जाँच र सम्पादकीय स्वीकृति'
};

function build() {
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const out = {};
  for (const row of m.chapters) {
    const s = row.summary_status;
    if (s === 'draft_unverified') continue;      // drafts keep the default note
    const ref = row.primary_source_ref || {};
    out[row.id] = {
      s,
      l: SHORT[s] || s,
      r: ref.revid || null,
      v: 'संस्करण ' + (ref.revid || '?'),
      u: ref.url || ''
    };
  }
  return out;
}

function serialise(obj) {
  if (!Object.keys(obj).length) return '{}';
  const lines = Object.keys(obj).sort().map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(obj[k])}`);
  return '{\n' + lines.join(',\n') + '\n  }';
}

function main() {
  const check = process.argv.includes('--check');
  const expected = serialise(build());
  const src = fs.readFileSync(APP, 'utf8');
  if (src.includes(PLACEHOLDER)) {
    const next = src.replace(PLACEHOLDER, expected);
    if (check) {
      console.error('assets/app.js still holds the placeholder');
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(APP, next);
    console.log('wrote review-status table');
    return;
  }
  const re = /const REVIEW_STATUS = (\{[\s\S]*?\n  \}| \{\});/;
  const m = src.match(re);
  if (!m) {
    console.error('could not locate REVIEW_STATUS in assets/app.js');
    process.exitCode = 1;
    return;
  }
  const current = m[1].replace(/^\s+/, '').trim();
  const wanted = expected.replace(/^\s+/, '').trim();
  const normalise = (t) => t.replace(/\s+/g, '');
  if (normalise(current) === normalise(wanted)) {
    console.log('review-status table up to date');
    return;
  }
  if (check) {
    console.error('assets/app.js review-status table is stale; run node tools/gen-review-status.js');
    process.exitCode = 1;
    return;
  }
  fs.writeFileSync(APP, src.replace(re, `const REVIEW_STATUS = ${expected};`));
  console.log('updated review-status table');
}

if (require.main === module) main();
module.exports = { build };
