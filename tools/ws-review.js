#!/usr/bin/env node
/* Sanskrit Wikisource review helper for the chapter-summary source check.
 *
 * The accepted reference text is the Sanskrit Wikisource edition of the
 * Srimad-Bhagavata-Purana (CC BY-SA 4.0). This tool only *reads* that text to
 * build a pin (page id + revision id) and to measure the chapter's verse range,
 * verse count, and speaker changes so a reviewer can check mapping, sequence
 * and completeness. No source text is written into the app or committed.
 *
 * Usage:
 *   node tools/ws-review.js url <canto> <chapter>     raw-wikitext URL to fetch
 *   node tools/ws-review.js pin <canto> <chapter>     API URL returning revid
 *   node tools/ws-review.js ranges <canto> <chapter>  verse range of a saved snapshot
 *   node tools/ws-review.js audit                     manifest consistency report
 *
 * Snapshots are read from .work/ws/<canto>.<chapter>.txt (git-ignored).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const WS_DIR = path.join(ROOT, '.work', 'ws');
const DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

const deva = (n) => String(n).split('').map((d) => DIGITS[+d]).join('');
const titlePath = (canto, chapter) =>
  `श्रीमद्भागवतपुराणम्/स्कन्धः_${deva(canto)}/अध्यायः_${deva(chapter)}`;

function rawUrl(canto, chapter) {
  return 'https://sa.wikisource.org/w/index.php?title=' +
    encodeURIComponent(titlePath(canto, chapter)) + '&action=raw';
}

function apiUrl(canto, chapter) {
  return 'https://sa.wikisource.org/w/api.php?action=query&format=json&formatversion=2' +
    '&prop=revisions&rvprop=ids%7Ctimestamp&titles=' +
    encodeURIComponent(titlePath(canto, chapter));
}

/* Printed verse numbers are Devanagari numerals inside "॥ २३ ॥" markers. */
function verseNumbers(text) {
  const out = [];
  for (const m of text.matchAll(/[\u0964\u0965]+\s*([०-९]+)\s*[\u0964\u0965]+/g)) {
    out.push(Number([...m[1]].map((c) => DIGITS.indexOf(c)).join('')));
  }
  return out;
}

/* The chapter colophon ("इति श्रीमद्भागवते … ॥ २१ ॥") repeats the chapter number
 * in verse-marker form, so it must be removed before counting verses. */
function stripColophon(text) {
  const i = text.search(/इति\s+श्रीमद/);
  return i === -1 ? text : text.slice(0, i);
}

function speakers(text) {
  return [...text.matchAll(/^\s*([^\n।]{2,40}?)\s+उवाच\s*\\?[-–]/gm)].map((m) => m[1].trim());
}

function readSnapshot(canto, chapter) {
  const p = path.join(WS_DIR, `${canto}.${chapter}.txt`);
  if (!fs.existsSync(p)) {
    throw new Error(`no snapshot at ${path.relative(ROOT, p)}; save the raw wikitext there first`);
  }
  return fs.readFileSync(p, 'utf8');
}

function analyse(canto, chapter) {
  const raw = readSnapshot(canto, chapter);
  const text = stripColophon(raw);
  const found = verseNumbers(text);
  const unique = [...new Set(found)];
  const sorted = [...unique].sort((a, b) => a - b);
  const max = sorted[sorted.length - 1] || 0;
  const missing = [];
  for (let v = 1; v <= max; v++) if (!unique.includes(v)) missing.push(v);
  const dupes = found.filter((v, i) => found.indexOf(v) !== i);
  return {
    id: `${String(canto).padStart(2, '0')}.${String(chapter).padStart(2, '0')}`,
    page: titlePath(canto, chapter).replace(/_/g, ' '),
    raw_url: rawUrl(canto, chapter),
    markers: found.length,
    unique_verses: unique.length,
    verse_range: max ? `1-${max}` : null,
    contiguous: missing.length === 0,
    missing_verses: missing,
    repeated_markers: [...new Set(dupes)].sort((a, b) => a - b),
    speakers: speakers(raw)
  };
}

const ALLOWED = new Set(['draft_unverified', 'source_checked', 'editorially_approved']);

function audit() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/content-review-manifest.json'), 'utf8')
  );
  const problems = [];
  const counts = { draft_unverified: 0, source_checked: 0, editorially_approved: 0 };
  for (const row of manifest.chapters) {
    const s = row.summary_status;
    const k = row.key_points_status;
    if (!ALLOWED.has(s)) problems.push(`${row.id}: unknown summary_status ${s}`);
    if (!ALLOWED.has(k)) problems.push(`${row.id}: unknown key_points_status ${k}`);
    if (s !== k) problems.push(`${row.id}: summary/key-points status disagree`);
    counts[s] = (counts[s] || 0) + 1;
    // A promotion must carry a full, citable review record.
    if (s !== 'draft_unverified') {
      const ref = row.primary_source_ref;
      if (!ref || !ref.edition || !ref.page || !ref.revid || !ref.retrieved) {
        problems.push(`${row.id}: promoted without a pinned primary_source_ref`);
      }
      if (!row.reviewer || !row.reviewed_at) problems.push(`${row.id}: promoted without reviewer/date`);
      if (!row.verse_range) problems.push(`${row.id}: promoted without verse_range`);
      if (!row.checks || Object.values(row.checks).some((v) => v !== 'pass' && v !== 'partial')) {
        problems.push(`${row.id}: promoted without recorded checks`);
      }
    } else if (row.primary_source_ref || row.reviewer) {
      problems.push(`${row.id}: draft carries a review record; promote it or clear it`);
    }
  }
  const total = manifest.chapters.length;
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);
  if (sum !== total) problems.push(`status counts ${sum} != chapters ${total}`);
  const sp = manifest.source_policy;
  if (sp.verified_chapters !== counts.source_checked + counts.editorially_approved) {
    problems.push('source_policy.verified_chapters disagrees with chapter statuses');
  }
  if (sp.editorially_approved_chapters !== counts.editorially_approved) {
    problems.push('source_policy.editorially_approved_chapters disagrees with chapter statuses');
  }
  console.log(`chapters: ${total}`);
  console.log(`  draft_unverified     : ${counts.draft_unverified}`);
  console.log(`  source_checked       : ${counts.source_checked}`);
  console.log(`  editorially_approved : ${counts.editorially_approved}`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error('  - ' + p);
    process.exitCode = 1;
  } else {
    console.log('\nmanifest consistent');
  }
}

function main(argv) {
  const [cmd, a, b] = argv;
  if (cmd === 'audit') return audit();
  const canto = Number(a);
  const chapter = Number(b);
  if (!Number.isInteger(canto) || !Number.isInteger(chapter) || canto < 1 || chapter < 1) {
    console.error('usage: node tools/ws-review.js url|pin|ranges <canto> <chapter>   |   audit');
    process.exitCode = 2;
    return;
  }
  if (cmd === 'url') return console.log(rawUrl(canto, chapter));
  if (cmd === 'pin') return console.log(apiUrl(canto, chapter));
  if (cmd === 'ranges') return console.log(JSON.stringify(analyse(canto, chapter), null, 2));
  console.error(`unknown command: ${cmd}`);
  process.exitCode = 2;
}

if (require.main === module) main(process.argv.slice(2));
module.exports = { analyse, verseNumbers, speakers, stripColophon, rawUrl, apiUrl, titlePath };
