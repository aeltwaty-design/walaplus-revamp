const {chromium, devices} = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext({...devices[dev]}); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(900);
    const tag = dev.replace(/\s/g, '');
    const info = () => p.evaluate(() => { const r = document.querySelector('#phone').getBoundingClientRect(); const rail = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.rail'); const dots = [...document.querySelectorAll('#phone .cdots i')].map(i => i.className ? 1 : 0).join('');
      return `phone ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} vp ${innerWidth}x${innerHeight} full=${document.body.classList.contains('full')} rail sl=${rail && Math.round(rail.scrollLeft)} dots=${dots} docScroll=${document.documentElement.scrollWidth}x${document.documentElement.scrollHeight}`; });
    console.log(dev, 't0', await info());
    await p.screenshot({path: `mb/${tag}_0.png`});
    await p.waitForTimeout(4600); console.log(dev, 't4.6', await info());
    await p.waitForTimeout(4200); console.log(dev, 't8.8', await info());
    await p.screenshot({path: `mb/${tag}_1.png`});
    // controls
    await p.tap('#ctl'); await p.waitForTimeout(300); await p.screenshot({path: `mb/${tag}_2.png`});
    await p.evaluate(() => [...document.querySelectorAll('#c-home button')][2].click()); await p.waitForTimeout(600);
    console.log(dev, 'after pick', await p.evaluate(() => document.body.className), await info());
    await p.screenshot({path: `mb/${tag}_3.png`});
    // stores
    await p.evaluate(() => document.querySelector('#phone .hs[data-act="tab:stores"]').click()); await p.waitForTimeout(800);
    const sb = () => p.evaluate(() => { const l = [...document.querySelectorAll('#phone .layer')].pop(); const bn = l.querySelector('.st-banners'); return Math.round(bn.scrollLeft) + ' dots ' + [...l.querySelectorAll('.st-dots i')].map(i => i.classList.contains('on') ? 1 : 0).join(''); });
    console.log(dev, 'stores t0', await sb()); await p.waitForTimeout(4500); console.log(dev, 'stores t4.5', await sb());
    await p.screenshot({path: `mb/${tag}_4.png`});
    // scroll stores to bottom area: check tab bar and pill on screen
    await p.evaluate(() => { const s = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll'); s.scrollTop = 1400; s.dispatchEvent(new Event('scroll')); }); await p.waitForTimeout(600);
    await p.screenshot({path: `mb/${tag}_5.png`});
    console.log(dev, errs.join(' | ') || 'no errors');
    await ctx.close();
  }
  // desktop unchanged
  const ctx = await b.newContext({viewport: {width: 1100, height: 950}}); const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(700);
  console.log('desktop', await p.evaluate(() => document.body.className + ' ' + JSON.stringify(document.querySelector('#phone').getBoundingClientRect())));
  await p.screenshot({path: 'mb/desktop.png'});
  await b.close();
})();
