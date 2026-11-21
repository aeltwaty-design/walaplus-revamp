# Final UI prototype

A clickable HTML prototype of every screen on the Figma page **Final UI** of the WalaPlus revamp file.

- **Open it:** https://aeltwaty-design.github.io/walaplus-revamp/ once GitHub Pages is on for this repository (Settings, Pages, deploy from the `main` branch, folder `/ (root)`). Locally, `site/index.html` is the built prototype. Serve the `site/` folder over HTTP, for example `cd site && python3 -m http.server 8765`, then open http://127.0.0.1:8765. On a phone-sized window it fills the screen, and a **Controls** pill opens the switches. Add `?frame` to the address to keep the framed view.
- **Fonts:** the brand fonts (Expo Arabic and NaN SuperX Sans) are in `site/fonts/`, so the prototype looks the same wherever it is opened.

## What's here

| Path | What it is |
| --- | --- |
| `site/` | The built prototype: `index.html` plus every screen as a lossless 3x WebP in `img/`. |
| `exports/` | The 3x PNG exports of each Figma frame that the build starts from. |
| `build.py` | Builds `site/` from `exports/`: crops, cleans and encodes the screens, then inlines the scripts and styles below into `template.html`. |
| `template.html` | Screen specs, tap areas and the core prototype runtime. |
| `edge.js`, `edge.css` | Simulated edge cases: offline, slow, new user, location, camera, offer status, scan errors, search, favourites, reports. |
| `stores.js`, `stores.css`, `stores_src/`, `stores_prep/` | The live Stores (marketplace) screen with 248 merchant copies across every category and filter. |
| `map.js`, `map.css`, `map_src/` | The live Home map card: radar rings, glow sweep and pins that take the highlight in turn. |
| `corners.py` | Squares the rounded screen corners baked into the Figma exports. |
| `icons/` | Lucide icons used by the edge-case screens. |
| `tests/` | Playwright checks used while building (they expect the site served on port 8765). |

## Rebuild

```sh
cd prototype
python3 build.py exports /path/to/brand-fonts   # REUSE=1 skips re-encoding images that already exist
```

Needs Python 3 with Pillow and NumPy. The fonts folder must hold `expo-arabic/` and `nan-superx-sans-trial/` as in the brand kit.

The source of truth for the design is the Figma file. This repository is kept in step with every published update of the prototype.
