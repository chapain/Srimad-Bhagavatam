/* श्रीमद्भागवत अध्ययन एप — jsdom स्मोक-टेस्ट (द्वादश स्कन्ध)
 *
 * चलाउन (jsdom रिपोजिटरीबाहिर जडान गर्नुहोस्, Git मा नआओस् भनेर) :
 *   npm install --prefix /tmp/sb-test jsdom
 *   NODE_PATH=/tmp/sb-test/node_modules node tests/smoke.js
 *
 * JS_DOM_PATH वातावरण-चरले पनि jsdom को path दिन सकिन्छ।
 */
'use strict';

const fs = require('fs');
const path = require('path');

// ---- jsdom रिजोल्युसन : रिपोजिटरीभित्र node_modules आवश्यक छैन ----
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
const SCRIPTS = Array.from({ length: 12 }, (_, i) => 'data/canto-' + String(i + 1).padStart(2, '0') + '.js').concat('assets/app.js');

// ---- साधारण assert ----
let passed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✓ ' + label); }
  else { failures.push(label); console.log('  ✗ ' + label); }
}
function eq(a, b, label) { ok(a === b, label + ' (प्राप्त: ' + JSON.stringify(a) + ')'); }
function group(name) { console.log('\n▸ ' + name); }

// ---- DOM तयार ----
const dom = new JSDOM(html, {
  url: 'https://example.test/Srimad-Bhagavatam/',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});
const { window } = dom;
const doc = window.document;
window.scrollTo = function () {};
window.HTMLElement.prototype.scrollIntoView = function () {};

for (const f of SCRIPTS) {
  ok(fs.existsSync(path.join(ROOT, f)), 'स्क्रिप्ट उपलब्ध : ' + f);
  window.eval(read(f));
}
const main = doc.getElementById('main');
const sidebar = doc.getElementById('sidebar');

function go(hash) {
  window.location.hash = hash;
  window.dispatchEvent(new window.Event('hashchange'));
}
function txt() { return doc.body.textContent || ''; }
function renderedBad() {
  return /undefined|null|NaN|\[object Object\]/.test(main.textContent || '');
}
const C = window.BHAGAVATA_CONTENT || {};
const NE_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const neNum = (n) => String(n).replace(/\d/g, d => NE_DIGITS[+d]);

// ============================================================
group('सामग्री-संरचना (द्वादश स्कन्ध)');
ok(!!C[1], 'window.BHAGAVATA_CONTENT[1] अवस्थित');
ok(!!C[2], 'window.BHAGAVATA_CONTENT[2] अवस्थित');
ok(!!C[3], 'window.BHAGAVATA_CONTENT[3] अवस्थित');
ok(!!C[4] && !!C[5] && !!C[6] && !!C[7] && !!C[8] && !!C[9] && !!C[10] && !!C[11] && !!C[12], 'window.BHAGAVATA_CONTENT[4–12] अवस्थित');
eq(C[1].chapters.length, 19, 'प्रथम स्कन्ध : १९ अध्याय');
eq(C[2].chapters.length, 10, 'द्वितीय स्कन्ध : १० अध्याय');
eq(C[3].chapters.length, 33, 'तृतीय स्कन्ध : ३३ अध्याय');
[31, 26, 19, 15, 24, 24, 90, 31, 13].forEach((n, i) => eq(C[i + 4].chapters.length, n, 'स्कन्ध ' + (i + 4) + ' : ' + n + ' अध्याय'));
eq(C[1].themes.length, 8, 'प्रथम स्कन्ध : ८ विषयगत प्रकरण');
eq(C[2].themes.length, 4, 'द्वितीय स्कन्ध : ४ विषयगत प्रकरण');
eq(C[3].themes.length, 10, 'तृतीय स्कन्ध : १० विषयगत प्रकरण');
[8, 9, 9, 9, 5, 7, 14, 7, 7].forEach((n, i) => eq(C[i + 4].themes.length, n, 'स्कन्ध ' + (i + 4) + ' : ' + n + ' विषयगत प्रकरण'));
ok(C[2].chapters.map(c => c.n).join(',') === '1,2,3,4,5,6,7,8,9,10',
  'द्वितीय स्कन्धका अध्याय-सङ्ख्या ठीक १–१० क्रममा');
ok(C[3].chapters.map(c => c.n).join(',') === Array.from({ length: 33 }, (_, i) => i + 1).join(','),
  'तृतीय स्कन्धका अध्याय-सङ्ख्या ठीक १–३३ क्रममा');
ok(C[10].chapters.map(c => c.n).join(',') === Array.from({ length: 90 }, (_, i) => i + 1).join(','),
  'दशम स्कन्धका अध्याय-सङ्ख्या ठीक १–९० क्रममा');
[11, 12].forEach((cid, i) => ok(C[cid].chapters.map(c => c.n).join(',') === Array.from({ length: [31, 13][i] }, (_, j) => j + 1).join(','),
  'स्कन्ध ' + cid + ' का अध्याय क्रमशः १–' + [31, 13][i] + ' मा छन्'));
const covered10 = [];
C[10].themes.forEach(t => { for (let n = t.from; n <= t.to; n++) covered10.push(n); });
ok(covered10.length === 90 && new Set(covered10).size === 90 && Math.min(...covered10) === 1 && Math.max(...covered10) === 90,
  'दशम स्कन्धका विषयगत प्रकरणले अध्याय १–९० ठीक एकपटक ढाक्छन्');
[11, 12].forEach(cid => {
  const coveredCanto = [];
  C[cid].themes.forEach(t => { for (let n = t.from; n <= t.to; n++) coveredCanto.push(n); });
  const total = C[cid].chapters.length;
  ok(coveredCanto.length === total && new Set(coveredCanto).size === total &&
     coveredCanto.slice().sort((a, b) => a - b).join(',') === Array.from({ length: total }, (_, i) => i + 1).join(','),
    'स्कन्ध ' + cid + ' का विषयगत दायराले सबै अध्याय ठीक एकपटक ढाक्छ');
  ok(C[cid].themes.every(t => t.id && t.title && t.from <= t.to),
    'स्कन्ध ' + cid + ' का सबै प्रकरणमा id, शीर्षक र मान्य दायरा');
});

// प्रकरण-दायरा : १–३३ बिना खाली, बिना दोहोर, बिना अतिव्याप्ति
const covered = [];
C[3].themes.forEach(t => { for (let n = t.from; n <= t.to; n++) covered.push(n); });
ok(covered.length === 33 && covered.slice().sort((a, b) => a - b).join(',') === Array.from({ length: 33 }, (_, i) => i + 1).join(','),
  'तृतीय स्कन्धका प्रकरण-दायराले १–३३ ठीक एकपटक ढाक्छ (खाली/दोहोर/अतिव्याप्ति छैन)');
ok(C[3].themes.every(t => t.id && t.title && t.from <= t.to), 'तृतीय स्कन्धका सबै प्रकरणमा id, नेपाली शीर्षक र मान्य दायरा');
ok(C[1].themes.every(t => t.id && t.title && t.from <= t.to), 'प्रथम स्कन्धका सबै प्रकरणमा id, नेपाली शीर्षक र मान्य दायरा');

Array.from({ length: 12 }, (_, i) => i + 1).forEach(cid => {
  const c = C[cid];
  ok(c.intro && c.intro.length > 100, 'स्कन्ध ' + cid + ' : परिचय उपलब्ध');
  c.chapters.forEach(ch => {
    ok(typeof ch.title === 'string' && ch.title.trim().length > 3,
      'स्कन्ध ' + cid + ' / ' + ch.n + ' : शीर्षक');
    const paras = ch.summary.split(/\n\n+/).filter(p => p.trim());
    ok(paras.length >= 3, 'स्कन्ध ' + cid + ' / ' + ch.n + ' : बहु-अनुच्छेद सारांश (' + paras.length + ')');
    const summaryLength = ch.summary.replace(/\s/g, '').length;
    const minimumSummaryLength = [8, 9, 10].includes(cid) ? 350 : 500;
    ok(summaryLength >= minimumSummaryLength,
      'स्कन्ध ' + cid + ' / ' + ch.n + ' : पर्याप्त सारांश (' + summaryLength + ' / ' + minimumSummaryLength + ')');
    ok(Array.isArray(ch.points) && ch.points.length >= 4 &&
       ch.points.every(p => typeof p === 'string' && p.trim().length > 8),
      'स्कन्ध ' + cid + ' / ' + ch.n + ' : ≥४ सार्थक मुख्य-विन्दु (' + ch.points.length + ')');
    if (ch.shloka) {
      ok(/[\u0900-\u097F]/.test(ch.shloka.sa) && ch.shloka.sa.length > 30 &&
         ch.shloka.np && ch.shloka.np.length > 30,
        'स्कन्ध ' + cid + ' / ' + ch.n + ' : श्लोक + भावार्थ');
    }
  });
});

group('पाठ-स्वच्छता : NFC, कुनै generation artifact छैन');
const allStrings = [];
Array.from({ length: 12 }, (_, i) => i + 1).forEach(cid => {
  const c = C[cid];
  allStrings.push(c.intro);
  c.themes.forEach(t => allStrings.push(t.title));
  c.chapters.forEach(ch => {
    allStrings.push(ch.title, ch.summary);
    ch.points.forEach(p => allStrings.push(p));
    if (ch.shloka) allStrings.push(ch.shloka.sa, ch.shloka.np);
  });
});
ok(allStrings.every(s => typeof s === 'string' && s === s.normalize('NFC')),
  'सम्पूर्ण सामग्री NFC-स्थिर');
const artifacts = /undefined|null|NaN|\[object Object\]|TODO|TBD|PLACEHOLDER|Lorem|lorem|XXX|FIXME/i;
ok(!allStrings.some(s => artifacts.test(s)), 'कुनै placeholder / generation artifact छैन');
ok(!allStrings.some(s => /(^|\s)[a-zA-Z]{4,}(\s|$)/.test(s)),
  'सारांश/विन्दुमा अनावश्यक अङ्ग्रेजी शब्द छैन');
eq(C[1].chapters.filter(ch => ch.shloka).length, 6, 'प्रथम स्कन्ध : ६ चयनित श्लोक-ब्लक');
eq(C[2].chapters.filter(ch => ch.shloka).length, 6, 'द्वितीय स्कन्ध : ६ चयनित श्लोक-ब्लक');
eq(C[3].chapters.filter(ch => ch.shloka).length, 6, 'तृतीय स्कन्ध : ६ चयनित श्लोक-ब्लक');
eq(C[8].chapters.filter(ch => ch.shloka).length, 1, 'अष्टम स्कन्ध : १ चयनित श्लोक-ब्लक');
eq(C[9].chapters.filter(ch => ch.shloka).length, 1, 'नवम स्कन्ध : १ चयनित श्लोक-ब्लक');
eq(C[10].chapters.filter(ch => ch.shloka).length, 5, 'दशम स्कन्ध : ५ चयनित श्लोक-ब्लक');
eq(C[11].chapters.filter(ch => ch.shloka).length, 3, 'एकादश स्कन्ध : ३ चयनित श्लोक-ब्लक');
eq(C[12].chapters.filter(ch => ch.shloka).length, 3, 'द्वादश स्कन्ध : ३ चयनित श्लोक-ब्लक');
eq(C[1].chapters.reduce((a, ch) => a + ch.points.length, 0), 83, 'प्रथम स्कन्ध : ८३ मुख्य-विन्दु');
eq(C[2].chapters.reduce((a, ch) => a + ch.points.length, 0), 62, 'द्वितीय स्कन्ध : ६२ मुख्य-विन्दु');
eq(C[3].chapters.reduce((a, ch) => a + ch.points.length, 0), 191, 'तृतीय स्कन्ध : १९१ मुख्य-विन्दु');
[186, 156, 114, 90, 120, 120, 450, 155, 65].forEach((n, i) => eq(C[i + 4].chapters.reduce((a, ch) => a + ch.points.length, 0), n, 'स्कन्ध ' + (i + 4) + ' : मुख्य-विन्दु संख्या'));
ok(C[3].chapters.every(ch => ch.points.length >= 5 && ch.points.length <= 7),
  'तृतीय स्कन्ध : हरेक अध्यायमा ५–७ मुख्य-विन्दु');

group('PWA manifest, icons र अफलाइन सेवा');
const manifest = JSON.parse(read('manifest.webmanifest'));
ok(manifest.name && manifest.short_name && manifest.start_url === './' && manifest.scope === './',
  'manifest मा नाम, relative start URL र scope');
ok(manifest.display === 'standalone' && manifest.theme_color && manifest.background_color,
  'manifest standalone display र theme रंग');
const requiredIcons = [
  { path: 'assets/icons/icon-192.png', size: 192 },
  { path: 'assets/icons/icon-512.png', size: 512 },
  { path: 'assets/icons/maskable-512.png', size: 512 }
];
requiredIcons.forEach(icon => {
  const bytes = fs.readFileSync(path.join(ROOT, icon.path));
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  ok(png && bytes.readUInt32BE(16) === icon.size && bytes.readUInt32BE(20) === icon.size,
    icon.path + ' valid PNG ' + icon.size + '×' + icon.size);
});
ok(manifest.icons.some(icon => icon.purpose === 'maskable' && icon.sizes.includes('512x512')),
  'manifest-д maskable 512px icon байна');
ok(/rel="manifest" href="manifest\.webmanifest"/.test(html) &&
   /name="theme-color"/.test(html) && /apple-touch-icon/.test(html),
  'HTML मा manifest, theme color र Apple touch icon जोडिएका छन्');
ok(/navigator\.serviceWorker\.register\('\.\/service-worker\.js'\)/.test(html),
  'HTTPS/static origin मा service worker दर्ता हुन्छ');
const worker = read('service-worker.js');
ok(worker.includes("'./index.html'") && worker.includes("'./assets/app.js'") &&
   /length: 12/.test(worker) && worker.includes('canto-${String(i + 1).padStart(2, \'0\')}.js'),
  'service worker ले app shell र सबै १२ स्कन्ध precache गर्छ');
ok(worker.includes("request.mode === 'navigate'") && worker.includes("caches.match('./index.html')"),
  'नेटवर्क नहुँदा cached app shell बाट navigation खुल्छ');

group('index.html एकीकरण');
ok(html.includes('<script src="data/canto-01.js"></script>'), 'canto-01.js लोड');
ok(html.includes('<script src="data/canto-02.js"></script>'), 'canto-02.js लोड');
ok(html.includes('<script src="data/canto-03.js"></script>'), 'canto-03.js लोड');
[4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(cid => ok(html.includes('data/canto-' + String(cid).padStart(2, '0') + '.js'), 'canto-' + String(cid).padStart(2, '0') + '.js लोड'));
ok(html.indexOf('data/canto-02.js') < html.indexOf('data/canto-03.js') &&
   html.indexOf('data/canto-03.js') < html.indexOf('data/canto-08.js') &&
   html.indexOf('data/canto-08.js') < html.indexOf('data/canto-09.js') &&
   html.indexOf('data/canto-09.js') < html.indexOf('data/canto-10.js') &&
   html.indexOf('data/canto-10.js') < html.indexOf('data/canto-11.js') &&
   html.indexOf('data/canto-11.js') < html.indexOf('data/canto-12.js') &&
   html.indexOf('data/canto-12.js') < html.indexOf('assets/app.js'),
  'सबै सामग्री स्क्रिप्ट सही क्रममा app.js अगाडि लोड हुन्छन्');
ok(/<html lang="ne">/.test(html), 'पृष्ठ भाषा नेपाली');

// ============================================================
group('गृहपृष्ठ');
go('#/');
eq(doc.querySelectorAll('.canto-card').length, 12, '१२ स्कन्ध-कार्ड');
ok(doc.querySelectorAll('.canto-badge, .cc-badge').length >= 12, 'सबै कार्डमा स्थिति-ब्याज');
ok(txt().includes('१२') && txt().includes('३३५'), 'नेपाली अंक : १२ स्कन्ध / ३३५ अध्याय');
ok(!renderedBad(), 'गृहपृष्ठमा undefined/null/NaN/[object Object] छैन');
ok(doc.querySelector('.hero-stat b').textContent.trim() === '१२', 'नेपाली अंक रेन्डरिङ (१२)');
const c2card = doc.querySelectorAll('.canto-card')[1];
ok(c2card && c2card.textContent.includes('उपलब्ध'), 'दोस्रो स्कन्ध कार्ड “उपलब्ध” देखिन्छ');
const c3card = doc.querySelectorAll('.canto-card')[2];
ok(c3card && c3card.textContent.includes('उपलब्ध'), 'तेस्रो स्कन्ध कार्ड “उपलब्ध” देखिन्छ');
const c4card = doc.querySelectorAll('.canto-card')[3];
ok(c4card && c4card.textContent.includes('उपलब्ध'), 'चौथो स्कन्ध कार्ड “उपलब्ध” देखिन्छ');
ok(doc.querySelectorAll('.canto-card')[8].textContent.includes('उपलब्ध'), 'नवम स्कन्ध कार्ड “उपलब्ध” देखिन्छ');
ok(doc.querySelectorAll('.canto-card')[9].textContent.includes('उपलब्ध'), 'दशम स्कन्ध कार्ड “उपलब्ध” देखिन्छ');
ok(doc.querySelectorAll('.canto-card')[10].textContent.includes('उपलब्ध'), 'एकादश स्कन्ध कार्ड “उपलब्ध” देखिन्छ');
ok(doc.querySelectorAll('.canto-card')[11].textContent.includes('उपलब्ध'), 'द्वादश स्कन्ध कार्ड “उपलब्ध” देखिन्छ');

group('स्कन्ध १ : १९ अध्याय, कुनै regression छैन');
go('#/canto/1');
eq(doc.querySelectorAll('.theme-block').length, 8, '८ विषयगत प्रकरण');
eq(doc.querySelectorAll('.chapter-row').length, 19, '१९ अध्याय पङ्क्ति');
ok(main.textContent.includes('१९ अध्याय'), 'ब्यानरमा अध्याय-सङ्ख्या १९ (सूचीले ओभरराइट गरेको छैन)');
ok(!/\[object Object\]/.test(main.textContent), 'ब्यानरमा [object Object] छैन');
ok(!renderedBad(), 'स्कन्ध १ मा कुनै अवाञ्छित मान छैन');
for (let n = 1; n <= 19; n++) {
  go('#/canto/1/chapter/' + n);
  ok(main.querySelector('.reader h1').textContent === C[1].chapters[n - 1].title,
    'स्कन्ध १ / अध्याय ' + n + ' खुल्छ');
}

group('स्कन्ध २ : १० अध्याय, ४ प्रकरण');
go('#/canto/2');
eq(doc.querySelectorAll('.theme-block').length, 4, '४ विषयगत प्रकरण');
eq(doc.querySelectorAll('.chapter-row').length, 10, '१० अध्याय पङ्क्ति');
ok(main.textContent.includes('१० अध्याय') && main.textContent.includes('४ विषयगत प्रकरण'),
  'ब्यानरमा सही अध्याय/प्रकरण सङ्ख्या (नेपाली अंक)');
ok(main.querySelector('.canto-intro') && main.querySelector('.canto-intro').textContent.length > 100,
  'स्कन्ध-परिचय देखिन्छ');
ok(!renderedBad(), 'स्कन्ध २ मा कुनै अवाञ्छित मान छैन');
for (let n = 1; n <= 10; n++) {
  go('#/canto/2/chapter/' + n);
  const h1 = main.querySelector('.reader h1');
  ok(h1 && h1.textContent === C[2].chapters[n - 1].title, 'स्कन्ध २ / अध्याय ' + n + ' खुल्छ');
  ok(main.querySelectorAll('.reader p').length >= 3, '  · बहु-अनुच्छेद रेन्डर');
  ok(main.querySelectorAll('.points li').length >= 4, '  · मुख्य-विन्दु रेन्डर');
  ok(main.querySelector('.reader-kicker').textContent.includes('अध्याय ' + neNum(n)),
    '  · नेपाली अंकयुक्त अध्याय-शीर्षक');
  ok(!renderedBad(), '  · कुनै अवाञ्छित मान छैन');
}
go('#/canto/2/chapter/10');
ok(main.querySelector('.crumbs').textContent.includes('द्वितीय') || main.querySelector('.crumbs').textContent.includes('द्धितीय'),
  'स्कन्ध २ को breadcrumb / नाम');

group('स्कन्ध ३ : ३३ अध्याय, १० प्रकरण');
go('#/canto/3');
eq(doc.querySelectorAll('.theme-block').length, 10, '१० विषयगत प्रकरण');
eq(doc.querySelectorAll('.chapter-row').length, 33, '३३ अध्याय पङ्क्ति');
ok(main.textContent.includes('३३ अध्याय') && main.textContent.includes('१० विषयगत प्रकरण'),
  'ब्यानरमा ३३ अध्याय / १० प्रकरण (नेपाली अंक)');
ok(main.querySelector('.canto-intro') && main.querySelector('.canto-intro').textContent.length > 100,
  'स्कन्ध ३ को परिचय देखिन्छ');
ok(!renderedBad(), 'स्कन्ध ३ मा कुनै अवाञ्छित मान छैन');
for (let n = 1; n <= 33; n++) {
  go('#/canto/3/chapter/' + n);
  const h1 = main.querySelector('.reader h1');
  ok(h1 && h1.textContent === C[3].chapters[n - 1].title, 'स्कन्ध ३ / अध्याय ' + n + ' खुल्छ');
  ok(main.querySelectorAll('.reader p').length >= 3, '  · बहु-अनुच्छेद रेन्डर');
  ok(main.querySelectorAll('.points li').length >= 5, '  · ५+ मुख्य-विन्दु रेन्डर');
  ok(main.querySelector('.reader-kicker').textContent.includes('अध्याय ' + neNum(n)),
    '  · नेपाली अंकयुक्त अध्याय-शीर्षक');
  ok(!renderedBad(), '  · कुनै अवाञ्छित मान छैन');
}
go('#/canto/3/chapter/33');
ok(main.querySelector('.crumbs').textContent.includes('तृतीय'), 'स्कन्ध ३ को breadcrumb / नाम');
ok(main.querySelector('.shloka') && main.querySelector('.shloka .sa').textContent.length > 30,
  'स्कन्ध ३ / अध्याय ३३ मा श्लोक-ब्लक देखिन्छ');

group('स्कन्ध ४–१० : सूची, सबै अध्याय र श्लोक रेन्डर');
for (let cid = 4; cid <= 10; cid++) {
  go('#/canto/' + cid);
  eq(doc.querySelectorAll('.chapter-row').length, C[cid].chapters.length, 'स्कन्ध ' + cid + ' : अध्याय सूची रेन्डर');
  ok(main.querySelector('.canto-intro') && main.querySelector('.canto-intro').textContent.length > 100, 'स्कन्ध ' + cid + ' : परिचय रेन्डर');
  ok(!renderedBad(), 'स्कन्ध ' + cid + ' : कुनै अवाञ्छित मान छैन');
  for (let n = 1; n <= C[cid].chapters.length; n++) {
    go('#/canto/' + cid + '/chapter/' + n);
    ok(main.querySelector('.reader h1').textContent === C[cid].chapters[n - 1].title, 'स्कन्ध ' + cid + ' / अध्याय ' + n + ' खुल्छ');
    ok(main.querySelectorAll('.reader p').length >= 3 && main.querySelectorAll('.points li').length >= 5, '  · सारांश र मुख्य-विन्दु रेन्डर');
    ok(!renderedBad(), '  · कुनै अवाञ्छित मान छैन');
  }
}
go('#/canto/8/chapter/22');
ok(main.querySelector('.shloka') && main.querySelector('.shloka .sa').textContent.includes('बिभेमि'), 'अष्टम स्कन्धको चयनित श्लोक रेन्डर');
go('#/canto/9/chapter/21');
ok(main.querySelector('.shloka') && main.querySelector('.shloka .sa').textContent.includes('न कामये'), 'नवम स्कन्धको चयनित श्लोक रेन्डर');
go('#/canto/10/chapter/90');
ok(main.querySelector('.shloka') && main.querySelector('.shloka .sa').textContent.includes('मर्त्यस्तया'), 'दशम स्कन्धको चयनित श्लोक रेन्डर');

group('अध्याय-नेभिगेसन');
go('#/canto/2/chapter/5');
const links = Array.from(main.querySelectorAll('.reader-actions a.btn'));
ok(links.length >= 2, 'अघिल्लो र अर्को अध्यायका बटन');
ok(links.some(a => a.getAttribute('href') === '#/canto/2/chapter/4'), 'अघिल्लो अध्याय ४ को लिङ्क');
ok(links.some(a => a.getAttribute('href') === '#/canto/2/chapter/6'), 'अर्को अध्याय ६ को लिङ्क');
go('#/canto/2/chapter/6');
ok(main.querySelector('.reader h1').textContent === C[2].chapters[5].title, 'नेभिगेसनपछि अध्याय ६ खुल्छ');
go('#/canto/2/chapter/10');
ok(Array.from(main.querySelectorAll('.reader-actions a.btn')).some(a => a.getAttribute('href') === '#/canto/3'),
  'स्कन्ध २ को अन्तिम अध्यायबाट तृतीय स्कन्धतर्फ लिङ्क');
go('#/canto/3/chapter/5');
const links3 = Array.from(main.querySelectorAll('.reader-actions a.btn'));
ok(links3.some(a => a.getAttribute('href') === '#/canto/3/chapter/4'), 'स्कन्ध ३ / अध्याय ५ बाट अघिल्लो ४');
ok(links3.some(a => a.getAttribute('href') === '#/canto/3/chapter/6'), 'स्कन्ध ३ / अध्याय ५ बाट अर्को ६');
go('#/canto/3/chapter/33');
ok(Array.from(main.querySelectorAll('.reader-actions a.btn')).some(a => a.getAttribute('href') === '#/canto/4'),
  'स्कन्ध ३ को अन्तिम अध्यायबाट चतुर्थ स्कन्धतर्फ लिङ्क');
go('#/canto/9/chapter/24');
ok(Array.from(main.querySelectorAll('.reader-actions a.btn')).some(a => a.getAttribute('href') === '#/canto/10'),
  'स्कन्ध ९ को अन्तिम अध्यायबाट दशम स्कन्धतर्फ लिङ्क');
go('#/canto/10/chapter/90');
ok(Array.from(main.querySelectorAll('.reader-actions a.btn')).some(a => a.getAttribute('href') === '#/canto/11'),
  'स्कन्ध १० को अन्तिम अध्यायबाट एकादश स्कन्धतर्फ लिङ्क');
go('#/canto/11/chapter/31');
ok(Array.from(main.querySelectorAll('.reader-actions a.btn')).some(a => a.getAttribute('href') === '#/canto/12'),
  'स्कन्ध ११ को अन्तिम अध्यायबाट द्वादश स्कन्धतर्फ लिङ्क');

group('खोजी (query-string strip सहित)');
go('#/search?q=' + encodeURIComponent('चतुःश्लोकी'));
ok(main.textContent.includes('खोजीपरिणाम'), '#/search?q=… ले खोजी-पाटो खोल्छ');
ok(doc.querySelectorAll('.search-result').length >= 1, 'द्वितीय स्कन्धको सामग्री खोजीमा भेटिन्छ');
ok(!!main.querySelector('mark'), '<mark> हाइलाइट');
ok(main.querySelector('.sr-loc') && main.querySelector('.sr-loc').textContent.includes('अध्याय'),
  'परिणाममा स्कन्ध/अध्याय स्थान');
go('#/search?q=' + encodeURIComponent('विराट्'));
ok(doc.querySelectorAll('.search-result').length >= 3, '“विराट्” खोजीले उपलब्ध अध्यायहरू भेटाउँछ');
go('#/search?q=' + encodeURIComponent('कपिल'));
ok(doc.querySelectorAll('.search-result').length >= 8, '“कपिल” ले तृतीय स्कन्धका धेरै अध्याय भेटाउँछ');
go('#/search?q=' + encodeURIComponent('हिरण्याक्ष'));
ok(doc.querySelectorAll('.search-result').length >= 2, '“हिरण्याक्ष” खोजीमा भेटिन्छ');
go('#/search?q=' + encodeURIComponent('परीक्षित्'));
ok(doc.querySelectorAll('.search-result').length >= 4, '“परीक्षित्” प्रथम/द्वितीय स्कन्धमा भेटिन्छ');
go('#/search?q=' + encodeURIComponent('zzzअसम्भवशब्द'));
ok(main.textContent.includes('भेटिएन'), 'नभेटिएको खोजीमा सहज सूचना');
ok(!renderedBad(), 'खोजीमा कुनै अवाञ्छित मान छैन');

group('प्रगति-ट्र्याकिङ (localStorage)');
window.localStorage.removeItem('sb-read-v1');
go('#/canto/2/chapter/1');
const chk = doc.getElementById('readChk');
ok(!!chk && !chk.checked, 'पढिसकेँ चेकबक्स सुरुमा खाली');
chk.checked = true;
chk.dispatchEvent(new window.Event('change'));
const store = JSON.parse(window.localStorage.getItem('sb-read-v1') || '{}');
ok(Array.isArray(store['2']) && store['2'].includes(1), 'localStorage मा स्कन्ध २ / अध्याय १ सुरक्षित');
ok(sidebar.querySelector('.nav-ch-done') !== null, 'साइडबारमा ✓ देखिन्छ');
chk.checked = false;
chk.dispatchEvent(new window.Event('change'));
const store2 = JSON.parse(window.localStorage.getItem('sb-read-v1') || '{}');
ok(!(store2['2'] || []).includes(1), 'टगल अफ गर्दा प्रगति हट्छ');
go('#/canto/3/chapter/33');
const chk3 = doc.getElementById('readChk');
chk3.checked = true;
chk3.dispatchEvent(new window.Event('change'));
const store3 = JSON.parse(window.localStorage.getItem('sb-read-v1') || '{}');
ok(Array.isArray(store3['3']) && store3['3'].includes(33), 'localStorage मा स्कन्ध ३ / अध्याय ३३ सुरक्षित');
ok(sidebar.querySelector('.nav-ch-done') !== null, 'स्कन्ध ३ को साइडबारमा ✓ देखिन्छ');
window.localStorage.removeItem('sb-read-v1');

group('अक्षर-आकार नियन्त्रण');
window.localStorage.removeItem('sb-fs');
go('#/');
doc.getElementById('fontPlus').click();
ok(doc.body.classList.contains('fs-big'), 'अ+ ले fs-big थप्छ');
ok(window.localStorage.getItem('sb-fs') === '1', 'अक्षर-आकार localStorage मा सुरक्षित');
doc.getElementById('fontPlus').click();
ok(doc.body.classList.contains('fs-xl'), 'दोस्रो अ+ ले fs-xl');
doc.getElementById('fontPlus').click();
ok(doc.body.classList.contains('fs-xl'), 'अधिकतममा सीमित');
doc.getElementById('fontMinus').click();
doc.getElementById('fontMinus').click();
doc.getElementById('fontMinus').click();
ok(!doc.body.classList.contains('fs-big') && !doc.body.classList.contains('fs-xl'), 'अ− ले सामान्यमा फर्काउँछ');

group('साइडबार नियन्त्रण');
go('#/');
doc.getElementById('menuBtn').click();
ok(sidebar.classList.contains('open') && doc.getElementById('backdrop').classList.contains('show'),
  'मेनु बटनले साइडबार/ब्याकड्रप खोल्छ');
doc.getElementById('backdrop').click();
ok(!sidebar.classList.contains('open'), 'ब्याकड्रप क्लिकले बन्द गर्छ');
eq(sidebar.querySelectorAll('.nav-canto').length, 12, 'साइडबारमा १२ स्कन्ध');
go('#/canto/2');
const nav2 = sidebar.querySelectorAll('.nav-canto')[1];
ok(nav2.classList.contains('open'), 'सक्रिय स्कन्ध २ साइडबारमा खुला');
eq(nav2.querySelectorAll('.nav-theme').length, 4, 'साइडबारमा ४ प्रकरण');
eq(nav2.querySelectorAll('.nav-ch').length, 10, 'साइडबारमा १० अध्याय लिङ्क');
eq(nav2.querySelectorAll('.nav-ch.active').length, 0, 'स्कन्ध पृष्ठमा कुनै अध्याय सक्रिय छैन');
go('#/canto/2/chapter/3');
eq(sidebar.querySelectorAll('.nav-canto')[1].querySelectorAll('.nav-ch.active').length, 1,
  'अध्याय पृष्ठमा साइडबारको सक्रिय अध्याय');
go('#/canto/3');
const nav3 = sidebar.querySelectorAll('.nav-canto')[2];
ok(nav3.classList.contains('open'), 'सक्रिय स्कन्ध ३ साइडबारमा खुला');
eq(nav3.querySelectorAll('.nav-theme').length, 10, 'साइडबारमा स्कन्ध ३ का १० प्रकरण');
eq(nav3.querySelectorAll('.nav-ch').length, 33, 'साइडबारमा स्कन्ध ३ का ३३ अध्याय लिङ्क');
go('#/canto/3/chapter/17');
eq(sidebar.querySelectorAll('.nav-canto')[2].querySelectorAll('.nav-ch.active').length, 1,
  'स्कन्ध ३ / अध्याय १७ साइडबारमा सक्रिय');
go('#/canto/10');
const nav10 = sidebar.querySelectorAll('.nav-canto')[9];
ok(nav10.classList.contains('open'), 'सक्रिय दशम स्कन्ध साइडबारमा खुला');
eq(nav10.querySelectorAll('.nav-theme').length, 14, 'साइडबारमा दशम स्कन्धका १४ प्रकरण');
eq(nav10.querySelectorAll('.nav-ch').length, 90, 'साइडबारमा दशम स्कन्धका ९० अध्याय');
go('#/canto/11');
const nav11 = sidebar.querySelectorAll('.nav-canto')[10];
ok(nav11.classList.contains('open'), 'एकादश स्कन्धको साइडबार सामग्री खुल्छ');
eq(nav11.querySelectorAll('.nav-theme').length, 7, 'साइडबारमा एकादश स्कन्धका ७ प्रकरण');
eq(nav11.querySelectorAll('.nav-ch').length, 31, 'साइडबारमा एकादश स्कन्धका ३१ अध्याय');
go('#/canto/12');
const nav12 = sidebar.querySelectorAll('.nav-canto')[11];
ok(nav12.classList.contains('open'), 'द्वादश स्कन्धको साइडबार सामग्री खुल्छ');
eq(nav12.querySelectorAll('.nav-theme').length, 7, 'साइडबारमा द्वादश स्कन्धका ७ प्रकरण');
eq(nav12.querySelectorAll('.nav-ch').length, 13, 'साइडबारमा द्वादश स्कन्धका १३ अध्याय');

group('स्कन्ध ११–१२ र अमान्य मार्ग');
[11, 12].forEach((cid) => {
  go('#/canto/' + cid);
  eq(doc.querySelectorAll('.chapter-row').length, C[cid].chapters.length, 'स्कन्ध ' + cid + ' का सबै अध्याय सूचीबद्ध');
  C[cid].chapters.forEach(ch => {
    go('#/canto/' + cid + '/chapter/' + ch.n);
    ok(main.querySelector('.reader h1').textContent === ch.title, 'स्कन्ध ' + cid + ' / अध्याय ' + ch.n + ' खुल्छ');
  });
});
ok(!main.querySelector('.soon-box'), 'पूर्ण सामग्रीका स्कन्ध placeholder देखाउँदैनन्');
ok(!renderedBad(), 'पूर्ण सामग्रीमा कुनै अवाञ्छित मान छैन');
go('#/canto/3/chapter/99');
ok(!!main.querySelector('.theme-block'), 'स्कन्ध ३ को अमान्य अध्याय → स्कन्ध पृष्ठमा सहज fallback');
go('#/canto/2/chapter/99');
ok(!!main.querySelector('.theme-block'), 'अमान्य अध्याय → स्कन्ध पृष्ठमा सहज fallback');
go('#/canto/1/chapter/999');
ok(!!main.querySelector('.theme-block'), 'स्कन्ध १ को अमान्य अध्याय → fallback');
go('#/canto/77');
ok(main.textContent.includes('स्कन्ध भेटिएन'), 'अस्तित्वहीन स्कन्ध → सहज सूचना');
go('#/search?q=');
ok(main.textContent.includes('केही लेख्नुहोस्'), 'खाली खोजी → सहज सूचना');
go('#/random/garbage/path');
ok(doc.querySelectorAll('.canto-card').length === 12, 'अज्ञात मार्ग → गृहपृष्ठ');

// ============================================================
console.log('\n────────────────────────────────────────────');
console.log('पास : ' + passed + '   असफल : ' + failures.length);
if (failures.length) {
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('✅ सबै स्मोक-टेस्ट पास');
