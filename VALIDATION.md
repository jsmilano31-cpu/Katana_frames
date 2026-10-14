# Validation — 2026-10-14

The Legendary Katana revision uses the official textured J.AkioHonda model. The page ends at the planted sword, with credits in About. Original white mist and turquoise wisps follow the blade, a separate clipped light layer awakens exposed steel, and contact triggers a 1.6-second landing burst that completes independently of scrolling.

## Completed checks

| Check | Result |
| --- | --- |
| TypeScript and production build | Pass |
| Camera paths, reversal, clearance, awakening bounds, landing lifecycle, and GLB packing | 14 unit tests pass |
| Installed Edge desktop and Pixel 7 emulation | 33 browser tests pass; 1 touch-only case intentionally skipped on desktop |
| Actual model, textures, and local assets | Pass |
| Awakening | Pulse remains within exposed steel; reversing returns it to a dormant state |
| Landing playback | Completes when scroll stops; reversal cancels it; leaving the landing region re-arms it |
| Direct final-chapter entry | Settled scene without an automatic landing burst |
| Pause effects during landing | Settles immediately; exploration remains available |
| True page ending | Footer removed; document height equals the journey height at all five inspected sizes |
| Credits | Creator, source, license, and modification information available in About |
| Explore | Mouse/touch drag, keyboard controls, focus containment, reset, exit, and return to the authored view pass |
| Contact and floor limits | Actual blade tip stays embedded through orbit and resizing; camera stays above ground |
| Layout refresh | Preserves progress and does not retrigger impact |
| Native scroll, reverse/rapid movement, navigation, and replay | Pass |
| Responsive resizing and orientation changes | Preserve progress within native CSS-pixel rounding |
| Reduced motion / unavailable WebGL | Complete static journey |
| Failed loading and retry | Recovery passes |
| Fallback images | Six desktop and six portrait posters regenerated |
| Production review | HTTP 200; no JavaScript or console errors, failed assets, horizontal overflow, or bottom gap |

The production build was visually reviewed at **1440 × 900**, **1809 × 685**, **390 × 844**, **844 × 390**, and **320 × 568**. Captures include every act, awakening at 18%, 29%, and 39%, landing phases at 6%, 30%, 65%, and 90%, the settled scene, exploration, and portrait reduced motion.

Two interaction issues found during testing were fixed: ScrollTrigger refreshes emitted temporary progress resets that could replay the landing, and browser focus could scroll controls inside the sticky scene away from the final position. Refreshes now preserve authored progress, and live HTML panels use a fixed viewport layer. The complete browser suite passed after both fixes.

The browser suite uses the official model for awakening, landing, contact, asset, reverse-draw, and orientation checks. Small intercepted fixtures cover controller and failure scenarios; they are never shipped as the site's model. One earlier development review timed out during loading; subsequent development and final production reviews completed across all five viewports.

Raw production review: [visual-checks.json](docs/legendary/visual-checks.json).

## Performance and hardware

Measured after the browser suite and production visual review, with the real model, awakening, mist, stone, and fragments enabled.

Machine: **Acer Nitro ANV15-52**, Windows 11, **Intel Core i5-13420H**. Headless **Microsoft Edge 155.0.4283.45** used **Intel UHD Graphics via ANGLE / Direct3D11**. The laptop also has an RTX 5050, but the browser's reported renderer was Intel UHD. Development used Node.js 24.20.0.

| Configuration | Forward/reverse scrolling | Awakening and mist | Repeated landing bursts | Planted ambient | DPR |
| --- | --- | --- | --- | --- | --- |
| Desktop 1440 × 900 | 68–112 FPS | 165 FPS | 139–142 FPS | 164 FPS | 1 |
| Pixel 7 browser emulation | 108–130 FPS | 165 FPS | 156–159 FPS | 165 FPS | 1.25 |

Scrolling, awakening, and ambient values use the renderer's two-second measurement windows. Landing values use three real native-scroll landings and frame timestamps synchronized with `gl.finish()`, so GPU work completes before each timing sample. These headless results are throughput measurements, not display-refresh or device-wide guarantees.

The measured desktop scrolling result exceeds the 60 FPS target on this laptop. **No physical phone was available; the physical-mobile 30 FPS target remains unverified.** Phone emulation uses the laptop GPU. Mobile uses fewer ribbons, fog layers, particles, and fragments; pixel density is capped and sustained slow rendering reduces resolution.

Unlit mist cards use one rendering pass. Invisible trails, tip glints, and pressure rings are omitted. Pausing effects allows idle rendering to stop; hidden tabs suspend both rendering and effect clocks.

Raw measurements: [performance.json](docs/legendary/performance.json).

With the production preview running:

```powershell
$env:KATANA_PREVIEW_URL = 'http://127.0.0.1:4173'
node scripts/measure-fixture.mjs --real --effects
```

Vite reports a size advisory for the dynamically loaded Three.js core: approximately 564 KB minified / 144 KB gzipped. The production build succeeds.

## Delivery and review

- [Opening](docs/legendary/desktop-0.png)
- [Awakening and mist](docs/legendary/desktop-awakening-0.29.png)
- [Landing burst](docs/legendary/desktop-landing-0.3.png)
- [Desktop planted ending](docs/legendary/desktop-5.png)
- [Portrait planted ending](docs/legendary/portrait-5.png)
- [Portrait static fallback](docs/legendary/portrait-static.png)
- [Desktop exploration](docs/legendary/desktop-explore.png)
- [Portrait orbit](docs/legendary/portrait-orbit.png)
- Final screenshots and measurements: `docs/legendary/`
- Source, lockfile, and launcher: project root / `start-local.cmd`
- Static production build with local model, posters, fonts, and licenses: `dist/`

Double-click `start-local.cmd`, then open http://127.0.0.1:5173. The launcher uses `npm.cmd` to avoid the PowerShell execution-policy issue. Delivery remains local, with no audio or publication.

