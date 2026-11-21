"""Prepare 3x PNG pieces for the HTML Stores screen (run with python3 -I prep.py <scratch>)"""
import sys, os
from PIL import Image, ImageDraw
R = sys.argv[1]
EX = R + '/ex3'; ST = R + '/st'; OUT = R + '/proto/stores_src'
S = 3
BG = (240, 248, 243, 255)
def L(p): return Image.open(p).convert('RGBA')
def save(im, n): im.save(f'{OUT}/{n}.png')
s1, s3, s4, s5, s6 = [L(f'{EX}/{n}.png') for n in ['s1', 's3', 's4', 's5', 's6']]
W = 390 * S

# header: band + status bar + heart button, title area erased (title/location are HTML)
band = L(f'{ST}/band_header.png')          # 390 x 174
head = Image.new('RGBA', (W, 187 * S), BG)
head.alpha_composite(band, (0, 0))
clean = head.copy()
top = s1.crop((0, 0, W, 91 * S))
head.paste(top, (0, 0))
# erase the title + location (x 200..390, y 36..91) with the plain band
head.paste(clean.crop((200 * S, 36 * S, W, 91 * S)), (200 * S, 36 * S))
save(head, 'head')
# status bar strip for the sticky header (white)
save(search := s1.crop((0, 203 * S, W, 267 * S)), 'search')

# merchant photos (with logo plates): row top y, source
ROWS = {
    'dolce': (s1, 507), 'salon': (s1, 643), 'verve': (s1, 779),
    'arbys': (s1, 1215), 'meshkati': (s1, 1351), 'badr': (s1, 1487), 'amazon': (s1, 1623), 'afiya': (s1, 1759),
    'baskin': (s1, 2219), 'alma': (s1, 2355), 'bagel': (s4, 687), 'asian': (s4, 823), 'noon': (s5, 757),
}
for k, (im, y) in ROWS.items():
    save(im.crop(((16 + 217) * S, (y + 8) * S, (16 + 217 + 133) * S, (y + 8 + 112) * S)), 'ph_' + k)

# category tiles + chip icons (black glyph on transparent) + tints
TILES = ['all', 'food', 'retail', 'beauty', 'health', 'home', 'travel', 'edu', 'svc']
tints = {}
for t in TILES:
    im = L(f'{ST}/tile_{t}.png')
    save(im, 'tile_' + t)
    cx = im.width // 2
    tints[t] = '#%02x%02x%02x' % im.getpixel((cx, 4 * S))[:3]
    ic = im.crop((cx - 12 * S, 16 * S, cx + 12 * S, 40 * S))
    g = ic.convert('L')
    if t == 'all':   # white glyph on black
        a = g
    else:
        a = g.point(lambda v: 255 - v)
    out = Image.new('RGBA', ic.size, (17, 17, 17, 255)); out.putalpha(a)
    save(out, 'ic_' + t)
print('tints', tints)

# collection bands
glow = L(f'{ST}/glowA.png')                    # 390 x 149
bandA = Image.new('RGBA', (W, 149 * S), BG); bandA.alpha_composite(glow)
bandA.paste(s1.crop((0, 931 * S, W, (931 + 88) * S)), (0, 0))
save(bandA, 'bandA')
save(s1.crop((0, 1911 * S, W, (1911 + 88) * S)), 'bandB')
for i in range(1, 7):
    p = f'{ST}/cards/c{i}.png'
    if os.path.exists(p) and Image.open(p).width == 480: save(L(p), f'card{i}')

# nudge, cashback strip, voucher strip
save(s3.crop((0, 635 * S, W, 787 * S)), 'nudge')
save(s5.crop((0, 331 * S, W, 445 * S)), 'cbstrip')
save(s6.crop((0, 331 * S, W, 419 * S)), 'voustrip')
save(L(f'{ST}/banner4.png'), 'banner4')

# glass heart for banner 2 (third icon of the sprite, masked)
m = Image.open(f'{ST}/raw/b2_1.png').convert('L'); g = L(f'{ST}/raw/b2_3.jpg')
x0, x1 = 270, 370
rows = [y for y in range(m.height) if any(m.getpixel((x, y)) > 128 for x in range(x0, x1))]
box = (x0, rows[0], x1, rows[-1] + 1)
heart = g.crop(box); heart.putalpha(m.crop(box))
heart.save(f'{ST}/heart_glass.png')
print('heart box', box)

# sticky header status bar (white) and collection hero covers
s2 = L(f'{EX}/s2.png')
save(s2.crop((0, 0, W, 33 * S)), 'sb')
for i in range(1, 7):
    c = L(f'{OUT}/card{i}.png')
    save(c.crop((0, 0, 160 * S, 120 * S)), f'cov{i}')
