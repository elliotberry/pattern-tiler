import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Sidebar from './components/Sidebar.jsx';
import Toolbar from './components/Toolbar.jsx';
import PreviewCanvas from './components/PreviewCanvas.jsx';
import { useEditorState } from './state/useEditorState.js';
import { effectiveTileSize, loadImage, makeTile, makeWorkingImage } from './lib/applyEdits.js';
import { buildCell, tilingUsesSpacing } from './lib/tilings.js';
import { makeSeamless, padTile } from './lib/tileFx.js';

export default function App() {
  const { settings, canUndo, canRedo, update, rotate90, flip, resetEdits, load, undo, redo } =
    useEditorState();

  const [source, setSource] = useState(null);
  const [view, setView] = useState('tiled');
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState('');

  const onDrop = useCallback(
    async (files) => {
      const file = files[0];
      if (!file) return;
      try {
        const img = await loadImage(file);
        setSource(img);
        const tileW = Math.min(512, img.width);
        load(tileW, Math.round((tileW * img.height) / img.width));
        setError('');
      } catch {
        setError('Could not read that image.');
      }
    },
    [load]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // Derived pipeline: source -> working image -> tile -> repeat cell.
  const { quarter, angle, flipX, flipY } = settings;
  const working = useMemo(
    () => (source ? makeWorkingImage(source, { quarter, angle, flipX, flipY }) : null),
    [source, quarter, angle, flipX, flipY]
  );
  const tileSize = useMemo(
    () => (working ? effectiveTileSize(settings, working.width, working.height) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [working, settings.crop, settings.tileW, settings.tileH, settings.lockAspect]
  );
  const tile0 = useMemo(
    () => (working ? makeTile(working, settings.crop, tileSize.w, tileSize.h) : null),
    [working, settings.crop, tileSize]
  );
  // Optional edge blending so the tile wraps without a visible seam.
  const tile = useMemo(
    () => (tile0 ? makeSeamless(tile0, settings.seamless) : null),
    [tile0, settings.seamless]
  );
  // Spacing between tiles (discrete tilings only).
  const { tiling, gap, bg, offset } = settings;
  const unit = useMemo(
    () => (tile ? (tilingUsesSpacing(tiling) ? padTile(tile, gap, bg) : tile) : null),
    [tile, tiling, gap, bg]
  );
  const cell = useMemo(
    () => (unit ? buildCell(tiling, unit, { offset }) : null),
    [unit, tiling, offset]
  );

  const [showRegion, setShowRegion] = useState(true);
  const [showSeam, setShowSeam] = useState(false);
  const toggleSeam = (on) => {
    setShowSeam(on);
    if (on) setView('single');
  };

  // Undo / redo shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      if (e.target instanceof HTMLInputElement && e.target.type !== 'range') return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return (
    <div className="app" {...getRootProps()}>
      <input {...getInputProps()} />
      <Sidebar
        settings={settings}
        update={update}
        rotate90={rotate90}
        flip={flip}
        resetEdits={resetEdits}
        working={working}
        tile={tile}
        cell={cell}
        tileSize={tileSize}
        showRegion={showRegion}
        setShowRegion={setShowRegion}
        showSeam={showSeam}
        setShowSeam={toggleSeam}
        onBrowse={open}
        isDragActive={isDragActive}
      />
      <main className="main">
        <Toolbar
          view={view}
          setView={(v) => {
            setView(v);
            if (v === 'tiled') setShowSeam(false);
          }}
          zoom={zoom}
          setZoom={setZoom}
          canUndo={canUndo}
          canRedo={canRedo}
          undo={undo}
          redo={redo}
        />
        <PreviewCanvas
          view={view}
          cell={cell}
          tile={tile}
          showSeam={showSeam}
          rotation={settings.patternRotation}
          zoom={zoom}
          setZoom={setZoom}
          isDragActive={isDragActive}
        />
        {error && <div className="toast">{error}</div>}
      </main>
    </div>
  );
}
