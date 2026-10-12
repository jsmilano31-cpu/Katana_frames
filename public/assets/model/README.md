# Selected 3D asset

The official model is included as `katana.glb`, with original geometry and PBR textures. The creator's license is retained in `license.txt`. Source: **Katana** by **J.AkioHonda**:

https://sketchfab.com/3d-models/katana-36e9ab64846246e8964a66b691e62f37

License: Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/).

From the project root run:

    npm run assets:import -- "C:\path\to\official-download.zip"

A GLB, a .gltf file with its adjacent textures/buffer, or a ZIP containing glTF/GLB is supported for future replacement imports. The importer packs glTF resources into `katana.glb` and records the import. Then reload the preview, inspect framing, and run `npm.cmd run assets:posters` to render fallback images.

Do not extract files from Sketchfab's internal viewer. Use the creator's official download.
