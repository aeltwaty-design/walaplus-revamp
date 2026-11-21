/* ===== WalaPlus Final UI prototype · edge cases =====
   States the Figma screens don't show, drawn in the Final UI style:
   network, new user, location, camera, offer status, scan results,
   search, favourites, sharing, usage policy, reports, branch number entry.
   Driven by the "Simulate" switches and the "Edge cases on this screen" list. */
(function () {
const ICONS = /*ICONS*/{};
const ic = (n, cls = '') => `<span class="ic ${cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg></span>`;
const $ = s => document.querySelector(s);
// numbers after Arabic letters turn into Arabic-number runs, so 25% shows as %25 and 2+1 as 1+2: isolate them
const ltr = v => String(v).replace(/(\d+(?:[.,]\d+)?%|\d+\+\d+)/g, '<span dir="ltr">$1</span>');

/* ---------- simulated conditions ---------- */
const SIM_DEF = {net: 'online', user: 'regular', loc: 'on', cam: 'ok', offer: 'ok'};
const sim = Object.assign({}, SIM_DEF, {loc: cfg.loc === false ? 'off' : 'on'});
try { Object.assign(sim, JSON.parse(sessionStorage.getItem('wp-final-sim') || '{}')); } catch (e) {}
const saveSim = () => { try { sessionStorage.setItem('wp-final-sim', JSON.stringify(sim)); } catch (e) {} };
cfg.loc = sim.loc === 'on';
if (['none', 'dup', 'err'].includes(cfg.result)) { try { if (!sessionStorage.getItem('wp-final-sim')) cfg.result = 'r2'; } catch (e) { cfg.result = 'r2'; } }
const simKey = () => JSON.stringify(sim);
const favs = new Set();
const cache = new Set();          // screens already loaded while online
let recents = ['دولتشي بان', 'قهوة', 'سبا'];
let pendingLast = false;          // the user confirmed their last use; mark it used once it counts
let reminded = false;

function setSim(k, v, quiet) {
  sim[k] = v; saveSim();
  if (k === 'loc') { cfg.loc = v === 'on'; saveCfg(); const c = $('#c-loc'); if (c) c.checked = cfg.loc; }
  if (k === 'net' && v === 'slow') stack.forEach(e => { e.loaded = false; });
  if (k === 'offer') { pendingLast = false; reminded = false; stack.forEach(e => { e.lastOk = false; }); }
  if (window.onSim) onSim(k, v);
  renderSim();
  if (!quiet) rerenderAll();
}

/* ---------- small helpers ---------- */
const colAt = (img, y) => {
  const c = MAN.col && MAN.col[img];
  if (!c) return MAN.bg[img] || '#EEF6F2';
  return c[Math.max(0, Math.min(c.length - 1, Math.round(y / 8)))];
};
function hostAt(ctx, y) {
  const s = ctx.s;
  if (s.sheet) return [ctx.canvas, 96];
  if (s.split) return y >= s.split ? [ctx.segB, s.split] : [ctx.segA, 0];
  return [ctx.canvas, 0];
}
function place(ctx, r, html, cls = '', st = {}) {
  const [x, y, w, h] = r;
  const [p, dy] = hostAt(ctx, y);
  const d = document.createElement('div');
  d.className = ('ov ' + cls).trim();
  Object.assign(d.style, {left: x + 'px', top: (y - dy) + 'px', width: w + 'px'}, h != null ? {height: h + 'px'} : {}, st);
  if (html != null) d.innerHTML = html;
  p.appendChild(d);
  return d;
}
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
const btnHtml = (label, icon, cls = '', attrs = '') => `<button class="e-btn ${cls}" ${attrs}><span>${label}</span>${icon ? ic(icon) : ''}</button>`;
const cardHtml = o => `<i class="e-mini tone-${o.tone}">${ic(o.icon)}</i><div class="tx"><b>${o.t}</b><span>${o.b}</span></div>` +
  (o.btn ? `<button class="ov-pill" data-a="${o.a}">${o.btn}</button>` : '');

function rebuildTop() {
  const t = top_(); if (!t) return;
  const st = t.ctx && t.ctx.scroll ? t.ctx.scroll.scrollTop : 0;
  unmount(t, 'none'); mount(t, 'none');
  if (t.ctx.scroll) t.ctx.scroll.scrollTop = st;
  update();
}

/* ---------- names and lines used in the sheets ---------- */
const MNAME = {c1a: 'عافية', c1b: 'عافية', c1c: 'عافية', c2: 'مشكاتي', c3: 'صالون 30 درجة'};
const MLINE = {c1a: 'وجبات صحية · في الفروع وأونلاين', c1b: 'وجبات صحية · في الفروع وأونلاين', c1c: 'وجبات صحية · في الفروع وأونلاين', c2: 'إضاءة وديكور · أونلاين', c3: 'حلاقة رجالية · في الفروع'};
const MCOL = {c1a: '#F0702B', c1b: '#F0702B', c1c: '#F0702B', c2: '#B91C1C', c3: '#111111'};
const OLINE = {o2a: '2+1 على جميع المشروبات', o2b: 'خصم 15% على طلبات التطبيق والموقع', o2c: 'خصم 25% على الكيك الكامل'};

/* =====================================================================
   1. Decorations drawn on top of the Figma screens
   ===================================================================== */
const SK = {  // skeleton blocks [x, y, w, h, radius] in screen coordinates
  home: {top: 44, r: [[16, 52, 120, 36, 18], [240, 56, 134, 28, 8], [16, 113, 358, 172, 24], [16, 325, 358, 48, 24], [254, 397, 120, 24, 8], [16, 461, 358, 96, 24], [16, 581, 358, 104, 24], [203, 709, 171, 88, 24], [16, 709, 171, 88, 24]]},
  merchant: {top: 0, bg: '#fff', r: [[0, 0, 390, 300, 0], [270, 262, 104, 76, 24], [16, 348, 104, 58, 16], [214, 350, 160, 30, 8], [234, 388, 140, 18, 6], [16, 414, 358, 30, 15], [16, 458, 358, 215, 24], [214, 693, 160, 26, 8], [16, 728, 358, 116, 24]]},
  list: {top: 44, r: [[125, 50, 140, 24, 8], [16, 96, 358, 112, 24], [20, 229, 350, 40, 20], [250, 297, 124, 22, 8], [16, 329, 358, 435, 24]]},
  full: {top: 44, bg: '#fff', r: [[16, 61, 358, 200, 24], [318, 286, 56, 48, 14], [186, 292, 124, 22, 8], [16, 357, 358, 150, 24], [16, 530, 358, 110, 24], [214, 664, 160, 24, 8]]},
  sheet: {top: 96, bg: '#fff', r: [[16, 124, 358, 200, 24], [318, 349, 56, 48, 14], [186, 355, 124, 22, 8], [16, 420, 358, 140, 24], [16, 580, 358, 110, 24]]},
};
function skeleton(ctx) {
  const id = ctx.entry.id, s = ctx.s;
  const k = id.startsWith('home') ? 'home' : id.startsWith('m_') ? 'merchant'
    : (id === 'h1' || id === 'h2') ? 'list' : s.sheet ? 'sheet' : (id.startsWith('o2') && id !== 'o2b_success') ? 'full' : null;
  if (!k) return;
  const R = SK[k];
  const d = document.createElement('div'); d.className = 'skel';
  d.style.top = (s.sheet ? 0 : R.top) + 'px';
  d.style.background = R.bg || colAt(s.img, R.top + 10);
  if (s.sheet) d.style.borderRadius = '28px 28px 0 0';
  d.innerHTML = R.r.map(([x, y, w, h, r]) => `<i style="left:${x}px;top:${y - R.top}px;width:${w}px;height:${h}px;border-radius:${r}px"></i>`).join('');
  (s.sheet ? ctx.canvas : ctx.el).appendChild(d);
  setTimeout(() => { d.classList.add('gone'); setTimeout(() => d.remove(), 300); }, 1300);
}

function banner(ctx) {
  const id = ctx.entry.id, s = ctx.s;
  if (!(/^home|^s\d|^m_|^h[12]$|^r[12]$/.test(id) || (id.startsWith('o2') && id !== 'o2b_success'))) return;
  const d = document.createElement('div');
  if (id === 'r2') {
    d.className = 'e-banner ok';
    d.innerHTML = `${ic('circle-check')}<span>لا يوجد اتصال، والكود يعمل بدونه</span>`;
  } else {
    d.className = 'e-banner';
    d.innerHTML = `${ic('wifi-off')}<span>لا يوجد اتصال بالإنترنت</span><button data-a="netRetry">إعادة المحاولة</button>`;
  }
  let pos;
  if (s.sheet) pos = {top: '52px'};
  else if (id === 'r2') pos = {bottom: '137px'};
  else if (id === 'r1') pos = {bottom: '104px'};
  else if (s.pillImg) pos = {bottom: '192px'};
  else if (s.tab) pos = {bottom: (s.h - s.tab.top + 56) + 'px'};
  else if (s.actions) pos = {bottom: (s.h - s.actions.y + 12) + 'px'};
  else pos = {bottom: '36px'};
  Object.assign(d.style, pos);
  ctx.el.appendChild(d);
}

window.decorate = function (ctx) {
  const e = ctx.entry, s = ctx.s, id = e.id;
  if (s.html) return;
  e.decoState = simKey();
  const isTop = e === stack[stack.length - 1];
  if (sim.net === 'slow' && isTop && !e.loaded) skeleton(ctx);
  e.loaded = true;
  if (sim.net !== 'offline') cache.add(id);
  if (sim.net === 'offline') banner(ctx);
  if (sim.net === 'offline' && id === 'h1' && sim.user !== 'new') ctx.canvas.style.height = (s.h + 64) + 'px';
  if (id.startsWith('home')) decoHome(ctx);
  else if (id.startsWith('m_')) decoMerchant(ctx);
  else if (OFFER_GEO[id]) decoOffer(ctx);
  else if (id === 'r1') decoR1(ctx);
  else if (id === 'r2') decoR2(ctx);
  else if (id === 'h1') decoH1(ctx);
};

/* ----- Home ----- */
function decoHome(ctx) {
  const v = ctx.s.img.slice(4), img = ctx.s.img;
  const Y = y => v !== '3' ? y : (y < 81 ? y : y <= 556 ? y + 102 : y - 26);
  if (sim.user === 'new') {
    if (v !== '3') place(ctx, [16, 581, 358, 104], cardHtml({tone: 'mint', icon: 'sparkles', t: 'ابدأ التوفير من أول عرض', b: 'نجمع لك هنا كل ما توفّره', btn: 'تصفّح العروض', a: 'stores:s4'}), 'ov-card',
      {background: 'linear-gradient(100deg,#D9FBEC,#F4FFFA)', boxShadow: 'none', borderRadius: '24px'});
    const rail = (y, h, o) => {
      const wrap = place(ctx, [0, Y(y) - 6, 390, h + 12], '', '', {background: colAt(img, Y(y) - 8)});
      const c = document.createElement('div'); c.className = 'ov-card';
      Object.assign(c.style, {left: '16px', top: '6px', width: '358px', height: h + 'px'});
      c.innerHTML = cardHtml(o); wrap.appendChild(c);
    };
    rail(2789, 88, {tone: 'red', icon: 'heart', t: 'لا متاجر مفضلة بعد', b: 'اضغط القلب في أي متجر ليظهر هنا', btn: 'تصفّح', a: 'tab:stores'});
    place(ctx, [174, Y(3747), 38, 32], '', '', {background: colAt(img, Y(3762))});
    rail(3793, 128, {tone: 'violet', icon: 'ticket', t: 'لا قسائم جاهزة لديك', b: 'اشترِ قسيمة بنقاطك لنفسك أو أهدِها لمن تحب', btn: 'القسائم', a: 'stores:s6'});
    rail(4009, 96, {tone: 'grey', icon: 'repeat', t: 'لم تستخدم أي عرض بعد', b: 'العروض التي تكررها تظهر هنا لتصل لها بسرعة'});
  }
  if (sim.loc !== 'on') {
    const den = sim.loc === 'denied';
    const sub = (y, text) => place(ctx, [16, Y(y), 358, 24], text, 'ov-text', {background: colAt(img, Y(y) + 12), textAlign: 'right', font: '400 14px/24px "NaN SuperX","Expo Arabic",sans-serif', color: '#62625c'});
    sub(953, den ? 'الموقع متوقف من الإعدادات' : 'الموقع غير مفعّل');
    sub(1270, 'الأكثر استخدامًا في مدينتك');
    place(ctx, [16, Y(989), 358, 230],
      `<div class="grid"></div><div class="pin">${ic(den ? 'map-pin-off' : 'map-pin')}</div>` +
      `<b>${den ? 'الموقع متوقف لولاء بلس' : 'شغّل الموقع لترى ما حولك'}</b>` +
      `<p>${den ? 'فعّله من الإعدادات ليظهر لك الأقرب أولًا والمسافة لكل فرع.' : 'نرتّب العروض حسب المسافة ونريك أقرب فرع. لا نشارك موقعك مع المتاجر.'}</p>` +
      `<button class="ov-pill" data-a="enableLoc"><span>${den ? 'افتح الإعدادات' : 'فعّل الموقع'}</span>${ic(den ? 'settings' : 'navigation')}</button>`, 'ov-loc');
  }
}

/* ----- Merchant ----- */
function decoMerchant(ctx) {
  const k = 'm_' + cfg.merchant;
  ctx.heart = place(ctx, [20, 64, 40, 40], ic('heart'), 'ov-heart' + (favs.has(k) ? ' on' : ''));
  ctx.favKey = k;
  makeHot(ctx.canvas, [62, 64, 40, 40, 'share'], ctx);
}

/* ----- Offer sheet / page ----- */
const OFFER_GEO = {
  o2a_tall: {policy: [16, 527, 358, 46]}, o2b_tall: {policy: [16, 627, 358, 46]}, o2c_tall: {policy: [16, 500, 358, 46]},
  o2b_after: {policy: [16, 627, 358, 46]},
  o2a_full: {policy: [16, 460, 358, 46]}, o2b_full: {policy: [16, 557, 358, 46]}, o2c_full: {policy: [16, 437, 358, 46]}, o2c_online: {policy: [16, 632, 358, 46]},
};
const once = () => cfg.offer === 'o2c';
// O2b is unlimited, so "last use" and "used up" don't apply to it
const applies = st => !(cfg.offer === 'o2b' && (st === 'last' || st === 'used'));
const NOTICE = {
  get last() { return once() ? {cls: 'amber', icon: 'hourglass', t: 'هذه فرصتك الوحيدة', b: 'العرض مرة واحدة لكل موظف، في الفرع أو أونلاين'}
    : {cls: 'amber', icon: 'hourglass', t: 'هذه آخر مرة متبقية لك هذا الشهر', b: 'بعدها يتوقف العرض حتى يتجدد في 1 ديسمبر 2026'}; },
  get used() { return once() ? {cls: 'grey', icon: 'lock', t: 'استخدمت هذا العرض', b: 'العرض مرة واحدة لكل موظف ولا يتجدد'}
    : {cls: 'grey', icon: 'lock', t: 'استخدمت كل المرات هذا الشهر', b: 'يتجدد العرض في 1 ديسمبر 2026'}; },
  expired: {cls: 'grey', icon: 'calendar-x', t: 'انتهى هذا العرض', b: 'انتهى في 20 نوفمبر 2026 ولم يعد يظهر في التطبيق'},
  soon: {cls: 'cyan', icon: 'clock', t: 'يبدأ العرض غدًا، 22 نوفمبر', b: 'نذكّرك لحظة بدايته إن أردت'},
};
function decoOffer(ctx) {
  const id = ctx.entry.id, g = OFFER_GEO[id], tall = !!ctx.s.sheet;
  makeHot(ctx.canvas, [...g.policy, 'policy'], ctx, ctx.dy);
  // favourite heart for the merchant row
  const hy = tall ? 352 : 289;
  ctx.heart = place(ctx, [16, hy, 40, 40], ic('heart'), 'ov-heart' + (favs.has('dolce') ? ' on' : ''), {background: '#F2F4F3'});
  ctx.favKey = 'dolce';
  makeHot(ctx.canvas, [16, hy, 40, 40, 'fav'], ctx, ctx.dy);
  if (id === 'o2b_after') return;
  const st = sim.offer; if (st === 'ok' || !applies(st)) return;
  const N = NOTICE[st];
  const n = document.createElement('div'); n.className = 'ov-notice ' + N.cls;
  n.innerHTML = `${ic(N.icon)}<div><b>${N.t}</b><span>${N.b}</span></div>`;
  const H = ctx.s.h;
  const barH = tall ? 0 : H - ctx.s.actions.y;
  if (tall) { n.style.bottom = '88px'; ctx.canvas.appendChild(n); } else { n.style.bottom = (barH + 8) + 'px'; n.style.zIndex = 25; ctx.el.appendChild(n); }
  let cta = null;
  if (st === 'used') cta = {cls: 'off', label: once() ? 'استخدمت العرض' : 'استخدمت كل المرات', icon: 'lock', a: 'blocked'};
  if (st === 'expired') cta = {cls: 'aqua', label: 'عروض دولتشي بان الأخرى', icon: 'store', a: 'merchant'};
  if (st === 'soon') cta = reminded ? {cls: 'aqua', label: 'سنذكّرك غدًا', icon: 'bell-ring', a: 'remind'} : {cls: 'line', label: 'ذكّرني عند البدء', icon: 'bell', a: 'remind'};
  if (cta) {
    const c = document.createElement('div'); c.className = 'ov-cta ' + cta.cls; c.dataset.a = cta.a;
    c.innerHTML = `<span>${cta.label}</span>${ic(cta.icon)}`;
    Object.assign(c.style, {left: '80px', width: '294px', height: '56px'});
    if (tall) { c.style.top = (767 - 96) + 'px'; ctx.canvas.appendChild(c); } else { c.style.bottom = (barH - 68) + 'px'; c.style.zIndex = 26; ctx.el.appendChild(c); }
    ctx.cta = c;
  }
  if (st === 'expired') {
    const hero = tall ? 124 : 61;
    place(ctx, [16, hero, 358, 200], '', 'ov-gray');
    place(ctx, [186, hero + 21, 172, 30], 'انتهى في 20 نوفمبر 2026', 'ov-tag', {textAlign: 'center', lineHeight: '30px', height: '30px', borderRadius: '15px'});
  }
}

/* ----- Scanner ----- */
function decoR1(ctx) {
  if (sim.cam === 'denied') {
    const d = document.createElement('div'); d.className = 'cam-off';
    d.innerHTML = `<div class="e-icon">${ic('camera-off')}</div><div class="e-title">الكاميرا متوقفة</div>` +
      `<div class="e-body">اسمح لولاء بلس باستخدام الكاميرا من الإعدادات لتمسح رمز الكاشير، أو أدخل رقم الفرع المكتوب تحت الرمز.</div>` +
      btnHtml('افتح الإعدادات', 'settings', '', 'data-a="camSettings"') + `<button class="e-link" data-a="manual">أدخل رقم الفرع بدلًا من ذلك</button>`;
    ctx.canvas.appendChild(d);
  } else if (sim.cam === 'ask' && ctx.entry === stack[stack.length - 1]) {
    setTimeout(() => { if (top_() === ctx.entry && sim.cam === 'ask') askCamera(); }, 450);
  }
}
function showScanHint(ctx) {
  let h = ctx.canvas.querySelector('.scan-hint');
  if (!h) {
    h = document.createElement('div'); h.className = 'scan-hint';
    h.innerHTML = `${ic('scan-qr-code')}<div style="flex:1;min-width:0"><b>لم نجد رمزًا بعد</b><span>قرّب الكاميرا من رمز الكاشير، أو أدخل رقم الفرع المكتوب تحته</span></div><button class="ov-pill" data-a="manual">أدخل الرقم</button>`;
    ctx.canvas.appendChild(h);
  }
  requestAnimationFrame(() => h.classList.add('on'));
}
function armScanner(e) {
  if (!e || !e.ctx || e.id !== 'r1') return;
  clearTimeout(e.timer);
  e.timer = setTimeout(() => { if (top_() === e) act_('scanned', e.ctx); }, 2600);
}

/* ----- Redemption code ----- */
function decoR2(ctx) {
  if (!ctx.entry.codeExpired) return;
  place(ctx, [16, 412, 358, 248], `<div class="e-icon tone-amber">${ic('clock-alert')}</div><b>انتهت صلاحية هذا الكود</b>` +
    `<span>كان صالحًا حتى 11:59 م أمس. إن لم يطبّق الكاشير العرض، أبلغنا ونعيد لك الاستخدام.</span>` +
    `<button class="ov-pill ink" data-a="report"><span>أبلغ عن مشكلة</span>${ic('flag')}</button>`, 'ov-expired', {borderRadius: '0 0 24px 24px', background: 'rgba(255,255,255,.95)'});
}

/* ----- Used offers history ----- */
function decoH1(ctx) {
  if (sim.user !== 'new') return;
  ctx.canvas.style.height = '844px';
  const w = place(ctx, [0, 88, 390, 756], '', '', {background: colAt('h1', 90)});
  w.innerHTML = `<div class="ov-card" style="left:16px;top:8px;width:358px;height:112px;background:linear-gradient(100deg,#D9FBEC,#F4FFFA);box-shadow:none;border-radius:24px">` +
    cardHtml({tone: 'mint', icon: 'sparkles', t: 'لم توفّر بعد', b: 'كل مرة تستخدم فيها عرضًا نحسب لك ما وفّرته هنا'}) + `</div>` +
    `<div class="seg-rep" style="left:20px;top:141px;width:350px;height:48px"><span class="on">الكل</span><span>في الفروع</span><span>أونلاين</span></div>` +
    `<div class="ov-empty" style="left:0;top:200px;width:390px"><div class="e-icon tone-grey">${ic('history')}</div><div class="e-title">لا يوجد سجل بعد</div>` +
    `<div class="e-body">حين تستخدم عرضًا في فرع أو أونلاين، يظهر هنا مع ما وفّرته.</div>${btnHtml('تصفّح العروض', 'store', '', 'data-a="stores:s4"')}</div>`;
  w.querySelectorAll('.seg-rep span').forEach(sp => sp.onclick = ev => { ev.stopPropagation(); w.querySelectorAll('.seg-rep span').forEach(x => x.classList.toggle('on', x === sp)); });
}

/* =====================================================================
   2. Sheets, pages and system alerts drawn in HTML
   ===================================================================== */
Object.assign(SCR, {
  html_search: {html: 'search', label: 'Search', img: 'sb_mint', h: 844},
  html_favs: {html: 'favs', label: 'Favourites', img: 'sb_mint', h: 844},
  html_error: {html: 'error', label: 'Merchant · can\'t load', img: 'sb_mint', h: 844},
  html_sheet: {html: 'sheet', sheet: 1, label: 'Sheet', img: 'sb_mint', h: 748},
  html_manual: {html: 'manual', sheet: 1, label: 'Enter branch number', img: 'sb_mint', h: 748},
  html_report: {html: 'report', sheet: 1, label: 'Report a problem', img: 'sb_mint', h: 748},
});
const HTMLR = window.HTMLR = {};

function sheetShell(ctx) {
  const el = ctx.el; el.className = 'layer sheet';
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  scrim.onclick = () => closeSheet(ctx);
  const p = document.createElement('div'); p.className = 'panel-sheet auto ar';
  el.append(scrim, p); ctx.canvas = p; ctx.dy = 0;
  return p;
}
function closeSheet(ctx) { if (top_() === ctx.entry) pop(); }
function openSheet(o) { push({t: 'html', key: 'sheet', o, label: o.label || 'Sheet'}); }

HTMLR.sheet = ctx => {
  const o = ctx.entry.o, p = sheetShell(ctx);
  p.innerHTML = `<div class="grab"></div>` +
    (o.icon ? `<div class="e-icon tone-${o.tone || 'grey'}">${ic(o.icon)}</div>` : '') +
    `<div class="e-title">${o.title}</div>` + (o.body ? `<div class="e-body">${o.body}</div>` : '') + (o.html || '') +
    (o.primary ? btnHtml(o.primary.label, o.primary.icon, o.primary.cls || '', 'data-k="p"') : '') +
    (o.secondary ? `<button class="e-link" data-k="s">${o.secondary.label}</button>` : '');
  p.querySelectorAll('[data-k]').forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    const a = b.dataset.k === 'p' ? o.primary : o.secondary;
    (a.f || (() => closeSheet(ctx)))(ctx, b);
  });
  if (o.mount) o.mount(p, ctx);
};

const mini = (tone, icon, t, b) => `<li><i class="e-mini tone-${tone}">${ic(icon)}</i><div><b>${t}</b><span>${b}</span></div></li>`;
const SH = {
  lastUse(kind, offerCtx) {
    return {label: 'Last use · confirm', icon: 'hourglass', tone: 'amber', title: 'هذه آخر مرة متبقية لك',
      body: (kind === 'scan' ? 'تُحتسب لحظة مسح رمز الكاشير.' : 'تُحتسب لحظة كشف الكود.') + (once() ? ' والعرض مرة واحدة فقط لكل موظف.' : ' بعدها يتوقف العرض حتى يتجدد في 1 ديسمبر 2026.'),
      primary: {label: kind === 'scan' ? 'تابع وامسح الرمز' : 'تابع واكشف الكود', icon: kind === 'scan' ? 'scan-qr-code' : 'eye',
        f: c => { offerCtx.entry.lastOk = true; pendingLast = true; closeSheet(c); setTimeout(() => act_(kind, offerCtx), 380); }},
      secondary: {label: 'ليس الآن'}};
  },
  offlineReveal(kind, offerCtx) {
    return {label: 'Reveal · no internet', icon: 'wifi-off', tone: 'grey', title: 'تحتاج اتصالًا لكشف الكود',
      body: 'نحتسب الاستخدام لحظة كشف الكود، لذلك نحتاج الإنترنت. لم يُحتسب عليك شيء.',
      primary: {label: 'حاول مرة أخرى', icon: 'refresh-cw', f: (c, b) => {
        if (sim.net === 'offline') { shake(b); toast('ما زال الاتصال مقطوعًا'); return; }
        closeSheet(c); setTimeout(() => act_(kind, offerCtx), 380);
      }},
      secondary: {label: 'إغلاق'}};
  },
  policy() {
    const P = {
      o2a: ['متبقٍ لك 3 من 5 مرات', 'تستخدمه حتى 5 مرات في الشهر، ويتجدد العدد في 1 ديسمبر 2026.', 'لحظة مسح رمز QR عند الكاشير بنجاح، ثم يظهر كود الاسترداد.', 'ينتهي 31 ديسمبر 2026', 'في الفروع فقط · 42 فرعًا'],
      o2b: ['الاستخدام غير محدود', 'استخدمه في كل طلب أونلاين طوال مدة العرض.', 'لحظة الضغط على «اكشف الكود»، ويبقى الكود ظاهرًا لك بعدها.', 'ينتهي 15 يناير 2027', 'أونلاين فقط · موقع المتجر وتطبيقه'],
      o2c: ['مرة واحدة فقط', 'مرة واحدة لكل موظف، في الفرع أو أونلاين.', 'في الفرع: لحظة مسح رمز الكاشير. أونلاين: لحظة كشف الكود.', 'ينتهي 30 نوفمبر 2026', 'في الفروع وأونلاين · 42 فرعًا'],
    }[cfg.offer];
    return {label: 'Usage policy', icon: 'info', tone: 'grey', title: 'سياسة الاستخدام',
      html: `<ul class="e-list">${mini('mint', 'repeat', P[0], P[1])}${mini('violet', 'scan-qr-code', 'متى تُحتسب المرة؟', P[2])}${mini('amber', 'calendar-x', P[3], 'يختفي العرض من التطبيق بعد هذا التاريخ.')}${mini('cyan', 'store', P[4], 'العرض مجاني دائمًا ولا يحتاج نقاطًا.')}</ul>`,
      primary: {label: 'فهمت'}};
  },
  share(ctx) {
    const isOffer = ctx.entry.t === 'offer';
    const name = isOffer ? 'دولتشي بان' : MNAME[cfg.merchant];
    const line = isOffer ? OLINE[cfg.offer] : MLINE[cfg.merchant];
    const link = isOffer ? 'wala.plus/o/dolce-pan-21' : 'wala.plus/m/' + ({c2: 'meshkati', c3: '30-degrees'}[cfg.merchant] || 'afiya');
    const col = isOffer ? '#3B2A20' : MCOL[cfg.merchant];
    const apps = [['واتساب', 'message-circle', '#DCFCE7', '#16A34A'], ['الرسائل', 'message-square', '#DBEAFE', '#2563EB'], ['البريد', 'mail', '#F1F3F2', '#3F3F3A'], ['المزيد', 'ellipsis', '#F1F3F2', '#3F3F3A']];
    return {label: isOffer ? 'Share the offer' : 'Share the merchant', title: isOffer ? 'شارك العرض' : 'شارك المتجر',
      html: `<div class="sh-card"><div class="s-logo" style="background:${col}">${name[0]}</div><div style="flex:1;min-width:0;text-align:right"><b>${name}</b><span>${ltr(line)}</span></div></div>` +
        `<div class="sh-link"><code>${link}</code><button class="ov-pill" data-k2="copy"><span>نسخ</span>${ic('copy')}</button></div>` +
        `<div class="sh-apps">${apps.map(([n, i, bg, fg]) => `<button data-n="${n}"><i style="background:${bg};color:${fg}">${ic(i)}</i>${n}</button>`).join('')}</div>` +
        `<div class="e-body" style="margin:10px auto 0;font-size:12.5px">من يفتح الرابط يحتاج حساب ولاء بلس. العروض الحصرية تظهر لموظفي شركتك فقط.</div>`,
      secondary: {label: 'إغلاق'},
      mount: (p, c) => {
        p.querySelector('[data-k2=copy]').onclick = ev => { ev.stopPropagation(); toast('تم نسخ الرابط'); };
        p.querySelectorAll('.sh-apps button').forEach(b => b.onclick = ev => { ev.stopPropagation(); closeSheet(c); toast('تمت المشاركة عبر ' + b.dataset.n); });
      }};
  },
  onlineHelp() {
    return {label: 'Code didn\'t work online', icon: 'circle-help', tone: 'cyan', title: 'الكود لم يعمل في الموقع؟',
      html: `<ul class="e-list">${mini('grey', 'copy', 'اكتبه كما هو', 'WALA15 بالأحرف الكبيرة ودون مسافات.')}${mini('grey', 'ticket', 'ضعه في خانة كود الخصم', 'قبل الدفع، لا بعده.')}${mini('grey', 'info', 'تأكد من شروط العرض', 'على طلبات التطبيق والموقع فقط، ولا يُجمع مع عروض أخرى.')}</ul>`,
      primary: {label: 'أبلغ عن مشكلة', icon: 'flag', f: c => { closeSheet(c); setTimeout(() => openReport('دولتشي بان · خصم 15% أونلاين · اليوم'), 380); }},
      secondary: {label: 'إغلاق'}};
  },
  locBlocked() {
    return {label: 'Location blocked', icon: 'map-pin-off', tone: 'amber', title: 'الموقع متوقف لولاء بلس',
      body: 'فعّله من الإعدادات ليظهر لك الأقرب أولًا والمسافة لكل فرع.',
      html: `<ul class="e-list">${mini('grey', 'settings', '1. افتح الإعدادات', 'ثم الخصوصية، ثم خدمات الموقع.')}${mini('grey', 'map-pin', '2. اختر ولاء بلس', 'واضغط «أثناء استخدام التطبيق».')}</ul>`,
      primary: {label: 'افتح الإعدادات', icon: 'settings', f: c => { closeSheet(c); setTimeout(() => { setSim('loc', 'on'); toast('عدت من الإعدادات والموقع مفعّل'); }, 380); }},
      secondary: {label: 'ليس الآن'}};
  },
  dup(r1) {
    return {label: 'Scan · already counted', icon: 'circle-check', tone: 'mint', title: 'احتسبنا هذا الاستخدام قبل قليل',
      body: 'مسحت رمز هذا الفرع قبل دقيقتين، فلن نحتسبه مرة ثانية. اعرض الكود نفسه للكاشير.',
      primary: {label: 'اعرض الكود', icon: 'eye', f: c => { closeSheet(c); act_('swap:' + (r1.tabScan ? 'r0' : 'r2'), r1.ctx); }},
      secondary: {label: 'إغلاق'}};
  },
  err(r1) {
    return {label: 'Scan · server error', icon: 'server-crash', tone: 'red', title: 'تعذّر التحقق الآن',
      body: 'حدث خطأ من جهتنا ولم يُحتسب أي استخدام. حاول بعد لحظات.',
      primary: {label: 'حاول مرة أخرى', icon: 'refresh-cw', f: c => { closeSheet(c); setTimeout(() => armScanner(r1), 300); }},
      secondary: {label: 'أدخل رقم الفرع', f: c => { closeSheet(c); setTimeout(openManual, 380); }}};
  },
};

/* ----- system alerts (iOS) ----- */
function sysAlert(o) {
  if (phone.querySelector('.sysalert')) return;
  const d = document.createElement('div'); d.className = 'sysalert';
  d.innerHTML = `<div class="box"><div class="bd"><b>${o.title}</b><p>${o.body}</p>${o.map ? '<div class="mapimg"></div>' : ''}</div>` +
    o.buttons.map((b, i) => `<button data-i="${i}" class="${b.bold ? 'b' : ''}">${b.label}</button>`).join('') + `</div>`;
  d.addEventListener('click', ev => ev.stopPropagation());
  d.querySelectorAll('button').forEach(b => b.onclick = ev => {
    ev.stopPropagation(); d.classList.remove('on'); setTimeout(() => d.remove(), 200);
    o.buttons[+b.dataset.i].f();
  });
  phone.appendChild(d);
  requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('on')));
}
function askLocation() {
  if (sim.loc === 'denied') return openSheet(SH.locBlocked());
  if (sim.loc === 'on') return toast('الموقع مفعّل');
  sysAlert({title: 'السماح لـ «ولاء بلس» باستخدام موقعك؟', body: 'نستخدم موقعك لنريك العروض والفروع الأقرب إليك ونرتّب المتاجر حسب المسافة.', map: 1,
    buttons: [{label: 'السماح مرة واحدة', f: locGranted}, {label: 'السماح أثناء استخدام التطبيق', bold: 1, f: locGranted},
      {label: 'عدم السماح', f: () => { setSim('loc', 'denied'); toast('لن نعرض المسافات حتى تفعّل الموقع'); }}]});
}
function locGranted() { setSim('loc', 'on'); toast('تم تفعيل الموقع'); }
function askCamera() {
  sysAlert({title: 'يريد «ولاء بلس» الوصول إلى الكاميرا', body: 'لمسح رمز QR عند الكاشير واحتساب العرض.',
    buttons: [{label: 'السماح', bold: 1, f: () => setSim('cam', 'ok')}, {label: 'عدم السماح', f: () => setSim('cam', 'denied')}]});
}

/* ----- search ----- */
const MERCH = [
  ['دولتشي بان', 'مخبوزات', 1.2, 'both', [['خصم 25%', ''], ['1+1', 'gold']], '#3B2A20', 'كيك حلويات قهوة'],
  ['صالون 30 درجة', 'حلاقة رجالية', 0.8, 'branches', [['خصم 15%', ''], ['1+1', 'gold']], '#111111', 'حلاق صالون'],
  ['فيرف سبا', 'سبا', 3.4, 'branches', [['خصم 30%', '']], '#9C8B6E', 'مساج عناية'],
  ['ألما كافيه', 'مقهى', 0.4, 'branches', [['خصم 15%', '']], '#6B4F3A', 'قهوة كافيه'],
  ['باسكن روبنز', 'حلويات', 1.1, 'both', [['2+1', 'gold'], ['قسائم', 'violet']], '#E1006A', 'ايس كريم آيس'],
  ['أمازون', 'تسوق', null, 'online', [['قسائم', 'violet'], ['كاش باك 5%', 'cyan']], '#232F3E', 'amazon'],
  ['نون', 'إلكترونيات وتسوق', null, 'online', [['خصم 15%', ''], ['كاش باك 8%', 'cyan']], '#F4D600', 'noon'],
  ['عافية', 'وجبات صحية', 1.5, 'both', [['خصم 30%', '']], '#F0702B', 'afiya صحي'],
  ['باجل براذرز', 'قهوة ومخبوزات', 1.6, 'branches', [['1+1', 'gold'], ['خصم 10%', '']], '#E0662A', 'bagel'],
  ['أربيز', 'مطاعم', 2.2, 'branches', [['خصم 25%', '']], '#C8102E', 'برجر arbys'],
  ['البدر للبصريات', 'نظارات', 2.8, 'branches', [['1+1', 'gold']], '#7A4B2A', 'بصريات'],
  ['يلو', 'تأجير سيارات', null, 'online', [['خصم 10%', '']], '#FFD200', 'yelo سيارة'],
  ['وقت اللياقة', 'نادي رياضي', 1.9, 'branches', [['خصم 30%', '']], '#B91C1C', 'جيم رياضة حصري'],
  ['بترومين اكسبريس', 'خدمة سيارات', 3.1, 'branches', [['خصم 25%', '']], '#D7262E', 'سيارة زيت'],
  ['القرية النجدية', 'مطاعم', 2.5, 'branches', [['خصم 15%', '']], '#8B2E1F', 'مطعم سعودي'],
  ['كايزو', 'مطعم ياباني', 2.0, 'branches', [['خصم 20%', '']], '#1F2937', 'سوشي kayzo'],
  ['العربية للعود', 'عطور', null, 'online', [['كاش باك 12%', 'cyan']], '#3F2A56', 'عود عطر'],
].map(([n, c, d, ch, tags, col, kw]) => ({n, c, d, ch, tags, col, kw}));
const norm = s => String(s).toLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
const plural = n => n === 1 ? 'نتيجة واحدة' : n === 2 ? 'نتيجتان' : n <= 10 ? n + ' نتائج' : n + ' نتيجة';
function hl(name, q) {
  const i = norm(name).indexOf(q);
  if (!q || i < 0) return name;
  return name.slice(0, i) + `<mark class="mark">${name.slice(i, i + q.length)}</mark>` + name.slice(i + q.length);
}
function rowHtml(m, q = '') {
  const where = m.ch === 'online' ? `${ic('globe')}أونلاين` : sim.loc === 'on' ? `${ic('map-pin')}${m.d} كم` : (m.ch === 'both' ? 'فروع وأونلاين' : 'فروع');
  const tag = m.tags[0];
  return `<div class="s-row" data-a="merchant"><div class="s-logo" style="background:${m.col}">${m.n[0]}</div><div class="tx"><b>${hl(m.n, q)}</b><span>${m.c} · ${where}</span></div><span class="s-tag ${tag[1]}">${ltr(tag[0])}</span></div>`;
}
function openSearch(q) { push({t: 'html', key: 'search', q}); }
HTMLR.search = ctx => {
  const e = ctx.entry, el = ctx.el; el.className = 'layer page';
  el.innerHTML = `<div class="hpage"><div class="sb" style="background-image:url(${IMG('sb_mint')})"></div><div class="hbody">` +
    `<form class="s-head"><button type="button" class="rbtn" data-k="back">${ic('chevron-right')}</button>` +
    `<label class="s-field">${ic('search')}<input type="text" enterkeyhint="search" placeholder="ابحث عن متجر أو فئة أو عرض" autocomplete="off"><button type="button" class="clr" hidden>${ic('x')}</button></label></form>` +
    `<div class="s-out"></div></div></div>`;
  const inp = el.querySelector('input'), clr = el.querySelector('.clr'), out = el.querySelector('.s-out');
  ctx.scroll = el.querySelector('.hbody');
  inp.value = e.q || '';
  el.querySelector('[data-k=back]').onclick = ev => { ev.stopPropagation(); act_('back', ctx); };
  clr.onclick = ev => { ev.stopPropagation(); inp.value = ''; e.q = ''; run(); inp.focus(); };
  let t;
  inp.addEventListener('input', () => { e.q = inp.value; clearTimeout(t); t = setTimeout(run, 220); });
  el.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); const q = inp.value.trim(); if (q && !recents.includes(q)) recents = [q, ...recents].slice(0, 5); inp.blur(); });
  const chips = (list, icon) => `<div class="s-chips">${list.map(x => `<button class="s-chip" data-q="${x}">${ic(icon)}${x}</button>`).join('')}</div>`;
  const bindChips = () => out.querySelectorAll('[data-q]').forEach(b => b.onclick = ev => { ev.stopPropagation(); inp.value = e.q = b.dataset.q; run(); });
  function run() {
    const raw = (inp.value || '').trim(), q = norm(raw);
    clr.hidden = !raw;
    if (!q) {
      const rec = sim.user === 'new' ? [] : recents;
      out.innerHTML = (rec.length ? `<div class="s-sec"><h3>عمليات البحث الأخيرة</h3><button data-k="clear">مسح</button></div>${chips(rec, 'history')}` : '') +
        `<div class="s-sec"><h3>الأكثر بحثًا</h3></div>${chips(['قهوة', '1+1', 'مطاعم', 'عطور', 'كاش باك', 'قسائم'], 'search')}`;
      const c = out.querySelector('[data-k=clear]'); if (c) c.onclick = ev => { ev.stopPropagation(); recents = []; run(); };
      return bindChips();
    }
    if (sim.net === 'offline') {
      out.innerHTML = `<div class="s-empty"><div class="e-icon tone-grey">${ic('wifi-off')}</div><div class="e-title">البحث يحتاج اتصالًا</div><div class="e-body">تحقق من اتصالك ثم حاول مرة أخرى.</div>${btnHtml('حاول مرة أخرى', 'refresh-cw', 'ghost', 'data-k="retry"')}</div>`;
      out.querySelector('[data-k=retry]').onclick = ev => { ev.stopPropagation(); if (sim.net === 'offline') { shake(ev.currentTarget); toast('ما زال الاتصال مقطوعًا'); } else run(); };
      return;
    }
    const found = MERCH.filter(m => norm(m.n).includes(q) || norm(m.c).includes(q) || norm(m.kw).includes(q) || m.tags.some(([tg]) => norm(tg).includes(q)));
    const draw = () => {
      if (!found.length) {
        out.innerHTML = `<div class="s-empty"><div class="e-icon tone-grey">${ic('search-x')}</div><div class="e-title">لا نتائج لـ «${raw}»</div><div class="e-body">تأكد من الإملاء، أو جرّب اسمًا أقصر، أو ابحث بالفئة.</div>` +
          chips(['مطاعم', 'قهوة', '1+1', 'كاش باك'], 'search').replace('s-chips', 's-chips" style="justify-content:center') + btnHtml('تصفّح كل المتاجر', 'store', 'ghost', 'data-a="tab:stores"') + `</div>`;
        return bindChips();
      }
      out.innerHTML = `<div class="s-sec"><h3>المتاجر</h3><span class="s-count">${plural(found.length)}</span></div><div class="s-list">${found.map(m => rowHtml(m, q)).join('')}</div>`;
    };
    if (sim.net === 'slow') {
      out.innerHTML = `<div class="s-list">${'<div class="s-skel"></div>'.repeat(4)}</div>`;
      clearTimeout(e.slowT); e.slowT = setTimeout(() => { if (inp.isConnected && norm(inp.value) === q) draw(); }, 900);
    } else draw();
  }
  run();
  if (e === stack[stack.length - 1] && !e.q) setTimeout(() => { if (inp.isConnected) inp.focus({preventScroll: true}); }, 420);
};

/* ----- favourites page ----- */
function openFavs() { push({t: 'html', key: 'favs'}); }
HTMLR.favs = ctx => {
  const el = ctx.el; el.className = 'layer page';
  const base = sim.user === 'new' ? [] : ['كايزو', 'القرية النجدية'].map(n => MERCH.find(m => m.n === n));
  const extra = [...favs].map(k => k.startsWith('st:') ? (window.STORE_FAV_ROW && STORE_FAV_ROW(k)) : k === 'dolce' ? MERCH[0] : {n: MNAME[k.slice(2)], c: MLINE[k.slice(2)].split(' · ')[0], d: 1.5, ch: k === 'm_c2' ? 'online' : 'both', tags: [['خصم 30%', '']], col: MCOL[k.slice(2)]}).filter(Boolean);
  const list = [...extra, ...base];
  el.innerHTML = `<div class="hpage"><div class="sb" style="background-image:url(${IMG('sb_mint')})"></div><div class="hbody">` +
    `<div class="s-head"><button class="rbtn" data-k="back">${ic('chevron-right')}</button><div class="e-title" style="margin:0;flex:1;text-align:right">المفضلة</div></div>` +
    (list.length ? `<div class="s-sec"><h3>متاجرك المفضلة</h3><span class="s-count">${list.length === 1 ? 'متجر واحد' : list.length === 2 ? 'متجران' : list.length + ' متاجر'}</span></div><div class="s-list">${list.map(m => rowHtml(m)).join('')}</div>`
      : `<div class="s-empty" style="padding-top:120px"><div class="e-icon tone-red">${ic('heart')}</div><div class="e-title">لا متاجر مفضلة بعد</div><div class="e-body">اضغط القلب في صفحة أي متجر ليظهر هنا، ونخبرك حين يضيف عرضًا جديدًا.</div>${btnHtml('تصفّح المتاجر', 'store', '', 'data-a="tab:stores"')}</div>`) +
    `</div></div>`;
  ctx.scroll = el.querySelector('.hbody');
  el.querySelector('[data-k=back]').onclick = ev => { ev.stopPropagation(); act_('back', ctx); };
};

/* ----- merchant can't load ----- */
HTMLR.error = ctx => {
  const el = ctx.el; el.className = 'layer page';
  el.innerHTML = `<div class="hpage"><div class="sb" style="background-image:url(${IMG('sb_mint')})"></div>` +
    `<div class="st-page"><div class="e-icon tone-grey">${ic('wifi-off')}</div><div class="e-title">تعذّر تحميل المتجر</div>` +
    `<div class="e-body">تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى. ما حفظته في المفضلة يبقى كما هو.</div>${btnHtml('حاول مرة أخرى', 'refresh-cw', '', 'data-k="retry"')}</div>` +
    `<div class="hdr"><button class="rbtn" data-k="back">${ic('chevron-right')}</button></div></div>`;
  el.querySelector('[data-k=back]').onclick = ev => { ev.stopPropagation(); act_('back', ctx); };
  el.querySelector('[data-k=retry]').onclick = ev => {
    ev.stopPropagation();
    if (sim.net === 'offline') { shake(ev.currentTarget); toast('ما زال الاتصال مقطوعًا'); return; }
    replaceTop({t: 'merchant'}, 'fade');
  };
};

/* ----- branch number entry ----- */
function openManual() { if (top_().id !== 'html_manual') push({t: 'html', key: 'manual'}); }
HTMLR.manual = ctx => {
  const e = ctx.entry, p = sheetShell(ctx);
  e.code = e.code || ''; e.tries = e.tries || 0;
  p.innerHTML = `<div class="grab"></div><div class="e-icon tone-mint">${ic('hash')}</div><div class="e-title">أدخل رقم الفرع</div>` +
    `<div class="e-body" style="margin-bottom:14px">تجده مكتوبًا تحت رمز QR عند الكاشير، ويتكوّن من 6 أرقام.</div>` +
    `<div class="pin">${'<i></i>'.repeat(6)}</div><div class="pin-err"></div>` +
    `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-n="${n}">${n}</button>`).join('')}<button class="blank"></button><button data-n="0">0</button><button data-n="del">${ic('delete')}</button></div>` +
    `<button class="e-link" data-k="close">إلغاء</button>`;
  const pin = p.querySelector('.pin'), err = p.querySelector('.pin-err'), pad = p.querySelector('.pad');
  const draw = () => {
    pin.querySelectorAll('i').forEach((b, i) => { b.textContent = e.code[i] || ''; b.classList.toggle('cur', i === e.code.length && !e.lock); });
    pad.classList.toggle('locked', !!e.lock);
  };
  const lockTick = () => {
    const left = Math.ceil((e.lock - Date.now()) / 1000);
    if (left <= 0 || !p.isConnected) { if (left <= 0) { e.lock = 0; e.tries = 0; err.textContent = ''; draw(); } return; }
    err.textContent = `أدخلت رقمًا خاطئًا 3 مرات. حاول بعد ${left} ثانية`;
    setTimeout(lockTick, 500);
  };
  const check = () => {
    if (sim.net === 'offline') { closeSheet(ctx); const b = top_(); setTimeout(() => act_('swap:f4', b.ctx), 60); return; }
    if (e.code === '104233') {
      pin.classList.add('ok'); err.textContent = '';
      setTimeout(() => { closeSheet(ctx); markUsedIfPending(); const b = top_(); act_('swap:' + (b.tabScan ? 'r0' : 'r2'), b.ctx); }, 450);
      return;
    }
    e.tries++;
    pin.classList.add('err'); shake(pin);
    if (e.tries >= 3) { e.lock = Date.now() + 30000; lockTick(); }
    else err.textContent = `هذا الرقم لا يطابق أي فرع لدولتشي بان. ${e.tries === 1 ? 'تبقّت محاولتان' : 'تبقّت محاولة واحدة'}`;
    setTimeout(() => { e.code = ''; pin.classList.remove('err'); draw(); }, 700);
  };
  ctx.key = k => {
    if (e.lock || pin.classList.contains('ok')) return;
    if (k === 'del') e.code = e.code.slice(0, -1);
    else if (e.code.length < 6) e.code += k;
    draw();
    if (e.code.length === 6) setTimeout(check, 200);
  };
  pad.querySelectorAll('[data-n]').forEach(b => b.onclick = ev => { ev.stopPropagation(); ctx.key(b.dataset.n); });
  p.querySelector('[data-k=close]').onclick = ev => { ev.stopPropagation(); closeSheet(ctx); };
  draw();
  if (e.lock) lockTick();
};

/* ----- report a problem ----- */
function openReport(sub) { push({t: 'html', key: 'report', sub}); }
HTMLR.report = ctx => {
  const e = ctx.entry, p = sheetShell(ctx);
  const R = ['الكاشير لم يستطع مسح الكود أو كتابته', 'الفرع رفض تطبيق العرض', 'طُبّق خصم أقل من المعلن', 'احتُسب الاستخدام ولم أستفد من العرض', 'سبب آخر'];
  const draw = () => {
    if (e.sent) {
      const q = e.sent === 'queued';
      p.innerHTML = `<div class="grab"></div><div class="e-icon tone-${q ? 'grey' : 'mint'}">${ic(q ? 'clock' : 'circle-check')}</div>` +
        `<div class="e-title">${q ? 'سنرسل البلاغ عند عودة الاتصال' : 'وصلنا بلاغك'}</div>` +
        `<div class="e-body">${q ? 'حفظناه على جهازك وسيُرسل تلقائيًا، لا تحتاج لكتابته مرة أخرى.' : 'نراجعه خلال 7 أيام. إن ثبت أن العرض لم يُطبّق نعيد لك الاستخدام ونُعلمك.'}</div>` + btnHtml('تم', '', '', 'data-k="done"');
      p.querySelector('[data-k=done]').onclick = ev => { ev.stopPropagation(); closeSheet(ctx); };
      return;
    }
    p.innerHTML = `<div class="grab"></div><div class="e-title" style="text-align:right">أبلغ عن مشكلة</div>` +
      `<div class="e-body" style="text-align:right;margin:0 0 16px">${ltr(e.sub || 'دولتشي بان · 2+1 على جميع المشروبات · اليوم')}</div>` +
      `<div class="rs">${R.map((r, i) => `<button data-i="${i}" class="${e.pick === i ? 'on' : ''}"><i></i>${r}</button>`).join('')}</div>` +
      btnHtml('أرسل البلاغ', 'flag', e.pick == null ? 'off' : '', 'data-k="send"') + `<button class="e-link" data-k="close">إلغاء</button>`;
    p.querySelectorAll('.rs button').forEach(b => b.onclick = ev => { ev.stopPropagation(); e.pick = +b.dataset.i; draw(); });
    p.querySelector('[data-k=send]').onclick = ev => {
      ev.stopPropagation();
      if (e.pick == null) { shake(p.querySelector('.rs')); toast('اختر سببًا أولًا'); return; }
      e.sent = sim.net === 'offline' ? 'queued' : 'sent'; draw();
    };
    p.querySelector('[data-k=close]').onclick = ev => { ev.stopPropagation(); closeSheet(ctx); };
  };
  draw();
};

/* =====================================================================
   3. Actions
   ===================================================================== */
function markUsedIfPending() {
  if (!pendingLast) return;
  pendingLast = false; sim.offer = 'used'; saveSim(); renderSim();
}
function guardUse(kind, ctx) {
  const e = ctx.entry;
  if (e.t !== 'offer') return false;
  const st = applies(sim.offer) ? sim.offer : 'ok';
  const nudge = msg => { shake(ctx.cta || ctx.canvas); toast(msg); return true; };
  if (st === 'used') return nudge(once() ? 'استخدمت هذا العرض' : 'استخدمت كل المرات هذا الشهر');
  if (st === 'expired') return nudge('انتهى هذا العرض');
  if (st === 'soon') return nudge('يبدأ العرض غدًا');
  if (kind === 'reveal' && sim.net === 'offline') { openSheet(SH.offlineReveal('reveal', ctx)); return true; }
  if (st === 'last' && !e.lastOk) { openSheet(SH.lastUse(kind, ctx)); return true; }
  if (kind === 'reveal') markUsedIfPending();
  return false;
}
function onScanned(ctx) {
  const e = ctx.entry;
  if (top_() !== e) return true;
  if (sim.cam !== 'ok') return true;
  if (cfg.result === 'none') { showScanHint(ctx); return true; }
  clearTimeout(e.timer);
  if (sim.net === 'offline') { replaceTop({t: 'f4', scanStart: 1, tabScan: e.tabScan}, 'fade'); return true; }
  if (cfg.result === 'dup') { openSheet(SH.dup(e)); return true; }
  if (cfg.result === 'err') { openSheet(SH.err(e)); return true; }
  if (cfg.result === 'r2' || e.tabScan) markUsedIfPending();
  return false;
}
function toggleFav(ctx) {
  if (!ctx.heart) return false;
  const k = ctx.favKey, on = !favs.has(k);
  if (on) favs.add(k); else favs.delete(k);
  ctx.heart.classList.toggle('on', on);
  toast(on ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
  return true;
}
function loadOlder(ctx) {
  if (ctx.olderEl) ctx.olderEl.remove();
  const d = place(ctx, [0, 1025, 390, 44], ic('loader-circle', 'spin'), 'older', {background: colAt('h1', 1047)});
  ctx.olderEl = d;
  setTimeout(() => {
    if (!d.isConnected) return;
    if (sim.net === 'offline') {
      d.innerHTML = `${ic('wifi-off')}<span>تعذّر تحميل الأشهر السابقة</span><button data-a="older">إعادة المحاولة</button>`;
    } else { d.remove(); ctx.olderEl = null; toast('الأشهر السابقة خارج النموذج'); }
  }, 900);
}

window.edgeAct = function (act, ctx, hsEl) {
  const [a, arg] = act.split(/:(.*)/s);
  const e = ctx.entry;
  switch (a) {
    case 'search': openSearch(''); return true;
    case 'favs': openFavs(); return true;
    case 'enableLoc': case 'locOn': askLocation(); return true;
    case 'fav': return toggleFav(ctx);
    case 'share': openSheet(SH.share(ctx)); return true;
    case 'policy': openSheet(SH.policy()); return true;
    case 'report': openReport(e.id === 'h2' ? 'دولتشي بان · 2+1 على جميع المشروبات · 18 نوفمبر' : null); return true;
    case 'manual': openManual(); return true;
    case 'onlineHelp': openSheet(SH.onlineHelp()); return true;
    case 'older': loadOlder(ctx); return true;
    case 'camSettings': setSim('cam', 'ok'); toast('عدت من الإعدادات والكاميرا مفعّلة'); return true;
    case 'netRetry': toast(sim.net === 'offline' ? 'ما زال الاتصال مقطوعًا' : 'عاد الاتصال'); return true;
    case 'remind':
      reminded = !reminded; rebuildTop();
      toast(reminded ? 'سنرسل لك تنبيهًا غدًا لحظة بدايته' : 'ألغينا التذكير'); return true;
    case 'blocked': return guardUse('scan', ctx) || true;
    case 'clearFilter': e.emptyList = false; rebuildTop(); toast('مسحنا الفلاتر'); return true;
    case 'scan': case 'reveal': return guardUse(a, ctx);
    case 'scanned': return onScanned(ctx);
    case 'tpReveal':
      if (sim.net === 'offline') { openSheet(SH.offlineReveal('tpReveal', ctx)); return true; }
      return false;
    case 'merchant':
      if (sim.net === 'offline' && !cache.has('m_' + cfg.merchant)) {
        const t = top_();
        if (t.t === 'offer') replaceTop({t: 'html', key: 'error'}, 'from-left'); else push({t: 'html', key: 'error'});
        return true;
      }
      return false;
  }
  return false;
};

/* delegated taps on HTML overlays: <button data-a="..."> */
phone.addEventListener('click', ev => {
  const t = ev.target.closest('[data-a]');
  if (!t || !phone.contains(t)) return;
  ev.stopPropagation(); ev.preventDefault();
  if (dragMoved) return;
  const layer = t.closest('.layer');
  const entry = stack.find(x => x.el === layer) || top_();
  act_(t.dataset.a, entry.ctx, null);
}, true);

/* keys: typing must not trigger "Back" */
addEventListener('keydown', ev => {
  const t = top_();
  if (document.querySelector('.sysalert') && (ev.key === 'Escape' || ev.key === 'Backspace')) { ev.stopPropagation(); ev.preventDefault(); return; }
  if (t && t.id === 'html_manual' && t.ctx.key && (/^[0-9]$/.test(ev.key) || ev.key === 'Backspace')) {
    ev.preventDefault(); ev.stopPropagation(); t.ctx.key(ev.key === 'Backspace' ? 'del' : ev.key); return;
  }
  const tag = ev.target && ev.target.tagName;
  if ((tag === 'INPUT' || tag === 'TEXTAREA') && ev.key === 'Backspace') ev.stopPropagation();
}, true);

/* =====================================================================
   4. Panel: simulate switches + edge cases on this screen
   ===================================================================== */
const SIMS = [
  ['net', 'Network', [['online', 'Online'], ['offline', 'Offline'], ['slow', 'Slow']]],
  ['user', 'User', [['regular', 'Regular'], ['new', 'New, no history']]],
  ['loc', 'Location', [['on', 'On'], ['off', 'Not asked'], ['denied', 'Blocked']]],
  ['cam', 'Camera', [['ok', 'Allowed'], ['ask', 'Not asked'], ['denied', 'Blocked']]],
  ['offer', 'Offer status', [['ok', 'Available'], ['last', 'Last use'], ['used', 'Used up'], ['expired', 'Ended'], ['soon', 'Starts tomorrow']]],
];
const ep = document.getElementById('edge-panel');
if (ep) ep.innerHTML = `<div class="grp"><label>Simulate</label><div id="sim"></div></div>` +
  `<div class="grp"><label>Edge cases on this screen</label><div class="edge-on" id="edge-on"></div></div>`;
const locGrp = $('#c-loc') && $('#c-loc').closest('.grp'); if (locGrp) locGrp.style.display = 'none';

function simSwitch(k, v) {
  setSim(k, v);
  const has = f => stack.some(f);
  const top = top_();
  if (k === 'offer' && !has(e => e.t === 'offer')) resetTo([{t: 'home'}, {t: 'merchant'}, {t: 'offer', mode: 'tall', flow: 1}]);
  if (k === 'cam' && !has(e => e.id === 'r1')) jump('r1');
  if (k === 'loc' && !(top.t === 'home' || top.t === 'stores')) resetTo([{t: 'home'}]);
  if (k === 'user' && !(top.t === 'home' || top.id === 'h1' || top.t === 'html')) resetTo([{t: 'home'}]);
}
function resetSim() {
  Object.assign(sim, SIM_DEF); saveSim();
  cfg.loc = true; cfg.result = 'r2'; saveCfg(); seg('c-result', 'result');
  favs.clear(); pendingLast = false; reminded = false; if (window.onSim) onSim('reset');
  stack.forEach(e => { e.emptyList = false; e.codeExpired = false; e.lastOk = false; });
  renderSim(); rerenderAll();
}
function renderSim() {
  const box = document.getElementById('sim'); if (!box) return;
  box.innerHTML = SIMS.map(([k, l, opts]) => `<div class="simrow"><span>${l}</span><div class="seg small">${opts.map(([v, n]) => `<button data-k="${k}" data-v="${v}" class="${sim[k] === v ? 'on' : ''}">${n}</button>`).join('')}</div></div>`).join('') +
    `<div class="row" style="margin-top:2px"><button class="btn" id="sim-reset">Reset all edge states</button></div>`;
  box.querySelectorAll('button[data-k]').forEach(b => b.onclick = () => simSwitch(b.dataset.k, b.dataset.v));
  box.querySelector('#sim-reset').onclick = resetSim;
}

function setResult(v, fire) {
  cfg.result = v; saveCfg(); seg('c-result', 'result');
  const t = top_();
  if (fire && t.id === 'r1') act_('scanned', t.ctx);
}
function onsList(t) {
  const id = t.id, L = [];
  const add = (l, s, f, on) => L.push([l, s, f, on]);
  const net = () => {
    add('No internet', 'offline banner, actions that need a connection', () => setSim('net', 'offline'), sim.net === 'offline');
    add('Slow connection', 'loading skeleton', () => setSim('net', 'slow'), sim.net === 'slow');
  };
  const loc = () => {
    add('Location not asked yet', 'the app earns the permission first', () => setSim('loc', 'off'), sim.loc === 'off');
    add('Location permission prompt', 'system alert: allow or don\'t', () => { if (sim.loc !== 'off') setSim('loc', 'off'); setTimeout(askLocation, 300); });
    add('Location blocked in Settings', 'how to turn it back on', () => setSim('loc', 'denied'), sim.loc === 'denied');
  };
  if (id.startsWith('home')) {
    add('New user', 'no savings, favourites, vouchers or history', () => setSim('user', 'new'), sim.user === 'new');
    loc();
    add('Search', 'type a merchant, category or offer type', () => openSearch(''));
    add('Search with no results', '«بيتزا هت»', () => openSearch('بيتزا هت'));
    net();
  } else if (id === 'html_stores') {
    loc();
    if (window.STORES_ONS) STORES_ONS(t, add);
    add('Favourites', 'the heart at the top', () => openFavs());
    add('Favourites, empty', 'new user', () => { setSim('user', 'new', true); openFavs(); });
    add('Search with no results', '«بيتزا هت»', () => openSearch('بيتزا هت'));
    net();
  } else if (id.startsWith('m_')) {
    add('Add to favourites', 'the heart fills', () => act_('fav', t.ctx), favs.has('m_' + cfg.merchant));
    add('Share the merchant', 'share sheet', () => act_('share', t.ctx));
    add('Can\'t load (no internet)', 'error page with retry', () => { setSim('net', 'offline', true); cache.delete('m_' + cfg.merchant); replaceTop({t: 'html', key: 'error'}, 'fade'); });
    net();
  } else if (OFFER_GEO[id]) {
    if (cfg.offer !== 'o2b') {
      add(once() ? 'One-time offer, not used yet' : 'Last use left', 'warning, then a confirm before it counts', () => setSim('offer', 'last'), sim.offer === 'last');
      add(once() ? 'Already used (once only)' : 'Used up this month', once() ? 'button off, never renews' : 'button off, renews 1 Dec', () => setSim('offer', 'used'), sim.offer === 'used');
    }
    add('Offer ended (old link)', 'grey hero, other offers instead', () => setSim('offer', 'expired'), sim.offer === 'expired');
    add('Starts tomorrow', 'remind me', () => setSim('offer', 'soon'), sim.offer === 'soon');
    add('Usage policy', 'tap the usage line', () => act_('policy', t.ctx));
    add('Share the offer', 'share sheet', () => act_('share', t.ctx));
    if (/o2b|o2c_online/.test(id)) add('Reveal with no internet', 'nothing counts offline', () => setSim('net', 'offline'), sim.net === 'offline');
    else net();
  } else if (id === 'r1') {
    add('Camera permission prompt', 'system alert', () => setSim('cam', 'ask'), sim.cam === 'ask');
    add('Camera blocked', 'open Settings or type the number', () => setSim('cam', 'denied'), sim.cam === 'denied');
    add('No QR in view', 'hint after a few seconds', () => { setResult('none'); setSim('cam', 'ok'); }, cfg.result === 'none');
    add('Already counted', 'scanned twice', () => { if (sim.cam !== 'ok') setSim('cam', 'ok'); setResult('dup', true); }, cfg.result === 'dup');
    add('Server error', 'nothing counted, retry', () => { if (sim.cam !== 'ok') setSim('cam', 'ok'); setResult('err', true); }, cfg.result === 'err');
    add('No internet', 'scan ends on F4', () => setSim('net', 'offline'), sim.net === 'offline');
    add('Enter the branch number', 'valid number: 104233', () => openManual());
  } else if (/^f[1-4]$/.test(id)) {
    add('Enter the branch number', 'valid: 104233 · 3 wrong tries lock it', () => openManual());
  } else if (id === 'r2') {
    add('Code expired', 'opened the next day', () => { t.codeExpired = true; rebuildTop(); }, t.codeExpired);
    add('No internet', 'the code still works', () => setSim('net', 'offline'), sim.net === 'offline');
  } else if (id === 'r3' || id === 'h2') {
    add('Report a problem', 'pick a reason, send', () => act_('report', t.ctx));
    add('Report with no internet', 'saved and sent later', () => { setSim('net', 'offline', true); act_('report', t.ctx); });
  } else if (id === 'h1') {
    add('New user', 'empty history', () => setSim('user', 'new'), sim.user === 'new');
    add('Older months fail to load', 'no internet', () => { setSim('net', 'offline'); setTimeout(() => { const t2 = top_(); t2.ctx.scroll.scrollTo({top: 400, behavior: 'smooth'}); act_('older', t2.ctx); }, 60); });
    net();
  } else if (id === 'o2b_success') {
    add('Code didn\'t work online', 'tips and report', () => act_('onlineHelp', t.ctx));
  } else if (id === 'html_search') {
    add('No results', '«بيتزا هت»', () => { t.q = 'بيتزا هت'; rebuildTop(); });
    add('No internet', 'search needs a connection', () => setSim('net', 'offline'), sim.net === 'offline');
    add('Slow connection', 'loading rows', () => setSim('net', 'slow'), sim.net === 'slow');
    add('New user', 'no recent searches', () => setSim('user', 'new'), sim.user === 'new');
  } else if (id === 'html_manual') {
    add('Type the right number', '104233', () => { t.code = ''; '104233'.split('').forEach((d, i) => setTimeout(() => t.ctx.key && t.ctx.key(d), i * 90)); });
    add('Type a wrong number', '111111', () => { t.code = ''; '111111'.split('').forEach((d, i) => setTimeout(() => t.ctx.key && t.ctx.key(d), i * 90)); });
  } else if (id === 'html_error') {
    add('Back online', 'then tap "try again"', () => setSim('net', 'online'), sim.net === 'online');
  }
  return L;
}
let prevTop = null;
function renderOns() {
  const box = document.getElementById('edge-on'); if (!box) return;
  const t = top_(); if (!t) return;
  const L = onsList(t);
  box.innerHTML = '';
  if (!L.length) { box.innerHTML = '<div class="none">Nothing extra on this screen. The switches above still apply.</div>'; return; }
  for (const [l, sub, f, on] of L) {
    const b = document.createElement('button');
    if (on) b.className = 'on';
    b.innerHTML = `<span>${l}</span><small>${sub || ''}</small>`;
    b.onclick = () => { f(t); setTimeout(renderOns, 50); };
    box.appendChild(b);
  }
}
window.onStack = function () {
  const t = top_(); if (!t) return;
  if (cfg.loc !== (sim.loc === 'on')) { sim.loc = cfg.loc ? 'on' : (sim.loc === 'denied' ? 'denied' : 'off'); saveSim(); renderSim(); }
  if (t !== prevTop && t.decoState && t.decoState !== simKey() && t.el && t.el.isConnected) {
    prevTop = t;
    const st = t.ctx.scroll ? t.ctx.scroll.scrollTop : 0;
    unmount(t, 'none'); mount(t, 'none');
    if (t.ctx.scroll) t.ctx.scroll.scrollTop = st;
  }
  prevTop = t;
  renderOns();
};

/* index: edge-case screens */
(function () {
  const idx = $('#idx'); if (!idx) return;
  const b = document.createElement('b'); b.textContent = 'Edge cases'; idx.appendChild(b);
  const items = [
    ['Search', () => { resetTo([{t: 'home'}]); openSearch(''); }],
    ['Search · no results', () => { resetTo([{t: 'home'}]); openSearch('بيتزا هت'); }],
    ['Favourites', () => { resetTo([{t: 'home'}, {t: 'stores', lens: 's1', root: 1}]); openFavs(); }],
    ['Enter branch number', () => { jump('f1'); setTimeout(openManual, 30); }],
    ['Report a problem', () => { jump('r3'); setTimeout(() => act_('report', top_().ctx), 30); }],
    ['Usage policy', () => { resetTo([{t: 'home'}, {t: 'merchant'}, {t: 'offer', mode: 'tall', flow: 1}]); setTimeout(() => act_('policy', top_().ctx), 30); }],
    ['Location prompt', () => { if (sim.loc === 'on') setSim('loc', 'off', true); resetTo([{t: 'home'}]); setTimeout(askLocation, 300); }],
    ['Camera prompt', () => { setSim('cam', 'ask', true); jump('r1'); }],
  ];
  for (const [l, f] of items) { const bt = document.createElement('button'); bt.textContent = l; bt.onclick = f; idx.appendChild(bt); }
})();

/* shared with stores.js */
window.EDGE = {ic, ltr, sim, setSim, favs, openSheet, closeSheet, openSearch, openFavs, askLocation, btnHtml, mini, shake, rebuildTop};

/* scan result options that the Figma page doesn't have */
OPTS.result.push(['none', 'No QR', 'hint'], ['dup', 'Twice', 'counted'], ['err', 'Error', 'server']);
seg('c-result', 'result');
const c = $('#c-loc'); if (c) c.checked = cfg.loc;
renderSim();
rerenderAll();
})();
