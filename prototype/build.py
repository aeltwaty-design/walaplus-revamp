#!/usr/bin/env python3
"""Builds the WalaPlus Final UI prototype.
Inputs: ex/*.png (2x exports from Figma page Final UI), brand fonts.
Outputs: site/index.html, site/img/*.webp, site/fonts/*.
Run from this folder: python3 build.py <export dir> <fonts dir>"""
import json, os, re, sys, shutil, glob
from PIL import Image, ImageDraw

EX = sys.argv[1] if len(sys.argv) > 1 else 'ex'
FONTS = sys.argv[2] if len(sys.argv) > 2 else '/mnt/project-files/brand-fonts'
OUT = 'site'
os.makedirs(OUT + '/img', exist_ok=True)
os.makedirs(OUT + '/fonts', exist_ok=True)
S = 3  # export scale (3x = iPhone-class sharpness)
M = {'img': {}, 'bg': {}, 'col': {}}
REUSE = os.environ.get('REUSE') == '1'  # skip the slow lossless encode for images already built

def load(n):
    return Image.open(f'{EX}/{n}.png').convert('RGBA')

import corners  # screens are plain rectangles: fill the dark rounded corners of the exports
corners.init(load)
def load_sq(n):
    return corners.square(load(n))

def save(im, name, q=None, force=False):
    M['img'][name] = [im.width // S, im.height // S]
    if REUSE and not force and os.path.exists(f'{OUT}/img/{name}.webp'):
        return
    # lossless: no chroma blur on small text or coloured edges
    im.save(f'{OUT}/img/{name}.webp', 'WEBP', lossless=True, quality=70, method=4, exact=False)
    M['img'][name] = [im.width // S, im.height // S]

def cols(im, name):
    # colour at x = 8 css px every 8 css px: edge-case overlays match the background
    M['col'][name] = [rgb(im.getpixel((8 * S, min(im.height - 1, y * S)))) for y in range(0, im.height // S, 8)]

def rgb(px):
    return '#%02x%02x%02x' % px[:3]

def notch(t):
    """Tab bar: the ring around the scan button (centre 195,50 in the crop, button r 40, ring to r 48)
    becomes a real gap cut from the bar, so the page shows through it."""
    k = 4
    big = Image.new('L', (t.width * k, t.height * k), 255)
    d = ImageDraw.Draw(big)
    cx, cy = 195 * S * k, 50 * S * k
    R, r = int(48.6 * S * k), 40 * S * k  # 48.6: also clears the soft edge the original 48 mask left
    d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=0)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    keep = np.asarray(big.resize(t.size, Image.LANCZOS)).astype(float) / 255
    a = np.asarray(t).astype(float)
    yy, xx = np.mgrid[0:t.height, 0:t.width]
    dist = np.hypot(xx + .5 - 195 * S, yy + .5 - 50 * S)
    edge = (dist > (40 - 1.5) * S) & (dist < 44 * S)
    a[edge, :3] = 17  # the button's own black, so its edge does not keep a light fringe
    a[..., 3] *= keep
    return Image.fromarray(np.clip(a + .5, 0, 255).astype(np.uint8), 'RGBA')

def round_mask(w, h, r, top_only=True):
    m = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, w - 1, h - 1 + (r * 2 if top_only else 0)), r, fill=255)
    return m

import numpy as np
GREY, INK = 152.0, 18.0

def page_rows(main, y, rh):
    """Page colour for each 3x row of a rail: the frame's right gutter when it is light, else the page mint."""
    page = np.array(main.getpixel((389 * S - 2, main.height - 300 * S))[:3], float)
    out = []
    for yy in range(y * S, (y + rh) * S):
        c = np.array(main.getpixel((389 * S - 2, min(main.height - 1, yy)))[:3], float)
        out.append(c if c.min() > 200 and abs(c - page).max() < 24 else page)
    return np.array(out)

def degrey(im, xo, rows):
    """Replace the grey canvas (and card shadows or text edges drawn over it) left of x = xo with the page colour."""
    a = np.asarray(im).astype(float)
    reg = a[:, :xo]
    mx, mn = reg.max(2), reg.min(2)
    v = reg.mean(2)
    neutral = (mx - mn) <= 6
    cand = neutral & (v >= 110) & (v <= 160)
    flat = np.ones_like(neutral)
    for dy, dx in ((2, 0), (-2, 0), (0, 2), (0, -2)):
        flat &= np.abs(v - np.roll(np.roll(v, dy, 0), dx, 1)) <= 2
    # pure grey, plus the flat shadow-darkened grey in gaps between cards
    grown = neutral & ((mx - mn) <= 3) & flat & (v >= 136) & (v <= 156)
    for _ in range(40):  # grow from the pure grey into shadows and text edges, not deep into photos
        g = grown.copy()
        g[1:] |= grown[:-1]; g[:-1] |= grown[1:]; g[:, 1:] |= grown[:, :-1]; g[:, :-1] |= grown[:, 1:]
        g &= cand
        if (g == grown).all(): break
        grown = g
    al = np.clip((GREY - v) / (GREY - INK), 0, 1)[..., None]
    T = rows[:, None, :]
    new = T * (1 - al) + INK * al
    reg[grown] = new[grown]
    a[:, :xo] = reg
    return Image.fromarray(np.clip(a + .5, 0, 255).astype(np.uint8)).convert('RGBA')

# ---- Homes ----
OX, OY = 830, 14
HOMES = {'home1': 4237, 'home2': 4237, 'home3': 4211}
RAILS = [  # y, h, minX (Home 1 coordinates)
    (113, 172, -680), (461, 96, -830), (1307, 400, -358), (1799, 104, -227),
    (1999, 204, -334), (2789, 88, -38), (2993, 168, -298), (3249, 160, -290),
    (3537, 188, -198), (3793, 128, -242), (4009, 96, -602)]

def shift3(y):
    if y < 81: return y
    if y <= 556: return y + 102
    return y - 26

for name, h in HOMES.items():
    src = load(name)
    main = src.crop((OX * S, OY * S, (OX + 390) * S, (OY + h) * S))
    save(main, name)
    cols(main, name)
    M['bg'][name] = rgb(main.getpixel((390, main.height - 4)))
    tab_top = h - 84
    t = main.crop((0, (tab_top - 44) * S, 390 * S, h * S))
    mask = Image.new('L', t.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 44 * S, t.width - 1, t.height + 2 * 28 * S), 28 * S, fill=255)  # square bottom corners
    d.ellipse(((195 - 48) * S, (50 - 48) * S, (195 + 48) * S, (50 + 48) * S), fill=255)
    t.putalpha(Image.composite(t.getchannel('A'), Image.new('L', t.size, 0), mask))
    save(notch(t), name + '_tab', force=True)
    for i, (y, rh, minx) in enumerate(RAILS):
        if name == 'home3': y = shift3(y)
        x0 = (OX + minx) * S
        reg = src.crop((x0, (OY + y) * S, (OX + 390) * S, (OY + y + rh) * S))
        # the export has a grey (152) canvas left of the frame: swap it for the page colour of each row
        bg = degrey(reg.convert('RGB'), -minx * S, page_rows(main, y, rh))
        save(bg, f'{name}_r{i}', force=True)
        M.setdefault('edge', {})[f'{name}_r{i}'] = [
            rgb(tuple(int(v) for v in np.median(np.asarray(main.crop((0, (y - 3) * S, 390 * S, (y - 3) * S + 1)).convert('RGB')).reshape(-1, 3), 0))),
            rgb(tuple(int(v) for v in np.median(np.asarray(main.crop((0, (y + rh + 2) * S, 390 * S, (y + rh + 2) * S + 1)).convert('RGB')).reshape(-1, 3), 0)))]
    ty = 2319 if name != 'home3' else 2293
    M['bg'][name + '_flip'] = rgb(main.getpixel((6 * S, (ty + 180) * S)))

# Home 3 spacer: one row just above the split, stretched
h3 = Image.open(f'{OUT}/img/home3.webp').convert('RGBA')
row = h3.crop((0, 193 * S, 390 * S, 194 * S)).resize((390 * S, 8))
save(row, 'home3_spacer')

# ---- straight copies ----
# ---- Today's pick faces: card on a transparent ground, its shadow kept as alpha ----
for n in ['tp_front', 'tp_back']:
    im = load(n).convert('RGB')
    card = Image.new('L', (im.width * 4, im.height * 4), 0)
    ImageDraw.Draw(card).rounded_rectangle((60 * 4, 42 * 4, 1134 * 4 - 1, 1131 * 4 - 1), 60 * 4, fill=255)
    card = card.resize(im.size, Image.LANCZOS)
    g = np.asarray(im).astype(float).min(2)
    sh = Image.fromarray(np.clip((255 - g) / (255 - INK) * 255, 0, 255).astype(np.uint8))
    shadow = Image.new('RGBA', im.size, (18, 18, 18, 0)); shadow.putalpha(sh)
    face = im.convert('RGBA'); face.putalpha(card)
    shadow.alpha_composite(face)
    save(shadow, n, force=True)
    M['bg'][n] = '#ffffff'

for n in ['bal_e', 'tp_success', 'm_c1a', 'm_c1b', 'm_c1c', 'm_c2', 'm_c3',
          'o2a_full', 'o2b_full', 'o2b_success', 'o2c_full',
          'o2c_online', 'r0', 'r1', 'r2', 'r3', 'f1', 'f2', 'f3', 'f4', 'h1', 'h2']:
    im = load_sq(n)
    save(im, n, force=True)
    cols(im, n)
    M['bg'][n] = rgb(im.getpixel((im.width // 2, im.height - 6)))

# ---- tall sheets: crop from y 96 with rounded top corners ----
for n in ['o2a_tall', 'o2b_tall', 'o2c_tall', 'o2b_after']:
    im = load_sq(n).crop((0, 96 * S, 390 * S, 844 * S))
    im.putalpha(Image.composite(im.getchannel('A'), Image.new('L', im.size, 0),
                                round_mask(im.width, im.height, 28 * S)))
    save(im, n, force=True)

# ---- Stores tab bars and map pills ----
STORES = {'s1': (2683, 2599, 2501)}   # the live Stores screen keeps only the tab bar and map pill
for n, (h, top, pill) in STORES.items():
    im = load_sq(n)
    t = im.crop((0, (top - 44) * S, 390 * S, h * S))
    mask = Image.new('L', t.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 44 * S, t.width - 1, t.height + 2 * 28 * S), 28 * S, fill=255)  # square bottom corners
    d.ellipse(((195 - 48) * S, (50 - 48) * S, (195 + 48) * S, (50 + 48) * S), fill=255)
    m2 = Image.new('L', t.size, 0)
    m2.paste(mask, (0, 0))
    t.putalpha(Image.composite(t.getchannel('A'), Image.new('L', t.size, 0), m2))
    save(notch(t), n + '_tab', force=True)
    if pill:
        m, mb = 8 * S, 12 * S
        p = im.crop((137 * S - m, pill * S - m, 252 * S + m, (pill + 48) * S + mb))
        pm = Image.new('L', p.size, 0)
        ImageDraw.Draw(pm).rounded_rectangle((m, m, p.width - m - 1, p.height - mb - 1), 24 * S, fill=255)
        p.putalpha(pm)
        save(p, n + '_pill')
s2 = load('s2')
p = s2.crop((61 * S, 662 * S, 325 * S, 710 * S))
pm = Image.new('L', p.size, 0)
ImageDraw.Draw(pm).rounded_rectangle((0, 0, p.width - 1, p.height - 1), 24 * S, fill=255)
p.putalpha(pm)
save(p, 's2_pill')
# status bar for the HTML pages (search, favourites, errors)
save(load_sq('h1').crop((0, 0, 390 * S, 44 * S)), 'sb_mint', force=True)

# ---- live Stores screen: pieces cut from the Figma screens (st/prep.py) ----
def card_cut(im):
    """Collection card: the photo keeps its rounded corners and the caption sits on a transparent ground."""
    a = np.asarray(im.convert('RGB')).astype(float); h, w = a.shape[:2]
    ph = 120 * S
    big = Image.new('L', (w * 4, ph * 4), 0)
    k = 3 * 4  # 1 css px in: drops the light fringe the export left on the photo edge
    ImageDraw.Draw(big).rounded_rectangle((k, k, w * 4 - 1 - k, ph * 4 - 1), 57 * 4, fill=255)
    alpha = np.zeros((h, w))
    alpha[:ph] = np.asarray(big.resize((w, ph), Image.LANCZOS)) / 255
    cap = a[ph:]; bl = np.median(cap.reshape(-1, 3), 0).mean()
    alpha[ph:] = np.clip((bl - cap.mean(2)) / (bl - INK), 0, 1)
    a[ph:] = INK
    out = np.dstack([a, alpha * 255])
    return Image.fromarray(np.clip(out + .5, 0, 255).astype(np.uint8), 'RGBA')

for f in sorted(glob.glob('stores_src/*.png')):
    n = os.path.basename(f)[:-4]
    if re.match(r'card\d$', n):
        save(card_cut(Image.open(f)), 'st_' + n, force=True)
    else:
        im = Image.open(f).convert('RGBA')
        sq = corners.square(im, ('TL', 'TR'))
        save(sq, 'st_' + n, force=sq is not im)

for f in sorted(glob.glob('map_src/*.png')):
    save(Image.open(f).convert('RGBA'), 'mp_' + os.path.basename(f)[:-4], force=True)

# ---- fonts ----
FONT_FILES = {
    'expo-medium.ttf': 'expo-arabic/Expo_Arabic_Medium.ttf',
    'expo-bold.otf': 'expo-arabic/Expo_Arabic_Bold.otf',
    'nan-regular.ttf': 'nan-superx-sans-trial/NaN_SuperX_Sans_TRIAL_Regular.ttf',
    'nan-bold.ttf': 'nan-superx-sans-trial/NaN_SuperX_Sans_TRIAL_Bold.ttf',
    'nan-medium.ttf': 'nan-superx-sans-trial/NaN_SuperX_Sans_TRIAL_Medium.ttf',
    'nan-semibold.ttf': 'nan-superx-sans-trial/NaN_SuperX_Sans_TRIAL_SemiBold.ttf',
}
for dst, src in FONT_FILES.items():
    shutil.copy(os.path.join(FONTS, src), f'{OUT}/fonts/{dst}')

tpl = open('template.html', encoding='utf-8').read()
# edge cases: styles, behaviour and Lucide icons inlined
icons = {}
for f in sorted(glob.glob('icons/*.svg')):
    body = open(f, encoding='utf-8').read()
    inner = re.search(r'<svg[^>]*>(.*)</svg>', body, re.S).group(1)
    icons[os.path.basename(f)[:-4]] = re.sub(r'\s+', ' ', inner).strip()
tpl = tpl.replace('/*EDGE_CSS*/', open('edge.css', encoding='utf-8').read())
tpl = tpl.replace('/*EDGE_JS*/', open('edge.js', encoding='utf-8').read().replace('/*ICONS*/{}', json.dumps(icons, ensure_ascii=False)))
tpl = tpl.replace('/*STORES_CSS*/', open('stores.css', encoding='utf-8').read())
# Home map card: live HTML (map.js), pin logos from map_src
tpl = tpl.replace('/*MAP_CSS*/', open('map.css', encoding='utf-8').read())
tpl = tpl.replace('/*MAP_JS*/', open('map.js', encoding='utf-8').read().replace('/*MAPART*/', open('map_src/art.svg', encoding='utf-8').read()))
tpl = tpl.replace('/*STORES_JS*/', open('stores.js', encoding='utf-8').read().replace('/*RIYAL*/', open('riyal.txt').read().strip()))
open(f'{OUT}/index.html', 'w', encoding='utf-8').write(tpl.replace('/*MANIFEST*/{}', json.dumps(M)))
tot = sum(os.path.getsize(f'{OUT}/img/' + f) for f in os.listdir(OUT + '/img'))
print(len(M['img']), 'images', round(tot / 1e6, 1), 'MB')
