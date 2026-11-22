const {chromium, devices} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({...devices['iPhone 13']}); const p = await ctx.newPage();
  await p.addInitScript(() => { window.__L = () => { const l = [...document.querySelectorAll('#phone .layer')].pop(); return [l, l.querySelector('.scroll')]; }; });
  await p.goto('http://127.0.0.1:8765/index.html');
  for (const home of ['1', '2', '3']) {
    await p.evaluate(h => { localStorage.clear(); localStorage.setItem('wp-final-cfg', JSON.stringify({home: h})); }, home); await p.reload(); await p.waitForTimeout(1200);
    for (const left of [0, .25, .5, 1]) {
      const y = await p.evaluate(left => { const [l, s] = window.__L(); const r = l.querySelector('.rail.snap'); s.scrollTop = 0; r.style.scrollSnapType = 'none'; r.scrollLeft = -(r.scrollWidth - r.clientWidth) * left; return r.getBoundingClientRect().top; }, left);
      await p.waitForTimeout(300);
      await p.screenshot({path: `v20/hero_h${home}_${left}.png`, clip: {x: 0, y: y - 30, width: 390, height: 80}});
    }
  }
  await b.close();
})();
