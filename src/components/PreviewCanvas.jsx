import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { renderPattern } from '../lib/render.js';
import { drawOffsetTile } from '../lib/tileFx.js';
import { FullscreenIcon } from './Icons.jsx';
import { ZOOM_MAX, ZOOM_MIN } from './Toolbar.jsx';

export default function PreviewCanvas({
  view,
  cell,
  tile,
  showSeam,
  rotation,
  zoom,
  setZoom,
  isDragActive,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Wheel zoom (needs a non-passive listener to preventDefault).
  useEffect(() => {
    const el = wrapRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const f = Math.exp(-e.deltaY * 0.0015);
      setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current * f)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setZoom]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w || !size.h) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.round(size.w * dpr);
    const H = Math.round(size.h * dpr);
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    const g = canvas.getContext('2d');
    g.imageSmoothingQuality = 'high';
    const cs = getComputedStyle(canvas);
    g.fillStyle = cs.getPropertyValue('--preview-bg').trim() || '#eee';
    g.fillRect(0, 0, W, H);
    if (!cell || !tile) return;

    const ox = (size.w / 2 + pan.x) * dpr;
    const oy = (size.h / 2 + pan.y) * dpr;

    if (view === 'single') {
      const dw = tile.width * zoom * dpr;
      const dh = tile.height * zoom * dpr;
      g.save();
      g.shadowColor = 'rgba(0,0,0,0.35)';
      g.shadowBlur = 24 * dpr;
      g.fillStyle = '#fff';
      g.fillRect(ox - dw / 2, oy - dh / 2, dw, dh);
      g.restore();
      if (showSeam) drawOffsetTile(g, tile, ox - dw / 2, oy - dh / 2, dw, dh);
      else g.drawImage(tile, ox - dw / 2, oy - dh / 2, dw, dh);
    } else {
      renderPattern(g, cell, {
        width: W,
        height: H,
        rotation,
        scale: zoom * dpr,
        originX: ox,
        originY: oy,
      });
    }
  }, [size, pan, view, cell, tile, showSeam, rotation, zoom]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, pan };
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setPan({ x: d.pan.x + e.clientX - d.x, y: d.pan.y + e.clientY - d.y });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const goFullscreen = () => {
    const el = wrapRef.current;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div
      ref={wrapRef}
      className={`preview${isDragActive ? ' drag' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => setPan({ x: 0, y: 0 })}
    >
      <canvas ref={canvasRef} />
      {!tile && (
        <div className="preview-empty">
          <strong>Drop an image anywhere</strong>
          <span>Your tiled pattern will appear here.</span>
        </div>
      )}
      <button
        type="button"
        className="fab"
        title="Fullscreen"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={goFullscreen}
      >
        <FullscreenIcon />
      </button>
    </div>
  );
}
