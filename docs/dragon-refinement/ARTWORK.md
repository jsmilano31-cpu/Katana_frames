# Ink dragon artwork

Generated with the built-in `image_gen.imagegen` tool on 2026-10-15, with `transparent_background: true`. The user's attached painting informed the ink-dragon composition; this is an original generated illustration. The vermilion sun, reveal mask, eye opening, and glow are separate procedural shader layers.

Project assets:
- `public/assets/dragon/ink-dragon.png` — original 1024 × 1536 RGBA output, 2,525,304 bytes.
- `public/assets/dragon/ink-dragon-mobile.png` — 512 × 768 RGBA delivery variant, 569,113 bytes. High-quality bicubic resizing preserves the original alpha.

The eye anchor is measured at pixel (350, 267) in the original illustration, stored as normalized UV (.342, .826). The small eye and its glow follow that anchor in both texture variants. The licensed katana model and its attribution are separate from the added artwork.

## Final generation prompt

```text
Use case: stylized-concept. Asset type: production transparent PNG illustration for a cinematic katana website, portrait aspect 2:3. Create an ORIGINAL exquisitely detailed East Asian ink dragon, inspired by traditional sumi-e paintings: a fierce left-facing snarling head at approximately x=43%, y=22% of canvas, long whiskers curving left, branching horns, swept-back silver charcoal mane, beautiful intricate overlapping scales, narrow pale silver eye, segmented ivory-gray belly. One continuous elongated upright serpentine S-shaped body occupies center and right, curling down through the canvas, lower tail dissolving naturally into delicate charcoal ink flecks and translucent smoke. Cohesive refined hand-painted charcoal and silver-gray engraving detail with dry-brush ink textures, solemn divine legendary presence, museum-quality illustration, highly readable head profile. Designed for compositing on a DARK CHARCOAL website: silver-gray lit ridges, pale gray belly and fine mane strokes must remain readable on dark backgrounds, deep black recesses. Full subject comfortably within canvas, no cropped horns or whiskers. Actual transparent alpha background, including around all wisps. Isolated dragon only. NO sun, NO background rectangle, NO parchment, NO text, NO buildings, NO landscape, NO neon glow, NO cartoon icon, NO simplistic vector shapes. Eye should be small and sharply defined, not glowing yet. Keep empty transparent space around the silhouette. Render a portrait 1024x1536 composition.
```
