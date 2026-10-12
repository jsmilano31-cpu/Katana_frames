# Katana — A study in form

A local single-page showcase built with Vite, TypeScript, Three.js, and GSAP ScrollTrigger. Five chapters move from a full katana reveal to the blade, guard, handle, and full form. The final chapter enables drag and keyboard exploration.

## Run locally

Requires Node.js 20.19+ or 22.12+. Dependencies and a lockfile are included.

```powershell
npm.cmd install
npm.cmd run dev
```

Open the Local URL printed by Vite, normally `http://127.0.0.1:5173`.

You can also double-click `start-local.cmd`. The commands deliberately use `npm.cmd`, which avoids PowerShell's `npm.ps1` script launcher; changing your execution policy is unnecessary.

```powershell
npm.cmd run build
npm.cmd run preview
```

The static production build is in `dist/`. This project has not been published.

## Included 3D asset

**The official Katana by J.AkioHonda is imported and included**, with its original textures packed into `public/assets/model/katana.glb`. Its license is preserved next to the model. The site starts in 3D when WebGL and motion preferences allow, with five desktop and five portrait posters for fallback views. A generated test fixture is used only in intercepted browser tests; it is never substituted for the selected katana.

The model's official source:

[Sketchfab model page](https://sketchfab.com/3d-models/katana-36e9ab64846246e8964a66b691e62f37)

To import a replacement official download:

```powershell
npm.cmd run assets:import -- "C:\path\to\official-katana.zip"
```

The importer accepts a self-contained GLB, glTF with adjacent resources, or a ZIP containing either. It embeds buffers and textures into `public/assets/model/katana.glb`, preserves geometry/materials, and marks the asset manifest ready. Reload the website or press **Retry 3D** to activate the renderer.

Calibration is centralized in `src/config.ts`: model orientation, camera paths, focal points, field of view, and portrait camera roll. The original Sketchfab presentation rotation is reset. The scabbard and its Kurikata fitting are hidden, and visible sword geometry alone determines normalization. All five chapters are framed against the imported model. Inspect and regenerate posters after any calibration or asset change.

With the dev server running at port 5173:

```powershell
npm.cmd run assets:posters
npm.cmd run assets:check
npm.cmd run build
```

The poster script uses installed Microsoft Edge to render five desktop and five portrait fallback images from the official model. Set `KATANA_PREVIEW_URL` for a different local port; set `KATANA_BROWSER_CHANNEL` to `chrome` to use installed Chrome. `assets:check` verifies the model and all ten rendered posters before delivery.

## Controls and accessibility

- Native scroll drives a reversible camera timeline, with approximately 0.8 seconds of catch-up. Desktop travel is eight viewport heights; portrait travel is six.
- Chapter links jump to authored views. The last chapter offers **Explore the form** when 3D is ready.
- In exploration, drag to orbit or focus the viewer and use arrow keys. **R**, **Home**, or **Reset view** restores the full view. **Escape** or **Back to the study** exits and restores scrolling. Wheel zoom is disabled.
- Reduced motion, missing models, loading failures, and unavailable WebGL produce an ordinary still-image page. Rendered chapter posters are used after asset preparation; until then the original creator preview is used throughout.
- PBR reflections use a generated studio environment. Pixel density is capped, render resolution reduces after sustained low frame rate, and rendering stops while idle or the tab is hidden.

## Verification

```powershell
npm.cmd test
npm.cmd run test:browser
```

Browser tests use installed Microsoft Edge at 1440 × 900 and Pixel 7 emulation. No browser download is required. Tests cover the official textured model, fault-injected missing-model behavior, actual WebGL with a small test-only GLB, forward/reverse/rapid scrolling, portrait resizing, drag/keyboard/reset/exit, replay, asset-error retry, unavailable WebGL, and reduced motion changes.

The read-only `window.__katana.state()` exposes current chapter, camera pose, mode, and sampled renderer statistics for local QA. `?capture=1` enables poster capture; it does not add a visitor control.

Desktop and portrait framing are checked with the real model. A physical phone is still needed to establish actual mobile frame rate. See `VALIDATION.md` for recorded checks and performance limits.

## Attribution

- **Katana**, model and preview render by **J.AkioHonda**, [source](https://sketchfab.com/3d-models/katana-36e9ab64846246e8964a66b691e62f37), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The preview is cropped for layout. On import, resources are embedded into GLB when needed; runtime normalization, lighting, and rendered fallback images are recorded in the manifest. The creator describes this as a realistic interpretation without historical accuracy.
- **Cormorant Garamond**, locally hosted, under the SIL Open Font License. License included with the font in `public/assets/fonts/OFL.txt`.
- Three.js, GSAP, their glTF decoders, and all page assets are served locally. No accounts, backend, audio, or hosting integration is required.
