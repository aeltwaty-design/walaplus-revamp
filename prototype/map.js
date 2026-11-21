/* ---------- Home map card (حولك الآن): live radar and rotating highlight ----------
   Rebuilt in HTML from Figma Map card 441:420 (Aramco 585:4333), drawn over the Home image.
   Rings ping out from "my location" with a slow sweep of the accent glow; the merchant pins
   take the highlight one at a time (accent fill + distance). */
const HM_ART = '/*MAPART*/';
const HM_ARC = 'M4.12132 3.16085C2.67187 3.12592 1.22243 2.60202 0 1.64154L1.22243 0.0698519C2.1829 0.820771 3.31802 1.20496 4.43567 1.17003C5.466 1.13511 6.35661 0.733456 6.91544 0L8.48713 1.22243C7.54411 2.42739 6.12959 3.10846 4.48804 3.16085C4.3658 3.17831 4.24356 3.17831 4.12132 3.16085Z';
const HM_LOCATE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.16" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12H5"/><path d="M19 12H22"/><path d="M12 2V5"/><path d="M12 19V22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>';
const HM_MAPICON = c => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>`;
// pins as in Figma (left, top, corner radius, logo box); distances other than Radisson's 0.8 are made up from the map scale
const HM_PINS = [
  {k: 'radisson', v: '25%', d: '0.8', top: 43, right: 358 - 295, r: 8, logo: {w: 64, h: 26, r: 8, b: 1}},
  {k: 'br', v: '2+1', d: '1.1', top: 114, right: 358 - 294.5, r: 8, logo: {w: 28.5, h: 24, r: 6, b: .375}},
  {k: 'thirty', v: '1+1', d: '1.4', top: 126, left: 65, r: 8, logo: {w: 24, h: 24, r: 6, b: .375}},
  {k: 'bassami', v: '15%', d: '1.8', top: 67, left: 25, r: 999, logo: {w: 26, h: 26, r: 12, b: 1}},
  {k: 'chuck', v: '20%', d: '1.3', top: 12, left: 92, r: 8, logo: {w: 24, h: 24, r: 6, b: .375}},
];
const HM_THEME = {wala: ['#00FFA8', '0,255,168', '#111'], aramco: ['#47A1C1', '71,161,193', '#000']};

function makeHomeMap(m, ctx, dy) {
  const [acc, rgb, ink] = HM_THEME[m.theme] || HM_THEME.wala;
  const el = document.createElement('div'); el.className = 'hm';
  el.style.top = (m.y - dy) + 'px';
  el.style.setProperty('--acc', acc); el.style.setProperty('--acc-rgb', rgb); el.style.setProperty('--acc-ink', ink);
  let mos = '';
  for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) mos += `<path transform="translate(${3.76 + 12 * i} ${10.41 + 16 * j})" d="${HM_ARC}"/>`;
  // logo tiles: each Figma tile (with its border), cut from the Home export with rounded transparent corners (map_src)
  const logo = (k, L) => `<i class="lg" style="width:${L.w}px;height:${L.h}px;background-image:url(${IMG('mp_' + k)})"></i>`;
  const pins = HM_PINS.map((p, i) => {
    const pos = p.left != null ? `left:${p.left}px;transform-origin:left center;` : `right:${p.right}px;transform-origin:right center;`;
    return `<div class="mp" data-i="${i}" style="top:${p.top}px;${pos}border-radius:${p.r}px"><p dir="rtl"><span>${p.v}</span><span class="d"> · ${p.d} كم</span></p>${logo(p.k, p.logo)}</div>`;
  }).join('');
  el.innerHTML = `<div class="art">${HM_ART}</div>` +
    `<svg class="mos" width="56" height="42" viewBox="0 0 56 42" fill="${acc}">${mos}</svg>` +
    `<p class="road" dir="rtl">طريق الملك فهد</p>` +
    `<div class="radar"><i class="glow"></i><i class="sweep"></i><i class="ring"></i><i class="ring"></i><i class="ring"></i><i class="halo"></i><i class="me"></i></div>` +
    pins +
    `<div class="cluster">+12</div><div class="locate">${HM_LOCATE}</div>` +
    `<div class="bar"><div class="btn">${HM_MAPICON(ink)}<span>افتح الخريطة</span></div><div class="sum"><b dir="rtl">18 متجرا و32 عرضا</b><span dir="rtl">ضمن 2 كم منك</span></div></div>`;
  const all = [...el.querySelectorAll('.mp')];
  let on = 0;
  const show = i => all.forEach((p, j) => p.classList.toggle('on', j === i));
  show(0);
  const t = setInterval(() => {
    if (!el.isConnected) return clearInterval(t);
    const top = top_();
    if (document.hidden || !top || top.el !== el.closest('.layer')) return;
    on = (on + 1) % all.length; show(on);
  }, 2600);
  return el;
}
