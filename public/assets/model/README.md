# Selected 3D asset

The official **Katana** by **J.AkioHonda** is included in `katana.glb`, with original PBR textures embedded and the creator's license retained in `license.txt`.

Source: https://sketchfab.com/3d-models/katana-36e9ab64846246e8964a66b691e62f37

License: Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/).

The runtime resets the original presentation orientation, normalizes the sword, aligns the scabbard opening, and separates sword/scabbard animation groups. The scabbard fitting travels with its scabbard. During the draw a temporary clipping plane conceals steel inside the scabbard. Original geometry, materials, and UVs remain in the delivered GLB; runtime geometry transforms are baked into clones for animation. Studio lighting, original ink clouds, and procedural wind surround the model. In the finale the actual blade tip is anchored in a procedural ink-covered stone slab; only the camera orbits during exploration. Six desktop and six portrait fallback images are rendered from this sequence.

For future replacement imports, from the project root:

    npm.cmd run assets:import -- "C:\path\to\official-download.zip"

A GLB, glTF with adjacent buffers/textures, or ZIP is supported. Recalibrate against the replacement model and regenerate posters before rebuilding. Use the creator's official download.
