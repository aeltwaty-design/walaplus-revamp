"""Square screen corners.

The Figma exports of the screen frames come with rounded corners on a dark (33,33,33) ground.
square(im) fills those corners from the screen itself, so every screen is a plain rectangle:
- the corner shape comes from a template measured on flat corners (two radii: merchant
  screens and the rest), in TL orientation, grown by 1 px to absorb 1 px differences;
- each corner pixel is replaced by the pixel mirrored across the corner edge, mixed by its
  measured dark share, so flat colours stay exact and photos carry on naturally.
"""
import numpy as np
from PIL import Image

D = np.array([33.0, 33.0, 33.0])
B = 150
_TPL = {}


def _box(a, k):
    """Corner box of k in TL orientation (a view-friendly copy)."""
    h, w = a.shape[:2]
    c = {'TL': a[:B, :B], 'TR': a[:B, w - B:][:, ::-1], 'BL': a[h - B:, :B][::-1], 'BR': a[h - B:, w - B:][::-1, ::-1]}[k]
    return c.copy()


def _put(a, k, c):
    h, w = a.shape[:2]
    if k == 'TL': a[:B, :B] = c
    elif k == 'TR': a[:B, w - B:] = c[:, ::-1]
    elif k == 'BL': a[h - B:, :B] = c[::-1]
    else: a[h - B:, w - B:] = c[::-1, ::-1]


def _template(im, k):
    c = _box(np.asarray(im.convert('RGB')).astype(float), k)
    I = np.median(c[120:, 120:].reshape(-1, 3), 0)
    o = np.clip(((I - c) / (I - D)).mean(2), 0, 1)
    o[o < 0.03] = 0
    return o


def init(load):
    """load(name) -> PIL image of a Figma export. Merchant screens (A) use a smaller radius."""
    for fam, src in (('A', 'm_c3'), ('B', 'h1')):
        im = load(src)
        bl, br = _template(im, 'BL'), _template(im, 'BR')
        # measured: TL matches BR and TR matches BL (half-turn symmetry of the export)
        _TPL[fam] = {'TL': br, 'TR': bl, 'BL': bl, 'BR': br}


def _dilate(m):
    g = m.copy()
    g[1:] |= m[:-1]; g[:-1] |= m[1:]; g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]
    return g


def _fix(c, ot):
    """c: RGB(A) float box in TL orientation, ot: template outside share."""
    rgb = c[..., :3]
    om = _dilate(ot > 0)
    ys, xs = np.nonzero(om)
    edge = _dilate(om) & ~om
    ey, ex = np.nonzero(edge)
    # nearest pixel just inside the corner edge, then mirror through it
    d2 = (ys[:, None] - ey[None]) ** 2 + (xs[:, None] - ex[None]) ** 2
    j = d2.argmin(1)
    qy, qx = ey[j], ex[j]
    ry, rx = np.clip(2 * qy - ys, 0, B - 1), np.clip(2 * qx - xs, 0, B - 1)
    bad = om[ry, rx]
    ry[bad], rx[bad] = qy[bad], qx[bad]
    p = rgb[ys, xs]
    R = rgb[ry, rx]
    v = R - D
    n2 = (v * v).sum(1)
    est = np.clip(((R - p) * v).sum(1) / np.maximum(n2, 1), 0, 1)
    t = ot[ys, xs]
    o = np.where(n2 >= 900, est, t)
    o = np.where((t >= 0.98) | ((np.abs(p - D).max(1) <= 4) & (t > 0)), 1.0, o)
    rgb[ys, xs] = p + o[:, None] * (R - D)
    if c.shape[2] == 4:
        c[ys, xs, 3] = 255
    return c


def square(im, corners=('TL', 'TR', 'BL', 'BR')):
    """Returns a copy of im with its dark rounded frame corners filled; other corners untouched."""
    a = np.asarray(im).astype(float)
    h0, w0 = a.shape[:2]
    if w0 < B:
        return im
    if h0 < B:  # a short strip (status bar): mirror it downwards for the work, then cut back
        a = np.pad(a, ((0, B - h0), (0, 0), (0, 0)), mode='symmetric')
    done = False
    for k in corners:
        c = _box(a, k)
        dk = np.abs(c[..., :3] - D).max(2) <= 4
        if c.shape[2] == 4:
            dk &= c[..., 3] > 250
        if not dk[0, 0]:
            continue
        run = next((i for i in range(B) if not dk[0, i]), B)
        if run < 80:
            continue
        fam = 'A' if run < 100 else 'B'
        _put(a, k, _fix(c, _TPL[fam][k]))
        done = True
    if not done:
        return im
    return Image.fromarray(np.clip(a[:h0] + .5, 0, 255).astype(np.uint8), im.mode)
