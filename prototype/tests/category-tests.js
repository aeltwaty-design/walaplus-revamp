const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(1000);
  for (const v of ['3', '1']) {
    await p.evaluate(v => [...document.querySelectorAll('#c-home button')][+v - 1].click(), v); await p.waitForTimeout(900);
    const y = v === '3' ? 1773 : 1799;
    await p.evaluate(y => { const s = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll'); s.scrollTop = y - 300; }, y);
    // freeze at chosen times: pause and set negative delays
    const shot = async (t, name) => {
      await p.evaluate(t => { document.querySelectorAll('.mq-track').forEach(tr => { tr.style.animationName = 'none'; void tr.offsetWidth; tr.style.animationName = ''; tr.style.animationPlayState = 'paused'; tr.style.animationDelay = (-t) + 's'; }); }, t);
      await p.waitForTimeout(150);
      const box = await p.evaluate(() => { const r = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.rail.mq').getBoundingClientRect(); return {x: r.x, y: r.y - 4, width: r.width, height: r.height + 8}; });
      await p.screenshot({path: `mq/h${v}_${name}.png`, clip: box});
    };
    await shot(0, 't0'); await shot(8, 't8'); await shot(26.5, 't26'); await shot(27.3, 't27');
    if (v === '1') {
      await p.evaluate(() => document.querySelectorAll('.mq-track').forEach(tr => { tr.style.animationPlayState = ''; tr.style.animationDelay = '0s'; }));
      const durs = await p.evaluate(() => [...document.querySelectorAll('.mq-track')].map(t => t.style.animationDuration + ' ' + t.style.getPropertyValue('--p')));
      console.log('tracks', durs.join(' | '));
      // tap a chip: should open Stores
      await p.waitForTimeout(500);
      const hs = await p.evaluate(() => { const h = [...document.querySelectorAll('.rail.mq .hs')].find(e => { const r = e.getBoundingClientRect(); return r.left > 20 && r.right < 370; }); const r = h.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2}; });
      await p.mouse.click(hs.x, hs.y); await p.waitForTimeout(900);
      console.log('after tap', await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().className + ' ' + (document.querySelector('#phone .st-head') ? 'stores' : 'not stores')));

      await p.evaluate(() => document.querySelector('#phone .hs[data-act="tab:home"]')?.click()); await p.waitForTimeout(800);
    }
  }
  console.log(errs.join(' | ') || 'no errors');
  await b.close();
})();
