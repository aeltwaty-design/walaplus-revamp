const {chromium, devices} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({...devices['iPhone 13'], colorScheme: 'dark'}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__L = () => { const l = [...document.querySelectorAll('#phone .layer')].pop(); return [l, l.querySelector('.scroll')]; }; });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(1200);
  for (const home of ['1', '2', '3']) {
    await p.evaluate(h => localStorage.setItem('wp-final-cfg', JSON.stringify({home: h})), home); await p.reload(); await p.waitForTimeout(1500);
    for (const [tag, pick] of [['r8', '_r8_bg'], ['r0', '_r0.']]) {
      for (const left of [0, .5, 1]) {
        await p.evaluate(([pick, left]) => { const [l, s] = window.__L(); const r = [...l.querySelectorAll('.rail')].find(x => (x.style.background + x.firstChild.style.backgroundImage).includes(pick));
          s.scrollTop = Math.max(0, r.getBoundingClientRect().top - l.getBoundingClientRect().top + s.scrollTop - 250); r.style.scrollSnapType = 'none'; r.scrollLeft = -(r.scrollWidth - r.clientWidth) * left; s.dispatchEvent(new Event('scroll')); }, [pick, left]);
        await p.waitForTimeout(350);
        await p.screenshot({path: `v20/${tag}_h${home}_${left}.png`, clip: {x: 0, y: 150, width: 390, height: 330}});
      }
    }
  }
  // all rails: gap at the far end
  const gaps = await p.evaluate(() => { const [l] = window.__L(); return [...l.querySelectorAll('.rail:not(.mq)')].map(r => { r.style.scrollSnapType = 'none'; r.scrollLeft = -(r.scrollWidth - r.clientWidth); const hs = [...r.querySelectorAll('.hs')]; return Math.round(Math.min(...hs.map(h => h.getBoundingClientRect().left)) - r.getBoundingClientRect().left); }); });
  console.log('left gap at end of each rail:', gaps.join(' '));
  // hero carousel snap at the end (real swipe)
  await p.reload(); await p.waitForTimeout(1500);
  const hero = await p.evaluate(() => { const [l] = window.__L(); const r = l.querySelector('.rail.snap'); const b = r.getBoundingClientRect(); return [b.y + b.height / 2]; });
  for (let k = 0; k < 3; k++) { await p.mouse.move(300, hero[0]); await p.mouse.down(); await p.mouse.move(40, hero[0], {steps: 8}); await p.mouse.up(); await p.waitForTimeout(700); }
  await p.screenshot({path: 'v20/hero_end.png', clip: {x: 0, y: 60, width: 390, height: 300}});
  // sort and filter sheets on Stores, dark mode
  await p.evaluate(() => localStorage.setItem('wp-final-cfg', JSON.stringify({home: '1'}))); await p.reload(); await p.waitForTimeout(1200);
  await p.evaluate(() => act_('tab', top_().ctx)); await p.waitForTimeout(300);
  console.log(errs.join(' | ') || 'no errors'); await b.close();
})();
