/* श्रीमद्भागवत अध्ययन एप — मोबाइल/उत्तरात्मक स्मोक-टेस्ट
 *
 * यो टेस्ट मोबाइल-मैत्रीताको लागि जाँच्छ :
 *   - viewport meta (viewport-fit, safe-area), color-scheme
 *   - styles.css मा responsive rules (ट्यापबार wrap, safe-area, tap-targets,
 *     media-queries: 900/700/480 px र landscape)
 *   - app.js मा ट्यापबार-उचाइ sync र Esc-le-close behavior
 *   - jsdom मा साइडबार/ब्याकड्रप र Esc keyพฤติกรรม
 *
 * चलाउन :
 *   npm install --prefix /tmp/sb-test jsdom
 *   NODE_PATH=/tmp/sb-test/node_modules node tests/smoke-responsive.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

function loadJsdom() {
  const candidates = [
    'jsdom',
    process.env.JS_DOM_PATH,
    '/tmp/sb-test/node_modules/jsdom',
    path.join(process.env.HOME || '/home/user', 'sb-test/node_modules/jsdom')
  ].filter(Boolean);
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* अर्को प्रयास */ }
  }
  console.error('jsdom भेटिएन। npm install --prefix /tmp/sb-test jsdom चलाउनुहोस्।');
  process.exit(2);
}
const { JSDOM } = loadJsdom();

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('index.html');
const css = read('assets/styles.css');
const appjs = read('assets/app.js');

let passed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✓ ' + label); }
  else { failures.push(label); console.log('  ✗ ' + label); }
}
function has(hay, needle, label) { ok(hay.indexOf(needle) >= 0, label); }
function group(name) { console.log('\n▸ ' + name); }

// ============================================================
group('viewport, safe-area र color-scheme');
ok(/viewport-fit=cover/.test(html), 'viewport meta मा viewport-fit=cover (नोच/safe-area)');
ok(/width=device-width, initial-scale=1/.test(html), 'viewport width/initial-scaleཡོདཔ་ད་');
ok(/<meta name="color-scheme" content="light">/.test(html), 'color-scheme meta अवस्थित');
ok(/theme-color/.test(html), 'theme-color meta अवस्थित');

// ============================================================
group('styles.css — मोबाइल/ट्याप target र horizontal scroll');
has(css, 'overflow-x: hidden', 'body मा overflow-x: hidden (horizontal scroll रोक्छ)');
has(css, '-webkit-tap-highlight-color: transparent', 'tap-highlight हटाउने');
has(css, 'touch-action: manipulation', 'बटन/लिङ्कमा touch-action: manipulation (ट्याप lagna)');
has(css, ':focus-visible', 'focus-visible outline (a11y)');
has(css, '--topbar-h', 'CSS variable --topbar-h (ट्यापबार उचाइ)');
has(css, 'safe-area-inset-top', 'safe-area-inset-top (नोच)');
has(css, 'safe-area-inset-bottom', 'safe-area-inset-bottom (तल्लो safe-area)');
has(css, 'min-height: 44px', 'ट्याप target ≥44px');
has(css, 'min-height: 40px', 'font-tools ट्याप target');
has(css, 'overflow-wrap: break-word', 'पाठमा overflow-wrap (word-break)');

// ============================================================
group('styles.css — responsive media queries');
has(css, '@media (max-width: 900px)', '900px media query (drawer)');
has(css, '@media (max-width: 700px)', '700px media query (ट्यापबार दुई पाटी)');
has(css, '@media (max-width: 480px)', '480px media query (सानो फोन्मा fine-tune)');
has(css, '@media (orientation: landscape) and (max-height: 520px)', 'landscape phone media query');
has(css, 'position: fixed; left: 0; top: var(--topbar-h)', 'मोबाइल साइडबार fixed/drawer (topbar-h वर्चू)');
has(css, 'inset: var(--topbar-h) 0 0 0', 'ब्याकड्रप topbar-h अनुसार');
has(css, 'width: min(290px, 84vw)', 'साइडबार width limited (viewport भन्दा सानो)');
has(css, 'flex-wrap: wrap', 'ट्यापबार flex-wrap (wrap हुने)');
has(css, '.search-wrap { flex: 1 1 100%', 'सानो फोन्मा खोजी पाटी छुट्ने');

// ============================================================
group('app.js — ट्यापबार sync र Esc behavior');
has(appjs, "document.documentElement.style.setProperty('--topbar-h'", 'ट्यापबार उचाइ CSS var मा set गरिन्छ');
has(appjs, 'syncTopbar', 'syncTopbar function अवस्थित');
has(appjs, "addEventListener('resize', syncTopbar)", 'resize मा syncTopbar called');
has(appjs, "e.key === 'Escape'", 'Esc keyworkd handler');
has(appjs, "sidebar.classList.remove('open')", 'Esc ले साइडबार बन्द गर्छ');

// ============================================================
group('jsdom — साइडबार, ब्याकड्रप र Esc behavior');
const SCRIPTS = Array.from({ length: 12 }, (_, i) => 'data/canto-' + String(i + 1).padStart(2, '0') + '.js').concat('assets/app.js');
const dom = new JSDOM(html, { url: 'https://example.test/Srimad-Bhagavatam/', pretendToBeVisual: true, runScripts: 'outside-only' });
const { window } = dom;
const doc = window.document;
window.scrollTo = function () {};
window.HTMLElement.prototype.scrollIntoView = function () {};
for (const f of SCRIPTS) window.eval(read(f));
const sidebar = doc.getElementById('sidebar');
const backdrop = doc.getElementById('backdrop');
const menuBtn = doc.getElementById('menuBtn');

menuBtn.click();
ok(sidebar.classList.contains('open') && backdrop.classList.contains('show'), 'मेनु बटनले साइडबार + ब्याकड्रप खोल्छ');
const ev = new window.KeyboardEvent('keydown', { key: 'Escape' });
doc.dispatchEvent(ev);
ok(!sidebar.classList.contains('open') && !backdrop.classList.contains('show'), 'Esc key ले साइडबार + ब्याकड्रप बन्द गर्छ');

menuBtn.click();
backdrop.click();
ok(!sidebar.classList.contains('open') && !backdrop.classList.contains('show'), 'ब्याकड्रप क्लिकले बन्द गर्छ');

// --topbar-h variable set गरेको छ (jsdom मा offsetHeight=0 हुन्छ, तर variable set हुन्छ)
ok(doc.documentElement.style.getPropertyValue('--topbar-h') !== '', '--topbar-h CSS variable set गरिएको');

// ============================================================
console.log('\n────────────────────────────────────────────');
console.log('पास : ' + passed + '   असफल : ' + failures.length);
if (failures.length) {
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('✅ मोबाइल/उत्तरात्मक स्मोक-टेस्ट पास');
