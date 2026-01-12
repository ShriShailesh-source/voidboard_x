# Voidboard

A lightweight, canvas-first whiteboard clone built with **Next.js** and React. Features smooth drawing, intuitive panning, fast erasing, and powerful collaboration tools.

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

Outputs optimized assets under `.next/` directory.

## Key Features

- **Click‑drag Panning:** In Select mode, drag empty canvas to move the board. Cursor changes to grab/grabbing.
- **Pen Cursor & Smooth Strokes:** Custom pen cursor; smoothed freehand with immediate ink at the tip.
- **Eraser Modes:** Point (delete target), Brush (erase within radius), Area (rectangle delete) with visual feedback and size control.
- **Pins & Text Editing:** Drop pins, drag to reposition, double‑click to edit text.
- **Persistence:** Automatically saves elements, camera, snapshots, and theme to `localStorage`; restores on load.
- **Keyboard Delete:** `Delete`/`Backspace` removes the currently selected element (outside of text editing).

## Approach & Design Decisions

### Architecture
- **Next.js Framework:** App Router (Next.js 15+) with React Server Components and Client Components.
- **Canvas-First:** Uses HTML5 Canvas for all rendering, ensuring smooth performance and pixel-perfect control.
- **State Management:** Client-side `useState` hooks for simplicity; no Redux needed for this use case.
- **Immediate Feedback:** Drawing occurs directly on canvas during mouse move events, then synced to the elements array for persistence.

### Key Design Choices

**1. Next.js App Router**
- Modern file-based routing with `app/` directory structure.
- Server Components for static content, Client Components (`'use client'`) for interactive canvas.
- Optimized builds with automatic code splitting and lazy loading.
- Ready for deployment to Vercel or any Node.js hosting platform.

**2. Camera & Viewport System**
- Decoupled camera (pan/zoom) from elements; transform applied during render.
- Screen ↔ World coordinate conversion allows intuitive interactions at any zoom level.
- Pan via Shift+Drag, Arrow keys, or WASD; zoom with Scroll wheel.

**2. Tool Architecture**
- Modular tool system: `pen`, `arrow`, `rectangle`, `circle`, `triangle`, `text`, `image`, `pin`, `select`, `eraser`, `pan`.
- Each tool has dedicated state (`strokeColor`, `strokeWidth`, `strokeOpacity`) and visual feedback.
- Tool UI panels positioned dynamically to avoid overlapping (Appearance panel, Eraser Panel, ToolsGrid).

**3. Eraser Modes**
- **Point:** Click to delete single element with confirmation dialog.
- **Brush:** Drag to erase all elements within radius; real-time visual feedback.
- **Area:** Drag rectangle to delete multiple elements; useful for bulk cleanup.

**4. Rendering Optimization**
- Only visible elements render; camera bounds check prevents off-canvas drawing from impacting performance.
- Shapes use seeded randomness for consistent "roughness" (hand-drawn look).
- Stroke smoothing via point averaging for pen tool.

**5. Persistence & State**
- Auto-saves to `localStorage`: elements, camera position, UI state (theme, snapshots).
- Snapshot feature for quick save/restore checkpoints.
- History tracking with undo support (Ctrl+Z).

**6. Interactions**
- **Text Editing:** Double-click text/pins to edit inline; Esc to finish.
- **Layer Controls:** Bring to front / send to back for element ordering.
- **Selection:** Click to select; visual outline shows selection state.
- **Keyboard Shortcuts:** Delete, Ctrl+Z (undo), Ctrl+S (snapshot), Ctrl+E (export).

### Why These Decisions?
- **Next.js over CRA:** Modern build tool with better performance, automatic optimizations, and deployment-ready structure.
- **Canvas over DOM:** Better performance for drawing-heavy apps; GPU acceleration for transformations.
- **State in React:** Keeps UI and data synchronized; hooks are sufficient for this app's complexity.
- **Tool-based UI:** Users intuitively understand "select a tool, then interact," matching Excalidraw/Figma patterns.
- **localStorage Persistence:** No server needed; offline-first user experience.

## Project Structure

```
voidboard/
├── app/                    # Next.js App Router
│   ├── layout.js          # Root layout with metadata
│   ├── page.js            # Home page (renders ExcalidrawClone)
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ExcalidrawClone.jsx  # Main canvas component (client-side)
│   └── ui/                # Reusable UI components
│       ├── Toolbar.jsx
│       ├── ToolsGrid.jsx
│       ├── EraserPanel.jsx
│       ├── TextEditing.jsx
│       └── ...
├── src/                   # Legacy CRA files (can be removed)
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies and scripts
```

## Notes

- ESLint warnings during development (hooks deps, a11y) don't block the app.
- Performance is smooth up to ~500–1000 elements; beyond that, consider spatial partitioning or WebGL.
- The `src/` directory contains legacy Create React App files and can be removed after confirming the Next.js migration works.

## Migration from CRA to Next.js

This project was converted from Create React App to Next.js for:
- ✅ Faster builds and development server
- ✅ Better production optimizations
- ✅ Modern App Router architecture
- ✅ Deployment-ready for Vercel/serverless platforms

**To complete cleanup:** Delete the `src/` folder and `public/` CRA files after testing.
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

