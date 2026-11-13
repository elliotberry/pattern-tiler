export const MAX_WORKING = 2048; // longest side of the working image
export const MAX_TILE = 1024;
export const MIN_TILE = 16;

export async function loadImage(file) {
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback (e.g. SVG): decode through an <img> element.
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = url;
      });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 512;
      c.height = img.naturalHeight || 512;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

// Source -> flipped -> rotated (90deg steps + free angle) working image.
// The crop rectangle (normalised 0..1) is expressed in this image's space.
export function makeWorkingImage(source, { quarter, angle, flipX, flipY }) {
  const sw = source.width;
  const sh = source.height;
  const theta = ((quarter * 90 + angle) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(theta));
  const sin = Math.abs(Math.sin(theta));
  const W = sw * cos + sh * sin;
  const H = sw * sin + sh * cos;
  const k = Math.min(1, MAX_WORKING / Math.max(W, H));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(W * k));
  c.height = Math.max(1, Math.round(H * k));
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.translate(c.width / 2, c.height / 2);
  g.rotate(theta);
  g.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  g.scale(k, k);
  g.drawImage(source, -sw / 2, -sh / 2);
  return c;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// With "fixed aspect ratio" the tile height follows the crop's aspect ratio.
export function effectiveTileSize(settings, workingW, workingH) {
  const { crop, tileW, tileH, lockAspect } = settings;
  const w = clamp(Math.round(tileW), MIN_TILE, MAX_TILE);
  if (!lockAspect) return { w, h: clamp(Math.round(tileH), MIN_TILE, MAX_TILE) };
  const cw = Math.max(1, crop.w * workingW);
  const ch = Math.max(1, crop.h * workingH);
  return { w, h: clamp(Math.round((w * ch) / cw), MIN_TILE, MAX_TILE) };
}

export function makeTile(working, crop, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(
    working,
    crop.x * working.width,
    crop.y * working.height,
    Math.max(1, crop.w * working.width),
    Math.max(1, crop.h * working.height),
    0,
    0,
    w,
    h
  );
  return c;
}
