/* ===== WalaPlus Final UI prototype · Stores tab, live =====
   The Stores screen built in HTML from the Figma "Marketplace · Final UI" parts, so every tap works:
   lenses, banners, category tiles, sub-category chips, offer types, sort, filters, hearts, tags,
   collection bands, the location nudge and the sticky header. Search and the map keep their old behaviour.
   Merchants: the 13 from Figma, copied at random (seeded) into every category and sub-category. */
(function () {
const E = window.EDGE;
const {ic, ltr, sim, favs} = E;
const RIYAL = `<svg class="riyal" viewBox="0 0 1256 1256" aria-label="ريال"><path d="/*RIYAL*/"/></svg>`;
const SI = n => IMG('st_' + n);
const POINTS = 1250;                     // the user's balance in the Figma voucher strip
const PPR = 10;                          // points per riyal (50 riyals = 500 points)
const fmt = n => Number(n).toLocaleString('en-US');
const r1 = v => Math.round(v * 10) / 10;

/* ---------- categories (Tawaty's tree) ---------- */
const TREE = [
  {id: 'food', n: 'أكل ومشروبات', k: [
    {id: 'cafes', n: 'مقاهي', k: [['lounge', 'لاونج'], ['cafe', 'كافيهات'], ['specialty', 'قهوة مختصة'], ['equip', 'أدوات القهوة']]},
    {id: 'drinks', n: 'مشروبات', k: [['juice', 'عصائر'], ['water', 'مياه']]},
    {id: 'rest', n: 'مطاعم', k: [['arabic', 'عربي'], ['burger', 'برجر'], ['asian', 'آسيوي'], ['italian', 'إيطالي'], ['seafood', 'مأكولات بحرية'], ['breakfast', 'فطور'], ['fast', 'وجبات سريعة'], ['healthy', 'أكل صحي'], ['steak', 'ستيك'], ['american', 'أمريكي'], ['intl', 'عالمي']]},
    {id: 'sweets', n: 'حلويات ومخبوزات', k: [['icecream', 'آيس كريم'], ['nuts', 'مكسرات'], ['choc', 'شوكولاتة'], ['sweets', 'حلويات'], ['bakery', 'مخبوزات']]}]},
  {id: 'retail', n: 'أزياء وتسوّق', k: [
    {id: 'fashion', n: 'أزياء', k: [['apparel', 'ملابس'], ['jewelry', 'مجوهرات وإكسسوارات'], ['eyewear', 'نظارات وبصريات'], ['shoes', 'أحذية'], ['bags', 'حقائب وأمتعة']]},
    {id: 'shop', n: 'تسوّق', k: [['beauty', 'تجميل'], ['pets', 'حيوانات أليفة'], ['hyper', 'هايبر ماركت'], ['electronics', 'إلكترونيات'], ['delivery', 'توصيل أونلاين'], ['coffee', 'قهوة'], ['makeup', 'مكياج ومستحضرات'], ['flowers', 'ورود وهدايا'], ['books', 'مكتبات'], ['other', 'أخرى']]}]},
  {id: 'beauty', n: 'جمال ولياقة', k: [
    {id: 'beauty', n: 'جمال', k: [['salon', 'صالونات'], ['nails', 'مراكز أظافر'], ['spa', 'سبا'], ['barber', 'حلاقة رجالية'], ['center', 'مراكز تجميل']]},
    {id: 'fitness', n: 'لياقة', k: [['gym', 'نوادي رياضية'], ['equipment', 'معدات ومكملات']]}]},
  {id: 'health', n: 'صحة', k: [{id: 'centres', n: 'مراكز صحية'}, {id: 'eye', n: 'مراكز عيون'}, {id: 'labs', n: 'مختبرات'}, {id: 'physio', n: 'علاج طبيعي'}]},
  {id: 'home', n: 'المنزل والمطبخ', k: [
    {id: 'home', n: 'المنزل', k: [['furniture', 'أثاث'], ['floors', 'أرضيات ومغاسل'], ['lighting', 'أجهزة وإضاءة'], ['supplies', 'مستلزمات وإكسسوارات']]},
    {id: 'kitchen', n: 'المطبخ'}]},
  {id: 'travel', n: 'سفر وترفيه', k: [
    {id: 'hotels', n: 'فنادق'}, {id: 'flights', n: 'طيران'},
    {id: 'activities', n: 'أنشطة', k: [['hiking', 'هايكنج'], ['bowling', 'بولينج'], ['arcade', 'ألعاب أركيد'], ['escape', 'غرف هروب'], ['other', 'أخرى']]},
    {id: 'gaming', n: 'ألعاب'}, {id: 'digital', n: 'ترفيه رقمي'}]},
  {id: 'edu', n: 'تعليم وتدريب', k: [{id: 'schools', n: 'مدارس'}, {id: 'nurseries', n: 'حضانات'}, {id: 'training', n: 'تدريب'}, {id: 'apps', n: 'تطبيقات تعليمية'}]},
  {id: 'svc', n: 'خدمات', k: [{id: 'car', n: 'خدمات السيارات'}, {id: 'home', n: 'خدمات منزلية'}, {id: 'logistics', n: 'خدمات لوجستية'}, {id: 'studio', n: 'استوديو'}, {id: 'legal', n: 'خدمات قانونية'}, {id: 'insurance', n: 'تأمين وتمويل'}, {id: 'recharge', n: 'شحن الجوال'}, {id: 'subs', n: 'اشتراكات'}, {id: 'other', n: 'خدمات أخرى'}]},
];
TREE.forEach(t => t.k.forEach(s => { if (s.k) s.k = s.k.map(([id, n]) => ({id, n})); }));
const TINT = {food: '#d6fff1', retail: '#e9e1fd', beauty: '#d4f8fd', health: '#fdddf0', home: '#fff3d0', travel: '#ffe3d4', edu: '#dcebff', svc: '#d6fff1'};
const node = path => {
  let list = TREE, n = null;
  for (const id of path) { n = (list || []).find(x => x.id === id); if (!n) return null; list = n.k; }
  return n;
};

/* ---------- the 13 merchants in Figma ---------- */
const BASE = {
  dolce: {n: 'دولتشي بان', c: 'مخبوزات', ch: 'both', r: 4.7, rc: 1240, d: 1.2, vp: 860, col: '#3B2A20', path: 'food/sweets/bakery', tags: [['vou', 50], ['disc', 25], ['bogo', '1+1']]},
  salon: {n: 'صالون 30 درجة', c: 'حلاقة رجالية', ch: 'store', r: 4.8, rc: 860, d: 0.8, col: '#111111', path: 'beauty/beauty/barber', tags: [['disc', 15], ['bogo', '1+1']], m: 'c3'},
  verve: {n: 'فيرف سبا', c: 'سبا', ch: 'store', r: 4.6, rc: 320, d: 3.4, vp: 120, col: '#9C8B6E', path: 'beauty/beauty/spa', ad: 1, tags: [['vou', 200], ['disc', 30]]},
  arbys: {n: 'أربيز', c: 'برجر', ch: 'store', r: 4.2, rc: 2310, d: 2.6, col: '#C8102E', path: 'food/rest/burger', tags: [['bogo', '2+1'], ['disc', 20]]},
  meshkati: {n: 'مشكاتي', c: 'أجهزة وإضاءة', ch: 'both', r: 4.5, rc: 410, d: 4.1, col: '#B91C1C', path: 'home/home/lighting', tags: [['disc', 20], ['cb', 10], ['code', 15]], m: 'c2'},
  badr: {n: 'البدر للبصريات', c: 'نظارات وبصريات', ch: 'store', r: 4.4, rc: 530, d: 2.2, vp: 300, col: '#7A4B2A', path: 'retail/fashion/eyewear', tags: [['bogo', '1+1'], ['disc', 20], ['vou', 100]]},
  amazon: {n: 'أمازون', c: 'تسوّق', ch: 'online', r: 4.6, rc: 12400, d: null, vp: 540, col: '#232F3E', path: 'retail/shop/delivery', tags: [['cb', 5], ['vou', 100], ['code', 10]]},
  afiya: {n: 'عافية', c: 'أكل صحي', ch: 'both', r: 4.5, rc: 690, d: 1.9, col: '#F0702B', path: 'food/rest/healthy', tags: [['disc', 15], ['cb', 6]], m: 'c1'},
  baskin: {n: 'باسكن روبنز', c: 'آيس كريم', ch: 'both', r: 4.7, rc: 3100, d: 1.1, vp: 980, col: '#E1006A', path: 'food/sweets/icecream', tags: [['vou', 50], ['bogo', '2+1'], ['cb', 5]]},
  alma: {n: 'ألما كافيه', c: 'كافيهات', ch: 'store', r: 4.7, rc: 318, d: 0.4, col: '#6B4F3A', path: 'food/cafes/cafe', tags: [['disc', 15]]},
  bagel: {n: 'بيقل براذرز', c: 'فطور', ch: 'store', r: 4.6, rc: 740, d: 1.6, col: '#E0662A', path: 'food/rest/breakfast', tags: [['bogo', '1+1'], ['disc', 10]]},
  asian: {n: 'آسيان أوشن', c: 'آسيوي', ch: 'both', r: 4.4, rc: 560, d: 2.9, col: '#1F2937', path: 'food/rest/asian', tags: [['bogo', '1+1'], ['disc', 15]]},
  noon: {n: 'نون', c: 'تسوّق', ch: 'online', r: 4.5, rc: 9800, d: null, vp: 500, col: '#F4D600', path: 'retail/shop/electronics', tags: [['cb', 8], ['vou', 100]]},
};
const ORDER = Object.keys(BASE);
const CHL = {store: 'فروع', online: 'أونلاين', both: 'فروع وأونلاين'};

/* ---------- copies: every leaf category gets 3 or 4 of them, seeded so reloads match ---------- */
function rng(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(2611);
const pick = a => a[Math.floor(R() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hasStore = m => m.ch !== 'online', hasOnline = m => m.ch !== 'store';
const isOffer = m => m.tags.some(g => g[0] === 'disc' || g[0] === 'code' || g[0] === 'bogo');
const ALL = [];
const leaves = [];
TREE.forEach(t => t.k.forEach(s => (s.k ? s.k.map(l => [t.id, s.id, l.id, l.n]) : [[t.id, s.id, null, s.n]]).forEach(x => leaves.push(x))));
ORDER.forEach((k, i) => {
  const b = BASE[k];
  ALL.push({id: 'o' + i, b: k, n: b.n, c: b.c, ch: b.ch, r: b.r, rc: b.rc, d0: b.d, vp: b.vp || 0, path: b.path.split('/'), tags: b.tags.map(x => x.slice()), ad: !!b.ad, rank: i, orig: 1});
});
function genTags(ch) {
  const o = [];
  if (ch !== 'online') o.push(() => ['disc', pick([10, 15, 20, 25, 30, 40])], () => ['bogo', pick(['1+1', '1+1', '2+1'])]);
  if (ch !== 'store') o.push(() => ['cb', pick([3, 4, 5, 6, 8])], () => ['code', pick([10, 15, 20])]);
  o.push(() => ['vou', pick([10, 25, 50, 100, 200, 500])]);
  const n = 1 + Math.floor(R() * 2.6);
  return shuffle(o).slice(0, n).map(f => f());
}
function makeCopy(leaf, bk) {
  const b = BASE[bk];
  return {id: 'c' + ALL.length, b: bk, n: b.n, c: leaf[3], ch: b.ch, r: Math.min(4.9, Math.max(3.6, r1(b.r + (R() - .5) * .9))),
    rc: Math.max(24, Math.round(b.rc * (.12 + R() * .9))), d0: b.ch === 'online' ? null : r1(.3 + Math.pow(R(), 1.4) * 11.5),
    vp: Math.round(R() * 480), path: leaf.slice(0, 3).filter(Boolean), tags: genTags(b.ch), ad: R() < .05, rank: 100 + R() * 100, orig: 0};
}
const per = leaves.map(() => 3);
for (let i = 0; i < 248 - 13 - 3 * leaves.length; i++) per[Math.floor(R() * leaves.length)]++;
leaves.forEach((lf, li) => {
  const used = new Set(ALL.filter(m => m.orig && m.path.join('/') === lf.slice(0, 3).filter(Boolean).join('/')).map(m => m.b));
  for (let j = 0; j < per[li]; j++) {
    let bk, tries = 0;
    do { bk = pick(ORDER); } while (used.has(bk) && tries++ < 20);
    used.add(bk);
    ALL.push(makeCopy(lf, bk));
  }
});
// make sure every leaf has a branch, online, offers, cashback, vouchers and a 4.5+ rating; every level-2 has discount, 1+1, 2+1, under 1 km and an affordable voucher
const has = (m, t, v) => m.tags.some(g => g[0] === t && (v == null || g[1] === v));
const BOTH = ORDER.filter(k => BASE[k].ch === 'both');
const swapBoth = m => { const bk = pick(BOTH); const b = BASE[bk]; m.b = bk; m.n = b.n; m.ch = 'both'; if (m.d0 == null) m.d0 = r1(.4 + R() * 6); };
const addTag = (m, g) => { m.tags = m.tags.filter(x => x[0] !== g[0]); m.tags.push(g); };
const cands = (L, test = () => true) => { const a = shuffle(L.filter(m => !m.orig && test(m))); return a.length ? a : L.filter(test); };
leaves.forEach(lf => {
  const key = lf.slice(0, 3).filter(Boolean).join('/');
  const L = ALL.filter(m => m.path.join('/') === key);
  if (!L.some(hasStore) || !L.some(hasOnline)) swapBoth(cands(L)[0]);
  if (!L.some(m => has(m, 'cb'))) addTag(cands(L, hasOnline)[0], ['cb', pick([3, 4, 5, 6, 8])]);
  if (!L.some(isOffer)) { const m = cands(L)[0]; addTag(m, hasStore(m) ? ['disc', pick([15, 20, 25])] : ['code', pick([10, 15])]); }
  if (!L.some(m => has(m, 'vou'))) addTag(cands(L)[0], ['vou', pick([25, 50, 100])]);
  if (!L.some(m => m.r >= 4.5)) cands(L)[0].r = 4.6;
  // one copy per leaf that fits every lens and channel, so any single filter still finds something
  const sm = cands(L, m => m.ch === 'both')[0] || (() => { const m = cands(L)[0]; swapBoth(m); return m; })();
  if (!isOffer(sm)) addTag(sm, ['disc', pick([15, 20, 25])]);
  if (!has(sm, 'cb')) addTag(sm, ['cb', pick([3, 4, 5, 6])]);
  if (!(has(sm, 'vou') && minVou(sm) <= 100)) addTag(sm, ['vou', pick([25, 50, 100])]);
  sm.r = Math.max(sm.r, 4.5); sm.d0 = Math.min(sm.d0 ?? 9, r1(.4 + R() * 2.5));
});
TREE.forEach(t => t.k.forEach(s => {
  const L = ALL.filter(m => m.path[0] === t.id && m.path[1] === s.id);
  if (!L.some(m => has(m, 'disc'))) addTag(cands(L, hasStore)[0], ['disc', pick([10, 15, 20, 25, 30])]);
  for (const v of ['1+1', '2+1']) {
    if (L.some(m => has(m, 'bogo', v))) continue;
    const other = v === '1+1' ? '2+1' : '1+1';
    const c = cands(L, m => hasStore(m) && !has(m, 'bogo'));
    const c2 = c.length ? c : cands(L, m => hasStore(m) && has(m, 'bogo', other) && L.filter(x => has(x, 'bogo', other)).length > 1);
    if (c2.length) addTag(c2[0], ['bogo', v]);
  }
  if (!L.some(m => m.d0 != null && m.d0 <= 1)) cands(L, hasStore)[0].d0 = r1(.3 + R() * .6);
  if (!L.some(m => has(m, 'vou') && minVou(m) * PPR <= POINTS)) addTag(cands(L)[0], ['vou', 50]);
}));
ALL.forEach(m => { if (m.ch === 'online') m.d0 = null; else if (m.d0 == null) m.d0 = r1(.5 + R() * 5); m.tags = m.tags.filter(g => g[0] === 'vou' || (hasStore(m) && ['disc', 'bogo'].includes(g[0])) || (hasOnline(m) && ['cb', 'code'].includes(g[0]))); if (!m.tags.length) m.tags.push(['vou', 50]); });
function minVou(m) { const v = m.tags.filter(g => g[0] === 'vou').map(g => g[1]); return v.length ? Math.min(...v) : Infinity; }
const maxOf = (m, ...t) => Math.max(0, ...m.tags.filter(g => t.includes(g[0])).map(g => typeof g[1] === 'number' ? g[1] : 50));

/* ---------- location (area changes the distances) ---------- */
const AREAS = [['حي الملقا، الرياض', 'موقعي الحالي'], ['حي النرجس، الرياض', 'المنزل'], ['حي العليا، الرياض', 'العمل'], ['حي الروضة، جدة', '']];
let area = 0;
const dist = m => {
  if (m.d0 == null) return null;
  if (!area) return m.d0;
  const f = rng(area * 7919 + parseInt(m.id.slice(1), 10) * 31)();
  return r1(Math.max(.2, m.d0 * (.35 + f * 1.3)));
};
const locOn = () => sim.loc === 'on';

/* ---------- favourites (shared with the favourites page) ---------- */
const DEF_FAVS = ['st:salon', 'st:baskin', 'st:amazon'];
function seedFavs() { if (sim.user !== 'new') DEF_FAVS.forEach(k => favs.add(k)); }
seedFavs();
window.onSim = (k, v) => {
  if (k === 'user') { if (v === 'new') DEF_FAVS.forEach(x => favs.delete(x)); else seedFavs(); }
  if (k === 'reset') seedFavs();
};
window.STORE_FAV_ROW = k => {
  const b = BASE[k.slice(3)]; if (!b) return null;
  const g = b.tags[0];
  return {n: b.n, c: b.c, d: b.d, ch: b.ch === 'store' ? 'branches' : b.ch, tags: [[tagLabel(g, 'all', true), {disc: '', code: '', bogo: 'gold', cb: 'cyan', vou: 'violet'}[g[0]]]], col: b.col};
};

/* ---------- lenses, sorts, filters ---------- */
const LENS = [['all', 'الكل', null], ['offers', 'عروض', '#00ffa8'], ['cash', 'كاش باك', '#00def9'], ['vouch', 'قسائم', '#bb8fff']];
const LENS_LABEL = {all: 'feed', offers: 'offers lens', cash: 'cashback lens', vouch: 'vouchers lens'};
const SORTS = {rec: 'موصى به', near: 'الأقرب', rating: 'الأعلى تقييمًا', popular: 'الأكثر طلبًا', disc: 'أعلى خصم', rate: 'أعلى نسبة', cheap: 'الأقل سعرًا'};
const LENS_SORTS = {all: ['rec', 'near', 'rating', 'popular'], offers: ['near', 'rec', 'disc', 'rating'], cash: ['rate', 'rec', 'rating', 'popular'], vouch: ['popular', 'cheap', 'rec', 'rating']};
const SORT_SUB = {rec: 'ما يناسبك أولًا', near: 'حسب المسافة من موقعك', rating: 'تقييم العملاء', popular: 'الأكثر استخدامًا هذا الشهر', disc: 'الخصم الأكبر أولًا', rate: 'أعلى نسبة كاش باك أولًا', cheap: 'أقل قيمة قسيمة أولًا'};
const SORT_IC = {rec: 'sparkles', near: 'navigation', rating: 'star', popular: 'users', disc: 'badge-percent', rate: 'coins', cheap: 'wallet'};
const defSort = l => l === 'offers' ? (locOn() ? 'near' : 'rec') : LENS_SORTS[l][0];
const sortOf = st => { const s = st.sorts[st.lens] || defSort(st.lens); return s === 'near' && !locOn() ? 'rec' : s; };
const OTYPES = [['all', 'كل العروض', null, ''], ['disc', 'خصومات', '#00ffa8', 'aqua'], ['b11', '1+1', '#fcc128', 'gold'], ['b21', '2+1', '#fcc128', 'gold']];
const F0 = () => ({ch: 'any', dist: 0, rating: 0, has: [], fav: false, none: false});

function initState(lens, preset, cat) {
  const L = {s1: 'all', s3: 'all', s4: 'offers', s5: 'cash', s6: 'vouch'}[lens] || lens || 'all';
  const st = {lens: L, path: [], otype: 'all', within: true, sorts: {}, f: F0(), n: 12, nudgeOff: false};
  if (preset === 's4') { st.path = ['food']; st.otype = 'b11'; }
  if (cat && TREE.some(t => t.id === cat)) st.path = [cat];
  return st;
}
function lensOK(m, st, otype = st.otype) {
  switch (st.lens) {
    case 'offers':
      if (otype === 'disc') return has(m, 'disc') || has(m, 'code');
      if (otype === 'b11') return has(m, 'bogo', '1+1');
      if (otype === 'b21') return has(m, 'bogo', '2+1');
      return isOffer(m);
    case 'cash': return has(m, 'cb');
    case 'vouch': return has(m, 'vou') && (!st.within || minVou(m) * PPR <= POINTS);
  }
  return true;
}
function filtOK(m, st) {
  const f = st.f;
  if (f.none) return false;
  if (f.ch === 'store' && !hasStore(m)) return false;
  if (f.ch === 'online' && !hasOnline(m)) return false;
  if (f.dist && locOn() && st.lens !== 'cash') { const d = dist(m); if (d == null || d > f.dist) return false; }
  if (f.rating && m.r < f.rating) return false;
  if (f.has.length && st.lens === 'all' && !f.has.every(h => h === 'offers' ? isOffer(m) : has(m, h === 'cash' ? 'cb' : 'vou'))) return false;
  if (f.fav && !favs.has('st:' + m.b)) return false;
  return true;
}
const pathOK = (m, p) => p.every((x, i) => m.path[i] === x);
function sorter(key, st) {
  const tie = (a, b) => (b.orig - a.orig) || (a.rank - b.rank);
  const by = {
    rec: (a, b) => a.rank - b.rank,
    near: (a, b) => ((dist(a) ?? 1e9) - (dist(b) ?? 1e9)) || tie(a, b),
    rating: (a, b) => (b.r - a.r) || (b.rc - a.rc),
    popular: st.lens === 'vouch' ? (a, b) => (b.vp - a.vp) || tie(a, b) : (a, b) => b.rc - a.rc,
    disc: (a, b) => (maxOf(b, 'disc', 'code') - maxOf(a, 'disc', 'code')) || tie(a, b),
    rate: (a, b) => (maxOf(b, 'cb') - maxOf(a, 'cb')) || tie(a, b),
    cheap: (a, b) => (minVou(a) - minVou(b)) || tie(a, b),
  };
  return by[key] || by.rec;
}
function results(st, over = {}) {
  const s = Object.assign({}, st, over);
  const r = ALL.filter(m => pathOK(m, s.path) && lensOK(m, s) && filtOK(m, s)).sort(sorter(sortOf(s), s));
  if (!s.f.fav) return r;
  const seen = new Set();   // favourites only: each hearted merchant once, not every copy
  return r.filter(m => !seen.has(m.b) && seen.add(m.b));
}
const count = (st, over) => results(st, over).length;
const filterCount = f => (f.ch !== 'any') + (!!f.dist) + (!!f.rating) + f.has.length + (!!f.fav) + (!!f.none);
const feedMode = st => st.lens === 'all' && !st.path.length && !filterCount(st.f) && sortOf(st) === 'rec';

/* ---------- small renderers ---------- */
function tagLabel(g, lens, plain) {
  const [t, v] = g;
  if (t === 'disc') return plain ? `خصم ${v}%` : `خصم ${ltr(v + '%')}`;
  if (t === 'code') return plain ? `كود خصم ${v}%` : `كود خصم ${ltr(v + '%')}`;
  if (t === 'bogo') return plain ? v : `<span dir="ltr">${v}</span>`;
  if (t === 'cb') return plain ? `كاش باك ${v}%` : `كاش باك ${ltr(v + '%')}`;
  if (t === 'vou') return plain ? `قسائم من ${v}` : `${lens === 'vouch' ? 'بدءا من' : 'قسائم من'} <span dir="ltr">${v}</span>${RIYAL}`;
  return '';
}
const TAGCLS = {disc: 'disc', code: 'disc', bogo: 'bogo', cb: 'cb', vou: 'vou'};
function orderedTags(m, st) {
  const first = {offers: st.otype === 'b11' || st.otype === 'b21' ? ['bogo', 'disc', 'code'] : ['disc', 'code', 'bogo'], cash: ['cb'], vouch: ['vou'], all: []}[st.lens];
  const rank = g => { const i = first.indexOf(g[0]); return i < 0 ? 9 : i; };
  return m.tags.map((g, i) => [g, i]).sort((a, b) => (rank(a[0]) - rank(b[0])) || (a[1] - b[1])).map(x => x[0]);
}
function rowHtml(m, i, st) {
  const d = dist(m), showD = locOn() && d != null && st.lens !== 'cash';
  const fav = favs.has('st:' + m.b);
  const tags = orderedTags(m, st);
  return `<div class="st-row" data-s="m" data-i="${i}">` +
    `<div class="st-ph" style="background-image:url(${SI('ph_' + m.b)})"></div>` +
    `<div class="st-info"><div class="st-name"><b>${m.n}</b>${m.ad ? '<span class="st-ad">إعلان</span>' : ''}<button class="st-heart${fav ? ' on' : ''}" data-s="fav" data-b="${m.b}" aria-label="المفضلة">${ic('heart')}</button></div>` +
    `<div class="st-cat">${m.c} · ${CHL[m.ch]}</div>` +
    `<div class="st-meta">${ic('star', 'star')}<b>${m.r.toFixed(1)}</b><bdi>(${fmt(m.rc)})</bdi>${showD ? `<span>·</span>${ic('map-pin')}<em>${d} كم</em>` : ''}</div>` +
    `<div class="st-tags">${tags.map(g => `<button class="st-tag ${TAGCLS[g[0]]}" data-s="tag" data-i="${i}" data-t="${m.tags.indexOf(g)}">${tagLabel(g, st.lens)}</button>`).join('')}</div>` +
    `</div></div>`;
}
const chip = (label, n, on, attrs, cls = '', extra = '') => `<button class="st-chip ${on ? 'on' : ''} ${cls} ${n === 0 ? 'zero' : ''}" ${attrs}>${extra}${label}${n != null ? `<small>${fmt(n)}</small>` : ''}</button>`;
const plural = n => n === 0 ? 'لا متاجر' : n === 1 ? 'متجر واحد' : n === 2 ? 'متجران' : n <= 10 ? n + ' متاجر' : fmt(n) + ' متجرًا';
const showN = n => n === 0 ? 'لا نتائج' : n === 1 ? 'اعرض متجرًا واحدًا' : n === 2 ? 'اعرض متجرين' : n <= 10 ? `اعرض ${n} متاجر` : `اعرض ${fmt(n)} متجرًا`;

/* ---------- collections in the bands ---------- */
const COLLS = {
  a: {title: 'عروض حسب الطلعة', sub: 'مختارة لك', cards: [['card1', 'طلعات الخبر', 11], ['card2', 'طلعات جدة', 17], ['card3', 'طلعات الرياض', 25]]},
  b: {title: 'قريب منك', sub: 'حسب موقعك: حي الملقا', cards: [['card4', 'تستاهل المشوار', 9], ['card5', 'في طريقك', 32], ['card6', 'على بعد دقائق', 14]]},
};
function collMembers(img, n) {
  const g = rng(img.charCodeAt(4) * 977);
  const pool = ALL.filter(m => hasStore(m)).map(m => [g(), m]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const list = pool.slice(0, n);
  if (img === 'card6' || img === 'card4') list.sort((a, b) => (dist(a) ?? 99) - (dist(b) ?? 99));
  return list;
}
function bandHtml(k) {
  const c = COLLS[k];
  return `<div class="st-band ${k}"><div class="bg" style="background-image:url(${SI('band' + k.toUpperCase())})"></div>` +
    `<button class="see" data-s="colls" data-v="${k}" aria-label="عرض الكل"></button>` +
    `<div class="st-hrow">${c.cards.map(([img], j) => `<button data-s="coll" data-v="${k}${j}" style="background-image:url(${SI(img)})"></button>`).join('')}</div></div>`;
}
const nudgeHtml = () => `<div class="st-nudge" style="background-image:url(${SI('nudge')})"><button data-s="nudgeLater" style="left:81px;top:96px;width:66px"></button><button data-s="locOn" style="left:155px;top:96px;width:139px"></button><button data-s="locOn" style="left:300px;top:16px;width:74px;height:64px"></button></div>`;


/* one sideways mouse-drag for every rail on the page (banners, tiles, chips, tags, bands) */
const HD = {el: null};
function hDown(ev) {
  if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
  const r = ev.target.closest('.st-hrow,.st-tags,.st-banners'); if (!r) return;
  Object.assign(HD, {el: r, sx: ev.clientX, sy: ev.clientY, sl: r.scrollLeft, moved: false});
  dragMoved = false;
  ev.stopPropagation();
}
addEventListener('pointermove', ev => {
  const r = HD.el; if (!r) return;
  const dx = (ev.clientX - HD.sx) / scale;
  if (!HD.moved && Math.abs(dx) > 6) { HD.moved = true; dragMoved = true; r.style.scrollSnapType = 'none'; document.body.classList.add('dragging'); }
  if (HD.moved) r.scrollLeft = HD.sl - dx;
});
addEventListener('pointerup', () => {
  const r = HD.el; if (!r) return; HD.el = null;
  document.body.classList.remove('dragging');
  if (HD.moved) { r.style.scrollSnapType = ''; setTimeout(() => { dragMoved = false; }, 0); }
});

/* ---------- the screen ---------- */
Object.assign(SCR, {
  html_stores: {html: 'stores', label: 'Stores', img: 'sb_mint', h: 844, tabId: 'stores'},
  html_stcoll: {html: 'stcoll', label: 'Stores · collection', img: 'sb_mint', h: 844},
  html_stcolls: {html: 'stcolls', label: 'Stores · collections', img: 'sb_mint', h: 844},
});
const BANNERS = [  // right to left, as in Figma
  {img: 'banner4', go: {lens: 'cash', path: ['retail']}, toastMsg: 'كاش باك على الأزياء والتسوّق'},
  {img: 'banner3', go: {lens: 'offers', otype: 'b11', path: ['food', 'cafes']}, toastMsg: 'عروض 1+1 في المقاهي'},
  {img: 'banner2', go: {lens: 'vouch', within: false, sort: 'cheap'}, toastMsg: 'قسائم تبدأ من 10 ريال'},
  {img: 'banner1', offer: 'o2c'},
];
const tilesHtml = () => {
  const ids = ['all', ...TREE.map(t => t.id)];
  return `<div class="st-hrow st-tiles">${ids.map(id => { const [w] = size('st_tile_' + id); return `<button data-s="cat" data-v="${id === 'all' ? '' : id}" style="width:${w}px;background-image:url(${SI('tile_' + id)})" aria-label="${id}"></button>`; }).join('')}</div>`;
};
function catChips(st, sticky) {
  const p = st.path;
  if (!p.length) {
    if (!sticky) return '';
    return chip('الكل', null, true, 'data-s="cat" data-v=""') +
      TREE.map(t => `<button class="st-chip tinted" data-s="cat" data-v="${t.id}" style="background:${TINT[t.id]}"><span class="cic" style="background-image:url(${SI('ic_' + t.id)})"></span>${t.n}</button>`).join('');
  }
  const top = node(p.slice(0, 1)), l2 = p[1] ? node(p.slice(0, 2)) : null;
  let base, list, sel;
  if (p.length === 1) { base = p; list = top.k; sel = null; }
  else if (p.length === 2 && l2.k) { base = p; list = l2.k; sel = null; }
  else if (p.length === 2) { base = p.slice(0, 1); list = top.k; sel = p[1]; }
  else { base = p.slice(0, 2); list = l2.k; sel = p[2]; }
  return chip('الكل', count(st, {path: base}), !sel, `data-s="path" data-v="${base.join('/')}"`) +
    list.map(x => chip(x.n, count(st, {path: [...base, x.id]}), sel === x.id, `data-s="path" data-v="${[...base, x.id].join('/')}"`)).join('');
}
function pathHtml(st) {
  const p = st.path;
  let h = `<button data-s="path" data-v="">الفئات</button>`;
  for (let i = 0; i < p.length; i++) {
    const n = node(p.slice(0, i + 1));
    h += `${ic('chevron-left')}<button data-s="path" data-v="${p.slice(0, i + 1).join('/')}" class="${i === p.length - 1 ? 'cur' : ''}">${n.n}</button>`;
  }
  return `<div class="st-path">${h}<button class="clr" data-s="path" data-v="">مسح ${ic('x')}</button></div>`;
}
function typesHtml(st) {
  return `<div class="st-hrow st-types">${OTYPES.map(([k, l, dot, cls]) => chip(l === '1+1' || l === '2+1' ? `<span dir="ltr">${l}</span>` : l, count(st, {otype: k}), st.otype === k, `data-s="otype" data-v="${k}"`, st.otype === k ? cls : '', dot && st.otype !== k ? `<i class="dot" style="background:${dot}"></i>` : '')).join('')}</div>`;
}
function lensHtml(st) {
  return `<div class="st-lens">${LENS.map(([k, l, dot]) => `<button data-s="lens" data-v="${k}" class="${st.lens === k ? 'on' : ''}">${l}${dot && st.lens !== k ? `<i style="background:${dot}"></i>` : ''}</button>`).join('')}</div>`;
}
function activeHtml(st) {
  const f = st.f, L = [];
  if (f.none) L.push(['none', 'فلاتر لا تطابق شيئًا']);
  if (f.ch !== 'any') L.push(['ch', f.ch === 'store' ? 'في الفروع' : 'أونلاين']);
  if (f.dist && locOn() && st.lens !== 'cash') L.push(['dist', `حتى ${f.dist} كم`]);
  if (f.rating) L.push(['rating', `${ic('star')}<span dir="ltr">${f.rating}+</span>`]);
  if (st.lens === 'all') f.has.forEach(h => L.push(['has:' + h, {offers: 'فيها عروض', cash: 'فيها كاش باك', vouch: 'فيها قسائم'}[h]]));
  if (f.fav) L.push(['fav', 'المفضلة فقط']);
  if (!L.length) return '';
  return `<div class="st-hrow st-active">${L.map(([k, l]) => `<button class="st-chip" data-s="unf" data-v="${k}">${l}${ic('x', 'x')}</button>`).join('')}${L.length > 1 ? `<button class="st-chip" data-s="unf" data-v="all">مسح الكل</button>` : ''}</div>`;
}
function titleOf(st) {
  if (st.lens === 'offers') return {all: 'العروض', disc: 'خصومات', b11: 'عروض <span dir="ltr">1+1</span>', b21: 'عروض <span dir="ltr">2+1</span>'}[st.otype];
  if (st.lens === 'cash') return 'كاش باك';
  if (st.lens === 'vouch') return st.within ? 'ضمن رصيدك' : 'قسائم';
  return st.path.length ? node(st.path).n : 'كل المتاجر';
}

function dynHtml(st, res) {
  let h = '';
  if (st.lens === 'offers') h += typesHtml(st);
  if (st.lens === 'cash') h += `<div class="st-strip" data-s="cbHow" style="height:114px;background-image:url(${SI('cbstrip')})"></div>`;
  if (st.lens === 'vouch') h += `<div class="st-strip" data-s="balance" style="height:88px;background-image:url(${SI('voustrip')})"><button class="st-switch ${st.within ? '' : 'off'}" data-s="within" aria-label="ضمن رصيدي"></button></div>`;
  h += st.path.length ? pathHtml(st) + `<div class="st-hrow st-subs">${catChips(st)}</div>` : tilesHtml();
  const fc = filterCount(st.f);
  h += `<div class="st-tool"><h2>${titleOf(st)}</h2><span class="st-count">${fmt(res.length)}</span>` +
    `<button class="st-sort" data-s="sort">${ic('arrow-up-down')}<span>${SORTS[sortOf(st)]}</span>${ic('chevron-down')}</button>` +
    `<button class="st-filter" data-s="filter" aria-label="الفلاتر">${ic('sliders-horizontal')}${fc ? `<b>${fc}</b>` : ''}</button></div>`;
  h += activeHtml(st);
  h += `<div class="st-list"></div><div class="st-more"></div><div style="height:${sim.net === 'offline' ? 240 : 180}px"></div>`;
  return h;
}
function itemsHtml(ctx, from, to) {
  const st = ctx.entry.st, res = ctx.res, feed = feedMode(st);
  let h = '';
  for (let i = from; i < Math.min(to, res.length); i++) {
    h += rowHtml(res[i], i, st);
    if (i === 0 && !locOn() && !st.nudgeOff && st.lens !== 'cash') h += nudgeHtml();
    if (feed && i >= 2 && (i - 2) % 5 === 0) h += bandHtml(((i - 2) / 5) % 2 ? 'b' : 'a');
  }
  return h;
}

HTMLR.stores = ctx => {
  const e = ctx.entry, el = ctx.el;
  const st = e.st || (e.st = initState(e.lens, e.preset, e.cat));
  e.label = 'Stores · ' + LENS_LABEL[st.lens];
  el.className = 'layer page st-layer';
  const locLine = locOn()
    ? `<button class="st-loc" data-s="area">${ic('map-pin')}<span>${AREAS[area][0]}</span></button>`
    : `<button class="st-loc off" data-s="locOn">${ic('map-pin')}<span>الموقع غير مفعّل ·</span><b>فعّله</b></button>`;
  el.innerHTML = `<div class="scroll"><div class="st-head" style="background-image:url(${SI('head')})">` +
    `<button class="st-fav" data-s="favs" aria-label="المفضلة"></button><div class="st-title"><h1>المتاجر</h1>${locLine}</div>` +
    `<div class="st-banners">${BANNERS.map((b, i) => `<button data-s="banner" data-v="${i}" style="background-image:url(${SI(b.img)})"></button>`).join('')}</div>` +
    `<div class="st-dots">${BANNERS.map((b, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div></div>` +
    `<div class="st-search" data-s="search" style="background-image:url(${SI('search')})"></div>` +
    `<div class="st-lensrow"></div><div class="st-dyn"></div></div>` +
    `<div class="st-sticky"><div class="sb" style="background-image:url(${SI('sb')})"></div><div class="st-lensrow"></div><div class="st-hrow"></div></div>`;
  const sc = el.querySelector('.scroll');
  ctx.scroll = sc; ctx.canvas = sc.firstChild; ctx.dy = 0;
  ctx.sticky = el.querySelector('.st-sticky');
  // tab bar + map pill
  const tab = document.createElement('div'); tab.className = 'fixed';
  const [, th] = size('s1_tab');
  Object.assign(tab.style, {bottom: 0, height: th + 'px', backgroundImage: `url(${IMG('s1_tab')})`});
  tabs(44).forEach(a => makeHot(tab, a, ctx, 0));
  el.appendChild(tab);
  const pill = document.createElement('div'); pill.className = 'st-pill';
  el.appendChild(pill); ctx.pill = pill;
  if (sim.net === 'offline') {
    const b = document.createElement('div'); b.className = 'e-banner';
    b.innerHTML = `${ic('wifi-off')}<span>لا يوجد اتصال بالإنترنت</span><button data-a="netRetry">إعادة المحاولة</button>`;
    b.style.bottom = '192px'; el.appendChild(b);
  }
  // taps
  el.addEventListener('click', ev => {
    const t = ev.target.closest('[data-s]');
    if (!t || !el.contains(t)) return;
    ev.stopPropagation();
    if (dragMoved) return;
    const f = ACT[t.dataset.s]; if (f) f(ctx, argOf(t), t);
  });
  dragScroll(sc, 'y');
  el.addEventListener('pointerdown', hDown, true);
  const bn = el.querySelector('.st-banners'), dots = el.querySelectorAll('.st-dots i');
  bn.addEventListener('scroll', () => { const i = Math.min(3, Math.round(Math.abs(bn.scrollLeft) / 308)); dots.forEach((d, j) => d.classList.toggle('on', j === i)); }, {passive: true});
  if (typeof autoCarousel === 'function') autoCarousel(bn, BANNERS.length, 308);
  sc.addEventListener('scroll', () => onScroll(ctx), {passive: true});
  draw(ctx, true);
};

function draw(ctx, first) {
  const e = ctx.entry, st = e.st, el = ctx.el;
  e.label = 'Stores · ' + LENS_LABEL[st.lens];
  ctx.res = results(st);
  el.querySelectorAll('.st-lensrow').forEach(x => { x.innerHTML = lensHtml(st); });
  const dyn = el.querySelector('.st-dyn');
  dyn.innerHTML = dynHtml(st, ctx.res);
  const sh = ctx.sticky.querySelector('.st-hrow');
  sh.innerHTML = `<button class="st-chip grid" data-s="top" aria-label="كل الفئات">${ic('layout-grid')}</button>` + (st.path.length ? catChips(st, true) : catChips(st, true));
  ctx.tool = dyn.querySelector('.st-tool');
  ctx.list = dyn.querySelector('.st-list');
  ctx.more = dyn.querySelector('.st-more');
  if (!ctx.res.length) {
    ctx.list.innerHTML = emptyHtml(st);
  } else if (sim.net === 'slow' && !e.loaded && e === top_()) {
    ctx.list.innerHTML = '<div class="st-skel"></div>'.repeat(4);
    setTimeout(() => { if (ctx.list.isConnected) { e.loaded = true; fillList(ctx); } }, 1200);
  } else { e.loaded = true; fillList(ctx); }
  fixTagFades(ctx.el);
  onScroll(ctx);
  if (first) requestAnimationFrame(() => onScroll(ctx));
  if (typeof update === 'function' && !first) update();
}
function fillList(ctx) {
  const st = ctx.entry.st;
  if (!(st.n > 0)) st.n = 12;
  ctx.shown = Math.min(st.n, ctx.res.length);
  ctx.list.innerHTML = itemsHtml(ctx, 0, ctx.shown);
  moreState(ctx);
  fixTagFades(ctx.list);
}
function moreState(ctx) {
  const left = ctx.res.length - ctx.shown;
  ctx.more.innerHTML = left > 0 ? '' : (ctx.res.length > 4 ? `<span>${ic('check')} وصلت لآخر القائمة · ${plural(ctx.res.length)}</span>` : '');
}
function loadMore(ctx) {
  if (ctx.loading || !ctx.entry.loaded || !(ctx.shown >= 0) || ctx.shown >= ctx.res.length) return;
  ctx.loading = true;
  ctx.more.innerHTML = `${ic('loader-circle', 'spin')}<span>نحمّل المزيد</span>`;
  setTimeout(() => {
    ctx.loading = false;
    if (!ctx.more.isConnected) return;
    if (sim.net === 'offline') { ctx.more.innerHTML = `${ic('wifi-off')}<span>تعذّر تحميل المزيد</span><button data-s="more">إعادة المحاولة</button>`; return; }
    const from = ctx.shown, to = from + 10;
    ctx.list.insertAdjacentHTML('beforeend', itemsHtml(ctx, from, to));
    ctx.shown = Math.min(to, ctx.res.length); ctx.entry.st.n = ctx.shown;
    moreState(ctx); fixTagFades(ctx.list);
  }, sim.net === 'slow' ? 1100 : 450);
}
function fixTagFades(root) {
  requestAnimationFrame(() => root.querySelectorAll('.st-tags').forEach(t => { t.classList.toggle('more', t.scrollWidth > t.clientWidth + 2); }));
}
function emptyHtml(st) {
  const why = st.f.none || filterCount(st.f) ? 'جرّب تخفيف الفلاتر أو امسحها.' : st.lens === 'vouch' && st.within ? 'لا قسائم ضمن رصيدك هنا. أطفئ «ضمن رصيدي» لترى الكل.' : 'جرّب فئة أخرى أو عدسة أخرى.';
  return `<div class="st-empty"><div class="e-icon tone-grey">${ic('search-x')}</div><div class="e-title">لا متاجر بهذه الاختيارات</div><div class="e-body">${why}</div>` +
    `<button class="e-btn ink" data-s="clearAll"><span>مسح الفلاتر</span>${ic('rotate-ccw')}</button></div>`;
}
function onScroll(ctx) {
  const sc = ctx.scroll, st = ctx.entry.st;
  if (!ctx.tool || !ctx.tool.isConnected) return;
  const on = sc.scrollTop > ctx.tool.offsetTop - 120;
  ctx.sticky.classList.toggle('on', on);
  const p = ctx.pill;
  if (st.lens === 'cash') p.style.display = 'none';
  else {
    p.style.display = '';
    if (on) {
      if (p.dataset.m !== 's') { p.dataset.m = 's'; Object.assign(p.style, {left: '61px', top: 'auto', bottom: '134px', width: '264px', height: '48px', backgroundImage: `url(${IMG('s2_pill')})`}); p.innerHTML = `<div class="half" data-s="map" style="left:0;width:118px"></div><div class="half" data-s="search" style="left:118px;width:146px"></div>`; }
    } else if (p.dataset.m !== 'm') {
      const [w, h] = size('s1_pill'); p.dataset.m = 'm';
      Object.assign(p.style, {left: '129px', top: 'auto', bottom: '122px', width: w + 'px', height: h + 'px', backgroundImage: `url(${IMG('s1_pill')})`});
      p.innerHTML = `<div class="half" data-s="map" style="left:8px;top:8px;bottom:auto;width:115px;height:48px"></div>`;
    }
  }
  if (sc.scrollTop + sc.clientHeight > sc.scrollHeight - 700) loadMore(ctx);
}
// after a change made from far down the page, bring the list start under the sticky header
function keepPlace(ctx, was) {
  if (was > ctx.tool.offsetTop - 120) ctx.scroll.scrollTop = ctx.tool.offsetTop - 153;
}
function change(ctx, f) {
  const st = ctx.entry.st, was = ctx.scroll.scrollTop;
  f(st); st.n = 12; ctx.entry.loaded = true;
  draw(ctx);
  keepPlace(ctx, was);
}

/* ---------- actions ---------- */
const mOf = (ctx, i) => ctx.res[+i];
const argOf = t => t.dataset.v ?? t.dataset.i ?? t.dataset.b;
function openOffer(kind, m) {
  const v = kind === 'code' ? 'o2b' : kind === 'disc' && m && m.ch === 'both' ? 'o2c' : 'o2a';
  if (cfg.offer !== v) { cfg.offer = v; saveCfg(); seg('c-offer', 'offer'); }
  push({t: 'offer', mode: 'tall', flow: 1});
}
function openMerchantFor(ctx, m) {
  const b = BASE[m.b];
  let v = cfg.merchant;
  if (b.m === 'c2' || b.m === 'c3') v = b.m;
  else if (b.m === 'c1' && !v.startsWith('c1')) v = 'c1a';
  if (v !== cfg.merchant) { cfg.merchant = v; saveCfg(); seg('c-merchant', 'merchant'); }
  act_('merchant', ctx);
}
const ACT = {
  favs: () => E.openFavs(),
  search: () => E.openSearch(''),
  map: () => toast('map'),
  locOn: () => E.askLocation(),
  area: ctx => openArea(ctx),
  banner: (ctx, v) => {
    const b = BANNERS[+v];
    if (b.offer) { if (cfg.offer !== b.offer) { cfg.offer = b.offer; saveCfg(); seg('c-offer', 'offer'); } return push({t: 'offer', mode: 'tall', flow: 1}); }
    change(ctx, st => { Object.assign(st, {lens: b.go.lens, path: b.go.path || [], otype: b.go.otype || 'all', f: F0()}); if (b.go.within != null) st.within = b.go.within; if (b.go.sort) st.sorts[b.go.lens] = b.go.sort; });
    ctx.scroll.scrollTo({top: 220, behavior: 'smooth'});
    toast(b.toastMsg);
  },
  lens: (ctx, v) => change(ctx, st => { if (st.lens === v) return; st.lens = v; st.otype = 'all'; }),
  otype: (ctx, v) => change(ctx, st => { st.otype = v; }),
  cat: (ctx, v) => change(ctx, st => { st.path = v ? [v] : []; }),
  path: (ctx, v) => change(ctx, st => { st.path = v ? v.split('/') : []; }),
  top: ctx => ctx.scroll.scrollTo({top: 200, behavior: 'smooth'}),
  within: (ctx) => { change(ctx, st => { st.within = !st.within; }); toast(ctx.entry.st.within ? 'نعرض القسائم ضمن رصيدك فقط' : 'نعرض كل القسائم'); },
  balance: () => toast('رصيدك 1,250 نقطة'),
  cbHow: () => openCbHow(),
  sort: ctx => openSort(ctx),
  filter: ctx => openFilter(ctx),
  unf: (ctx, v) => change(ctx, st => {
    if (v === 'all') { st.f = F0(); return; }
    if (v.startsWith('has:')) st.f.has = st.f.has.filter(h => h !== v.slice(4));
    else st.f[v] = F0()[v];
  }),
  clearAll: ctx => { change(ctx, st => { st.f = F0(); st.otype = 'all'; if (st.lens === 'vouch' && st.within && !count(st)) st.within = false; if (!count(st)) st.path = []; }); toast('مسحنا الفلاتر'); },
  m: (ctx, i) => openMerchantFor(ctx, mOf(ctx, i)),
  fav: (ctx, b, t) => {
    const k = 'st:' + b, on = !favs.has(k);
    if (on) favs.add(k); else favs.delete(k);
    ctx.el.querySelectorAll(`.st-heart[data-b="${b}"]`).forEach(h => { h.classList.toggle('on', on); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); });
    toast(on ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
    if (ctx.entry.st && ctx.entry.st.f.fav && !on) setTimeout(() => change(ctx, () => {}), 350);
  },
  tag: (ctx, i, t) => {
    const m = mOf(ctx, i), g = m.tags[+t.dataset.t];
    if (g[0] === 'vou') return openVoucher(m);
    if (g[0] === 'cb') return openCashback(m, g[1]);
    openOffer(g[0], m);
  },
  nudgeLater: ctx => { change(ctx, st => { st.nudgeOff = true; }); toast('نذكّرك لاحقًا'); },
  more: ctx => { ctx.loading = false; loadMore(ctx); },
  colls: (ctx, k) => push({t: 'html', key: 'stcolls', k}),
  coll: (ctx, v) => push({t: 'html', key: 'stcoll', k: v[0], j: +v[1]}),
};

/* ---------- sheets ---------- */
function openSort(ctx) {
  const st = ctx.entry.st, cur = sortOf(st);
  E.openSheet({label: 'Stores · sort', title: 'رتّب حسب',
    html: `<ul class="st-opts">${LENS_SORTS[st.lens].map(k => `<li data-k="${k}" class="${k === cur ? 'on' : ''}"><span class="lic">${ic(SORT_IC[k])}</span><div style="flex:1;text-align:right">${SORTS[k]}<small>${k === 'near' && !locOn() ? 'يحتاج تفعيل الموقع' : SORT_SUB[k]}</small></div><span class="rd">${k === cur ? ic('check') : ''}</span></li>`).join('')}</ul>`,
    secondary: {label: 'إغلاق'},
    mount: (p, c) => p.querySelectorAll('li').forEach(li => li.onclick = ev => {
      ev.stopPropagation();
      const k = li.dataset.k;
      E.closeSheet(c);
      if (k === 'near' && !locOn()) { toast('فعّل الموقع لنرتّب حسب المسافة'); setTimeout(() => E.askLocation(), 400); st.sorts[st.lens] = 'near'; return; }
      setTimeout(() => change(ctx, s => { s.sorts[s.lens] = k; }), 200);
    })});
}
function openFilter(ctx) {
  const st = ctx.entry.st;
  const f = JSON.parse(JSON.stringify(st.f)); f.none = false;
  const segBtns = (key, opts) => `<div class="st-seg" data-key="${key}">${opts.map(([v, l, dot]) => `<button data-v="${v}" class="${String(f[key]) === String(v) ? 'on' : ''}">${dot ? `<i class="dot" style="background:${dot}"></i>` : ''}${l}</button>`).join('')}</div>`;
  const html = () =>
    (st.lens !== 'cash' ? `<div class="st-sec">طريقة الاستخدام</div>${segBtns('ch', [['any', 'الكل'], ['store', 'في الفروع'], ['online', 'أونلاين']])}` : '') +
    (st.lens !== 'cash' ? `<div class="st-sec">المسافة</div>` + (locOn() ? segBtns('dist', [[0, 'أي مسافة'], [1, '1 كم'], [3, '3 كم'], [5, '5 كم'], [10, '10 كم']])
      : `<div class="st-seg"><button data-loc="1">${ic('map-pin')}فعّل الموقع لتصفية حسب المسافة</button></div>`) : '') +
    `<div class="st-sec">التقييم</div>${segBtns('rating', [[0, 'الكل'], [4, '<span dir="ltr">4+</span>'], [4.5, '<span dir="ltr">4.5+</span>']])}` +
    (st.lens === 'all' ? `<div class="st-sec">يقدّم</div><div class="st-seg" data-multi="has">${[['offers', 'عروض', '#00ffa8'], ['cash', 'كاش باك', '#00def9'], ['vouch', 'قسائم', '#bb8fff']].map(([v, l, dot]) => `<button data-v="${v}" class="${f.has.includes(v) ? 'on' : ''}"><i class="dot" style="background:${dot}"></i>${l}</button>`).join('')}</div>` : '') +
    `<div class="st-tgl" data-tgl="fav"><span>المفضلة فقط</span><span class="st-switch ${f.fav ? '' : 'off'}"></span></div>` +
    `<button class="e-btn ink" data-go="1"><span></span>${ic('check')}</button><button class="e-link" data-clr="1">مسح الكل</button>`;
  E.openSheet({label: 'Stores · filters', title: 'الفلاتر', html: '<div class="st-f"></div>',
    mount: (p, c) => {
      const box = p.querySelector('.st-f');
      const paint = () => {
        box.innerHTML = html();
        const n = count(st, {f});
        const go = box.querySelector('[data-go]');
        go.querySelector('span').textContent = showN(n);
        go.classList.toggle('dim', !n);
        box.querySelectorAll('.st-seg[data-key] button').forEach(b => b.onclick = ev => { ev.stopPropagation(); const k = b.parentNode.dataset.key; f[k] = k === 'ch' ? b.dataset.v : +b.dataset.v; paint(); });
        box.querySelectorAll('.st-seg[data-multi] button').forEach(b => b.onclick = ev => { ev.stopPropagation(); const v = b.dataset.v; f.has = f.has.includes(v) ? f.has.filter(x => x !== v) : [...f.has, v]; paint(); });
        box.querySelectorAll('[data-loc]').forEach(b => b.onclick = ev => { ev.stopPropagation(); E.closeSheet(c); setTimeout(() => E.askLocation(), 380); });
        box.querySelector('[data-tgl]').onclick = ev => { ev.stopPropagation(); f.fav = !f.fav; paint(); };
        go.onclick = ev => { ev.stopPropagation(); if (!n) { E.shake(go); toast('لا نتائج بهذه الفلاتر'); return; } E.closeSheet(c); setTimeout(() => change(ctx, s => { s.f = f; }), 200); };
        box.querySelector('[data-clr]').onclick = ev => { ev.stopPropagation(); Object.assign(f, F0()); paint(); };
      };
      paint();
    }});
}
function openArea(ctx) {
  E.openSheet({label: 'Stores · location', title: 'تصفّح المتاجر قرب',
    html: `<ul class="st-opts">${AREAS.map(([n, s], i) => `<li data-i="${i}" class="${i === area ? 'on' : ''}"><span class="lic">${ic(i ? 'map-pin' : 'navigation')}</span><div style="flex:1;text-align:right">${n}<small>${s || 'عنوان محفوظ'}</small></div><span class="rd">${i === area ? ic('check') : ''}</span></li>`).join('')}` +
      `<li data-add="1"><span class="lic">${ic('plus')}</span><div style="flex:1;text-align:right">أضف عنوانًا<small>ابحث عن حي أو اختر من الخريطة</small></div></li></ul>`,
    secondary: {label: 'إغلاق'},
    mount: (p, c) => p.querySelectorAll('li').forEach(li => li.onclick = ev => {
      ev.stopPropagation(); E.closeSheet(c);
      if (li.dataset.add) return toast('إضافة عنوان خارج النموذج');
      area = +li.dataset.i;
      setTimeout(() => { rebuild(ctx); toast('نعرض المسافات من ' + AREAS[area][0]); }, 250);
    })});
}
function rebuild(ctx) { const y = ctx.scroll.scrollTop; unmount(ctx.entry, 'none'); mount(ctx.entry, 'none'); ctx.entry.ctx.scroll.scrollTop = y; update(); }
const mhead = (m, line) => `<div class="st-mhead"><div class="ph" style="background-image:url(${SI('ph_' + m.b)})"></div><div><b>${m.n}</b><span>${line}</span></div></div>`;
function openCbHow() {
  E.openSheet({label: 'Cashback · how it works', icon: 'coins', tone: 'cyan', title: 'كيف يعمل الكاش باك؟',
    html: `<ul class="st-steps"><li><div><b>ابدأ التسوّق من ولاء بلس</b><span>نفتح لك موقع المتجر أو تطبيقه مربوطًا بحسابك.</span></div></li>` +
      `<li><div><b>اشترِ كالمعتاد أونلاين</b><span>الكاش باك على المشتريات المؤهلة أونلاين فقط.</span></div></li>` +
      `<li><div><b>يرجع لمحفظتك نقاطًا</b><span>بعد ما يتأكد طلبك، عادة خلال 30 يومًا.</span></div></li></ul>`,
    primary: {label: 'فهمت'}});
}
function openCashback(m, v) {
  E.openSheet({label: 'Cashback · ' + m.n, title: `اكسب ${ltr(v + '%')} كاش باك`,
    html: mhead(m, `كاش باك ${ltr(v + '%')} · أونلاين`) +
      `<ul class="st-steps"><li><div><b>ابدأ من هنا</b><span>نفتح ${m.n} مربوطًا بحسابك في ولاء بلس.</span></div></li>` +
      `<li><div><b>أكمل طلبك أونلاين</b><span>على المشتريات المؤهلة، ولا يُجمع مع أكواد خصم أخرى.</span></div></li>` +
      `<li><div><b>يرجع لك ${ltr(v + '%')} نقاطًا</b><span>بعد تأكيد الطلب، عادة خلال 30 يومًا.</span></div></li></ul>`,
    primary: {label: 'تسوّق الآن', icon: 'arrow-left', f: (c, b) => {
      if (sim.net === 'offline') { E.shake(b); toast('تحتاج اتصالًا لفتح المتجر'); return; }
      E.closeSheet(c); toast('نفتح ' + m.n + ' (خارج النموذج)');
    }},
    secondary: {label: 'إغلاق'}});
}
const PEOPLE = ['سارة', 'محمد', 'نورة', 'خالد'];
function openVoucher(m) {
  const base = minVou(m);
  const vals = [...new Set([base, base * 2, base * 5].map(v => Math.min(v, 1000)))];
  const s = {v: vals.find(v => v * PPR <= POINTS) || vals[0], gift: false, who: null, done: false};
  const exp = '21 نوفمبر 2027';
  const where = m.ch === 'online' ? 'تستخدمها أونلاين في موقع المتجر أو تطبيقه' : m.ch === 'store' ? 'تستخدمها في الفروع: أعطِ الكود للكاشير' : 'في الفروع أو أونلاين';
  E.openSheet({label: 'Voucher · ' + m.n, title: '', html: '<div class="st-v"></div>',
    mount: (p, c) => {
      const box = p.querySelector('.st-v');
      p.querySelector('.e-title').remove();
      const paint = () => {
        if (s.done) {
          box.innerHTML = `<div class="e-icon tone-mint">${ic('circle-check')}</div><div class="e-title">${s.gift ? `أرسلنا الهدية إلى ${s.who}` : 'القسيمة في محفظتك'}</div>` +
            `<div class="e-body">قسيمة <span dir="ltr">${s.v}</span> ريال من ${m.n}، صالحة حتى ${exp}.${s.gift ? ' سيصلها إشعار الآن.' : ''}</div>` +
            (s.gift ? '' : `<div class="st-code"><span>WP-${4800 + s.v}-${1193 + base}</span><button class="ov-pill" data-copy="1"><span>نسخ</span>${ic('copy')}</button></div>`) +
            `<button class="e-btn ink" data-ok="1"><span>تم</span>${ic('check')}</button>` + (s.gift ? '' : `<button class="e-link" data-wal="1">افتح المحفظة</button>`);
          const cp = box.querySelector('[data-copy]'); if (cp) cp.onclick = ev => { ev.stopPropagation(); toast('copied'); };
          box.querySelector('[data-ok]').onclick = ev => { ev.stopPropagation(); E.closeSheet(c); };
          const w = box.querySelector('[data-wal]'); if (w) w.onclick = ev => { ev.stopPropagation(); E.closeSheet(c); setTimeout(() => toast('المحفظة خارج النموذج'), 300); };
          return;
        }
        const pts = s.v * PPR, ok = pts <= POINTS;
        box.innerHTML = mhead(m, `قسائم ${m.c ? '· ' + m.c : ''}`) +
          `<div class="st-sec">اختر القيمة</div><div class="st-vals">${vals.map(v => `<button data-v="${v}" class="${v === s.v ? 'on' : ''} ${v * PPR > POINTS ? 'no' : ''}"><b><span dir="ltr">${fmt(v)}</span>${RIYAL}</b><span>${fmt(v * PPR)} نقطة</span></button>`).join('')}</div>` +
          `<div class="st-seg" data-k="for"><button data-f="me" class="${s.gift ? '' : 'on'}">${ic('user')}لي</button><button data-f="gift" class="${s.gift ? 'on' : ''}">${ic('gift')}هدية لزميل أو قريب</button></div>` +
          (s.gift ? `<div class="st-who">${PEOPLE.map(n => `<button data-w="${n}" class="${s.who === n ? 'on' : ''}">${n}</button>`).join('')}<button data-w="+">${ic('plus')}</button></div>` : '') +
          `<ul class="e-list" style="margin-bottom:14px">${E.mini('violet', 'calendar', 'صالحة سنة من الشراء', 'تنتهي ' + exp)}${E.mini('grey', 'store', where, 'الكود يظهر في محفظتك بعد الشراء')}${E.mini(ok ? 'mint' : 'amber', 'wallet', `رصيدك ${fmt(POINTS)} نقطة`, ok ? `يتبقى لك ${fmt(POINTS - pts)} نقطة بعد الشراء` : `ينقصك ${fmt(pts - POINTS)} نقطة لهذه القيمة`)}</ul>` +
          `<button class="e-btn ${ok ? 'ink' : 'dim'}" data-buy="1"><span>${ok ? (s.gift ? 'أهدِ' : 'اشترِ') + ` بـ ${fmt(pts)} نقطة` : 'اشحن رصيدك'}</span>${ic(ok ? (s.gift ? 'gift' : 'ticket') : 'plus')}</button><button class="e-link" data-x="1">إغلاق</button>`;
        box.querySelectorAll('.st-vals button').forEach(b => b.onclick = ev => { ev.stopPropagation(); s.v = +b.dataset.v; paint(); });
        box.querySelectorAll('[data-f]').forEach(b => b.onclick = ev => { ev.stopPropagation(); s.gift = b.dataset.f === 'gift'; paint(); });
        box.querySelectorAll('[data-w]').forEach(b => b.onclick = ev => { ev.stopPropagation(); if (b.dataset.w === '+') return toast('اختيار جهة اتصال خارج النموذج'); s.who = b.dataset.w; paint(); });
        box.querySelector('[data-x]').onclick = ev => { ev.stopPropagation(); E.closeSheet(c); };
        box.querySelector('[data-buy]').onclick = ev => {
          ev.stopPropagation(); const b = ev.currentTarget;
          if (!ok) return toast('شحن الرصيد خارج النموذج');
          if (sim.net === 'offline') { E.shake(b); return toast('تحتاج اتصالًا لشراء القسيمة'); }
          if (s.gift && !s.who) { E.shake(box.querySelector('.st-who')); return toast('اختر لمن الهدية'); }
          b.innerHTML = `<span>نتمّ الشراء</span>${ic('loader-circle', 'spin')}`;
          setTimeout(() => { if (!box.isConnected) return; s.done = true; paint(); }, sim.net === 'slow' ? 1500 : 700);
        };
      };
      paint();
    }});
}

/* ---------- collection pages ---------- */
function collList(ctx, list) {
  ctx.res = list;
  const st = {lens: 'all', otype: 'all', f: F0()};
  return list.map((m, i) => rowHtml(m, i, st)).join('');
}
function collShell(ctx, title, body) {
  const el = ctx.el; el.className = 'layer page st-layer st-cpage';
  el.innerHTML = `<div class="hpage"><div class="sb" style="background-image:url(${IMG('sb_mint')})"></div><div class="hbody">` +
    `<div class="s-head"><button class="rbtn" data-s="back">${ic('chevron-right')}</button><div class="e-title" style="margin:0;flex:1;text-align:right">${title}</div></div>${body}</div></div>`;
  ctx.scroll = el.querySelector('.hbody');
  dragScroll(ctx.scroll, 'y');
  el.addEventListener('pointerdown', hDown, true);
  el.addEventListener('click', ev => {
    const t = ev.target.closest('[data-s]'); if (!t || dragMoved) return; ev.stopPropagation();
    const a = t.dataset.s, v = argOf(t);
    if (a === 'back') return act_('back', ctx);
    if (a === 'coll') return push({t: 'html', key: 'stcoll', k: v[0], j: +v[1]});
    const f = ACT[a]; if (f) f(ctx, v, t);
  });
}
HTMLR.stcoll = ctx => {
  const e = ctx.entry, c = COLLS[e.k], [img, name, n] = c.cards[e.j];
  const list = collMembers(img, n);
  e.label = 'Collection · ' + img;
  collShell(ctx, name, `<div class="st-chero" style="background-image:url(${SI('cov' + img.slice(4))})"><div><b>${name}</b><span>${plural(n)} · ${c.title}</span></div></div>` +
    `<div class="st-list" style="padding-top:4px">${collList(ctx, list)}</div>`);
  fixTagFades(ctx.el);
};
HTMLR.stcolls = ctx => {
  const c = COLLS[ctx.entry.k];
  collShell(ctx, c.title, `<div class="s-sec"><h3>${c.sub}</h3><span class="s-count">${c.cards.length} مجموعات</span></div>` +
    `<div class="st-cgrid">${c.cards.map(([img], j) => `<button data-s="coll" data-v="${ctx.entry.k}${j}" style="background-image:url(${SI(img)})"></button>`).join('')}</div>`);
};

/* ---------- hooks into the rest of the prototype ---------- */
const prevEdge = window.edgeAct;
window.edgeAct = function (act, ctx, hs) {
  const [a, arg] = act.split(/:(.*)/s);
  if (a === 'stores') {
    const t = top_();
    if (t.t === 'stores' && t.ctx && t.ctx.res) { const L = initState(arg).lens; change(t.ctx, st => { st.lens = L; st.otype = 'all'; }); return true; }
    push({t: 'stores', lens: arg});
    return true;
  }
  return prevEdge(act, ctx, hs);
};
window.STORES_ONS = (t, add) => {
  const st = t.st; if (!st) return;
  const ctx = t.ctx;
  add('No matches for these filters', 'empty list with "clear filters"', () => change(ctx, s => { s.f.none = true; }), st.f.none);
  add('Favourites only', 'filter shows hearted stores', () => change(ctx, s => { s.f.fav = true; }), st.f.fav);
  add('Pick another area', 'distances change', () => openArea(ctx));
  add('Offers lens · 1+1 in food', 'Figma S4', () => change(ctx, s => { Object.assign(s, {lens: 'offers', path: ['food'], otype: 'b11', f: F0()}); }), st.lens === 'offers' && st.otype === 'b11' && st.path.join() === 'food');
};
})();
