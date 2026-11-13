// Tile-level effects applied before the tiling is built.

const smooth = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * Make the tile wrap without visible seams. Each pixel is blended between the
 * tile and a copy of itself shifted by half its size. The blend weight is 0 on
 * every edge (so neighbouring tiles meet on identical source pixels) and 1 in
 * the middle (so the centre of the image is untouched).
 * strength: 0..1, how far in from the edges the blending reaches.
 */
export function makeSeamless(tile, strength) {
  if (!strength || strength <= 0) return tile;
  const w = tile.width;
  const h = tile.height;
  const src = tile.getContext('2d').getImageData(0, 0, w, h);
  const out = new ImageData(w, h);
  const s = src.data;
  const o = out.data;
  const hw = Math.floor(w / 2);
  const hh = Math.floor(h / 2);
  const fx = Math.max(1e-6, (strength * w) / 2);
  const fy = Math.max(1e-6, (strength * h) / 2);

  const mx = new Float32Array(w);
  for (let x = 0; x < w; x++) mx[x] = smooth(Math.min(x + 0.5, w - x - 0.5) / fx);

  for (let y = 0; y < h; y++) {
    const my = smooth(Math.min(y + 0.5, h - y - 0.5) / fy);
    const sy = (y + hh) % h;
    for (let x = 0; x < w; x++) {
      const m = mx[x] * my;
      const i = (y * w + x) * 4;
      const j = (sy * w + ((x + hw) % w)) * 4;
      o[i] = s[j] + (s[i] - s[j]) * m;
      o[i + 1] = s[j + 1] + (s[i + 1] - s[j + 1]) * m;
      o[i + 2] = s[j + 2] + (s[i + 2] - s[j + 2]) * m;
      o[i + 3] = s[j + 3] + (s[i + 3] - s[j + 3]) * m;
    }
  }

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').putImageData(out, 0, 0);
  return c;
}

/**
 * Add `gap` px of space between tiles (half on each side) filled with `bg`
 * (a CSS color, or null for transparent).
 */
export function padTile(tile, gap, bg) {
  const g = Math.round(gap || 0);
  if (g <= 0) return tile;
  const c = document.createElement('canvas');
  c.width = tile.width + g;
  c.height = tile.height + g;
  const ctx = c.getContext('2d');
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.drawImage(tile, Math.floor(g / 2), Math.floor(g / 2));
  return c;
}

// Draw the tile wrapped by half its size, so its seams cross the middle.
export function drawOffsetTile(ctx, tile, x, y, w, h) {
  const hw = w / 2;
  const hh = h / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (const dx of [-hw, hw]) {
    for (const dy of [-hh, hh]) {
      ctx.drawImage(tile, x + dx, y + dy, w, h);
    }
  }
  ctx.restore();
}
