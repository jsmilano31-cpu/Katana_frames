# Validation — 2026-10-13

The updated Ink & Steel experience uses the official textured J.AkioHonda katana. Wind ribbons and mist follow the fitted scabbard mouth. The finale turns the sword downward, embeds its actual blade-tip vertex in an ink-covered stone slab, and releases a reversible wind ring and particles. Gentle ambient motion has an accessible Pause effects control.

## Completed checks

| Check | Result |
| --- | --- |
| TypeScript and static production build | Pass |
| Camera continuity, reversal, draw clearance, wind timing, planted state, and GLB packing | 10 unit tests pass |
| Installed Edge desktop and Pixel 7 emulation | 25 browser tests pass; 1 touch scenario intentionally skipped on desktop |
| Official textured model | All six acts load locally without failed requests or JavaScript errors |
| Native scroll, reverse/rapid scrolling, chapter links, and replay | Pass |
| Sheath gust and reverse effects | Wind follows the mouth; reverse traversal restores effects without stale impact state |
| Embedded blade | Tip stays at the contact anchor after impact, during orbit, and through resizing |
| Explore | Mouse/touch drag, keyboard rotation, visible focus, focus containment, reset, exit, and authored-camera restoration pass |
| Orbit floor limits | Camera remains above the ground |
| Pause effects | Ambient time freezes; scroll choreography continues; Resume restarts drift |
| Reduced motion and unavailable WebGL | Complete static journey; no wind animation or GLB request in reduced-motion mode |
| Asset failure and retry | Recovery passes |
| Fallback images | Six desktop and six portrait posters regenerated from the completed sequence |
| Asset integrity and attribution | Model, posters, creator credit, and license retained |
| Production preview | HTTP 200; no JavaScript errors, failed assets, or horizontal overflow at all five inspected sizes |

Visual review covered **1440 × 900**, **1809 × 685** (the supplied screenshot's proportions), **390 × 844**, **844 × 390**, and **320 × 568**. All six acts, raised sword, impact gust, planted finale, and orbit controls were inspected. Intermediate strike poses at 92%, 93%, and 95.8% were also captured. Compact portrait framing increases opening camera distance; short landscape layouts move close-up copy below the blade. A final compact-toolbar adjustment was visually checked after the browser suite.

Browser QA uses an intercepted small GLB for controller/failure scenarios and the official model for effects, contact, asset, reverse-draw, and orientation checks. Test fixtures are not delivered as the site's model. Production visual checks are recorded in [visual-checks.json](docs/wind-impact/visual-checks.json).

## Performance and hardware

Measured with the production build and official model after the browser suite completed. The script measures a forward/reverse scroll, then allows catch-up and two complete measurement windows at the sheath gust, impact gust, and planted ambient scene.

Test machine: **Acer Nitro ANV15-52**, Windows 11, **Intel Core i5-13420H**. Headless **Microsoft Edge 155.0.4283.45** selected **Intel UHD Graphics through ANGLE / Direct3D11**. Development used Node.js 24.20.0.

| Configuration | Scrolling FPS | Active-effects FPS | Pixel density | Sampled draw calls / triangles |
| --- | --- | --- | --- | --- |
| Desktop, 1440 × 900 | 96–115 | Approximately 165 | 1 | 15–31 / 19,516–22,090 |
| Pixel 7 browser emulation | 112–162 | Approximately 165 | 1.25 | 11–30 / 19,224–21,704 |

The measured desktop result exceeds the 60 FPS target on this machine. Headless measurements are not display-refresh or device-wide guarantees. **No physical phone was available: the 30 FPS physical-mobile target remains unverified.** Phone emulation uses the laptop GPU. Mobile reduces particle and ribbon counts, omits a decorative ink layer, and caps pixel density; sustained slow rendering still reduces resolution automatically.

Ambient motion renders while enabled. Pausing effects allows idle rendering to stop; hidden tabs stop rendering and do not accumulate a large time step on return.

Raw measurements: [performance.json](docs/wind-impact/performance.json).

With the production preview running, repeat using:

```powershell
$env:KATANA_PREVIEW_URL = 'http://127.0.0.1:4173'
node scripts/measure-fixture.mjs --real --effects
```

Vite reports a size advisory for the dynamically loaded Three.js core chunk: approximately 559 KB minified / 142 KB gzipped. The production build succeeds.

## Delivery and review

- [Opening at the supplied proportions](docs/wind-impact/wide-0.png)
- [Portrait opening](docs/wind-impact/portrait-0.png)
- [Unsheathing wind](docs/wind-impact/desktop-1.png)
- [Impact gust](docs/wind-impact/desktop-impact.png)
- [Desktop planted finale](docs/wind-impact/desktop-5.png)
- [Portrait planted finale](docs/wind-impact/portrait-5.png)
- [Portrait static fallback](docs/wind-impact/portrait-static.png)
- [Desktop exploration](docs/wind-impact/desktop-explore.png)
- [Portrait orbit](docs/wind-impact/portrait-orbit.png)
- All final screenshots and measurements: `docs/wind-impact/`
- Updated source, package lockfile, and local launcher: project root / `start-local.cmd`
- Static production build with local assets: `dist/`

Double-click `start-local.cmd` and open http://127.0.0.1:5173. It uses `npm.cmd` to avoid the PowerShell execution-policy issue. This delivery is local; no site was published.

