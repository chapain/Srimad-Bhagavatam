'use strict';

// npm install --prefix /tmp/sb-test puppeteer-core @sparticuz/chromium
// NODE_PATH=/tmp/sb-test/node_modules node tests/mobile-browser.js
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const puppeteer = require('puppeteer-core');
const chromiumModule = require('@sparticuz/chromium');
const chromium = chromiumModule.default || chromiumModule;

const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: true });
  try {
    const page = await browser.newPage();
    const url = `http://127.0.0.1:${server.address().port}/`;
    for (const width of [320, 360, 390, 480, 700, 701, 900]) {
      await page.setViewport({ width, height: 800 });
      await page.goto(url, { waitUntil: 'load' });
      const layout = await page.evaluate(() => {
        const rect = selector => {
          const r = document.querySelector(selector).getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
        };
        return {
          menu: rect('#menuBtn'), brand: rect('.brand'), minus: rect('#fontMinus'), plus: rect('#fontPlus'),
          input: rect('#searchInput'), search: rect('#searchBtn'), bar: rect('.topbar'),
          scrollWidth: document.documentElement.scrollWidth,
          barHeight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h'))
        };
      });
      for (const name of ['menu', 'brand', 'minus', 'plus', 'input', 'search']) {
        const r = layout[name];
        assert(r.width > 0 && r.left >= 0 && r.right <= width + 0.5, `${width}: ${name} outside viewport`);
      }
      assert(layout.minus.width >= 44 && layout.plus.width >= 44 && layout.minus.height >= 44 && layout.plus.height >= 44, `${width}: font targets too small`);
      assert(layout.scrollWidth <= width, `${width}: horizontal overflow`);
      assert.strictEqual(layout.barHeight, Math.round(layout.bar.height), `${width}: incorrect topbar height`);
      if (width <= 700) {
        assert(layout.menu.top === layout.minus.top && layout.minus.top === layout.plus.top, `${width}: first row split`);
        assert(layout.input.top >= layout.minus.bottom && layout.input.top === layout.search.top, `${width}: search not on its own row`);
        assert(layout.input.width > 100, `${width}: search input too narrow`);
      }
    }

    await page.setViewport({ width: 320, height: 800 });
    await page.goto(url + '#/canto/1/chapter/1', { waitUntil: 'load' });
    const selectors = ['.reader p', '.points li', '.shloka .sa', '.shloka .np', '.reader h2'];
    const sizes = () => page.evaluate(selectors => selectors.map(s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize)), selectors);
    const normal = await sizes();
    await page.click('#fontPlus');
    const big = await sizes();
    await page.click('#fontPlus');
    const xl = await sizes();
    for (let i = 0; i < selectors.length; i++) {
      assert(big[i] > normal[i] && xl[i] > big[i], `${selectors[i]} did not grow at each step`);
    }
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('sb-fs')), '2');
    const zoomLayout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      reader: document.querySelector('.reader').getBoundingClientRect().right,
      viewport: innerWidth
    }));
    assert(zoomLayout.scrollWidth <= zoomLayout.viewport && zoomLayout.reader <= zoomLayout.viewport, 'zoom caused horizontal overflow');
    await page.click('#fontPlus');
    assert.deepStrictEqual(await sizes(), xl, 'maximum font size exceeded');
    await page.reload({ waitUntil: 'load' });
    assert.deepStrictEqual(await sizes(), xl, 'font size not restored on reload');
    await page.click('#fontMinus');
    assert.deepStrictEqual(await sizes(), big, 'font size did not shrink');
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('sb-fs')), '1');

    await page.click('#menuBtn');
    const drawer = await page.evaluate(() => ({
      top: parseFloat(getComputedStyle(document.querySelector('#sidebar')).top),
      backdrop: parseFloat(getComputedStyle(document.querySelector('#backdrop')).top),
      bar: document.querySelector('.topbar').offsetHeight
    }));
    assert.strictEqual(drawer.top, drawer.bar);
    assert.strictEqual(drawer.backdrop, drawer.bar);
    await page.click('#menuBtn');
    await page.evaluate(() => { document.querySelector('.topbar').style.paddingBottom = '25px'; });
    await page.waitForFunction(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) === document.querySelector('.topbar').offsetHeight);

    await page.type('#searchInput', 'प्रह्लाद');
    await page.click('#searchBtn');
    await page.waitForSelector('.search-result');
    assert((await page.$$('.search-result')).length > 0, 'search returned no results');
    console.log('Mobile browser layout, font sizing, persistence, drawer and search checks passed.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
