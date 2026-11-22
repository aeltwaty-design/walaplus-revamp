const {chromium} = require('playwright');
const state = p => p.evaluate(() => { const c = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.cv'); if (!c) return 'no cover';
  const on = [...c.querySelectorAll('.cv-ph')].findIndex(x => x.classList.contains('on'));
  const w = [...c.querySelectorAll('.cv-seg b')].map(b => Math.round(parseFloat(b.style.width)));
  return on + ' [' + w.join(',') + ']'; });
const top = p => p.evaluate(() => [...document.querySelectorAll('#phone .layer')].length + ' layers, crumb: ' + document.querySelector('#crumb').textContent);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(1000);
  for (const lab of ['C1 · offers', 'C1 · one offer', 'C1 · full']) {
    await p.evaluate(lab => [...document.querySelectorAll('.idx button')].find(b => b.textContent.includes(lab)).click(), lab); await p.waitForTimeout(700);
    console.log(lab, 'cover:', await state(p));
  }
  console.log('t=0.7s', await state(p)); await p.waitForTimeout(1500); console.log('t=2.2s', await state(p));
  await p.waitForTimeout(1200); console.log('t=3.4s (should be photo 1)', await state(p));
  await p.screenshot({path: 'cv/auto1.png', clip: {x: 0, y: 0, width: 390, height: 360}});
  await p.waitForTimeout(3000); console.log('t=6.4s (photo 2)', await state(p));
  // tap left half -> next
  await p.touchscreen.tap(100, 180); await p.waitForTimeout(200); console.log('tap left ->', await state(p), '|', await top(p));
  // tap right half -> previous
  await p.touchscreen.tap(290, 180); await p.waitForTimeout(200); console.log('tap right ->', await state(p));
  await p.touchscreen.tap(290, 180); await p.touchscreen.tap(290, 180); await p.waitForTimeout(200); console.log('tap right x2 (wraps back) ->', await state(p));
  // swipe via CDP touch
  const cdp = await ctx.newCDPSession(p);
  const touch = async pts => { await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: pts[0][0], y: pts[0][1]}]});
    for (const q of pts.slice(1)) { await p.waitForTimeout(16); await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: q[0], y: q[1]}]}); }
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []}); };
  const s0 = await state(p);
  await touch(Array.from({length: 8}, (_, i) => [100 + i * 20, 200])); await p.waitForTimeout(200); console.log('swipe right (next):', s0, '->', await state(p));
  await touch(Array.from({length: 8}, (_, i) => [300 - i * 20, 200])); await p.waitForTimeout(200); console.log('swipe left (back) ->', await state(p));
  // hold pauses
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 200, y: 200}]});
  const h0 = await state(p); await p.waitForTimeout(1500); const h1 = await state(p);
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []}); await p.waitForTimeout(100);
  console.log('hold 1.5s paused:', h0, h1, '| after release same photo:', await state(p));
  // vertical swipe scrolls the page
  const st0 = await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll').scrollTop);
  await touch(Array.from({length: 10}, (_, i) => [200, 280 - i * 18])); await p.waitForTimeout(500);
  const st1 = await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll').scrollTop);
  console.log('vertical swipe scrolls:', st0, '->', st1, 'cover', await state(p));
  await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll').scrollTop = 0); await p.waitForTimeout(300);
  // buttons still work
  await p.touchscreen.tap(40, 84); await p.waitForTimeout(500); console.log('fav tap ->', await p.evaluate(() => document.querySelector('#toast').textContent + ' ' + document.querySelector('#toast').className));
  await p.touchscreen.tap(81, 84); await p.waitForTimeout(500); console.log('share tap ->', await top(p), await p.evaluate(() => document.querySelector('#toast').textContent));
  await p.evaluate(() => [...document.querySelectorAll('.idx button')].find(b => b.textContent.includes('C1 · full')).click()); await p.waitForTimeout(800);
  // pause when another screen is on top: open offer (tap a hotspot lower in the page)
  const before = await state(p);
  await p.evaluate(() => { const h = [...[...document.querySelectorAll('#phone .layer')].pop().querySelectorAll('.hs')].find(e => e.dataset.act === 'offer'); h.click(); }); await p.waitForTimeout(4000);
  const under = await p.evaluate(() => { const c = document.querySelector('#phone .cv'); return [...c.querySelectorAll('.cv-ph')].findIndex(x => x.classList.contains('on')); });
  console.log('paused under the offer sheet:', before, '-> still photo', under, '|', await top(p));
  await p.touchscreen.tap(355, 84); await p.waitForTimeout(600);
  console.log(errs.join(' | ') || 'no errors'); await b.close();
})();
