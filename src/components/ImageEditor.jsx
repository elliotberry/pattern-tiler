import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MAX_TILE, MIN_TILE } from '../lib/applyEdits.js';
import { getDomain } from '../lib/tilings.js';
import {
  ChevronDown,
  FlipHIcon,
  FlipVIcon,
  ResetIcon,
  RotateLeftIcon,
  RotateRightIcon,
} from './Icons.jsx';

const MIN_CROP = 0.03;
const MAX_STAGE_H = 300;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function applyDrag(handle, start, dx, dy) {
  let { x, y, w, h } = start;
  if (handle === 'move') {
    return { x: clamp(x + dx, 0, 1 - w), y: clamp(y + dy, 0, 1 - h), w, h };
  }
  let x2 = x + w;
  let y2 = y + h;
  if (handle.includes('w')) x = clamp(x + dx, 0, x2 - MIN_CROP);
  if (handle.includes('e')) x2 = clamp(x2 + dx, x + MIN_CROP, 1);
  if (handle.includes('n')) y = clamp(y + dy, 0, y2 - MIN_CROP);
  if (handle.includes('s')) y2 = clamp(y2 + dy, y + MIN_CROP, 1);
  return { x, y, w: x2 - x, h: y2 - y };
}

export default function ImageEditor({
  working,
  settings,
  tileSize,
  update,
  rotate90,
  flip,
  resetEdits,
  showRegion,
  setShowRegion,
  showSeam,
  setShowSeam,
  onBrowse,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [wrapW, setWrapW] = useState(280);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setWrapW(el.clientWidth));
    ro.observe(el);
    setWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Fit the working image into the stage.
  const fit = Math.min(wrapW / working.width, MAX_STAGE_H / working.height);
  const dispW = Math.max(40, Math.round(working.width * fit));
  const dispH = Math.max(40, Math.round(working.height * fit));

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(dispW * dpr);
    c.height = Math.round(dispH * dpr);
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(working, 0, 0, c.width, c.height);
  }, [working, dispW, dispH]);

  const { crop } = settings;
  // Part of the tile the current tiling actually uses (null = all of it).
  const regions = showRegion ? getDomain(settings.tiling, tileSize.w, tileSize.h) : null;

  const onPointerDown = (handle) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { handle, x: e.clientX, y: e.clientY, crop: { ...crop } };
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    e.stopPropagation();
    const dx = (e.clientX - d.x) / dispW;
    const dy = (e.clientY - d.y) / dispH;
    update({ crop: applyDrag(d.handle, d.crop, dx, dy) }, 'crop');
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };
  const dragProps = (handle) => ({
    onPointerDown: onPointerDown(handle),
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  });

  const cropPxW = Math.max(1, crop.w * working.width);
  const cropPxH = Math.max(1, crop.h * working.height);

  const setW = (v) => {
    const n = clamp(Math.round(Number(v) || MIN_TILE), MIN_TILE, MAX_TILE);
    update({ tileW: n }, 'tileW');
  };
  const setH = (v) => {
    const n = clamp(Math.round(Number(v) || MIN_TILE), MIN_TILE, MAX_TILE);
    if (settings.lockAspect) {
      update({ tileW: clamp(Math.round((n * cropPxW) / cropPxH), MIN_TILE, MAX_TILE) }, 'tileH');
    } else {
      update({ tileH: n }, 'tileH');
    }
  };
  const toggleLock = (checked) => {
    if (checked) update({ lockAspect: true });
    else update({ lockAspect: false, tileW: tileSize.w, tileH: tileSize.h });
  };

  return (
    <>
      <div className="card-head">
        <button type="button" className="link-btn" title="Choose a different image" onClick={onBrowse}>
          CHANGE IMAGE <ChevronDown />
        </button>
      </div>

      <div className="stage-wrap" ref={wrapRef}>
        <div className="crop-frame" style={{ width: dispW, height: dispH }}>
          <canvas ref={canvasRef} style={{ width: dispW, height: dispH }} />
          <div
            className="crop-box"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
            }}
            {...dragProps('move')}
          >
            {regions && (
              <svg className="region" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
                {regions.map((pts, i) => (
                  <polygon key={i} points={pts.map((p) => p.join(',')).join(' ')} />
                ))}
              </svg>
            )}
            {HANDLES.map((h) => (
              <span key={h} className={`handle h-${h}`} {...dragProps(h)} />
            ))}
          </div>
        </div>
      </div>

      <div className="tool-row">
        <button type="button" className="icon-btn" title="Rotate left 90°" onClick={() => rotate90(-1)}>
          <RotateLeftIcon />
        </button>
        <button type="button" className="icon-btn" title="Rotate right 90°" onClick={() => rotate90(1)}>
          <RotateRightIcon />
        </button>
        <button
          type="button"
          className={`icon-btn${settings.flipX ? ' on' : ''}`}
          title="Flip horizontally (resets crop)"
          onClick={() => flip('x')}
        >
          <FlipHIcon />
        </button>
        <button
          type="button"
          className={`icon-btn${settings.flipY ? ' on' : ''}`}
          title="Flip vertically (resets crop)"
          onClick={() => flip('y')}
        >
          <FlipVIcon />
        </button>
        <span className="spacer" />
        <button
          type="button"
          className="icon-btn"
          title="Reset crop, rotation and flips"
          onClick={resetEdits}
        >
          <ResetIcon />
        </button>
      </div>

      <div className="field">
        <label htmlFor="angle">Angle</label>
        <input
          id="angle"
          type="range"
          min="-45"
          max="45"
          step="0.5"
          value={settings.angle}
          onChange={(e) => update({ angle: Number(e.target.value) }, 'angle')}
          onDoubleClick={() => update({ angle: 0 })}
        />
        <output>{settings.angle.toFixed(1)}°</output>
      </div>

      <div className="field">
        <label htmlFor="seamless" title="Blend the tile edges so it wraps without a visible seam">
          Seamless
        </label>
        <input
          id="seamless"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.seamless}
          onChange={(e) => update({ seamless: Number(e.target.value) }, 'seamless')}
          onDoubleClick={() => update({ seamless: 0 })}
        />
        <output>{Math.round(settings.seamless * 100)}%</output>
      </div>

      <div className="size-row">
        <label>
          W
          <input
            type="number"
            min={MIN_TILE}
            max={MAX_TILE}
            value={tileSize.w}
            onChange={(e) => setW(e.target.value)}
          />
        </label>
        <span className="times">×</span>
        <label>
          H
          <input
            type="number"
            min={MIN_TILE}
            max={MAX_TILE}
            value={tileSize.h}
            onChange={(e) => setH(e.target.value)}
          />
        </label>
        <span className="unit">px</span>
      </div>

      <label className="check">
        <input
          type="checkbox"
          checked={settings.lockAspect}
          onChange={(e) => toggleLock(e.target.checked)}
        />
        <span className="box" />
        Fixed aspect ratio
      </label>

      <label className="check" title="Outline the part of the image the tiling uses">
        <input type="checkbox" checked={showRegion} onChange={(e) => setShowRegion(e.target.checked)} />
        <span className="box" />
        Show tile region
      </label>

      <label className="check" title="Preview the tile offset by half so its seams cross the middle">
        <input type="checkbox" checked={showSeam} onChange={(e) => setShowSeam(e.target.checked)} />
        <span className="box" />
        Show seam
      </label>
    </>
  );
}
