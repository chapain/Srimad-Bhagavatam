/* श्रीमद्भागवत अध्ययन एप — मुख्य तर्क */
(function () {
  'use strict';

  // ---- १२ स्कन्धको आधारभूत सूची (विस्तृत सामग्री data/canto-XX.js बाट आउँछ) ----
  const CANTO_META = [
    { id: 1,  name: 'प्रथम स्कन्ध',   roman: 'Prathama Skandha',  tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',            chapters: 19, color: '#7c2d12' },
    { id: 2,  name: 'द्धितीय स्कन्ध',  roman: 'Dvitīya Skandha',   tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',             chapters: 10, color: '#9a4a1a' },
    { id: 3,  name: 'तृतीय स्कन्ध',   roman: 'Tṛtīya Skandha',    tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',             chapters: 33, color: '#b07d1e' },
    { id: 4,  name: 'चतुर्थ स्कन्ध',  roman: 'Caturtha Skandha',  tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',                chapters: 31, color: '#53772f' },
    { id: 5,  name: 'पञ्चम स्कन्ध',   roman: 'Pañcama Skandha',   tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',               chapters: 26, color: '#2f6f5f' },
    { id: 6,  name: 'षष्ठ स्कन्ध',    roman: 'Ṣaṣṭha Skandha',    tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',                   chapters: 19, color: '#21618c' },
    { id: 7,  name: 'सप्तम स्कन्ध',   roman: 'Saptama Skandha',   tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',                  chapters: 15, color: '#3a4fa0' },
    { id: 8,  name: 'अष्टम स्कन्ध',   roman: 'Aṣṭama Skandha',    tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',                      chapters: 24, color: '#6d3aa0' },
    { id: 9,  name: 'नवम स्कन्ध',    roman: 'Navama Skandha',    tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',                          chapters: 24, color: '#a03472' },
    { id: 10, name: 'दशम स्कन्ध',    roman: 'Daśama Skandha',    tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',                       chapters: 90, color: '#8a1f2d' },
    { id: 11, name: 'एकादश स्कन्ध',  roman: 'Ekādaśa Skandha',  tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',                             chapters: 31, color: '#1f6e6e' },
    { id: 12, name: 'द्वादश स्कन्ध', roman: 'Dvādaśa Skandha',  tagline: 'प्रारम्भिक नेपाली मस्यौदा तयार',                chapters: 13, color: '#7a5a20' }
  ];

  const CONTENT = window.BHAGAVATA_CONTENT || {};

  // ---- सामान्य सहायक ----
  const NE_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  const ne = (s) => String(s).replace(/\d/g, (d) => NE_DIGITS[+d]);

  const readStore = {
    key: 'sb-read-v1',
    all() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; } },
    isRead(c, n) { const a = this.all()[c] || []; return a.includes(n); },
    toggle(c, n) {
      const a = this.all(); a[c] = a[c] || [];
      const i = a[c].indexOf(n);
      if (i >= 0) a[c].splice(i, 1); else a[c].push(n);
      localStorage.setItem(this.key, JSON.stringify(a));
      return i < 0;
    },
    count(c) { return (this.all()[c] || []).length; }
  };

  const getCanto = (id) => {
    const meta = CANTO_META.find((c) => c.id === +id);
    const content = CONTENT[+id];
    if (!meta) return null;
    const merged = Object.assign({}, meta, content || {});
    // सावधान : meta.chapters (अध्याय-सङ्ख्या) लाई content.chapters (अध्याय-सूची) ले
    // ओझेलमा पार्छ, जसले ब्यानरमा "[object Object]" देखाउँथ्यो। सङ्ख्या अलग राखिन्छ।
    merged.nChapters = (content && content.chapters && content.chapters.length) || meta.chapters;
    merged.chapters = meta.chapters;
    return merged;
  };

  const chapterOf = (canto, n) => (canto.chapters || []).find((c) => c.n === +n);

  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  const highlight = (text, q) => {
    if (!q) return esc(text);
    const t = esc(text);
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return t.replace(new RegExp('(' + safeQ + ')', 'gi'), '<mark>$1</mark>');
  };

  // ---- पाटोहरू ----
  const main = document.getElementById('main');
  const sidebar = document.getElementById('sidebar');

  function renderSidebar(active) {
    let html = '<div class="side-title">बाह्र स्कन्ध · विषय क्रम</div>';
    CANTO_META.forEach((c) => {
      const ct = CONTENT[c.id];
      const isOpen = active.canto === c.id;
      html += '<div class="nav-canto ' + (isOpen ? 'open' : '') + '" data-canto="' + c.id + '">';
      html += '  <div class="nav-canto-head" data-toggle="' + c.id + '">';
      html += '    <span class="nav-num" style="--c:' + c.color + '">' + ne(c.id) + '</span>';
      html += '    <span class="nav-canto-name">' + c.name + ' <span class="nav-canto-count">· ' + ne(c.chapters) + ' अध्याय</span></span>';
      html += '    <span class="nav-caret">▶</span>';
      html += '  </div>';
      html += '  <div class="nav-themes">';
      if (ct && ct.themes) {
        ct.themes.forEach((t) => {
          html += '<div class="nav-theme"><div class="nav-theme-name">◆ ' + esc(t.title) + '</div>';
          (ct.chapters || []).filter((ch) => ch.n >= t.from && ch.n <= t.to).forEach((ch) => {
            const isActive = active.canto === c.id && active.chapter === ch.n;
            const done = readStore.isRead(c.id, ch.n);
            html += '<a class="nav-ch ' + (isActive ? 'active' : '') + '" href="#/canto/' + c.id + '/chapter/' + ch.n + '">' +
              '<span class="nav-ch-no">' + ne(ch.n) + '.</span><span>' + esc(ch.title) + '</span>' +
              (done ? '<span class="nav-ch-done">✓</span>' : '') + '</a>';
          });
          html += '</div>';
        });
      } else {
        html += '<span class="nav-soon">विस्तृत सामग्री तयार हुँदैछ</span>';
      }
      html += '  </div></div>';
    });
    sidebar.innerHTML = html;
    sidebar.querySelectorAll('[data-toggle]').forEach((el) => {
      el.addEventListener('click', () => {
        const box = el.parentElement;
        if (+el.dataset.toggle === active.canto && box.classList.contains('open')) {
          window.location.hash = '#/canto/' + el.dataset.toggle;
          return;
        }
        box.classList.toggle('open');
      });
    });
    // खुला स्कन्धको शीर्षकमा क्लिक — स्कन्ध पृष्ठ
    sidebar.querySelectorAll('.nav-canto-head').forEach((el) => {
      el.addEventListener('dblclick', () => { window.location.hash = '#/canto/' + el.dataset.toggle; });
    });
  }

  function viewHome() {
    let done = 0, total = 0;
    CANTO_META.forEach((c) => { total += c.chapters; done += Math.min(readStore.count(c.id), c.chapters); });
    const loaded = CANTO_META.reduce((sum, c) => {
      const chapters = CONTENT[c.id] && CONTENT[c.id].chapters || [];
      return sum + chapters.filter((ch) => ch.summary && ch.summary.trim()).length;
    }, 0);

    let html = '<section class="hero">';
    html += '<h1>श्रीमद्भागवत महापुराण</h1>';
    html += '<p>वेदव्यासद्वारा विरचित, शुकदेव गोस्वामीद्वारा राजा परीक्षित्लाई सुनाइएको पुराण-रत्न। बाह्रै स्कन्धका नेपाली परिचय र ३३५ अध्यायका सारांश तथा मुख्य-विन्दु लेखिएका छन्। सबै सारांशको अवस्था एउटै छैन — हाल ' + ne(Object.keys(REVIEW_STATUS).length) + ' अध्याय संस्कृत विकिस्रोतको स्थिर संस्करणसँग अध्याय-स्तरमा जाँचिएका छन्, बाँकी अझै प्रारम्भिक मस्यौदा हुन् र प्रत्येक अध्यायमा आफ्नै स्थिति देखाइन्छ।</p>';
    html += '<div class="hero-stats">' +
      '<div class="hero-stat"><b>' + ne(12) + '</b><span>स्कन्ध (भाग)</span></div>' +
      '<div class="hero-stat"><b>' + ne(335) + '</b><span>अध्याय</span></div>' +
      '<div class="hero-stat"><b>' + ne(loaded) + '</b><span>नयाँ सारांश लेखिएका अध्याय</span></div>' +
      '<div class="hero-stat"><b>' + ne(done) + '</b><span>तपाईंले पढिसक्नुभएका</span></div>' +
      '</div></section>';

    html += '<h2 class="section-h">बाह्र स्कन्ध</h2><div class="canto-grid">';
    CANTO_META.forEach((c) => {
      const ct = CONTENT[c.id];
      const ready = ct && ct.chapters && ct.chapters.length;
      const readN = Math.min(readStore.count(c.id), c.chapters);
      const pct = ready ? Math.round((readN / c.chapters) * 100) : 0;
      html += '<a class="canto-card" style="--c:' + c.color + '" href="#/canto/' + c.id + '">';
      html += '<span class="cc-num">' + ne(c.id) + '</span>';
      html += '<h3>' + c.name + '</h3>';
      html += '<span class="cc-tag">' + c.tagline + '</span>';
      const started = ready ? ct.chapters.filter((ch) => ch.summary && ch.summary.trim()).length : 0;
      html += '<div class="cc-meta"><span>' + ne(c.chapters) + ' अध्याय</span>' +
        (started ? '<span class="cc-badge ready">' + ne(started) + ' प्रारम्भिक मस्यौदा</span>' : '<span class="cc-badge soon">पुनर्लेखन बाँकी</span>') + '</div>';
      if (ready && pct > 0) html += '<div class="cc-progress"><i style="width:' + pct + '%"></i></div>';
      html += '</a>';
    });
    html += '</div>';

    html += '<div class="howto"><h2 class="section-h">कसरी प्रयोग गर्ने</h2><ol>' +
      '<li><b>स्कन्ध छान्नुहोस्</b> — माथिका कार्ड वा बायाँपट्टिको सूचीबाट। प्रत्येक स्कन्ध <b>विषयगत प्रकरणहरू</b>मा विभाजित छ (जस्तै दशम स्कन्धमा: बाललीला, रास-पञ्चाध्यायी, मथुरा-प्रसङ्ग…).</li>' +
      '<li><b>प्रकरण भित्रका अध्यायहरू</b> क्रमशः खोल्नुहोस् — हरेक अध्यायमा विस्तृत सारांश, मुख्य विषयहरू र महत्त्वपूर्ण श्लोक छन्।</li>' +
      '<li><b>खोजी प्रयोग</b> — माथिको खानामा नाम वा घटना लेख्नुहोस् (जस्तै: <i>कालिय</i>, <i>भीष्म-स्तुति</i>, <i>अजामिल</i>) — सम्पूर्ण ग्रन्थभरि खोजिन्छ।</li>' +
      '<li><b>प्रगति ट्र्याकिङ</b> — अध्यायको तल्लो भागमा "पढिसकेँ" खानामा चिन्ह लगाउनुहोस्; तपाईंको प्रगति यही ब्राउजरमा सुरक्षित रहन्छ।</li>' +
      '</ol></div>';
    main.innerHTML = html;
    renderSidebar({});
  }

  function viewCanto(id) {
    const c = getCanto(id);
    if (!c) { main.innerHTML = '<p class="empty">स्कन्ध भेटिएन।</p>'; return; }
    renderSidebar({ canto: c.id });
    const ct = CONTENT[c.id];
    const ready = ct && ct.chapters && ct.chapters.length;

    let html = '<div class="canto-banner" style="background:linear-gradient(120deg,' + c.color + 'dd,' + c.color + ')">';
    html += '<div class="cb-roman">' + c.roman + '</div>';
    html += '<h1>' + c.name + '</h1><div class="cb-tag">' + c.tagline + '</div>';
    html += '<div class="cb-meta"><span>📖 ' + ne(ready ? ct.chapters.length : c.chapters) + ' अध्याय</span>' + (ready ? '<span>🧩 ' + ne(ct.themes.length) + ' विषयगत प्रकरण</span><span>✓ ' + ne(readStore.count(c.id)) + ' पढिसकिएका</span>' : '') + '</div>';
    html += '</div>';

    if (!ready) {
      html += '<div class="soon-box"><h2>यो स्कन्धको विस्तृत सामग्री तयार हुँदैछ</h2>' +
        '<p>' + c.name + 'का ' + ne(c.chapters) + ' अध्यायको विषयगत विभाजन र विस्तृत नेपाली सारांश क्रमशः थपिँदैछ। अहिलेका लागि उपलब्ध स्कन्धहरू गृहपृष्ठबाट हेर्नुहोस्।</p>' +
        '<a class="btn" href="#/">🏠 गृहपृष्ठ</a></div>';
      main.innerHTML = html;
      return;
    }

    html += '<div class="canto-intro">' + (ct.intro ? esc(ct.intro) : 'यस स्कन्धको परिचय पुनर्लेखनका लागि बाँकी छ।') + '</div>';

    ct.themes.forEach((t) => {
      html += '<div class="theme-block" id="theme-' + t.id + '">';
      html += '<div class="theme-head"><span class="theme-dot"></span><h3>' + esc(t.title) + '</h3><span class="theme-range">अध्याय ' + ne(t.from) + '–' + ne(t.to) + '</span></div>';
      html += '<ul class="chapter-list">';
      ct.chapters.filter((ch) => ch.n >= t.from && ch.n <= t.to).forEach((ch) => {
        const hasSummary = ch.summary && ch.summary.trim();
        const teaser = hasSummary ? ch.summary.split('\n')[0] : 'सारांश पुनर्लेखनका लागि बाँकी छ';
        html += '<li><a class="chapter-row" href="#/canto/' + c.id + '/chapter/' + ch.n + '">' +
          '<span class="cr-no">' + ne(ch.n) + '</span>' +
          '<span class="cr-body"><span class="cr-title">' + esc(ch.title) + '</span><span class="cr-teaser">' + esc(teaser.slice(0, 120)) + (hasSummary ? '…' : '') + '</span></span>' +
          (readStore.isRead(c.id, ch.n) ? '<span class="cr-check">✓</span>' : '') + '</a></li>';
      });
      html += '</ul></div>';
    });
    main.innerHTML = html;
  }

  // ---- समीक्षा-स्थिति ----
  // docs/content-review-manifest.json बाट उत्पन्न अध्याय-आधारित स्थिति। सारांश सामग्री
  // यहाँ दोहोरिँदैन; स्थिति मात्र राखिन्छ। पुनःउत्पादन: node tools/gen-review-status.js
  const REVIEW_STATUS = {
    "01.01": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110172,"v":"संस्करण 110172","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१"},
    "01.02": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110173,"v":"संस्करण 110173","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_२"},
    "01.03": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":369178,"v":"संस्करण 369178","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_३"},
    "01.04": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110175,"v":"संस्करण 110175","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_४"},
    "01.05": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110176,"v":"संस्करण 110176","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_५"},
    "01.06": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110177,"v":"संस्करण 110177","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_६"},
    "01.07": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110178,"v":"संस्करण 110178","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_७"},
    "01.08": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":196197,"v":"संस्करण 196197","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_८"},
    "01.09": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":330834,"v":"संस्करण 330834","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_९"},
    "01.10": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110181,"v":"संस्करण 110181","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१०"},
    "01.11": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110182,"v":"संस्करण 110182","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_११"},
    "01.12": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110183,"v":"संस्करण 110183","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१२"},
    "01.13": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110184,"v":"संस्करण 110184","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१३"},
    "01.14": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110185,"v":"संस्करण 110185","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१४"},
    "01.15": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":364156,"v":"संस्करण 364156","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१५"},
    "01.16": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":148532,"v":"संस्करण 148532","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१६"},
    "01.17": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":313090,"v":"संस्करण 313090","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१७"},
    "01.18": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110189,"v":"संस्करण 110189","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१८"},
    "01.19": {"s":"source_checked","l":"अध्याय-स्तरीय स्रोत-जाँच","r":110190,"v":"संस्करण 110190","u":"https://sa.wikisource.org/wiki/श्रीमद्भागवतपुराणम्/स्कन्धः_१/अध्यायः_१९"}
  };

  function reviewStatusKey(cantoId, chNo) {
    return String(cantoId).padStart(2, '0') + '.' + String(chNo).padStart(2, '0');
  }

  function reviewNoteHtml(cantoId, chNo) {
    const rec = REVIEW_STATUS[reviewStatusKey(cantoId, chNo)];
    if (rec && rec.s === 'source_checked') {
      return '<p class="reader-note checked">यो सारांश स्वीकृत स्रोत (<a href="' + esc(rec.u) + '" rel="noopener">' +
        'संस्कृत विकिस्रोत</a>, ' + esc(rec.v) + ') सँग अध्याय-स्तरमा जाँचिएको छ; ' +
        'श्लोक-दर-श्लोक अनुवाद-जाँच वा स्वतन्त्र सम्पादकीय स्वीकृति भने बाँकी छ।</p>';
    }
    if (rec && rec.s === 'editorially_approved') {
      return '<p class="reader-note checked">यो सारांश स्रोत-जाँच र सम्पादकीय स्वीकृति दुवै पार गरेको छ।</p>';
    }
    return '<p class="reader-note">यो नेपाली सारांश प्रारम्भिक मस्यौदा हो; मूलपाठसँग अध्याय-दर-अध्याय समीक्षा बाँकी छ।</p>';
  }

  function viewChapter(cantoId, chNo) {
    const c = getCanto(cantoId);
    if (!c || !CONTENT[c.id]) { viewCanto(cantoId); return; }
    const ct = CONTENT[c.id];
    const ch = chapterOf(ct, chNo);
    if (!ch) { viewCanto(cantoId); return; }
    renderSidebar({ canto: c.id, chapter: ch.n });

    const theme = (ct.themes || []).find((t) => ch.n >= t.from && ch.n <= t.to);
    const prev = (ct.chapters || []).find((x) => x.n === ch.n - 1);
    const next = (ct.chapters || []).find((x) => x.n === ch.n + 1);

    let html = '<div class="crumbs"><a href="#/">गृहपृष्ठ</a> › <a href="#/canto/' + c.id + '">' + c.name + '</a>' +
      (theme ? ' › ' + esc(theme.title) : '') + ' › अध्याय ' + ne(ch.n) + '</div>';

    html += '<article class="reader">';
    html += '<div class="reader-kicker">' + c.name + ' · अध्याय ' + ne(ch.n) + '</div>';
    html += '<h1>' + esc(ch.title) + '</h1>';

    if (ch.shloka) {
      html += '<div class="shloka"><span class="sa">' + esc(ch.shloka.sa).replace(/\n/g, '<br>') + '</span>' +
        '<span class="np"><b>भावार्थ :</b> ' + esc(ch.shloka.np) + '</span></div>';
    }

    html += '<h2>विस्तृत सारांश</h2>';
    if (ch.summary && ch.summary.trim()) {
      html += reviewNoteHtml(c.id, ch.n);
      ch.summary.split(/\n\n+/).forEach((p) => {
        if (p.trim()) html += '<p>' + esc(p.trim()) + '</p>';
      });
    } else {
      html += '<p class="empty">यस अध्यायको सारांश पुनर्लेखनका लागि बाँकी छ।</p>';
    }

    if (ch.points && ch.points.length) {
      html += '<h2>मुख्य विषयहरू</h2><ul class="points">';
      ch.points.forEach((p) => { html += '<li>' + esc(p) + '</li>'; });
      html += '</ul>';
    }

    const read = readStore.isRead(c.id, ch.n);
    html += '<div class="reader-actions">';
    if (prev) html += '<a class="btn ghost" href="#/canto/' + c.id + '/chapter/' + prev.n + '">← अ ' + ne(prev.n) + ': ' + esc(prev.title.slice(0, 26)) + '</a>';
    if (next) html += '<a class="btn" href="#/canto/' + c.id + '/chapter/' + next.n + '">अ ' + ne(next.n) + ': ' + esc(next.title.slice(0, 26)) + ' →</a>';
    if (!next && c.id < 12) html += '<a class="btn" href="#/canto/' + (c.id + 1) + '">' + CANTO_META[c.id].name + ' →</a>';
    html += '<label class="read-toggle"><input type="checkbox" id="readChk" ' + (read ? 'checked' : '') + '> पढिसकेँ ✓</label>';
    html += '</div></article>';
    main.innerHTML = html;

    document.getElementById('readChk').addEventListener('change', (e) => {
      readStore.toggle(c.id, ch.n);
      renderSidebar({ canto: c.id, chapter: ch.n });
    });
    window.scrollTo({ top: 0 });
    // साइडबारमा सक्रिय अध्याय देखिने
    const activeLink = sidebar.querySelector('.nav-ch.active');
    if (activeLink) activeLink.scrollIntoView({ block: 'center' });
  }

  function viewSearch(q) {
    renderSidebar({});
    q = (q || '').trim();
    let html = '<h1 class="section-h">खोजीपरिणाम' + (q ? ' — “' + esc(q) + '”' : '') + '</h1>';
    if (!q) { main.innerHTML = html + '<p class="empty">केही लेख्नुहोस् — नाम, घटना वा विषय।</p>'; return; }
    let found = 0;
    CANTO_META.forEach((c) => {
      const ct = CONTENT[c.id];
      if (!ct || !ct.chapters) return;
      ct.chapters.forEach((ch) => {
        const hay = ch.title + ' ' + ch.summary + ' ' + (ch.points || []).join(' ');
        if (hay.toLowerCase().includes(q.toLowerCase())) {
          found++;
          const idx = hay.toLowerCase().indexOf(q.toLowerCase());
          const snip = hay.slice(Math.max(0, idx - 70), idx + 150);
          html += '<a class="search-result" href="#/canto/' + c.id + '/chapter/' + ch.n + '">' +
            '<span class="sr-loc">' + c.name + ' · अध्याय ' + ne(ch.n) + '</span><br>' +
            '<span class="sr-title">' + highlight(ch.title, q) + '</span>' +
            '<span class="sr-snippet">…' + highlight(snip, q) + '…</span></a>';
        }
      });
    });
    if (!found) html += '<p class="empty">“' + esc(q) + '” भेटिएन। अर्को शब्द प्रयास गर्नुहोस् — जस्तै: प्रह्लाद, भीष्म, वराह, गजेन्द्र।</p>';
    else html += '<p class="search-count">' + ne(found) + ' वटा अध्यायमा भेटियो।</p>';
    main.innerHTML = html;
  }

  // ---- राउटर ----
  function route() {
    const raw = location.hash.replace(/^#\/?/, '');
    // मार्ग (path) र प्रश्न-शृङ्खला (query) छुट्याउनुपर्छ : नत्र 'search?q=…' एउटै
    // टुक्रा बन्छ र खोजी-पाटो कहिल्यै खुल्दैन।
    const qIdx = raw.indexOf('?');
    const pathPart = qIdx < 0 ? raw : raw.slice(0, qIdx);
    const queryPart = qIdx < 0 ? '' : raw.slice(qIdx + 1);
    let parts;
    try { parts = decodeURIComponent(pathPart).split('/').filter(Boolean); }
    catch (e) { parts = pathPart.split('/').filter(Boolean); }
    if (!parts.length) return viewHome();
    if (parts[0] === 'canto' && parts[1] && parts[2] === 'chapter' && parts[3]) return viewChapter(+parts[1], +parts[3]);
    if (parts[0] === 'canto' && parts[1]) return viewCanto(+parts[1]);
    if (parts[0] === 'search') {
      const m = queryPart.match(/(?:^|&)q=([^&]*)/);
      let q = '';
      if (m) { try { q = decodeURIComponent(m[1]); } catch (e) { q = m[1]; } }
      return viewSearch(q);
    }
    viewHome();
  }

  // ---- आरम्भ कार्य ----
  document.getElementById('menuBtn').addEventListener('click', () => {
    sidebar.classList.toggle('open');
    document.getElementById('backdrop').classList.toggle('show', sidebar.classList.contains('open'));
  });
  document.getElementById('backdrop').addEventListener('click', () => {
    sidebar.classList.remove('open');
    document.getElementById('backdrop').classList.remove('show');
  });
  sidebar.addEventListener('click', (e) => {
    if (e.target.closest('a') && window.innerWidth <= 900) {
      sidebar.classList.remove('open');
      document.getElementById('backdrop').classList.remove('show');
    }
  });

  const si = document.getElementById('searchInput');
  const doSearch = () => {
    const q = si.value.trim();
    if (q) location.hash = '#/search?q=' + encodeURIComponent(q);
  };
  si.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  document.getElementById('searchBtn').addEventListener('click', doSearch);

  const fsClasses = ['', 'fs-big', 'fs-xl'];
  let fsIdx = Number(localStorage.getItem('sb-fs') || 0);
  if (!Number.isInteger(fsIdx) || fsIdx < 0 || fsIdx >= fsClasses.length) fsIdx = 0;
  const applyFs = () => {
    document.body.classList.remove('fs-big', 'fs-xl');
    if (fsClasses[fsIdx]) document.body.classList.add(fsClasses[fsIdx]);
    localStorage.setItem('sb-fs', fsIdx);
  };
  document.getElementById('fontPlus').addEventListener('click', () => { if (fsIdx < 2) { fsIdx++; applyFs(); } });
  document.getElementById('fontMinus').addEventListener('click', () => { if (fsIdx > 0) { fsIdx--; applyFs(); } });
  applyFs();

  // ट्यापबारको वास्तविक उचाइ साइडबार र ब्याकड्रपको लागि CSS variable मा उतार्नुहोस् —
  // मोबाइलमा ट्यापबार दुई पाटी बन्दा पनि साइडबार र ब्याकड्रप ठीक ठाउँमा रहन्छन्।
  const topbar = document.querySelector('.topbar');
  const syncTopbar = () => {
    if (topbar) document.documentElement.style.setProperty('--topbar-h', topbar.offsetHeight + 'px');
  };
  syncTopbar();
  window.addEventListener('resize', syncTopbar);
  window.addEventListener('load', syncTopbar);
  if (topbar && 'ResizeObserver' in window) new ResizeObserver(syncTopbar).observe(topbar, { box: 'border-box' });

  // Esc ले mobile साइडबार बन्द गर्ने (ट्याप र स्क्रीन-रेडर support)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      document.getElementById('backdrop').classList.remove('show');
    }
  });

  window.addEventListener('hashchange', route);
  route();
})();
