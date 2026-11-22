const {chromium, devices} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({...devices['iPhone 13']}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(1200);
  const lay = 0;
  await p.addInitScript(() => { window.__L = () => { const l = [...document.querySelectorAll('#phone .layer')].pop(); return [l, l.querySelector('.scroll')]; }; });
  await p.reload(); await p.waitForTimeout(800);
  for (const home of ['1', '2', '3']) {
    await p.evaluate(h => localStorage.setItem('wp-final-cfg', JSON.stringify({home: h})), home); await p.reload(); await p.waitForTimeout(1500);
    // food offers rail at three scroll positions
    for (const left of [0, .5, 1]) {
      await p.evaluate(([lay, left]) => { const [l, s] = window.__L(); const r = [...l.querySelectorAll('.rail')].find(x => x.style.background.includes('_r6_bg'));
        s.scrollTop = r.getBoundingClientRect().top - l.getBoundingClientRect().top + s.scrollTop - 300; r.scrollLeft = -(r.scrollWidth - r.clientWidth) * left; s.dispatchEvent(new Event('scroll')); }, [lay, left]);
      await p.waitForTimeout(400);
      await p.screenshot({path: `v19/r6_h${home}_${left}.png`, clip: {x: 0, y: 200, width: 390, height: 300}});
    }
    // Today's pick back
    await p.evaluate(lay => { const [l, s] = window.__L(); const f = l.querySelector('.flip'); s.scrollTop += f.getBoundingClientRect().top - 150; s.dispatchEvent(new Event('scroll')); }, lay);
    await p.waitForTimeout(400);
    const fb = await p.evaluate(() => { const r = document.querySelector('#phone .flip').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
    await p.touchscreen.tap(fb[0] + 200, fb[1] + 200); await p.waitForTimeout(1400);
    await p.screenshot({path: `v19/tp_h${home}.png`, clip: {x: 0, y: Math.max(0, fb[1] - 20), width: 390, height: 440}});
    // reveal
    await p.touchscreen.tap(fb[0] + 200, fb[1] + 14 + 337); await p.waitForTimeout(1800);
    await p.screenshot({path: `v19/tps_h${home}.png`});
    if (home === '3') {
      await p.evaluate(() => document.querySelector('#b-reset').click()); await p.waitForTimeout(800);
      await p.evaluate(lay => { const [l, s] = window.__L(); s.scrollTop = 0; }, lay);
      await p.screenshot({path: `v19/bal_h3_off.png`, clip: {x: 0, y: 60, width: 390, height: 320}});
      await p.touchscreen.tap(195, 140); await p.waitForTimeout(900);
      await p.screenshot({path: `v19/bal_h3_on.png`, clip: {x: 0, y: 60, width: 390, height: 360}});
    }
  }
  console.log(errs.join(' | ') || 'no errors'); await b.close();
})();
