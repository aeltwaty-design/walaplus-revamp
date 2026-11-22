const {chromium, devices} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({...devices['iPhone 13'], colorScheme: 'dark'}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__L = () => { const l = [...document.querySelectorAll('#phone .layer')].pop(); return [l, l.querySelector('.scroll')]; }; });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('wp-final-cfg', JSON.stringify({home: '1'})); }); await p.reload(); await p.waitForTimeout(1500);
  const st = await p.evaluate(async () => { const [l] = window.__L(); const rr = l.querySelector('.rail.snap'); rr.scrollTo({left: -708, behavior: 'smooth'}); await new Promise(r => setTimeout(r, 1200)); return [rr.scrollLeft, rr.scrollWidth - rr.clientWidth]; });
  console.log('hero scrollLeft, max:', st.join(' '));
  await p.screenshot({path: 'v20/hero_end_h1.png', clip: {x: 0, y: 90, width: 390, height: 230}});
  // Stores: sort and filter sheets in dark mode
  await p.evaluate(() => resetTo([{t: 'home'}, {t: 'stores', lens: 's1'}])); await p.waitForTimeout(800);
  const opened = await p.evaluate(() => { const [l] = window.__L(); const el = l.querySelector('[data-s="sort"]'); if (el) { el.click(); return 'sort'; } return null; });
  await p.waitForTimeout(700);
  console.log('sort opener:', opened);
  await p.screenshot({path: 'v20/sort_dark.png'});
  await p.evaluate(() => { const x = document.querySelector('#phone .e-link'); if (x) x.click(); }); await p.waitForTimeout(600);
  await p.evaluate(() => { const [l] = window.__L(); const el = l.querySelector('[data-s="filter"]'); if (el) el.click(); }); await p.waitForTimeout(700);
  await p.screenshot({path: 'v20/filter_dark.png'});
  console.log(errs.join(' | ') || 'no errors'); await b.close();
})();
