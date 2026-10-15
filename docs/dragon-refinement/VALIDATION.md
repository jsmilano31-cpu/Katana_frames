# Dragon artwork and extraction timing — 2026-10-15

This revision replaces the geometric SVG dragon with a cohesive detailed transparent illustration, a distressed procedural vermilion sun, and a small registered eye layer. The existing six-act journey, detailed licensed model, grove, silhouette field, leaf accumulation, and camera controls are retained.

## Timing

The renderer now passes the measured exposed fraction after applying the sword and scabbard transforms. A 1% seating tolerance prevents a small collar clearance from awakening a still-sheathed blade. The spirit progressively reveals from the head into the body; its eye opens over 65–95% extraction. The blade pulse follows the same measured exposed steel and reaches the actual tip on full clearance.

| Journey progress | Actual exposed steel | Intended state |
| --- | --- | --- |
| 12% | 0.58% | Seated; dragon and sun hidden |
| 16% | 7.55% | Faint ink contours and sun emerge |
| 20% | 25.28% | Head and body progressively emerge |
| 25% | 55.29% | Partial draw; eye remains dormant |
| 28% | 73.89% | Eye starts opening |
| 32% | 95.21% | Eye reaches its narrow awakened gaze |
| 34% | 100% | Full clearance; eye and blade glint peak together |
| 40% | 100% | Complete dragon still held; blade glint fading |
| 46% | 100% | Ink and sun dissolving |
| 52% | 100% | Dragon absent before Stillness |

All reveal, eye, sun, and dissolution state is sampled rather than triggered. Reverse scrolling and direct jumps resolve immediately. Pause effects retains scrolling while freezing ambient motion; stopping scroll freezes the awakening. Decorative texture failure is isolated from model loading and exploration.

## Artwork and responsive review

The [artwork notes](ARTWORK.md) include the exact prompt, generation tool, delivered asset paths, dimensions, and eye registration. Desktop texture memory is bounded to one 1024 × 1536 RGBA image; mobile uses 512 × 768. There are three background planes, with no full-screen bloom or copied reference painting.

Review captures cover desktop 1440 × 900, wide-short 1809 × 685, portrait 390 × 844, mobile landscape 844 × 390, and compact 320 × 568. Each includes seated, first steel, emerging, partial draw, eye opening, full awakening, held reveal, dissolution, Stillness, and the ending. The desktop comparison uses the same 36% progress as the saved before image. Sun radius and landscape placement were refined after the first inspection to eliminate a clipped disc edge and header crowding. The sun's initial opacity is restrained to a faint stain, building with the dragon rather than arriving at nearly full strength before the head emerges.

## Verification results

- `npm.cmd test`: 18 unit tests pass, including exposure-dependent timing, dormant seating tolerance, faint early sun, reverse sampling, blade clipping bounds, and the existing bounded leaf simulation.
- Browser regressions: 56 unique applicable cases pass across desktop Edge and Pixel 7 emulation. Four input-specific cases intentionally skip the inapplicable project. The initial 60-case run passed 54 and failed two obsolete assertions that still expected the former late 40% glint peak; the updated assertions pass on both projects in a focused eight-case rerun, including refreshed fallbacks and nonblocking decorative texture failure. After softening the early sun, a final six-case timing/fallback rerun also passes.
- `npm.cmd run build`: TypeScript and Vite production build pass. The existing 566.47 kB Three.js core chunk advisory remains; the scene module is 228.47 kB before gzip in this build.
- `npm.cmd run assets:check`: official model, original material, transparent desktop/mobile illustration variants, and all twelve fallback chapter images pass. The draw fallback represents the fully awakened 34% view. A failed dragon request leaves the real katana and exploration usable.
- All sixteen model/manifest/dragon/poster production files match their local sources by SHA-256; see [production assets](production-assets.json).
- Production visual captures have no runtime or console errors, failed asset responses, or horizontal overflow at the five reviewed sizes. Stopped and reversed samples are identical; see [raw visual checks](visual-checks.json).
- Existing regressions cover forward/reverse scroll, rapid chapter changes, resizing/orientation, impact cancellation/re-arming, direct final entry, Pause effects, mouse/touch/keyboard controls, orbit/zoom/pan bounds, depth visibility, loading/retry, reduced motion, and unavailable WebGL. Grove and leaf behavior remain intact.

## Active-effects performance

Measured on an Acer Nitro ANV15-52, Core i5-13420H, Windows 11, Intel UHD Graphics through ANGLE/D3D11, installed Edge 155.0.4283.45, Node 24.20.0. Measurements use the production build at full dragon awakening (34%), real model, sun, registered eye, and resumed ambient mist, with five-second frame timings synchronized through `gl.finish()`.

| Layout | Render throughput | DPR | Draw calls | Triangles |
| --- | --- | --- | --- | --- |
| Desktop 1440 × 900 | 164.8 FPS | 1 | 42 | 22,462 |
| Pixel 7 emulation | 165.0 FPS | 1.25 | 31 | 22,006 |

These are headless rendered-frame measurements on the available laptop, rather than guaranteed display rates. Physical phone hardware was unavailable; mobile results use desktop device emulation. There were no runtime or console errors during either measurement. [Raw measurements](performance.json) retain GPU, browser, scene state, and statistics. The previous [grove and hour-long accumulation measurements](../divine-awakening/VALIDATION.md) remain a baseline for those unchanged systems.

## Delivered locally

Updated TypeScript source, transparent artwork, existing lockfile and launcher, static `dist/` build, regenerated desktop/mobile fallbacks, five-layout production screenshots, raw diagnostics, and these notes. Use `start-local.cmd` or `npm.cmd run dev`; serve `dist/` using `npm.cmd run preview`. No audio, hosting, or publication was added.
