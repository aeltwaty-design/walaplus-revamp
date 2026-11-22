const {chromium} = require('playwright');
const tx = p => p.evaluate(() => [...[...document.querySelectorAll('#phone .layer')].pop().querySelectorAll('.mq-track')].map(t => Math.round(10 * +((t.style.transform.match(/-?[\d.]+/) || [0])[0])) / 10));
const railBox = p => p.evaluate(() => { const r = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.rail.mq').getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; });
const topIs = p => p.evaluate(() => document.querySelector('#phone .st-head') ? 'stores' : 'home');
(async () => {
  const b = await chromium.launch();
  // ---- desktop mouse (framed view) ----
  {
    const ctx = await b.newContext({viewport: {width: 1280, height: 800}}); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload(); await p.waitForTimeout(1000);
    await p.evaluate(() => { const s = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll'); s.scrollTop = 1500; }); await p.waitForTimeout(300);
    const a = await tx(p); await p.waitForTimeout(1000); const c = await tx(p);
    console.log('mouse auto 1s', a, '->', c);
    const r = await railBox(p); const y1 = r.y + r.h * .27, y2 = r.y + r.h * .75;
    // fast flick left on row 1
    await p.mouse.move(r.x + 300 * r.w / 390, y1); await p.mouse.down();
    for (let i = 1; i <= 8; i++) { await p.mouse.move(r.x + (300 - i * 25) * r.w / 390, y1); await p.waitForTimeout(16); }
    const d0 = await tx(p); await p.mouse.up();
    console.log('after flick left (row1 moved ~-200 phone px)', d0, 'scale', r.w / 390);
    console.log('top after flick (should be home):', await topIs(p));
    await p.waitForTimeout(300); const e1 = await tx(p); await p.waitForTimeout(2700); const e2 = await tx(p); await p.waitForTimeout(1000); const e3 = await tx(p);
    console.log('momentum then slow, row1 keeps going left:', d0[0], e1[0], e2[0], e3[0], '| last 1s delta', (e3[0] - e2[0]).toFixed(1), '(mod period)');
    console.log('row2 untouched keeps right:', e2[1], e3[1]);
    // slow drag right on row 2, release slowly
    await p.mouse.move(r.x + 100 * r.w / 390, y2); await p.mouse.down();
    for (let i = 1; i <= 20; i++) { await p.mouse.move(r.x + (100 + i * 4) * r.w / 390, y2); await p.waitForTimeout(30); }
    await p.waitForTimeout(250); await p.mouse.up();
    const f1 = await tx(p); await p.waitForTimeout(1000); const f2 = await tx(p);
    console.log('row2 after slow drag right, still right:', f1[1], '->', f2[1]);
    // drag row 1 right, slow -> direction flips back to right
    await p.mouse.move(r.x + 100 * r.w / 390, y1); await p.mouse.down();
    for (let i = 1; i <= 20; i++) { await p.mouse.move(r.x + (100 + i * 4) * r.w / 390, y1); await p.waitForTimeout(30); }
    await p.waitForTimeout(250); await p.mouse.up();
    const g1 = await tx(p); await p.waitForTimeout(1000); const g2 = await tx(p);
    console.log('row1 after slow drag right, now right:', g1[0], '->', g2[0]);
    // mouse vertical drag over the rail scrolls the page
    const st0 = await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll').scrollTop);
    await p.mouse.move(r.x + 200 * r.w / 390, y1); await p.mouse.down();
    for (let i = 1; i <= 10; i++) { await p.mouse.move(r.x + 200 * r.w / 390, y1 - i * 10); await p.waitForTimeout(16); }
    await p.mouse.up();
    const st1 = await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll').scrollTop);
    console.log('mouse vertical drag scrolls page:', st0, '->', st1, 'top', await topIs(p));
    // plain click on a chip opens Stores
    await p.waitForTimeout(300);
    const hs = await p.evaluate(() => { const h = [...[...document.querySelectorAll('#phone .layer')].pop().querySelectorAll('.rail.mq .hs')].find(e => { const r = e.getBoundingClientRect(), pr = document.querySelector('#phone').getBoundingClientRect(); return r.left > pr.left + 30 && r.right < pr.right - 30; }); const r = h.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2}; });
    await p.mouse.click(hs.x, hs.y); await p.waitForTimeout(900);
    console.log('click chip ->', await topIs(p));
    console.log(errs.join(' | ') || 'no errors');
    await ctx.close();
  }
  // ---- phone touch ----
  {
    const ctx = await b.newContext({viewport: {width: 412, height: 915}, deviceScaleFactor: 2, isMobile: true, hasTouch: true}); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1000);
    await p.evaluate(() => { const s = [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll'); s.scrollTop = 1500; }); await p.waitForTimeout(300);
    const cdp = await ctx.newCDPSession(p);
    const touch = async (pts, dt = 16) => {
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: pts[0][0], y: pts[0][1]}]});
      for (const q of pts.slice(1)) { await p.waitForTimeout(dt); await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: q[0], y: q[1]}]}); }
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    };
    const r = await railBox(p); const k = r.w / 390, y1 = r.y + r.h * .27;
    const a = await tx(p);
    await touch(Array.from({length: 9}, (_, i) => [r.x + (100 + i * 25) * k, y1]));
    const b1 = await tx(p); await p.waitForTimeout(400); const b2 = await tx(p); await p.waitForTimeout(2600); const b3 = await tx(p); await p.waitForTimeout(1000); const b4 = await tx(p);
    console.log('touch flick right row1:', a[0], b1[0], b2[0], b3[0], b4[0], '| top', await topIs(p));
    await touch(Array.from({length: 9}, (_, i) => [r.x + (300 - i * 25) * k, y1]));
    await p.waitForTimeout(3000); const c1 = await tx(p); await p.waitForTimeout(1000); const c2 = await tx(p);
    console.log('touch flick left row1, then slow left:', c1[0], '->', c2[0], '| top', await topIs(p));
    const st0 = await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll').scrollTop);
    await touch(Array.from({length: 10}, (_, i) => [r.x + 200 * k, y1 - i * 15]));
    await p.waitForTimeout(600);
    const st1 = await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll').scrollTop);
    console.log('touch vertical swipe on rail scrolls page:', st0, '->', st1);
    // tap opens stores
    const r2 = await railBox(p);
    const hs = await p.evaluate(() => { const h = [...[...document.querySelectorAll('#phone .layer')].pop().querySelectorAll('.rail.mq .hs')].find(e => { const r = e.getBoundingClientRect(); return r.left > 30 && r.right < innerWidth - 30; }); const r = h.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2}; });
    await p.touchscreen.tap(hs.x, hs.y); await p.waitForTimeout(900);
    console.log('tap chip ->', await topIs(p));
    console.log(errs.join(' | ') || 'no errors');
  }
  await b.close();
})();
