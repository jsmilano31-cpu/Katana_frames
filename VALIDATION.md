# Validation — 2026-10-14

The Moonlit Grove revision uses the official textured J.AkioHonda model. The final approach reveals a complete procedural bamboo grove, with rocks, damp ground, fallen leaves, moonlight, fog, and motes. Explore supports full horizontal orbit, bounded zoom, and bounded pan. The sword and its embedded tip remain stationary. The six-act journey, awakening, timed landing burst, true document-bottom ending, and About credits are retained.

## Completed checks

| Check | Result |
| --- | --- |
| TypeScript and production build | Pass |
| Camera paths, reversal, clearance, awakening bounds, landing lifecycle, and GLB packing | 14 unit tests pass |
| Installed Edge desktop and Pixel 7 emulation | 41 browser tests pass; 3 input-specific cases intentionally skipped on the other device project |
| Actual model, textures, and local assets | Pass |
| Awakening | Pulse remains within exposed steel; reversing returns it to a dormant state |
| Landing playback | Completes when scroll stops; reversal cancels it; leaving the landing region re-arms it |
| Direct final-chapter entry | Settled scene without an automatic landing burst |
| Pause effects during landing | Settles immediately; exploration remains available |
| True page ending | Footer removed; document height equals the journey height at all five inspected sizes |
| Credits | Creator, source, license, and modification information available in About |
| Explore | Mouse orbit, wheel zoom, right-drag pan, touch orbit and two-finger pinch/pan, keyboard, toolbar, focus containment, Reset, Exit, and Replay pass |
| Grove reveal | 90–96.5% reveal reverses cleanly; no grove before the ending; direct final entry shows the settled scene |
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

The production build was visually reviewed at **1440 × 900**, **1809 × 685**, **390 × 844**, **844 × 390**, and **320 × 568**. New captures cover the draw, mist reveal, grove reveal, impact, settled composition, exploration, four approximately quarter-turn viewpoints, close zoom, and portrait reduced motion. All five sizes have no runtime or console errors, failed assets, horizontal overflow, or document-bottom gap.

The earlier ScrollTrigger refresh and sticky-scene focus fixes are retained. Grove shaders, buffers, and textures are warmed behind the loading poster to avoid their first upload at impact. After this loading refinement, the four targeted official-model loading and failure/retry checks passed again in both browser projects. The full suite passed 41 cases with three intentional skips: two touch cases on desktop and one mouse case on portrait.

The browser suite uses the official model for awakening, landing, contact, asset, reverse-draw, orientation, and six-view checks. Small intercepted fixtures cover controller bounds and failure scenarios; they are never shipped as the site's model. Production visual review and performance measurements use the actual textured model and complete grove.

Raw production review: [visual-checks.json](docs/moonlit-grove/visual-checks.json).

## Performance and hardware

Measured on the production build with the real model, grove, awakening, mist, stone, and fragments enabled. Measurements ran without another browser test or screenshot process competing for rendering resources.

Machine: **Acer Nitro ANV15-52**, Windows 11, **Intel Core i5-13420H**. Headless **Microsoft Edge 155.0.4283.45** used **Intel UHD Graphics via ANGLE / Direct3D11**. The laptop also has an RTX 5050, but the browser's reported renderer was Intel UHD. Development used Node.js 24.20.0.

| Configuration | Forward/reverse scrolling | Awakening and mist | Landing bursts | Planted ambient | Grove orbit | DPR |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop 1440 × 900 | 77–101 FPS | 165 FPS | 112–117 FPS | 120 FPS | 137 FPS | 1 |
| Pixel 7 browser emulation | 87–151 FPS | 165 FPS | 121–136 FPS | 161 FPS | 163 FPS | 1.25 |

Scrolling, awakening, and ambient values use the renderer's two-second measurement windows. Landing values use three real native-scroll landings; orbit values use five seconds of continuously changing camera direction with active ambient motion. Both use timestamps synchronized with `gl.finish()`. These headless results measure rendering throughput and do not guarantee display refresh or performance on other hardware.

The first desktop measurement before buffer/texture warming was 58–66 FPS during scrolling. The final measurement after the loading refinement was 77–101 FPS. Browser/GPU conditions vary between runs; the raw final results are retained. The visible grove uses about 77,100 triangles and 45–46 draw calls on desktop, and about 48,400 triangles and 38–39 calls in portrait.

The final measured desktop scrolling result exceeds the 60 FPS target on this laptop. **No physical phone was available; the physical-mobile 30 FPS target remains unverified.** Phone emulation uses the laptop GPU. Portrait uses 90 bamboo stalks and 3,150 leaves, compared with 180 stalks and 6,300 leaves on desktop, plus fewer rocks, ground leaves, fog layers, and particles. Pixel density is capped and sustained slow rendering reduces resolution.

Unlit mist cards use one rendering pass. Invisible trails, tip glints, and pressure rings are omitted. Pausing effects allows idle rendering to stop; hidden tabs suspend both rendering and effect clocks.

Raw measurements: [performance.json](docs/moonlit-grove/performance.json).

With the production preview running:

```powershell
$env:KATANA_PREVIEW_URL = 'http://127.0.0.1:4173'
node scripts/measure-fixture.mjs --real --effects
```

Vite reports a size advisory for the dynamically loaded Three.js core: approximately 566 KB minified / 144 KB gzipped. The production build succeeds. No dependencies were added; the existing lockfile is retained.

## Delivery and review

- [Desktop planted ending](docs/moonlit-grove/desktop-final.png)
- [Portrait planted ending](docs/moonlit-grove/portrait-final.png)
- [Landing burst](docs/moonlit-grove/desktop-impact.png)
- [Desktop exploration](docs/moonlit-grove/desktop-explore.png)
- [Portrait exploration](docs/moonlit-grove/portrait-explore.png)
- [Opposite viewpoint](docs/moonlit-grove/desktop-orbit-2.png)
- [Portrait static fallback](docs/moonlit-grove/portrait-static.png)
- Final screenshots and measurements: `docs/moonlit-grove/`; earlier revision captures are retained in their original directories.
- Source, lockfile, and launcher: project root / `start-local.cmd`
- Static production build with local model, posters, fonts, and licenses: `dist/`

Double-click `start-local.cmd`, then open http://127.0.0.1:5173. The launcher uses `npm.cmd` to avoid the PowerShell execution-policy issue. Delivery remains local, with no audio or publication.

