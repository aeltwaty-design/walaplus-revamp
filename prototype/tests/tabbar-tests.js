const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const out = process.argv[2] || 'pill';
  for (const H of [700, 760, 900]) {
    const ctx = await b.newContext({viewport: {width: 390, height: H}, deviceScaleFactor: 2.77, isMobile: true, hasTouch: true}); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(800);
    await p.evaluate(() => document.querySelector('#phone .hs[data-act="tab:stores"]').click()); await p.waitForTimeout(800);
    await p.screenshot({path: `${out}/st_${H}.png`, clip: {x: 0, y: H - 200, width: 390, height: 200}});
    await p.evaluate(() => { const s = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll'); s.scrollTop = 1400; s.dispatchEvent(new Event('scroll')); }); await p.waitForTimeout(500);
    await p.screenshot({path: `${out}/st_${H}_s.png`, clip: {x: 0, y: H - 200, width: 390, height: 200}});
    // home tab
    await p.evaluate(() => document.querySelector('#phone .hs[data-act="tab:home"]')?.click()); await p.waitForTimeout(600);
    await p.screenshot({path: `${out}/home_${H}.png`, clip: {x: 0, y: H - 200, width: 390, height: 200}});
    const r = await p.evaluate(() => { const l = [...document.querySelectorAll('#phone .layer')]; return l.length + ' ' + document.querySelector('#phone').getBoundingClientRect().height; });
    console.log(H, r, errs.join(' | ') || 'ok');
    await ctx.close();
  }
  await b.close();
})();
