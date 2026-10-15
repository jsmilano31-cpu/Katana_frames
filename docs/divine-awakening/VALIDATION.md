# Divine Awakening — validation, 2026-10-15

The official textured J.AkioHonda katana remains the central model. This revision adds four original dragon SVG layers, scroll-sampled eye opening and ink dissolution, and instanced falling bamboo leaves that settle and accumulate. Older leaves are baked into a fixed-size ground texture, preserving their marks without adding unbounded objects. Delivery remains local, without audio or publication.

## Checks

- TypeScript and 17 unit tests pass. Unit checks include an hour of simulated leaf fall, accounting for every leaf as airborne, landed, or baked; density changes retain accumulation, and Replay reset clears it.
- All 54 applicable browser cases pass across the full run and focused reruns; four input-specific cases are intentionally skipped. One desktop camera-bounds check ran during a development reload and passed after source froze. The final focused run passes all six real-model dragon, leaf, and depth cases on desktop and portrait; both camera-bounds cases also pass.
- Dragon reveal, fierce eye opening, and dissolution reverse from scroll. The spirit disappears by 52%, before Stillness. Separate portrait framing and a height cap retain the head in short windows. Artwork remains behind the steel with depth testing; the original model materials are preserved.
- Settled leaves survive orbit, zoom, pan, Reset view, Exit, pause/resume, and returning to the ending. Reverse scrolling suspends the system. Replay clears both geometry and texture and suppresses respawning during the initial replay frames.
- Falling begins after the landing settles. Pausing freezes the shared leaf clock, spawning, descent, and settling; hidden tabs do not catch up missed spawn time. Scroll-driven dragon and steel awakening remain usable while paused.
- A ten-minute visual soak retains 512 desktop or 256 portrait landed instances, with thousands of older leaves baked into the carpet. The desktop airborne capacity is 96; portrait spawn capacity is 48. In-flight leaves finish naturally when a desktop viewport changes to portrait density. Fixed texture allocation is chosen at initialization: 2048 desktop or 1024 portrait, preserved across orientation changes.
- Existing native scrolling, reverse/rapid movement, chapter navigation, landing completion/re-arming, direct final entry, menu, mouse/touch/keyboard controls, bounds, focus, loading retry, unavailable WebGL, and reduced motion remain covered by the browser suite.

## Production review

Review sizes: 1440 × 900 desktop, 1809 × 685 wide-short, 390 × 844 portrait, 844 × 390 landscape, and 320 × 568 compact phone. Captures cover emergence, opening eye, full awakening, dissolution, Stillness, settled leaves, four orbit views, near/far zoom, and a ten-minute leaf carpet. Raw errors, layout dimensions, fragment visibility counts, and accumulation counts are in [visual-checks.json](visual-checks.json).

All five production layouts have zero runtime/console errors, missing assets, horizontal overflow, and bottom gap. Rendered-fragment masks retain both the hero blade and surrounding field with the carpet present. All fourteen model, manifest, and poster files in `dist/` match their source hashes. The production build passes; Vite retains its existing size advisory for the 566 KB Three.js core chunk.

- [Desktop awakening](desktop-awakened.png)
- [Wide-short awakening](wide-awakened.png)
- [Portrait awakening](portrait-awakened.png)
- [Grove with falling leaves](desktop-grove.png)
- [Ten-minute carpet](desktop-carpet.png)
- [Portrait grove](portrait-grove.png)
- [Static portrait ending](portrait-static.png)

All twelve desktop/portrait chapter posters are regenerated from the actual model. The finale uses three minutes of representative leaf accumulation. The manifest records the added original SVG and procedural leaf artwork; no new external artwork or model is downloaded.

## Performance and limits

Measurements use the real textured GLB, active mist, sword field, dragon, and leaves on the production build, with no competing browser QA process. See [performance.json](performance.json) for five-second dragon and grove-orbit samples, including ten-minute and one-hour leaf accumulation. Frame timing is synchronized with `gl.finish()`; this measures headless rendering throughput, not guaranteed display refresh.

Hardware: Acer Nitro ANV15-52, Windows 11, Intel Core i5-13420H. The browser reports Intel UHD Graphics through ANGLE / Direct3D11. Browser version and exact renderer are recorded with the measurements. Node.js 24.20.0 is used for development.

| Configuration | Dragon awakening | Grove orbit, ten-minute carpet | Grove orbit, one-hour carpet | DPR |
| --- | --- | --- | --- | --- |
| Desktop, Edge 155.0.4283.45 | 146 FPS | 78 FPS | 67 FPS | 1 |
| Pixel 7 browser emulation, same Edge/GPU | 164 FPS | 99 FPS | 129 FPS | 1.25 |

These measured desktop scenarios exceed the 60 FPS target; they do not establish a minimum for every scroll position or device. Camera direction and browser/GPU conditions vary between samples. The one-hour desktop scene reports 50 draw calls and about 138,640 triangles; portrait reports 43 calls and about 79,166 triangles. More than 21,000 desktop leaves have become persistent texture marks while only 512 settled and 65 airborne leaves remain geometric in that sample.

Pixel 7 results are browser emulation on the laptop GPU. No physical phone is available, so the physical-mobile 30 FPS target remains unverified. Geometry and textures have fixed capacities; counters grow while old marks accumulate into the same carpet. Carpet marks are flat, and do not form physical piles or persist after page reload. Adaptive resolution, hidden-tab suspension, and Pause effects are retained.

## Reproduce and deliver

Run `npm.cmd test`, `npm.cmd run test:browser`, `npm.cmd run assets:check`, and `npm.cmd run build`. With a preview running, set `KATANA_PREVIEW_URL` and run `node scripts/review-divine.mjs` or `node scripts/measure-divine.mjs`.

`window.__katana.atmosphere()` is a read-only effects diagnostic. With `?capture=1`, `captureLeaves(seconds)` resets and samples up to two hours of leaf accumulation for reproducible review. Normal visitor controls do not expose simulation time.

Source, lockfile, and `start-local.cmd` remain at the project root. The complete static build is in `dist/`; all model, font, license, artwork, and poster resources are served locally. Double-click the launcher and open http://127.0.0.1:5173.
