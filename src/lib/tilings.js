// Tiling registry. Every `build(tile, opts)` receives the tile canvas and returns
// a canvas holding ONE rectangular repeat cell. The cell tiles the plane by pure
// translation (createPattern 'repeat'), so the preview stays fast.
//
// Naming used in comments below: T = the tile, fx / fy / fxy = flipped
// horizontally / vertically / both (fxy is the same as a 180 degree rotation).

const SQRT3 = Math.sqrt(3);
const SQRT2 = Math.sqrt(2);
const DEG = Math.PI / 180;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// Draw `tile` so it covers the rectangle (x, y, w, h) (centered, uniform scale).
function drawCover(g, tile, x, y, w, h) {
  const k = Math.max(w / tile.width, h / tile.height);
  const dw = tile.width * k;
  const dh = tile.height * k;
  g.drawImage(tile, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// Clip to a polygon, grown slightly so neighbouring pieces overlap and no
// hairline seams from anti-aliasing show up between them.
function clipPoly(g, pts, grow = 1.5) {
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p[0];
    cy += p[1];
  }
  cx /= pts.length;
  cy /= pts.length;
  g.beginPath();
  pts.forEach(([x, y], i) => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy) || 1;
    const f = (d + grow) / d;
    const px = cx + dx * f;
    const py = cy + dy * f;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  });
  g.closePath();
  g.clip();
}

// Draw `src` into the slot (x, y, w, h) with an optional flip.
// kind: 'id' | 'fx' | 'fy' | 'fxy'
function place(g, src, x, y, kind = 'id') {
  const w = src.width;
  const h = src.height;
  const sx = kind === 'fx' || kind === 'fxy' ? -1 : 1;
  const sy = kind === 'fy' || kind === 'fxy' ? -1 : 1;
  g.save();
  g.translate(x + (sx < 0 ? w : 0), y + (sy < 0 ? h : 0));
  g.scale(sx, sy);
  g.drawImage(src, 0, 0);
  g.restore();
}

// Lay out a grid of flips: rows is an array of arrays of kinds.
function layout(tile, rows) {
  const w = tile.width;
  const h = tile.height;
  const c = makeCanvas(w * rows[0].length, h * rows.length);
  const g = c.getContext('2d');
  rows.forEach((row, j) => row.forEach((kind, i) => place(g, tile, i * w, j * h, kind)));
  return c;
}

// Square made from the tile (cover-fit), used by the 4-fold groups.
function coverSquare(tile) {
  const s = Math.max(1, Math.round(Math.min(tile.width, tile.height)));
  const c = makeCanvas(s, s);
  drawCover(c.getContext('2d'), tile, 0, 0, s, s);
  return c;
}

// Four copies rotated by 90 degrees about the centre of a 2s x 2s cell.
function pinwheel(sq) {
  const s = sq.width;
  const c = makeCanvas(2 * s, 2 * s);
  const g = c.getContext('2d');
  for (let k = 0; k < 4; k++) {
    g.save();
    g.translate(s, s);
    g.rotate((k * Math.PI) / 2);
    g.translate(-s, -s);
    g.drawImage(sq, 0, 0);
    g.restore();
  }
  return c;
}

/* ------------------------------ simple tilings ----------------------------- */

function grid(tile) {
  return tile;
}

function brick(tile, { offset = 0.5 } = {}) {
  const w = tile.width;
  const h = tile.height;
  const c = makeCanvas(w, 2 * h);
  const g = c.getContext('2d');
  const off = Math.round(w * offset);
  g.drawImage(tile, 0, 0);
  g.drawImage(tile, off, h);
  g.drawImage(tile, off - w, h);
  return c;
}

function halfDrop(tile, { offset = 0.5 } = {}) {
  const w = tile.width;
  const h = tile.height;
  const c = makeCanvas(2 * w, h);
  const g = c.getContext('2d');
  const off = Math.round(h * offset);
  g.drawImage(tile, 0, 0);
  g.drawImage(tile, w, off);
  g.drawImage(tile, w, off - h);
  return c;
}

// pmm: reflect across both axes.
const mirror = (tile) =>
  layout(tile, [
    ['id', 'fx'],
    ['fy', 'fxy'],
  ]);

// pm: reflect left-right only / top-bottom only.
const mirrorLR = (tile) => layout(tile, [['id', 'fx']]);
const mirrorTB = (tile) => layout(tile, [['id'], ['fy']]);

// Square lattice rotated 45 degrees; the cell holds two diamonds.
function diamond(tile) {
  const sq = coverSquare(tile);
  const s = sq.width;
  const d = s * SQRT2;
  const Wi = Math.max(2, Math.round(d));
  const c = makeCanvas(Wi, Wi);
  const g = c.getContext('2d');
  g.scale(Wi / d, Wi / d);
  const centers = [
    [0, 0],
    [d, 0],
    [0, d],
    [d, d],
    [d / 2, d / 2],
  ];
  for (const [cx, cy] of centers) {
    g.save();
    g.translate(cx, cy);
    g.rotate(Math.PI / 4);
    g.drawImage(sq, -s / 2 - 0.75, -s / 2 - 0.75, s + 1.5, s + 1.5);
    g.restore();
  }
  return c;
}

// Checkerboard of the square and the square turned 90 degrees.
function basket(tile) {
  const sq = coverSquare(tile);
  const s = sq.width;
  const c = makeCanvas(2 * s, 2 * s);
  const g = c.getContext('2d');
  const turned = (x, y) => {
    g.save();
    g.translate(x + s, y);
    g.rotate(Math.PI / 2);
    g.drawImage(sq, 0, 0);
    g.restore();
  };
  g.drawImage(sq, 0, 0);
  g.drawImage(sq, s, s);
  turned(s, 0);
  turned(0, s);
  return c;
}

/* ------------------------ wallpaper groups (rectangular) ------------------- */

// p2: 180 degree rotation.
const p2 = (tile) => layout(tile, [['id'], ['fxy']]);

// pg: glide reflection. Row 1 is flipped top-bottom and shifted by half a tile.
function pg(tile) {
  const w = tile.width;
  const h = tile.height;
  const c = makeCanvas(w, 2 * h);
  const g = c.getContext('2d');
  const off = Math.round(w / 2);
  place(g, tile, 0, 0, 'id');
  place(g, tile, off, h, 'fy');
  place(g, tile, off - w, h, 'fy');
  return c;
}

// cm: mirror lines on a centred lattice.
const cm = (tile) =>
  layout(tile, [
    ['id', 'fx'],
    ['fx', 'id'],
  ]);

// pmg: one mirror direction, perpendicular glide, 2-fold centres.
const pmg = (tile) =>
  layout(tile, [
    ['id', 'fx'],
    ['fxy', 'fy'],
  ]);

// pgg: two perpendicular glides and 2-fold centres, no mirrors.
const pgg = (tile) =>
  layout(tile, [
    ['id', 'fy'],
    ['fx', 'fxy'],
  ]);

// cmm: mirrors in both directions on a centred lattice.
const cmm = (tile) =>
  layout(tile, [
    ['id', 'fx'],
    ['fxy', 'fy'],
    ['fx', 'id'],
    ['fy', 'fxy'],
  ]);

/* ---------------------------- wallpaper groups (square) -------------------- */

const p4 = (tile) => pinwheel(coverSquare(tile));

// p4m: square domain split along its diagonal, then mirrored on all sides.
function p4m(tile) {
  const q = coverSquare(tile);
  const s = q.width;
  const g = q.getContext('2d');
  g.save();
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, s);
  g.lineTo(s, s);
  g.closePath();
  g.clip();
  g.transform(0, 1, 1, 0, 0, 0); // reflect across the main diagonal
  drawCover(g, tile, 0, 0, s, s);
  g.restore();
  return mirror(q);
}

// p4g: pinwheel of squares that are mirror-symmetric about their anti-diagonal.
function p4g(tile) {
  const q = coverSquare(tile);
  const s = q.width;
  const g = q.getContext('2d');
  g.save();
  g.beginPath();
  g.moveTo(s, 0);
  g.lineTo(s, s);
  g.lineTo(0, s);
  g.closePath();
  g.clip();
  g.transform(0, -1, -1, 0, s, s); // reflect across the anti-diagonal
  drawCover(g, tile, 0, 0, s, s);
  g.restore();
  return pinwheel(q);
}

/* ---------------------------- wallpaper groups (hex) ----------------------- */
// Hexagons (pointy-top, circumradius R) sit on a hex lattice with spacing
// L = R*sqrt(3). The rectangular repeat cell is L x 3R and holds 2 lattice
// points. Each group fills one hexagon from a small domain, then the hexagon
// is repeated by translation.
//
// Local coordinates around a hexagon centre O: the base triangle (sector
// centred on the x axis) is O, (a,-R/2), (a,R/2) with a = R*sqrt(3)/2.

function hexGeometry(kind, s) {
  const R = Math.max(2, kind === 'p3' ? s / 1.5 : s);
  const a = (R * SQRT3) / 2; // apothem
  const L = R * SQRT3;
  const H = 3 * R; // = L * sqrt(3)
  const O = [0, 0];
  const A = [a, -R / 2];
  const B = [a, R / 2];
  const c = [(2 * a) / 3, 0]; // centroid of the base triangle
  return {
    R,
    a,
    L,
    H,
    centroid: c,
    tri: { pts: [O, A, B], box: [0, -R / 2, a, R] },
    halfUp: { pts: [O, [a, 0], B], box: [0, -R / 2, a, R] },
    rhombus: { pts: [O, A, B, [0, R]], box: [0, -R / 2, a, 1.5 * R] },
    // Third of the base triangle around its centroid: kite at vertex B.
    kite: { pts: [c, [a, 0], B, [a / 2, R / 4]], box: [a / 2, 0, a / 2, R / 2] },
  };
}

function hexCell(tile, kind) {
  const s = Math.min(tile.width, tile.height);
  const geo = hexGeometry(kind, s);
  const { R, L, H } = geo;
  const Wi = Math.max(2, Math.round(L));
  const Hi = Math.max(2, Math.round(Wi * SQRT3));
  const c = makeCanvas(Wi, Hi);
  const g = c.getContext('2d');
  g.scale(Wi / L, Hi / H);

  const piece = (d, mirrorY) => {
    g.save();
    if (mirrorY) g.scale(1, -1);
    clipPoly(g, d.pts);
    drawCover(g, tile, d.box[0], d.box[1], d.box[2], d.box[3]);
    g.restore();
  };

  // The triangle used as one sector of a mirrored (D3) star.
  const baseTriangle = () => {
    if (kind === 'p3m1') {
      piece(geo.tri, false);
    } else {
      // p31m: three kites rotated about the triangle centroid.
      for (let j = 0; j < 3; j++) {
        g.save();
        g.translate(geo.centroid[0], geo.centroid[1]);
        g.rotate(j * 120 * DEG);
        g.translate(-geo.centroid[0], -geo.centroid[1]);
        piece(geo.kite, false);
        g.restore();
      }
    }
  };

  const drawHex = () => {
    if (kind === 'p6') {
      for (let k = 0; k < 6; k++) {
        g.save();
        g.rotate(k * 60 * DEG);
        piece(geo.tri, false);
        g.restore();
      }
    } else if (kind === 'p6m') {
      for (let k = 0; k < 6; k++) {
        g.save();
        g.rotate(k * 60 * DEG);
        piece(geo.halfUp, false);
        piece(geo.halfUp, true);
        g.restore();
      }
    } else if (kind === 'p3') {
      for (let k = 0; k < 3; k++) {
        g.save();
        g.rotate(k * 120 * DEG);
        piece(geo.rhombus, false);
        g.restore();
      }
    } else {
      // p3m1 / p31m: alternate rotated and mirrored sectors (a D3 star).
      for (let k = 0; k < 6; k++) {
        g.save();
        if (k % 2 === 0) {
          g.rotate(k * 60 * DEG);
        } else {
          const phi = (30 + 30 * (k - 1)) * DEG;
          g.rotate(phi);
          g.scale(1, -1);
          g.rotate(-phi);
        }
        baseTriangle();
        g.restore();
      }
    }
  };

  for (let j = -1; j <= 3; j++) {
    for (let i = -3; i <= 3; i++) {
      const cx = i * L + (j * L) / 2;
      const cy = (j * L * SQRT3) / 2;
      if (cx < -R || cx > L + R || cy < -R || cy > H + R) continue;
      g.save();
      g.translate(cx, cy);
      drawHex();
      g.restore();
    }
  }
  return c;
}

/* -------------------------------- tile regions ----------------------------- */
// Which part of the tile feeds the pattern, as polygons in normalised tile
// coordinates (0..1). Returns null when the whole tile is used.

function toTile(pts, box, tw, th) {
  const k = Math.max(box[2] / tw, box[3] / th);
  const cx = box[0] + box[2] / 2;
  const cy = box[1] + box[3] / 2;
  return pts.map(([x, y]) => [(x - cx) / (tw * k) + 0.5, (y - cy) / (th * k) + 0.5]);
}

function squareRegion(tw, th, kind) {
  const s = Math.min(tw, th);
  const box = [0, 0, s, s];
  const pts = {
    full: [
      [0, 0],
      [s, 0],
      [s, s],
      [0, s],
    ],
    diag: [
      [0, 0],
      [s, 0],
      [s, s],
    ],
    anti: [
      [0, 0],
      [s, 0],
      [0, s],
    ],
  }[kind];
  return [toTile(pts, box, tw, th)];
}

function hexRegion(kind, tw, th) {
  const geo = hexGeometry(kind, Math.min(tw, th));
  const d = { p3: geo.rhombus, p3m1: geo.tri, p31m: geo.kite, p6: geo.tri, p6m: geo.halfUp }[kind];
  return [toTile(d.pts, d.box, tw, th)];
}

/* --------------------------------- registry -------------------------------- */
// spacing: gap/background controls apply (discrete tiles only).
// offset: the brick/half-drop offset slider applies.

const SIMPLE = 'Simple';
const WALLPAPER = 'Wallpaper groups';

export const TILINGS = [
  { id: 'grid', label: 'Grid', group: SIMPLE, spacing: true, build: grid },
  { id: 'brick', label: 'Brick', group: SIMPLE, spacing: true, offset: true, build: brick },
  { id: 'halfdrop', label: 'Half-drop', group: SIMPLE, spacing: true, offset: true, build: halfDrop },
  { id: 'diamond', label: 'Diamond', group: SIMPLE, spacing: true, region: (w, h) => squareRegion(w, h, 'full'), build: diamond },
  { id: 'basket', label: 'Basket weave', group: SIMPLE, spacing: true, region: (w, h) => squareRegion(w, h, 'full'), build: basket },
  { id: 'mirror', label: 'Mirror', group: SIMPLE, spacing: true, build: mirror },
  { id: 'mirrorlr', label: 'Mirror left-right', group: SIMPLE, spacing: true, build: mirrorLR },
  { id: 'mirrortb', label: 'Mirror top-bottom', group: SIMPLE, spacing: true, build: mirrorTB },
  { id: 'p2', label: 'Half-turn', group: WALLPAPER, build: p2 },
  { id: 'pg', label: 'Glide', group: WALLPAPER, build: pg },
  { id: 'cm', label: 'Offset mirror', group: WALLPAPER, build: cm },
  { id: 'pmg', label: 'Mirror glide', group: WALLPAPER, build: pmg },
  { id: 'pgg', label: 'Double glide', group: WALLPAPER, build: pgg },
  { id: 'cmm', label: 'Rhombic mirror', group: WALLPAPER, build: cmm },
  { id: 'p4', label: 'Pinwheel', group: WALLPAPER, region: (w, h) => squareRegion(w, h, 'full'), build: p4 },
  { id: 'p4g', label: 'Pinwheel mirror', group: WALLPAPER, region: (w, h) => squareRegion(w, h, 'anti'), build: p4g },
  { id: 'p4m', label: 'Kaleidoscope', group: WALLPAPER, region: (w, h) => squareRegion(w, h, 'diag'), build: p4m },
  { id: 'p3', label: 'Triangular', group: WALLPAPER, region: (w, h) => hexRegion('p3', w, h), build: (t) => hexCell(t, 'p3') },
  { id: 'p3m1', label: 'Triangle kaleidoscope', group: WALLPAPER, region: (w, h) => hexRegion('p3m1', w, h), build: (t) => hexCell(t, 'p3m1') },
  { id: 'p31m', label: 'Triple kite', group: WALLPAPER, region: (w, h) => hexRegion('p31m', w, h), build: (t) => hexCell(t, 'p31m') },
  { id: 'p6', label: 'Hexagonal', group: WALLPAPER, region: (w, h) => hexRegion('p6', w, h), build: (t) => hexCell(t, 'p6') },
  { id: 'p6m', label: 'Honeycomb', group: WALLPAPER, region: (w, h) => hexRegion('p6m', w, h), build: (t) => hexCell(t, 'p6m') },
];

const find = (id) => TILINGS.find((x) => x.id === id) || TILINGS[0];

export function buildCell(id, tile, opts = {}) {
  return find(id).build(tile, opts);
}

export const tilingUsesSpacing = (id) => !!find(id).spacing;
export const tilingUsesOffset = (id) => !!find(id).offset;

// Polygons (normalised tile coords) showing which part of the tile is used.
export function getDomain(id, tileW, tileH) {
  const t = find(id);
  return t.region ? t.region(tileW, tileH) : null;
}
