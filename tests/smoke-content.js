/* अध्याय संरचना, पुनर्लेखन-कवरेज र पाठ-स्वच्छता जाँच */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const EXPECTED = [19, 10, 33, 31, 26, 19, 15, 24, 24, 90, 31, 13];
const globalWindow = { BHAGAVATA_CONTENT: {} };
let passed = 0;
const failures = [];
function ok(test, label) {
  if (test) { passed++; console.log('✓ ' + label); }
  else { failures.push(label); console.log('✗ ' + label); }
}
const BENGALI = /[\u0980-\u09FF]/;
const CYRILLIC = /[\u0400-\u052F]/;

for (let canto = 1; canto <= 12; canto++) {
  const file = `data/canto-${String(canto).padStart(2, '0')}.js`;
  new Function('window', read(file))(globalWindow);
}
const C = globalWindow.BHAGAVATA_CONTENT;
const total = EXPECTED.reduce((a, b) => a + b, 0);
const reviewManifest = JSON.parse(read('docs/content-review-manifest.json'));
const STATUSES = ['draft_unverified', 'source_checked', 'editorially_approved'];
const promotedIds = reviewManifest.chapters
  .filter((r) => r.summary_status !== 'draft_unverified').map((r) => r.id);
const manifestMatches = reviewManifest.chapters.length === total &&
  new Set(reviewManifest.chapters.map((row) => row.id)).size === total &&
  reviewManifest.chapters.every((row) => {
    const chapter = C[row.canto]?.chapters[row.chapter - 1];
    const structural = chapter &&
      row.id === `${String(row.canto).padStart(2, '0')}.${String(row.chapter).padStart(2, '0')}` &&
      row.title === chapter.title &&
      STATUSES.includes(row.summary_status) && row.summary_status === row.key_points_status &&
      row.word_count === chapter.summary.trim().split(/\s+/).filter(Boolean).length &&
      row.expansion_triage === (row.word_count < 150 ? 'needs_expansion' : 'length_check_only');
    if (!structural) return false;
    const isDraft = row.summary_status === 'draft_unverified';
    if (isDraft) {
      // A draft must still carry its provisional range and no review record.
      return /^\d+-\d+$/.test(row.candidate_verse_range) && !row.primary_source_ref && !row.reviewer;
    }
    // A promoted chapter must carry a complete, pinned, individual review record.
    const ref = row.primary_source_ref || {};
    const pinned = !!(ref.edition && ref.url && ref.page && ref.pageid && ref.revid && ref.retrieved);
    const ranged = /^\d+-\d+$/.test(row.verse_range || '');
    const signed = !!(row.reviewer && row.reviewed_at);
    const checks = row.checks && Object.keys(row.checks).length > 0 &&
      Object.values(row.checks).every((v) => v === 'pass' || v === 'partial');
    return pinned && ranged && signed && checks;
  });
ok(manifestMatches, '३३५ अध्यायको समीक्षा-म्यानिफेस्ट संरचना र प्रचलित समीक्षा-स्थिति मिल्छ');
ok(promotedIds.length === reviewManifest.source_policy.verified_chapters,
  'प्रमाणित भनिएका अध्याय-सङ्ख्या वास्तविक स्थितिसँग मिल्छ (' + promotedIds.length + ')');
ok(promotedIds.length < total,
  'सबै अध्याय प्रमाणित भनिएको छैन (' + promotedIds.length + '/' + total + ' मात्र प्रमाणित-जाँचिएको)');
const policy = reviewManifest.source_policy;
ok(policy.editorially_approved_chapters === 0 || policy.editorially_approved_chapters > 0,
   'सम्पादकीय स्वीकृति गणना उपस्थित');
ok(!!policy.accepted_reference && !!policy.accepted_reference.license &&
   policy.accepted_reference.license.includes('CC BY-SA') &&
   Array.isArray(policy.accepted_reference.limitations) && policy.accepted_reference.limitations.length > 0,
   'स्वीकृत सन्दर्भ-संस्करण, अनुमति र सीमा म्यानिफेस्टमा स्पष्ट छ');
const rejected = JSON.stringify(policy.rejected_or_limited_sources || {});
ok(rejected.includes('ITX') && rejected.includes('GRETIL') &&
   rejected.includes('Dutt') &&
   String((policy.accepted_reference || {}).copyrighted_material || '').includes('No copyrighted translation'),
   'अस्वीकृत/सीमित स्रोत र प्रतिलिपि-अधिकार नीति अभिलेखित छ');
ok(policy.secondary_sources.includes('never treat OCR as verified source text') &&
   reviewManifest.content_standard.warning.includes('not evidence of completeness'),
   'समीक्षा म्यानिफेस्टले अप्रमाणित स्थिति र OCR नीति स्पष्ट गर्छ');
let nonempty = 0;
for (let canto = 1; canto <= 12; canto++) {
  const c = C[canto];
  ok(!!c, `स्कन्ध ${canto} सामग्री उपलब्ध`);
  if (!c) continue;
  ok(c.intro.trim().length > 0, `स्कन्ध ${canto} परिचय स्थिति`);
  ok(Array.isArray(c.chapters) && c.chapters.length === EXPECTED[canto - 1], `स्कन्ध ${canto} अध्याय-सङ्ख्या ${EXPECTED[canto - 1]}`);
  ok(Array.isArray(c.themes) && c.themes.length > 0, `स्कन्ध ${canto} विषयगत समूह उपलब्ध`);
  ok(c.chapters.every((ch, i) => ch.n === i + 1), `स्कन्ध ${canto} अध्याय-क्रम निरन्तर`);
  for (const ch of c.chapters) {
    ok(typeof ch.title === 'string' && ch.title.trim().length > 0, `स्कन्ध ${canto}/${ch.n} शीर्षक`);
    ok(typeof ch.summary === 'string', `स्कन्ध ${canto}/${ch.n} सारांश-क्षेत्र`);
    ok(Array.isArray(ch.points), `स्कन्ध ${canto}/${ch.n} मुख्य-विन्दु क्षेत्र`);
    const hasText = ch.summary.trim().length > 0;
    if (hasText) nonempty++;
    const expectedHasText = canto <= 12;
    ok(hasText === expectedHasText, `स्कन्ध ${canto}/${ch.n} पुनर्लेखन स्थिति ठीक`);
    ok(expectedHasText ? ch.points.length > 0 : ch.points.length === 0,
      `स्कन्ध ${canto}/${ch.n} मुख्य-विन्दु ${expectedHasText ? 'भएका' : 'खाली'}`);
    ok(!expectedHasText || ch.summary.trim().length >= (canto >= 4 ? 500 : 1000),
      `स्कन्ध ${canto}/${ch.n} सारांशमा पर्याप्त विवरण-आधार`);
    const visible = [ch.title, ch.summary, ...ch.points];
    ok(visible.every((s) => s === s.normalize('NFC')), `स्कन्ध ${canto}/${ch.n} पाठ NFC`);
    ok(visible.every((s) => !BENGALI.test(s) && !CYRILLIC.test(s)), `स्कन्ध ${canto}/${ch.n} मिश्र-लिपि छैन`);
    if (ch.shloka) {
      ok(typeof ch.shloka.sa === 'string' && ch.shloka.sa.trim().length > 0 &&
         typeof ch.shloka.np === 'string' && ch.shloka.np.trim().length > 0,
         `स्कन्ध ${canto}/${ch.n} श्लोक-ब्लक संरचना`);
    }
  }
}
ok(total === 335, 'कुल ३३५ अध्यायको संरचना');
ok(nonempty === 335, 'बाह्रै स्कन्धका ३३५ अध्यायका प्रारम्भिक सारांश तयार छन्');
console.log(`\nपास: ${passed}  असफल: ${failures.length}`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
