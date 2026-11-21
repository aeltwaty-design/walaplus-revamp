const {chromium} = require('playwright');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1100, height: 950}, deviceScaleFactor: 1});
  const errs = [], notes = {push: x => console.log(x), join: () => ''};
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.reload();
  await p.waitForTimeout(500);
  const shot = async n => { await p.waitForTimeout(450); await p.locator('#phone').screenshot({path: `${OUT}/${n}.png`}); };
  const top = () => p.evaluate('(() => { const e = stack[stack.length-1]; return (e.t||"") + "/" + (e.key||"") + "/" + (resolve(e)||"") })()');
  const click = async (sel, i = 0, any) => { const ok = await p.evaluate(([s, i, any]) => { const root = any ? document.querySelector('#phone') : [...document.querySelectorAll('#phone .layer')].pop(); const l = [...root.querySelectorAll(s)]; const e = l[i] || [...document.querySelectorAll('#phone ' + s)][i]; if (!e) return false; e.click(); return true; }, [sel, i, any]); if (!ok) errs.push('missing ' + sel + ' #' + i); await p.waitForTimeout(400); };
  const scroll = async y => { await p.evaluate(y => { const l = [...document.querySelectorAll('#phone .layer')].pop(); const s = l.querySelector('.scroll,.hbody'); if (!s) { window.__err = 'no scroll in ' + l.className; return; } s.scrollTop = y === 'end' ? s.scrollHeight : y; s.dispatchEvent(new Event('scroll')); }, y); await p.waitForTimeout(600); const e = await p.evaluate('window.__err'); if (e) { console.log('ERR', e, await p.evaluate('stack.map(e=>resolve(e)).join(">")')); await p.evaluate('window.__err=0'); } };
  const back = async () => { await p.evaluate('pop()'); await p.waitForTimeout(450); };
  const closeSheets = async () => { await p.evaluate(() => { while (stack.length > 1 && resolve(stack[stack.length - 1]) === 'html_sheet') pop(1, 'none'); }); await p.waitForTimeout(300); };
  const sim = async (k, v) => { await p.evaluate(([k, v]) => EDGE.setSim(k, v), [k, v]); await p.waitForTimeout(500); };
  const toastTxt = () => p.evaluate(() => { const t = document.querySelector('#toast, .toast'); return t ? t.textContent : ''; });

  await click('.hs[data-act="tab:stores"]');
  // 1 tag -> offer
  await click('.st-tag.disc'); notes.push('disc tag -> ' + await top()); await shot('01_offer_from_tag'); await back();
  // 2 voucher tag -> sheet
  await click('.st-tag.vou'); await shot('02_voucher_sheet');
  await click('.st-vals button', 2, 1); await shot('03_voucher_topup');
  await click('.st-vals button', 0, 1); await click('[data-f="gift"]', 0, 1); await shot('04_voucher_gift');
  await click('[data-buy]', 0, 1); notes.push('gift w/o person toast: ' + await toastTxt());
  await click('[data-w]', 1, 1); await click('[data-buy]', 0, 1); await p.waitForTimeout(900); await shot('05_voucher_gift_done');
  await click('[data-ok]', 0, 1);
  await click('.st-tag.vou'); await click('[data-buy]', 0, 1); await p.waitForTimeout(900); await shot('06_voucher_bought'); await click('[data-ok]', 0, 1);
  // 3 heart + favourites page
  await click('.st-heart', 0); await shot('07_heart');
  await click('.st-fav'); notes.push('fav btn -> ' + await top()); await shot('08_favs_page'); await back();
  // 4 row -> merchant
  await click('.st-row', 0); notes.push('row -> ' + await top() + ' merchant=' + await p.evaluate('cfg.merchant')); await shot('09_merchant'); await back();
  // 5 banners
  for (let i = 0; i < 4; i++) { await scroll(0); await click('.st-banners button', i); notes.push('banner ' + i + ' -> ' + await top() + ' toast=' + await toastTxt()); await shot('10_banner' + i); if ((await top()).includes('offer')) await back(); }
  // reset state to all
  await scroll(0); await click('.st-lens button[data-v="all"]');
  // 6 collections
  await scroll(900); await click('.st-band .see'); notes.push('see all -> ' + await top()); await shot('11_colls'); await click('.st-cgrid button', 1); notes.push('coll card -> ' + await top()); await shot('12_coll_page');
  await click('.st-row', 0); notes.push('coll row -> ' + await top()); await back(); await back(); await back();
  await click('.st-band button[data-s="coll"]', 0); notes.push('band card -> ' + await top()); await back();
  // 7 cashback lens tag
  await scroll(0); await click('.st-lens button[data-v="cash"]'); await click('.st-strip'); await shot('13_cb_how'); await closeSheets();
  await click('.st-tag.cb'); await shot('14_cb_sheet'); await closeSheets();
  await click('.st-lens button[data-v="all"]');
  // 8 location
  await click('.st-loc'); await shot('15_area_sheet'); await click('.st-opts li', 2, 1); await p.waitForTimeout(400); await shot('16_area_changed');
  await sim('loc', 'off'); await shot('17_loc_off'); await scroll(500); await shot('18_nudge');
  await click('.st-nudge [data-s="nudgeLater"]'); await shot('19_nudge_later');
  await scroll(0); await click('.st-loc'); await shot('20_sys_alert');
  await p.evaluate(() => { const bs = [...document.querySelectorAll('#phone button')].filter(b => b.textContent.includes('عدم السماح')); const x = bs.pop(); if (x) x.click(); else window.__noAlert = 1; }); await p.waitForTimeout(600); notes.push("no alert: " + await p.evaluate("window.__noAlert||0")); await shot('21_loc_denied');
  await click('.st-loc'); await shot('22_loc_blocked_sheet'); await closeSheets();
  await sim('loc', 'on');
  // 9 offline / slow
  await sim('net', 'offline'); await shot('23_offline'); await scroll('end'); await scroll('end'); await scroll('end'); await shot('24_offline_more');
  await sim('net', 'online'); await scroll(0);
  await sim('net', 'slow'); await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().querySelector('.scroll').scrollTop = 0); await p.waitForTimeout(300); await shot('25_slow'); await p.waitForTimeout(1500); await sim('net', 'online');
  // 10 sticky + grid
  await scroll(1200); await shot('26_sticky'); await click('.st-sticky .st-chip.tinted', 2); await shot('27_sticky_cat'); await click('.st-sticky .grid'); await p.waitForTimeout(500); await shot('28_grid_top');
  // scrolled pill search
  await scroll(1200); await click('.st-pill .half[data-s="search"]', 0, 1); notes.push('pill search -> ' + await top()); await back();
  // 11 load to end
  await click('.st-path .clr'); for (let i = 0; i < 30; i++) await scroll('end'); await shot('29_end');
  notes.push('end text: ' + await p.evaluate(() => [...document.querySelectorAll('#phone .layer')].pop().querySelector('.st-more').textContent));
  // 12 empty state from panel
  await scroll(0); await p.evaluate(() => { const e = stack[stack.length-1]; e.ctx && 0; }); 
  await p.evaluate(() => { const items = [...document.querySelectorAll('#edge-on button')]; const it = items.find(x => x.textContent.includes('No matches')); if (it) it.click(); else window.__noItem = 1; }); await p.waitForTimeout(500);
  notes.push('panel item missing: ' + await p.evaluate('window.__noItem||0')); await shot('30_empty');
  await click('.st-empty [data-s="clearAll"]'); await shot('31_cleared');
  // 13 favourites only filter
  await click('.st-filter'); await click('[data-tgl]', 0, 1); await click('[data-go]', 0, 1); await p.waitForTimeout(400); await shot('32_fav_only');
  await click('.st-heart.on', 0); await p.waitForTimeout(700); await shot('33_fav_removed');
  await click('.st-active button', 0);
  // 14 overflow at phone width
  const ov = await p.evaluate(() => { const l = [...document.querySelectorAll('#phone .layer')].pop(); const bad = []; l.querySelectorAll('*').forEach(e => { const r = e.getBoundingClientRect(), L = l.getBoundingClientRect(); if (r.width && (r.right > L.right + 1 || r.left < L.left - 1) && !e.closest('.st-hrow,.st-banners,.st-tags,.st-sticky')) bad.push(e.className + ' ' + Math.round(r.left - L.left) + '..' + Math.round(r.right - L.left)); }); return bad.slice(0, 15); });
  notes.push('overflow: ' + JSON.stringify(ov));
  // 15 home links
  await click('.hs[data-act="tab:home"]', 0, 1); notes.push('home -> ' + await top());
  
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
