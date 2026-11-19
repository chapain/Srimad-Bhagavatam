/* मुख्य UI व्यवहारको jsdom स्मोक-टेस्ट */
'use strict';
const fs = require('fs');
const path = require('path');
function loadJsdom() {
  for (const candidate of ['jsdom', process.env.JS_DOM_PATH, '/tmp/sb-test/node_modules/jsdom']) {
    if (!candidate) continue;
    try { return require(candidate); } catch (_) {}
  }
  console.error('jsdom भेटिएन: npm install --prefix /tmp/sb-test jsdom');
  process.exit(2);
}
const { JSDOM } = loadJsdom();
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('index.html');
const counts = [19, 10, 33, 31, 26, 19, 15, 24, 24, 90, 31, 13];
let passed = 0;
const failures = [];
function ok(test, label) {
  if (test) { passed++; console.log('✓ ' + label); }
  else { failures.push(label); console.error('✗ ' + label); }
}
function eq(actual, expected, label) { ok(actual === expected, `${label} (got ${actual})`); }
const dom = new JSDOM(html, {
  url: 'https://example.test/Srimad-Bhagavatam/',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});
const { window } = dom;
const doc = window.document;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
for (let n = 1; n <= 12; n++) window.eval(read(`data/canto-${String(n).padStart(2, '0')}.js`));
window.eval(read('assets/app.js'));
const main = doc.getElementById('main');
const C = window.BHAGAVATA_CONTENT;
function go(hash) {
  window.location.hash = hash;
  window.dispatchEvent(new window.Event('hashchange'));
}

ok(counts.every((n, i) => C[i + 1].chapters.length === n), 'बाह्र स्कन्धका ३३५ अध्याय लोड');
ok(C[1].intro.length > 0 && C[1].chapters.every(ch => ch.summary.length > 0 && ch.points.length > 0),
  'प्रथम स्कन्धको परिचय र १९ अध्यायका सारांश उपलब्ध');
ok(C[2].intro.length > 0 && C[2].chapters.every(ch => ch.summary.length > 0 && ch.points.length > 0) &&
  C[3].intro.length > 0 && C[3].chapters.every(ch => ch.summary.length >= 1000 && ch.points.length > 0) &&
  C[4].intro.length > 0 && C[4].chapters.every(ch => ch.summary.length >= 500 && ch.points.length > 0) &&
  C[5].intro.length > 0 && C[5].chapters.every(ch => ch.summary.length >= 500 && ch.points.length > 0) &&
  C[6].intro.length > 0 && C[6].chapters.every(ch => ch.summary.length >= 500 && ch.points.length > 0) &&
  C[7].intro.length > 0 && C[7].chapters.every(ch => ch.summary.length >= 500 && ch.points.length > 0) &&
  C[8].intro.length > 0 && C[8].chapters.every(ch => ch.summary.length >= 500 && ch.points.length > 0) &&
  C[9].intro.length > 0 && C[9].chapters.every(ch => ch.summary.length >= 500 && ch.points.length > 0) &&
  C[10].intro.length > 0 && C[10].chapters.every(ch => ch.summary.length >= 500 && ch.points.length > 0) &&
  C[11].intro.length > 0 && C[11].chapters.every(ch => ch.summary.length >= 500 && ch.points.length > 0) &&
  C[12].intro.length > 0 && C[12].chapters.every(ch => ch.summary.length >= 500 && ch.points.length > 0),
  'बाह्रै स्कन्धका सबै अध्यायमा प्रारम्भिक मस्यौदा छन्');
ok(!html.includes('verse-sources.js') && !read('assets/app.js').includes('verseCitation'),
  'पृष्ठ र एपमा पुरानो पद्य-लिङ्क प्रणाली छैन');
ok(!doc.querySelector('a[href^="https://"]'), 'HTML मा बाह्य स्रोत-लिङ्क छैन');

go('#/');
eq(doc.querySelectorAll('.canto-card').length, 12, 'गृहपृष्ठमा १२ स्कन्ध कार्ड');
ok((doc.body.textContent || '').includes('३३५'), 'गृहपृष्ठमा अध्याय-सङ्ख्या');

go('#/canto/1/chapter/1');
ok(main.querySelector('.reader h1')?.textContent === C[1].chapters[0].title, 'प्रथम स्कन्ध अध्याय १ खुल्छ');
ok(main.textContent.includes('नैमिषारण्य') && main.textContent.includes('परम सत्य'), 'नयाँ सारांश रेन्डर हुन्छ');
ok(main.querySelectorAll('.verse-ref').length === 0, 'सारांशमा बाह्य पद्य-लिङ्क छैन');

go('#/canto/1/chapter/2');
ok(main.textContent.includes('अहैतुकी') && main.textContent.includes('साधुसङ्ग'), 'प्रथम स्कन्ध अध्याय २ को विस्तृत सारांश रेन्डर हुन्छ');
ok(main.querySelectorAll('.points li').length > 0, 'पुनर्लेखित अध्यायका मुख्य-विन्दु देखिन्छन्');

go('#/canto/3/chapter/1');
ok(main.textContent.includes('विदुर') && main.textContent.includes('उद्धव'), 'तृतीय स्कन्ध अध्याय १ को पुनर्लेखित सारांश रेन्डर हुन्छ');
go('#/canto/4/chapter/1');
ok(main.querySelector('.reader h1')?.textContent === C[4].chapters[0].title && main.textContent.includes('सारांश'), 'चतुर्थ स्कन्धको नयाँ अध्याय-सारांश देखिन्छ');
go('#/canto/5/chapter/1');
ok(main.querySelector('.reader h1')?.textContent === C[5].chapters[0].title && main.textContent.includes('सारांश'), 'पञ्चम स्कन्धको नयाँ अध्याय-सारांश देखिन्छ');
go('#/canto/6/chapter/1');
ok(main.textContent.includes('अजामिल') && main.textContent.includes('विष्णुदूत'), 'षष्ठ स्कन्धको नयाँ सारांश देखिन्छ');
go('#/canto/7/chapter/1');
ok(main.textContent.includes('शिशुपाल') && main.textContent.includes('जय-विजय'), 'सप्तम स्कन्धको नयाँ सारांश देखिन्छ');
go('#/canto/8/chapter/1');
ok(main.textContent.includes('गजेन्द्र') && main.textContent.includes('शरण'), 'अष्टम स्कन्धको नयाँ सारांश देखिन्छ');
go('#/canto/9/chapter/1');
ok(main.textContent.includes('सुद्युम्न') && main.textContent.includes('पुरूरवा'), 'नवम स्कन्धको नयाँ सारांश देखिन्छ');
go('#/canto/10/chapter/1');
ok(main.textContent.includes('कंस') && main.textContent.includes('देवकी'), 'दशम स्कन्धको नयाँ सारांश देखिन्छ');
go('#/canto/11/chapter/1');
ok(main.textContent.includes('साम्ब') && main.textContent.includes('मुसल'), 'एकादश स्कन्धको नयाँ सारांश देखिन्छ');
go('#/canto/12/chapter/1');
ok(main.textContent.includes('कलियुग') && main.textContent.includes('राजवंश'), 'द्वादश स्कन्धको नयाँ सारांश देखिन्छ');
ok(main.querySelector('.reader-note')?.textContent.includes('प्रारम्भिक मस्यौदा'), 'अध्यायमा अप्रमाणित मस्यौदा स्थिति स्पष्ट देखिन्छ');
go('#/search?q=' + encodeURIComponent('नैमिषारण्य'));
ok(main.querySelectorAll('.search-result').length >= 1, 'खोज्दा अध्याय १ को नयाँ सारांश भेटिन्छ');

go('#/canto/1/chapter/1');
const toggle = doc.getElementById('readChk');
toggle.checked = true;
toggle.dispatchEvent(new window.Event('change'));
ok(main.querySelector('#readChk') !== null, 'पढाइ-प्रगति नियन्त्रण रेन्डर');
const worker = read('service-worker.js');
ok(worker.includes('v15') && !worker.includes('verse-sources') && !worker.includes('review-manifest'),
  'service worker ले हटाइएका स्रोत फाइलहरू क्यास गर्दैन');

console.log(`\nपास: ${passed}  असफल: ${failures.length}`);
if (failures.length) process.exit(1);
