# Validation — 2026-10-14

The Field of Blades revision uses the official textured J.AkioHonda model. The sheath fit is calibrated from the actual Saya and Habaki geometry. Tapping or clicking the settled scene enters exploration; one closed corner menu replaces the large panel. A seeded field of 160 desktop or 80 portrait silhouette katanas fills the clearing. The main blade remains dominant and planted; the previous camera angles, zoom bounds, and pan bounds are retained.

## Completed checks

| Check | Result |
| --- | --- |
| TypeScript and production build | Pass |
| Camera paths, reversal, clearance, awakening bounds, landing lifecycle, and GLB packing | 14 unit tests pass |
| Installed Edge desktop and Pixel 7 emulation | 48 browser tests pass; 4 input-specific cases intentionally skipped on the other device project |
| Actual model, textures, and local assets | Pass |
| Awakening | Pulse remains within exposed steel; reversing returns it to a dormant state |
| Landing playback | Completes when scroll stops; reversal cancels it; leaving the landing region re-arms it |
| Direct final-chapter entry | Settled scene without an automatic landing burst |
| Pause effects during landing | Settles immediately; exploration remains available |
| True page ending | Footer removed; document height equals the journey height at all five inspected sizes |
| Credits | Creator, source, license, and modification information available in About |
| Explore | Mouse orbit, wheel zoom, right-drag pan, touch orbit and two-finger pinch/pan, keyboard, toolbar, focus containment, Reset, Exit, and Replay pass |
| Grove reveal | 90–96.5% reveal reverses cleanly; no grove before the ending; direct final entry shows the settled scene |
| Sheath fit | Source cross-sections measured; opening and collar frames aligned; seated pose reviewed from front, back, and edge |
| Extraction | Collar-direction movement replaces the sideways dip; clipping, exposure, mist anchor, and reverse playback use the calibrated fit |
| Direct scene entry | Completed click/tap enters; drag, wheel, text selection, multitouch, About, Replay, and navigation are excluded |
| Corner controls | Closed by default; focus, outside-close, Escape, Reset, Pause, Replay, and Exit pass |
| Keyboard entry | Focus-visible action is positioned outside layout flow; Replay stays stationary during a click |
| Silhouette field | 160 desktop / 80 portrait instances; 368 triangles each; seeded planting and reveal reverse cleanly |
| Camera-driven fading | A full low-angle orbit at maximum zoom-out faded up to 3 nearby/obscuring swords while ambient time stayed paused |
| Camera bounds | Zoom reaches both bounds; pan stays within one model unit of the starting target; elevation stays above ground |
| Explore orientation change | Preserves viewing direction, planted tip, and impact count; updates responsive bounds and scenery density |
| Paused exploration | Grove clocks freeze while camera controls remain usable; fog follows camera orientation |
| Contact and floor limits | Actual blade tip stays embedded through orbit and resizing; camera stays above ground |
| Layout refresh | Preserves progress and does not retrigger impact |
| Native scroll, reverse/rapid movement, navigation, and replay | Pass |
| Responsive resizing and orientation changes | Preserve progress within native CSS-pixel rounding |
| Reduced motion / unavailable WebGL | Complete static journey |
| Failed loading and retry | Recovery passes |
| Fallback images | Six desktop and six portrait posters regenerated |
| Production review | HTTP 200; no JavaScript or console errors, failed assets, horizontal overflow, or bottom gap |

The production build was visually reviewed at **1440 × 900**, **1809 × 685**, **390 × 844**, **844 × 390**, and **320 × 568**. Captures cover Presence, early/late draw, mist, reveal, impact, the settled composition, direct entry with the menu closed, four approximately quarter-turn viewpoints, controls/help, both zoom ranges, and portrait reduced motion. Dedicated close-ups show the sheath from three directions. All five sizes have no runtime or console errors, failed assets, horizontal overflow, or document-bottom gap.

The earlier ScrollTrigger refresh and sticky-scene focus fixes are retained. Keyboard entry initially changed the Replay button's position when focus moved; its focus-visible placement now stays outside layout flow. Initial fragment navigation is explicitly routed after initialization to avoid native scrolling to fixed chapter panels. The final full suite passed 48 cases with four intentional skips: three touch cases on desktop and one mouse case on portrait. Shader/buffer/texture warming remains part of loading.

The browser suite uses the official model for awakening, landing, contact, asset, reverse-draw, orientation, and six-view checks. Small intercepted fixtures cover controller bounds and failure scenarios; they are never shipped as the site's model. Production visual review and performance measurements use the actual textured model and complete grove.

Raw production review: [visual-checks.json](docs/field-of-blades/visual-checks.json). Camera-fade probe: [proximity-check.json](docs/field-of-blades/proximity-check.json).

The source-space geometry inspection reports a minimum **0.007360** clearance between the blade and the sheath's outer cross-section envelope at nine sampled positions. The fitted frame rotation is about **0.000017 radians**, replacing the old 0.032-radian adjustment. This checks envelope compatibility; the renderer conceals enclosed steel with a clipping plane rather than simulating a hollow physical cavity. Actual measurements and calibrated frames: [sheath-fit.json](docs/field-of-blades/sheath-fit.json). Reproduce with `node scripts/inspect-fit.mjs`.

## Performance and hardware

Measured on the production build with the real model, complete silhouette field, grove, awakening, mist, stone, and fragments enabled. Measurements ran without another browser test or screenshot process competing for rendering resources.

Machine: **Acer Nitro ANV15-52**, Windows 11, **Intel Core i5-13420H**. Headless **Microsoft Edge 155.0.4283.45** used **Intel UHD Graphics via ANGLE / Direct3D11**. The laptop also has an RTX 5050, but the browser's reported renderer was Intel UHD. Development used Node.js 24.20.0.

| Configuration | Forward/reverse scrolling | Awakening and mist | Landing bursts | Planted ambient | Grove orbit | DPR |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop 1440 × 900 | 89–109 FPS | 164 FPS | 99–104 FPS | 107 FPS | 122 FPS | 1 |
| Pixel 7 browser emulation | 94–155 FPS | 165 FPS | 119–148 FPS | 165 FPS | 164 FPS | 1.25 |

Scrolling, awakening, and ambient values use the renderer's two-second measurement windows. Landing values use three real native-scroll landings; orbit values use five seconds of continuously changing camera direction with active ambient motion. Both use timestamps synchronized with `gl.finish()`. These headless results measure rendering throughput and do not guarantee display refresh or performance on other hardware.

The final planted scene uses about **136,300 triangles and 48 draw calls** on desktop, and **78,000 triangles and 41 calls** in portrait. The instanced field and contact patches add two draw calls; the original detailed GLB is not duplicated for background swords. Browser/GPU conditions vary between runs; the raw final results are retained.

The final measured desktop scrolling result exceeds the 60 FPS target on this laptop. **No physical phone was available; the physical-mobile 30 FPS target remains unverified.** Phone emulation uses the laptop GPU. Portrait uses 90 bamboo stalks and 3,150 leaves, compared with 180 stalks and 6,300 leaves on desktop, plus fewer rocks, ground leaves, fog layers, and particles. Pixel density is capped and sustained slow rendering reduces resolution.

Unlit mist cards use one rendering pass. Invisible trails, tip glints, and pressure rings are omitted. Pausing effects allows idle rendering to stop; hidden tabs suspend both rendering and effect clocks.

Raw measurements: [performance.json](docs/field-of-blades/performance.json).

With the production preview running:

```powershell
$env:KATANA_PREVIEW_URL = 'http://127.0.0.1:4173'
node scripts/measure-fixture.mjs --real --effects
```

Vite reports a size advisory for the dynamically loaded Three.js core: approximately 566 KB minified / 144 KB gzipped. The production build succeeds. No dependencies were added; the existing lockfile is retained.

## Delivery and review

- [Corrected sheath, front](docs/field-of-blades/sheath-front.png)
- [Corrected sheath, back](docs/field-of-blades/sheath-back.png)
- [Desktop planted ending](docs/field-of-blades/desktop-final.png)
- [Portrait planted ending](docs/field-of-blades/portrait-final.png)
- [Desktop exploration, menu closed](docs/field-of-blades/desktop-explore.png)
- [Portrait exploration, menu closed](docs/field-of-blades/portrait-explore.png)
- [Corner menu](docs/field-of-blades/portrait-menu.png)
- [Opposite viewpoint](docs/field-of-blades/desktop-orbit-2.png)
- [Camera proximity fading](docs/field-of-blades/proximity-fade.png)
- [Portrait static fallback](docs/field-of-blades/portrait-static.png)
- Final screenshots and measurements: `docs/field-of-blades/`; earlier revision captures are retained in their original directories.
- Source, lockfile, and launcher: project root / `start-local.cmd`
- Static production build with local model, posters, fonts, and licenses: `dist/`

Double-click `start-local.cmd`, then open http://127.0.0.1:5173. The launcher uses `npm.cmd` to avoid the PowerShell execution-policy issue. Delivery remains local, with no audio or publication.

