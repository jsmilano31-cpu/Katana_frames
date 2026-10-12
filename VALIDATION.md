# Validation — 2026-10-12

The official J.AkioHonda model is imported, its original geometry and textures are embedded into a local GLB, and its CC BY 4.0 license is retained. The scabbard and fitting are hidden during presentation. All five camera chapters have been inspected in desktop and portrait framing, and ten fallback posters were rendered from the real model.

| Check | Result |
| --- | --- |
| TypeScript and production build | Pass |
| Camera continuity, reversal, overscroll, and GLB resource packing | 6 unit tests pass |
| Edge desktop and Pixel 7 emulation | 17 browser tests pass; 1 desktop-only touch scenario intentionally skipped |
| Official textured model in both browser projects | All five views load without failed asset requests or runtime errors |
| Scroll, resize, drag, keyboard rotation, reset, exit, and replay | Pass |
| Missing model, failed request/retry, unavailable WebGL, and reduced motion | Pass |
| Official model and all desktop/portrait fallback files | `npm.cmd run assets:check` passes |
| Production preview at 1440 × 900 and 390 × 844 | HTTP 200, real 3D view, no JavaScript errors |
| Production reduced motion | Static view uses the rendered chapter posters |

## Performance

Measured during a continuous forward-and-reverse scroll with the **actual katana**, in headless Microsoft Edge 155.0.4283.45 on Windows using ANGLE / Intel UHD Graphics / Direct3D11.

| Configuration | Sampled rendered FPS | Pixel density | Draw calls / triangles |
| --- | --- | --- | --- |
| Desktop, 1440 × 900 | 101–130 | 1 | 7 / 18,052 |
| Pixel 7 browser emulation | 154–164 | 1.25 | 7 / 18,052 |

These are measurements on this machine, not universal guarantees. Portrait emulation uses the desktop GPU; a physical phone has not been tested. The source includes resolution adaptation and idle/hidden-tab rendering suspension.

To repeat the real-model performance check on this machine, with the local server running:

```powershell
$env:KATANA_PREVIEW_URL = 'http://127.0.0.1:5173'
node scripts/measure-fixture.mjs --real
```

The build emits Vite's size advisory for the Three.js core chunk (about 557 KB before gzip, 141 KB gzipped). The renderer and animation code load only when a 3D asset is ready and reduced motion is off. The advisory does not prevent the build.

## Review artifacts

- [Desktop production preview](docs/preview-desktop.png)
- [Portrait production preview](docs/preview-portrait.png)
- Production output: `dist/`
- Simple local launcher: `start-local.cmd`

No site was published. The source download in Downloads was left in place.
