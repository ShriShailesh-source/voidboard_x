# Voidboard

A minimal infinite canvas for quick sketching, flows, and notes.

## Run the Project

Prerequisites:
- Node.js 16+ and npm

Install and start:

```bash
npm install
npm start
```

This starts the dev server at http://localhost:3000.

Build for production:

```bash
npm run build
```

## Approach & Design Decisions

- Canvas-first rendering: Uses the HTML5 Canvas 2D API for all drawing (shapes, freehand, pins, selection, grid) to keep performance predictable and independent of DOM layout.
- Rough-style shapes: Custom jittered lines for rectangles, ellipses, triangles, and arrows via seeded noise to add a hand-drawn feel while remaining lightweight.
- Freehand smoothing: Quadratic curves + round caps/joins and light interpolation reduce jitter and ensure strokes start at the pen tip immediately.
- Camera model: Simple `camera { x, y, zoom }` for panning/zooming; world/screen coordinates converted consistently so tools work at any zoom.
- Interaction model:
  - Tools: select, pan, rectangle, ellipse, triangle, arrow, freehand, text, image, pin, eraser.
  - Panning with mouse drag on empty canvas (grab/grabbing cursor feedback), plus keyboard panning (WASD/arrow keys).
  - Pins: movable by drag; double-click to edit; tags, color; visual move hint.
  - Eraser modes: point (delete), brush (partial erase for freehand with live cursor preview), area (rectangle delete).
- Persistence: Auto-save to `localStorage` (elements, camera, snapshots, theme) and auto-restore on load to make the board resilient to browser restarts.
- UI & theming: Glassmorphism panels, neumorphic buttons, dark/light theme via CSS variables; radial gradient background; info modal, tutorial overlay, history/snapshots side panel.
- Export & share: PNG export via `canvas.toDataURL`; JSON import/export for board state; quick share (copy URL).
- Performance choices:
  - Render loop gated by `needsRender` to avoid unnecessary draws.
  - RequestAnimationFrame for cursor preview updates.
  - Throttled/conditional updates for hover and brush erasing to reduce flicker and re-renders.
  - Minimal object churn in hot paths; batch operations where practical.
- Accessibility/UX: Keyboard shortcuts (Ctrl+Z/S/E/H, Esc), hover highlights, cursor previews, clear selection outlines and handles.

## Notes
- Created with React; canvas logic is centralized in `src/ExcalidrawClone.jsx`.
- ESLint warnings may appear during development; they do not block running. You can address them incrementally.
- If you change tool behavior, keep coordinate conversions and camera interactions consistent.
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
