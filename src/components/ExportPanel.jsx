import { useState } from 'react';
import { renderPattern } from '../lib/render.js';

const MAX_SIDE = 8192;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function download(canvas, name, type, quality) {
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    type,
    quality
  );
}

export default function ExportPanel({ tile, cell, rotation }) {
  const [what, setWhat] = useState('field');
  const [w, setW] = useState(2048);
  const [h, setH] = useState(2048);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(0.92);

  if (!tile || !cell) {
    return (
      <div className="card">
        <p className="muted">Upload an image to export your pattern.</p>
      </div>
    );
  }

  const type = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';

  const doExport = () => {
    let out;
    if (what === 'field') {
      out = document.createElement('canvas');
      out.width = clamp(Math.round(w) || 1, 1, MAX_SIDE);
      out.height = clamp(Math.round(h) || 1, 1, MAX_SIDE);
      const g = out.getContext('2d');
      if (format === 'jpeg') {
        g.fillStyle = '#fff';
        g.fillRect(0, 0, out.width, out.height);
      }
      renderPattern(g, cell, {
        width: out.width,
        height: out.height,
        rotation,
        scale: 1,
        originX: out.width / 2,
        originY: out.height / 2,
      });
    } else {
      const src = what === 'cell' ? cell : tile;
      out = document.createElement('canvas');
      out.width = src.width;
      out.height = src.height;
      const g = out.getContext('2d');
      if (format === 'jpeg') {
        g.fillStyle = '#fff';
        g.fillRect(0, 0, out.width, out.height);
      }
      g.drawImage(src, 0, 0);
    }
    download(out, `pattern-${what}.${ext}`, type, quality);
  };

  return (
    <>
      <div className="card">
        <div className="card-title">What to export</div>
        <div className="radio-group">
          {[
            ['field', 'Tiled pattern'],
            ['cell', `Repeat cell (${cell.width}×${cell.height})`],
            ['tile', `Edited image (${tile.width}×${tile.height})`],
          ].map(([id, label]) => (
            <label key={id} className="radio">
              <input type="radio" name="what" checked={what === id} onChange={() => setWhat(id)} />
              <span className="dot" />
              {label}
            </label>
          ))}
        </div>

        {what === 'field' && (
          <div className="size-row">
            <label>
              W
              <input type="number" min="1" max={MAX_SIDE} value={w} onChange={(e) => setW(e.target.value)} />
            </label>
            <span className="times">×</span>
            <label>
              H
              <input type="number" min="1" max={MAX_SIDE} value={h} onChange={(e) => setH(e.target.value)} />
            </label>
            <span className="unit">px</span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Format</div>
        <div className="segmented">
          <button type="button" className={format === 'png' ? 'on' : ''} onClick={() => setFormat('png')}>
            PNG
          </button>
          <button type="button" className={format === 'jpeg' ? 'on' : ''} onClick={() => setFormat('jpeg')}>
            JPEG
          </button>
        </div>
        {format === 'jpeg' && (
          <div className="field">
            <label htmlFor="q">Quality</label>
            <input
              id="q"
              type="range"
              min="0.3"
              max="1"
              step="0.01"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
            <output>{Math.round(quality * 100)}%</output>
          </div>
        )}
      </div>

      <button type="button" className="primary-btn" onClick={doExport}>
        Download {ext.toUpperCase()}
      </button>
    </>
  );
}
