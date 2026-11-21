const {chromium, devices} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({...devices['Pixel 7']}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(900);
  const names = await p.evaluate(() => [...document.querySelectorAll('.idx button')].map(b => b.textContent.trim()));
  console.log(names.length, names.join(' | '));
  for (let i = 0; i < names.length; i++) {
    await p.evaluate(i => document.querySelectorAll('.idx button')[i].click(), i); await p.waitForTimeout(500);
    await p.screenshot({path: `sq/s${String(i).padStart(2, '0')}.png`});
    // bottom of the screen too
    await p.evaluate(() => { const l = [...document.querySelectorAll('#phone .layer')].pop(); const s = l && (l.querySelector('.scroll') || l); if (s) { s.scrollTop = 1e6; s.dispatchEvent(new Event('scroll')); } }); await p.waitForTimeout(400);
    await p.screenshot({path: `sq/s${String(i).padStart(2, '0')}b.png`});
  }
  console.log(errs.join(' | ') || 'no errors');
  await ctx.close();
  const c2 = await b.newContext({viewport: {width: 1100, height: 950}}); const q = await c2.newPage();
  await q.goto('http://127.0.0.1:8765/index.html'); await q.waitForTimeout(700); await q.screenshot({path: 'sq/desktop.png'});
  await b.close();
})();
