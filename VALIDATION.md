# Validation - 2026-10-13

The Ink & Steel sequence uses the official textured J.AkioHonda katana. The sword and scabbard are separate animation groups; the scabbard opening is fitted to the blade, and the blade is revealed through a temporary clipping plane during extraction. Original SVG ink clouds occupy multiple scene depths. All six acts and intermediate drawing/sweep poses were inspected on desktop and portrait layouts, with a compact layout also inspected at 844 x 390.

## Completed checks

| Check | Result |
| --- | --- |
| TypeScript and static production build | Pass |
| Camera endpoints, continuity, reversal, draw clearance, scene-state continuity, and GLB resource packing | 8 unit tests pass |
| Installed Edge desktop and Pixel 7 emulation | 21 browser tests pass; 1 touch scenario intentionally skipped in the desktop project |
| Official textured model | All six compositions load in both projects without failed requests or JavaScript errors |
| Native scroll, reverse/rapid scrolling, chapter links, and replay | Pass |
| Reverse draw | Sword and scabbard reseat and return to the original orientation |
| Portrait, landscape, and desktop resizing mid-draw | Progress and transforms preserved within native CSS-pixel rounding |
| Explore | Mouse/touch drag, keyboard rotation, focus containment, reset, exit, and return to the authored scene pass |
| Reduced motion and unavailable WebGL | Complete static journey |
| Asset failure and retry | Recovery passes |
| Rendered fallback images | All six desktop and six portrait files load; reduced motion does not request the GLB |
| Asset integrity and attribution | Asset check passes; license and credits retained |
| Production preview | HTTP 200; desktop, portrait, and landscape use the real model with no JavaScript errors or failed asset requests |

The production reduced-motion view was also inspected, including header contrast against the ivory final act. Browser QA uses a small intercepted GLB for controller/failure tests and the official model for asset, composition, reverse-draw, and orientation tests. The fixture is not delivered as the site's model.

## Performance and hardware

Measured against the production build during a continuous forward-and-reverse scroll, after the browser suite completed, using the real model and ink layers.

Test machine: **Acer Nitro ANV15-52**, Windows 11, **Intel Core i5-13420H**. Headless **Microsoft Edge 155.0.4283.45** selected **Intel UHD Graphics through ANGLE / Direct3D11**. Node.js 24.20.0 was used for development and checks.

| Configuration | Sampled rendered FPS | Pixel density | Sampled draw calls / triangles |
| --- | --- | --- | --- |
| Desktop, 1440 x 900 | 107-120 | 1 | 10-14 / 18,058-21,194 |
| Pixel 7 browser emulation | 147-164 | 1.25 | 9-13 / 18,056-21,192 |

These headless measurements exceed the desktop target on this test machine. They are not display-refresh or frame-rate guarantees. Phone emulation uses the laptop GPU: **a physical phone has not been tested, so the 30 FPS physical-mobile target remains unverified**. Portrait rendering omits one decorative plane, caps density, and retains automatic resolution reduction during sustained slow rendering. Rendering stops when idle or the tab is hidden.

Raw measurements: [performance.json](docs/ink-steel/performance.json).

To repeat the measurement with a server running (Node.js 24):

```powershell
$env:KATANA_PREVIEW_URL = 'http://127.0.0.1:4173'
node scripts/measure-fixture.mjs --real
```

Vite reports a size advisory for the Three.js core chunk: approximately 557 KB minified and 141 KB gzipped. It remains dynamically loaded when the 3D view is needed. The advisory does not prevent the build.

## Delivery and review

- [Desktop opening](docs/preview-desktop.png)
- [Portrait opening](docs/preview-portrait.png)
- [Desktop final act](docs/ink-steel/desktop-5.png)
- [Portrait final act](docs/ink-steel/portrait-5.png)
- [Portrait static fallback](docs/ink-steel/static-portrait.png)
- [Desktop exploration](docs/ink-steel/explore-desktop.png)
- [Portrait exploration](docs/ink-steel/explore-portrait.png)
- Six-act screenshots and intermediate poses: `docs/ink-steel/`
- Production build: `dist/`
- Local launcher: `start-local.cmd`

No site was published. The original model download remains in Downloads.
