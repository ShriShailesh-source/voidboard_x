# Voidboard (src)

A lightweight, canvas-first whiteboard clone focused on smooth drawing, intuitive panning, and fast erasing.

## Getting Started

- **Prerequisites:** Install Node.js (LTS recommended).
- **Install deps:**

```bash
npm install
```

- **Run dev server:**

```bash
npm start
```

- The app serves at http://localhost:3000.

## Build

- **Production build:**

```bash
npm run build
```

- Outputs optimized assets under `build/`.

## Key Features

- **Click‑drag Panning:** In Select mode, drag empty canvas to move the board. Cursor changes to grab/grabbing.
- **Pen Cursor & Smooth Strokes:** Custom pen cursor; smoothed freehand with immediate ink at the tip.
- **Eraser Modes:** Point (delete target), Brush (erase within radius), Area (rectangle delete) with visual feedback and size control.
- **Pins & Text Editing:** Drop pins, drag to reposition, double‑click to edit text.
- **Persistence:** Automatically saves elements, camera, snapshots, and theme to `localStorage`; restores on load.
- **Keyboard Delete:** `Delete`/`Backspace` removes the currently selected element (outside of text editing).

## Project Structure (src)

- `App.js`, `App.css` — App shell and styles
- `ExcalidrawClone.jsx` — Main canvas, tools, camera, interactions
- `index.js`, `index.css` — Entry point and global styles
- `reportWebVitals.js`, `setupTests.js`, `App.test.js` — CRA defaults/testing

## Notes

- You may see ESLint warnings during development (hooks deps, a11y, unused vars); they don’t block running the app.
- For best performance, keep many concurrent brush erases moderate; large area operations may take longer.

<details>
<summary><strong>Export / Import (PNG & JSON)</strong></summary>

- <strong>Export PNG:</strong> Use the Export panel (if available) to save a PNG snapshot of the current board.
- <strong>Export JSON:</strong> Save a JSON file of your elements/camera to re-open later.
- <strong>Import JSON:</strong> Load a previously exported JSON to restore a board state.
- <strong>Tips:</strong> For cleaner PNGs, zoom to a comfortable level before exporting; transparent backgrounds may be supported depending on your settings.

</details>

<details>
<summary><strong>Next Steps</strong></summary>

- Add screenshots/GIFs of the board and tools.
- Expand a shortcuts section (e.g., Undo, export/import, snapshots) if you use those features.

</details>
