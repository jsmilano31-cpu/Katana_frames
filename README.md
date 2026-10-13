# Katana - Ink & Steel

A local cinematic showcase made with Vite, TypeScript, Three.js, and GSAP ScrollTrigger. Native scrolling unfolds six movements: Presence, The draw, The edge, Stillness, Ink to light, and Your perspective. Wind escapes the scabbard during extraction; the finale plants the real katana into an ink-covered stone slab with an outward gust.

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

- Scroll forward or backward to draw or reseat the blade. Sword, camera, and impact choreography stop after approximately 0.8 seconds of catch-up. Travel is eight viewport heights on desktop and six on portrait screens.
- Fine sheath mist and ribbons follow the real opening. In the final act the sword turns downward (90–94%), strikes (94–96.5%), and releases an outward wind ring and ink particles (96.5–100%). Reverse scrolling undoes the sequence; the tip remains embedded after impact.
- Gentle ambient particles, ink drift, and faint wind continue while idle. **Pause effects** freezes that ambient motion while scrolling remains usable; **Resume effects** restores it. Hidden tabs stop rendering.
- The blade clears the scabbard before the perspective sweep. Moving lights and environment reflections reveal its shape. Layered ink artwork gradually gives way to ivory.
- Chapter navigation leads to authored compositions. Resizing and orientation changes preserve the scene's progress within native scroll-pixel rounding.
- **Explore the katana** becomes available when the final impact settles. Drag with mouse or touch, or focus the viewer and use arrow keys, to orbit the planted sword. Orbit limits keep the camera above the ground. **R**, **Home**, and **Reset view** reset the camera. **Escape** or **Back to the study** restores the cinematic sequence. **Replay the journey** returns to the beginning.
- Reduced motion, unavailable WebGL, and failed loading use six desktop and six portrait images rendered from the real model. A retry is available after loading failure. There is no forced wheel interception or scroll snapping.

`src/config.ts` centralizes act timing, responsive camera paths, transforms, extraction calibration, ground placement, wind settings, lighting, artwork, and text timing. `src/motion.ts` samples the reversible state; `src/scene.ts` renders it, with bounded wind pools and procedural stone in `src/effects.ts`. The actual maximum-X blade vertex supplies the contact anchor after normalization. The read-only `window.__katana.state()` exposes camera, tip contact, effects, ambient time, and rendering statistics for QA. `?capture=1` enables poster capture and freezes ambient time for reproducible images.

## Model and artwork

The official **Katana by J.AkioHonda** is included in `public/assets/model/katana.glb`, with embedded original PBR textures and a preserved license. The downloaded scene presents the scabbard below the blade. Runtime geometry is normalized, its opening aligned, and the parts grouped for animation. A temporary clipping plane conceals the portion still inside the scabbard during extraction. The source GLB remains intact.

Original SVG ink silhouettes are generated in `src/ink.ts` and rendered on transparent planes at different depths. Their artwork and layout are original. The Instagram reel served as composition and motion inspiration; no reel artwork, video, branding, or copy is included in the website.

Wind ribbons, mist, stone grain, ink patches, and fractures are procedural local artwork. No additional external asset or service is required. Desktop and portrait layouts reserve separate areas for copy, object, navigation, and controls; short landscape screens use a compact composition.

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
- Motion reference: [Gilt Foundry's Instagram reel](https://www.instagram.com/reel/DdDI2FQvGzs/).

All application assets are served locally. No accounts, backend, audio, or hosting integration is required.
