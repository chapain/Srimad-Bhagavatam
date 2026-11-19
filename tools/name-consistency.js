#!/usr/bin/env node
/* Nepali name/term consistency check for the chapter summaries.
 *
 * Finds pairs of Devanagari tokens in the app content that are near-identical
 * spellings of what is probably the same proper noun (one nukta, anusvara,
 * visarga, vowel-length or conjunct difference apart), and reports them so a
 * reviewer can pick one accepted form. This is a triage aid: it flags
 * candidates, it does not decide which spelling is correct.
 *
 * Usage: node tools/name-consistency.js [--all]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const DEVANAGARI = /^[\u0900-\u097F]+$/;
const STOP = new Set([
  'गर्छ', 'गर्छन्', 'हुन्छ', 'हुन्छन्', 'भन्छ', 'भन्छन्', 'रहेको', 'भएको', 'गरेको',
  'यसै', 'त्यसै', 'यसरी', 'त्यसरी', 'जसरी', 'तसरी', 'यहाँ', 'त्यहाँ', 'जहाँ', 'तहाँ'
]);

function chapters() {
  const w = { BHAGAVATA_CONTENT: {} };
  for (let c = 1; c <= 12; c++) {
    const f = path.join(ROOT, 'data', `canto-${String(c).padStart(2, '0')}.js`);
    new Function('window', fs.readFileSync(f, 'utf8'))(w);
  }
  return w.BHAGAVATA_CONTENT;
}

/* Normalise away the differences that usually mean "same word, different typist". */
function key(token) {
  return token
    .replace(/\u093C/g, '')            // nukta
    .replace(/[ँंः]/g, '')             // candrabindu, anusvara, visarga
    .replace(/ऋ/g, 'रि').replace(/ॠ/g, 'री')
    .replace(/[ीि]/g, 'ि')
    .replace(/[ूु]/g, 'ु')
    .replace(/[ेै]/g, 'े').replace(/[ोौ]/g, 'ो');
}

function main() {
  const all = process.argv.includes('--all');
  const C = chapters();
  const forms = new Map();   // key -> Map(form -> Set(chapter ids))
  const add = (tok, id) => {
    if (!DEVANAGARI.test(tok) || tok.length < 4 || STOP.has(tok)) return;
    const k = key(tok);
    if (!k) return;
    if (!forms.has(k)) forms.set(k, new Map());
    const m = forms.get(k);
    if (!m.has(tok)) m.set(tok, new Set());
    m.get(tok).add(id);
  };
  const texts = [];
  for (const [canto, c] of Object.entries(C)) {
    for (const ch of c.chapters) {
      const id = `${String(canto).padStart(2, '0')}.${String(ch.n).padStart(2, '0')}`;
      texts.push([id, [ch.title, ch.summary, ...(ch.points || []), (ch.shloka && ch.shloka.np) || ''].join(' ')]);
    }
    texts.push([`${String(canto).padStart(2, '0')}.intro`, c.intro || '']);
  }
  for (const [id, text] of texts) {
    for (const tok of text.split(/[^\u0900-\u097F]+/)) add(tok, id);
  }

  const conflicts = [...forms.entries()]
    .filter(([, m]) => m.size > 1)
    .map(([k, m]) => ({
      key: k,
      forms: [...m.entries()]
        .map(([f, ids]) => ({ form: f, count: ids.size, chapters: [...ids].sort() }))
        .sort((a, b) => b.count - a.count)
    }))
    /* Only report when the variants are true look-alikes, not distinct words. */
    .filter((g) => {
      const [a, b] = g.forms;
      const short = Math.min(a.form.length, b.form.length);
      const long = Math.max(a.form.length, b.form.length);
      return long - short <= 2 && a.form[0] === b.form[0];
    });

  console.log(`token groups with variant spellings: ${conflicts.length}`);
  let shown = 0;
  for (const g of conflicts) {
    const dominant = g.forms[0];
    const others = g.forms.slice(1);
    const total = g.forms.reduce((n, f) => n + f.count, 0);
    /* Rare one-off variants in a sea of a consistent form are the real defects. */
    const minor = others.filter((o) => o.count <= Math.max(2, dominant.count * 0.1));
    if (!minor.length && !all) continue;
    shown++;
    console.log(`\n  ${g.forms.map((f) => `${f.form} (${f.count})`).join('  vs  ')}`);
    for (const o of minor) {
      console.log(`    minority: ${o.form} → ${o.chapters.slice(0, 6).join(', ')}${o.chapters.length > 6 ? '…' : ''}`);
    }
    if (total < 2) console.log('    (single occurrence)');
  }
  console.log(`\nreported: ${shown}`);
}

if (require.main === module) main();
module.exports = { key };
