// Shared by the live preview and the exporter.

function resample(src, w, h) {
  let cur = src;
  // Halve repeatedly for decent quality when shrinking a lot.
  while (cur.width / 2 >= w && cur.height / 2 >= h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.floor(cur.width / 2));
    c.height = Math.max(1, Math.floor(cur.height / 2));
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(cur, 0, 0, c.width, c.height);
    cur = c;
  }
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const g = out.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(cur, 0, 0, w, h);
  return out;
}

/**
 * Fill the whole canvas with `cell` repeated.
 * scale: device px per cell px. origin: device px position of a cell corner.
 * rotation: degrees, around origin.
 */
export function renderPattern(ctx, cell, { width, height, rotation = 0, scale = 1, originX = 0, originY = 0 }) {
  let src = cell;
  let sx = 1;
  let sy = 1;
  if (scale < 0.75) {
    const sw = Math.max(1, Math.round(cell.width * scale));
    const sh = Math.max(1, Math.round(cell.height * scale));
    src = resample(cell, sw, sh);
    sx = cell.width / sw;
    sy = cell.height / sh;
  }
  const pattern = ctx.createPattern(src, 'repeat');
  pattern.setTransform(
    new DOMMatrix().translate(originX, originY).rotate(rotation).scale(scale * sx, scale * sy)
  );
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
