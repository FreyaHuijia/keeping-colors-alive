# Keeping Colors Alive

An interactive art study in erosion and restoration. Colors fall away from a painting as particles, and viewers can bring them back by painting over a selected area or holding a button.

## Run locally

From the repository root, start a static server with Python 3:

```sh
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). The project uses plain JavaScript, HTML, CSS, and Canvas 2D with no build step or runtime dependencies.

## Try the interaction

- Click **Weather now** to seed additional erosion patches, then adjust **Weathering** to control how quickly they spread.
- Click or tap a weathered area. Drag across the preview to restore individual particles, or use **Hold to restore** to gradually restore the whole selection.
- Toggle **Grid** to see selectable regions. Use **Pause** to freeze the simulation or **Reset** to rebuild the painting.
- Enter **Gallery view** to display the artwork with the controls hidden. Press **Space** to pause or resume, and **Esc** to return.

## How it works

- **Image sampling** — `particles.js` samples the source artwork every five pixels with `getImageData()`, yielding 34,992 particles. Each particle retains its original position and RGB color. A 12 × 9 spatial grid groups particles for selection and limits the search area for erosion.
- **Erosion and rendering** — The `requestAnimationFrame` loop expands irregular patches and releases particles from the painting. Released particles drift and fall under gravity before becoming dust. An offscreen canvas caches the stationary artwork while the main canvas composites it with moving particles, dust, and selection overlays.
- **Input and restoration** — `interaction.js` maps pointer coordinates from the scaled canvas into the artwork grid. Pointer capture keeps drag and hold gestures active when the pointer leaves the preview or button. Restoring particles ease back to their original positions and briefly resist further erosion.
- **Page and layout** — `index.html` defines the canvases and controls, `style.css` handles the responsive layout and gallery view, and `assets/artwork.jpg` supplies the source image.
