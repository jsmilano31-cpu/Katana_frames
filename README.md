# Katana - Ink & Steel

A local cinematic showcase made with Vite, TypeScript, Three.js, and GSAP ScrollTrigger. Native scrolling unfolds six movements: Presence, The draw, The edge, Stillness, Through the mist, and Your perspective. A silver-turquoise light pulse awakens the emerging blade, layered mist follows its movement, and a complete landing burst plants it in stone. The planted scene is the actual bottom of the page; credits are available in About.

## Run locally

Double-click **start-local.cmd**, then open **http://127.0.0.1:5173**.

Alternatively, in this project folder:

```powershell
npm.cmd install
npm.cmd run dev
```

The launcher uses `npm.cmd` to avoid PowerShell's `npm.ps1` execution-policy issue. No execution-policy change is needed. Node.js 20.19+ or 22.12+ is required; this delivery was tested with Node.js 24.20.0.

```powershell
npm.cmd run build
npm.cmd run preview
```

The production build is in `dist/`. Serve it over HTTP using the preview command. No site has been published.

## Choreography and controls

- Scroll forward or backward to draw or reseat the blade. Sword and camera movement follow scroll with approximately 0.8 seconds of catch-up. Travel is eight viewport heights on desktop and six on portrait screens.
- From 16–38%, a separate light layer sends a pulse along the exposed steel. It follows the model's curvature, obeys sheath clipping, and reaches the tip with a brief glint. Reverse scrolling returns the blade to its dormant state.
- White mist, turquoise wisps, and luminous motes surround the blade. Trails sample authored sword poses, respond to scroll direction, and strengthen during larger movements. The atmosphere stays dark through the final reveal.
- From 16–38%, an original turquoise ink dragon appears behind the draw. Its horned head and narrow eye awaken with the steel; it dissolves by 52%. Reveal, eye opening, and dissolution reverse with scrolling. Optional mist drift follows Pause effects.
- In the final act the sword turns downward (90–94%) and descends (94–96.5%). Contact triggers a 1.6-second flare, spreading fissures, rising stone fragments, and mist rings, even if scrolling stops. The actual blade tip remains anchored in stone.
- Reversing below contact cancels the burst. Moving below 94% re-arms it; a later forward crossing plays it again. Opening directly at `#form` shows the settled ending. Resize and Explore do not replay the burst.
- Gentle mist and motes continue while idle. **Pause effects** suppresses ambient motion and automatic bursts, settling an active landing immediately; scroll-controlled movement and awakening remain usable. **Resume effects** restores ambient movement. Hidden tabs suspend rendering and effect clocks.
- After landing settles, bamboo leaves continuously tumble into the grove at six per second on desktop and three on mobile. Fallen leaves remain; older leaves merge into a persistent ground texture, bounding the 3D count. Camera controls, Reset view, Exit, and resizing preserve the carpet. Reverse scrolling hides and suspends it; Replay or reload clears it. Pause effects freezes falling, spawning, and settling.
- Chapter navigation leads to authored compositions. Resizing and orientation changes preserve the scene's progress within native scroll-pixel rounding.
- After the final landing settles, **tap or click the scene** to enter the grove. A quiet hint appears when ready. Drags, scrolling, long presses, multitouch, text selection, and interactions with Replay, About, and navigation do not enter exploration. A keyboard entry button becomes visible when focused; Enter activates it.
- The viewer has one discreet **View controls** icon in the bottom-right safe area. Its closed-by-default menu contains Reset, Pause/Resume effects, Replay, Back to the study, and expandable gesture/keyboard help with rotation and zoom buttons. Outside-click closes the menu. Escape closes an open menu; another Escape exits. The main exploration view has no heading, large panel, or persistent status text.
- Mouse drag orbits; the wheel zooms; right-drag or Shift-drag pans. On touch screens, one finger orbits and two fingers pinch to zoom or drag to pan. Arrow keys orbit, Shift+arrows pan, and `+`/`−` zoom. **R**, **Home**, and **Reset view** reset the camera. Exit restores the authored view and scroll position; Replay returns to the beginning.
- The final approach reveals a complete 360-degree moonlit bamboo grove from 90–96.5% progress. Instanced stalks, branches, foliage, weathered rocks, fallen leaves, ground grain, contact shading, a moon, low fog, and motes are original procedural assets. Bamboo and fog drift with the shared ambient clock. The camera can orbit without a horizontal limit, zoom from 0.65–1.8 times its responsive starting distance, and pan within one model unit. Camera bounds keep it above ground and inside the clear central volume. Resizing preserves the explored direction; Reset returns to the current layout's starting view.
- Reduced motion, unavailable WebGL, and failed loading use six desktop and six portrait images rendered from the real model. A retry is available after loading failure. There is no forced wheel interception or scroll snapping.

`src/config.ts` centralizes choreography, framing, and effect settings. Pure scroll sampling remains separate from the landing clock in `src/impact.ts`; the scene renderer coordinates both. `src/awakening.ts` adds a separate clipped surface layer, `src/mist.ts` creates bounded fog and trails, and `src/effects.ts` handles the ground and fragments. The actual maximum-X blade vertex supplies the contact anchor after normalization. The read-only `window.__katana.state()` exposes camera, tip contact, awakening, landing state/count, ambient time, and rendering statistics for QA. `?capture=1` freezes ambient time, settles landings, and exposes progress/impact-phase capture hooks for reproducible images.

Live HTML panels use a fixed viewport layer to keep focus from scrolling the sticky scene. ScrollTrigger refreshes preserve authored progress and suppress transient resets, preventing layout refreshes from replaying the landing.

`src/grove.ts` owns the environment, local texture generation, seeded instance placement, reversible reveal, ambient motion, responsive density, and disposal. `sceneConfig.grove` and `sceneConfig.explore` centralize its settings. Exploration uses a world-up camera; zoom and pan share bounds across pointer, keyboard, and toolbar input. Paused effects stop ambient clocks while fog billboards still follow camera orientation.

`src/dragon.ts` creates four original SVG layers and samples their awakening from scroll. `src/leaf-state.ts` owns the seeded leaf clock and bounded landing queues; `src/falling-leaves.ts` renders the instances and bakes older leaves into one fixed-size texture. `sceneConfig.dragon` and `sceneConfig.leafFall` contain timing, placement, density, and accumulation settings. `window.__katana.atmosphere()` reports these effects; capture mode adds `captureLeaves(seconds)` for repeatable long-session review.

`src/sword-field.ts` adds 160 instanced silhouette katanas on desktop and 80 on portrait screens. A lightweight original outline follows the actual blade guide; grips and guards use simple geometry. Their tips are embedded in the ground. Seeded placements keep the main slab and initial approach clear. Nearby and foreground-obscuring swords fade with camera position, including while ambient effects are paused. The field reveals and reverses with the grove. The existing camera angles, zoom range, and pan range are retained.

Solid swords, stone, and grove surfaces write depth; alpha hashing preserves their progressive reveal and camera fades without transparent-batch sorting over the blades. Background blade edges have slightly more thickness for edge-on readability. Decorative rocks sit beyond the sword field, preserving the central blade, surrounding blades, then scenery hierarchy. Capture-only visibility masks check actual rendered blade fragments from high, rear, and side views.

Source-space cross-section measurements calibrate the Saya opening and Habaki collar in `sceneConfig.model.sheathFrame` and `collarFrame`. Their directions define the rigid fit, blade clipping plane, revealed length, and wind anchor. Extraction follows the collar direction without the old sideways dip. `node scripts/inspect-fit.mjs` reports measured envelope clearances from the actual GLB. Initial chapter links are routed explicitly after scene initialization so native fragment scrolling cannot target a fixed HTML panel during the layout transition.

## Model and artwork

The official **Katana by J.AkioHonda** is included in `public/assets/model/katana.glb`, with embedded original PBR textures and a preserved license. The downloaded scene presents the scabbard below the blade. Runtime geometry is normalized, its opening aligned, and the parts grouped for animation. A temporary clipping plane conceals the portion still inside the scabbard during extraction. The source GLB remains intact.

Original SVG ink silhouettes are generated in `src/ink.ts` and rendered on transparent planes at different depths. Their artwork and layout are original. The Instagram reel served as composition and motion inspiration; no reel artwork, video, branding, or copy is included in the website.

Wind ribbons, mist, stone grain, ink patches, and fractures are procedural local artwork. The mist's cool palette and curling shapes take visual inspiration from [Aniplex's official Muichiro figure](https://store.aniplexusa.com/demonslayer/muichiro-figure/); anime images, character models, and artwork are not shipped. All runtime assets are local. Desktop and portrait layouts reserve separate areas for copy, object, navigation, and controls; short landscape screens use a compact composition.

To import another official download:

```powershell
npm.cmd run assets:import -- "C:\path\to\official-katana.zip"
```

The importer accepts GLB, glTF with adjacent resources, and ZIP. Any replacement needs recalibration. With the development server running:

```powershell
npm.cmd run assets:posters
npm.cmd run assets:check
npm.cmd run build
```

The poster script uses installed Microsoft Edge. Set `KATANA_PREVIEW_URL` for a different port, or `KATANA_BROWSER_CHANNEL=chrome` for installed Chrome.

## Verification

```powershell
npm.cmd test
npm.cmd run test:browser
```

The browser suite exercises installed Edge at desktop size and with Pixel 7 emulation, using the official textured model as well as small test-only fixtures and injected failures. Fixtures are never substituted for the delivered model.

See [VALIDATION.md](VALIDATION.md) for results, actual hardware, frame-rate measurements, limitations, and production screenshots. Physical-phone performance has not been measured.

## Attribution

- **Katana**, model and original preview by **J.AkioHonda**: [source](https://sketchfab.com/3d-models/katana-36e9ab64846246e8964a66b691e62f37), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Runtime grouping, normalization, alignment, lighting, and rendered posters are recorded in the asset manifest. The creator describes the model as a realistic interpretation without historical accuracy.
- **Cormorant Garamond**, served locally under the SIL Open Font License; its license is included beside the font.
- Dragon spirit SVGs, falling bamboo leaves, and accumulated leaf artwork are original procedural assets created for this site.
- Motion reference: [Gilt Foundry's Instagram reel](https://www.instagram.com/reel/DdDI2FQvGzs/).

All application assets are served locally. No accounts, backend, audio, or hosting integration is required.
