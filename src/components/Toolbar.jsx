import { RedoIcon, SingleIcon, TiledIcon, UndoIcon } from './Icons.jsx';

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 4;

export default function Toolbar({
  view,
  setView,
  zoom,
  setZoom,
  canUndo,
  canRedo,
  undo,
  redo,
}) {
  // Log-scale slider so zooming feels even.
  const lo = Math.log(ZOOM_MIN);
  const hi = Math.log(ZOOM_MAX);
  const sliderVal = Math.log(zoom);
  const step = (dir) => setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * (dir > 0 ? 1.25 : 0.8))));

  return (
    <div className="toolbar">
      <div className="tool-group">
        <button
          type="button"
          className={`tool-btn${view === 'single' ? ' active' : ''}`}
          title="Single image"
          onClick={() => setView('single')}
        >
          <SingleIcon />
        </button>
        <button
          type="button"
          className={`tool-btn${view === 'tiled' ? ' active' : ''}`}
          title="Tiled pattern"
          onClick={() => setView('tiled')}
        >
          <TiledIcon />
        </button>
      </div>

      <span className="sep" />

      <div className="tool-group zoom">
        <button type="button" className="zoom-step" title="Zoom out" onClick={() => step(-1)}>
          −
        </button>
        <input
          type="range"
          min={lo}
          max={hi}
          step="0.01"
          value={sliderVal}
          aria-label="Zoom"
          title="Zoom (double-click to reset)"
          onChange={(e) => setZoom(Math.exp(Number(e.target.value)))}
          onDoubleClick={() => setZoom(1)}
        />
        <button type="button" className="zoom-step" title="Zoom in" onClick={() => step(1)}>
          +
        </button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
      </div>

      <span className="grow" />

      <div className="tool-group">
        <button type="button" className="tool-btn" title="Undo (Ctrl/Cmd+Z)" disabled={!canUndo} onClick={undo}>
          <UndoIcon />
        </button>
        <button
          type="button"
          className="tool-btn"
          title="Redo (Ctrl/Cmd+Shift+Z)"
          disabled={!canRedo}
          onClick={redo}
        >
          <RedoIcon />
        </button>
      </div>
    </div>
  );
}
