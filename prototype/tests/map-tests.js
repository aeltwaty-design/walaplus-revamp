const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const out = process.argv[2] || 'map';
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(1200);
  for (const v of ['1', '2', '3']) {
    if (v !== '1') { await p.evaluate(v => [...document.querySelectorAll('#c-home button')][+v - 1].click(), v); await p.waitForTimeout(900); }
    const y = v === '3' ? 963 : 989;
    await p.evaluate(y => { const s = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll'); s.scrollTop = y - 200; }, y); await p.waitForTimeout(400);
    const box = await p.evaluate(() => { const r = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.hm').getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; });
    for (let k = 0; k < (v === '1' ? 6 : 2); k++) {
      await p.screenshot({path: `${out}/h${v}_${k}.png`, clip: box});
      await p.waitForTimeout(1300);
    }
  }
  console.log(errs.join(' | ') || 'no errors');
  await b.close();
})();
