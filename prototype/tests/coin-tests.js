const {chromium, devices} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({...devices['iPhone 13']}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('wp-final-cfg', JSON.stringify({home: '1'})); }); await p.reload(); await p.waitForTimeout(1200);
  for (const home of ['1', '3']) {
    await p.evaluate(h => localStorage.setItem('wp-final-cfg', JSON.stringify({home: h})), home); await p.reload(); await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const c = [...document.querySelectorAll('#phone .coin-fx')].map(x => x.getBoundingClientRect()).find(x => x.width > 0 && x.top > 0); return [c.x, c.y]; });
    // pause all animations, then step through the 5 s cycle
    for (const t of [3000, 4000, 4300, 4450, 4600, 4750]) {
      await p.evaluate(t => document.getAnimations().forEach(a => { if (a.animationName && a.animationName.startsWith('coin')) { a.pause(); a.currentTime = t; } }), t);
      await p.screenshot({path: `v20/coin_h${home}_${t}.png`, clip: {x: r[0] - 10, y: r[1] - 10, width: 52, height: 52}});
    }
    if (home === '3') { await p.touchscreen.tap(195, 140); await p.waitForTimeout(800);
      await p.evaluate(() => document.getAnimations().forEach(a => { if (a.animationName && a.animationName.startsWith('coin')) { a.pause(); a.currentTime = 4450; } }));
      const c = await p.evaluate(() => { const x = document.querySelector('#phone .bal .coin-fx').getBoundingClientRect(); return [x.x, x.y]; });
      await p.screenshot({path: `v20/coin_h3_open.png`, clip: {x: c[0] - 10, y: c[1] - 10, width: 52, height: 52}}); }
  }
  console.log(errs.join(' | ') || 'no errors'); await b.close();
})();
