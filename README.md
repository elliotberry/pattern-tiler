# Pattern Tiler

A browser app for turning an image into a repeating pattern. Drop in a picture, crop and rotate it, pick a tiling, and see the tiled result update live.

Built with React and Vite (plain JavaScript, no TypeScript). The tiling itself is drawn with the Canvas 2D API, so there are no image-processing dependencies.

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## Using the app

1. Drop an image anywhere on the page, or click the upload area in the sidebar. PNG, JPG, WebP, GIF and SVG work.
2. Choose a tiling from the dropdown on the **Pattern** tab.
3. Edit the image in the card below it. The preview on the right updates as you go.
4. Open the **Export** tab to download the result.

### Pattern tab

- **Tiling** - pick how the image repeats (see the list below).
- **Rotation** - rotates the whole tiled pattern.
- **Offset** - shifts alternate rows or columns (Brick and Half-drop only).
- **Spacing and Fill** - leaves a gap between tiles and fills it with a color or leaves it transparent (the simple tilings only).
- **Crop box** - drag it to move, drag the handles to resize. A dashed outline shows which part of the image the current tiling uses; turn it off with "Show tile region".
- **Rotate and flip** - rotate 90 degrees either way, flip horizontally or vertically, or reset all edits. Flipping resets the crop.
- **Angle** - free rotation from -45 to 45 degrees. Rotating by a free angle leaves transparent corners, so crop them out.
- **Seamless** - blends the edges of the tile so it wraps without a visible seam. Turn on "Show seam" to preview the tile shifted by half its size, so any seams cross the middle.
- **Width and height** - the size of the tile in pixels (16 to 1024). "Fixed aspect ratio" ties the height to the crop's proportions.

Double-click any slider to reset it.

### Preview controls

- **Single image / tiled** view toggle.
- **Zoom** with the slider, the -/+ buttons or the mouse wheel.
- **Pan** by dragging. Double-click the preview to recenter.
- **Undo and redo** with the toolbar buttons or Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z. Rapid changes, such as dragging a slider, count as one step.
- **Fullscreen** with the button in the bottom-right corner.

### Export tab

Download as PNG or JPEG (with a quality slider):

- the tiled pattern at any size up to 8192 px a side,
- the single repeat cell, or
- the edited image.

## Tilings

**Simple:** Grid, Brick, Half-drop, Diamond, Basket weave, Mirror, Mirror left-right, Mirror top-bottom.

**Wallpaper groups:** Half-turn, Glide, Offset mirror, Mirror glide, Double glide, Rhombic mirror, Pinwheel, Pinwheel mirror, Kaleidoscope, Triangular, Triangle kaleidoscope, Triple kite, Hexagonal, Honeycomb.

Together these cover all 17 wallpaper groups, the ways a flat pattern can repeat using only translations, rotations and mirror reflections. In standard notation they are, in order: P2, PG, CM, PMG, PGG, CMM, P4, P4G, P4M, P3, P3M1, P31M, P6 and P6M. P1 is Grid and PMM is Mirror; PM is the pair of one-direction mirrors.

## How it works

The image goes through a short pipeline, all on canvases:

```
source image -> working image (flip, rotate)
             -> tile (crop, resize)
             -> seamless blend (optional)
             -> spacing (simple tilings only)
             -> repeat cell (the chosen tiling)
             -> preview / export
```

Each tiling builds a single rectangular repeat cell, which the preview then repeats with `createPattern`. This keeps redraws fast while zooming, panning and rotating.

## Project structure

```
src/
  App.jsx                 app state and the image pipeline
  state/useEditorState.js settings reducer with undo/redo history
  lib/
    applyEdits.js         load image, flip/rotate, crop and resize to a tile
    tileFx.js             seamless blending, spacing, seam preview
    tilings.js            the tiling registry and every repeat-cell builder
    render.js             fills a canvas with a repeated cell (preview and export)
  components/
    Sidebar, Tabs         left panel
    ImageEditor.jsx       crop box, rotate/flip, size and seamless controls
    DropZone.jsx          empty-state upload area
    Toolbar.jsx           view, zoom, undo/redo
    PreviewCanvas.jsx     live preview, pan and zoom
    ExportPanel.jsx       downloads
```

To add a tiling, write a function in `src/lib/tilings.js` that takes the tile canvas and returns one repeat cell, then add an entry to the `TILINGS` list.

## Notes

- Images larger than 2048 px on their longest side are scaled down for editing.
- The app is dark-mode only.
