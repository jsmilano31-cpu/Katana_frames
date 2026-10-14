# Selected 3D asset

The official **Katana** by **J.AkioHonda** is included in `katana.glb`, with original PBR textures embedded and the creator's license retained in `license.txt`.

Source: https://sketchfab.com/3d-models/katana-36e9ab64846246e8964a66b691e62f37

License: Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/).

The runtime resets the original presentation orientation, normalizes the sword, aligns the scabbard opening, and separates sword/scabbard animation groups. The scabbard fitting travels with its scabbard. During the draw a temporary clipping plane conceals steel inside the scabbard. Original geometry, materials, and UVs remain in the delivered GLB; runtime geometry transforms are baked into clones for animation. A separate clipped awakening light layer preserves the steel's PBR material. Studio lighting, original ink clouds, and procedural mist surround the model. In the finale the actual blade tip is anchored in a procedural stone setting with animated mist, fissures, and fragments; only the camera orbits during exploration. Six desktop and six portrait fallback images are rendered from this sequence.

The final setting also includes an original procedural moonlit bamboo grove with instanced foliage, rocks, ground textures, fog, motes, and a field of lightweight silhouette katanas. Exploration moves the camera through bounded orbit, zoom, and pan; the main model and its embedded tip remain stationary. The sheath fit is calibrated from actual Saya and Habaki cross-sections; its opening frame drives clipping and effects. The licensed GLB and original PBR textures are unchanged.

For future replacement imports, from the project root:

    npm.cmd run assets:import -- "C:\path\to\official-download.zip"

A GLB, glTF with adjacent buffers/textures, or ZIP is supported. Recalibrate against the replacement model and regenerate posters before rebuilding. Use the creator's official download.
