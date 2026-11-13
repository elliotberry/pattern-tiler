import { useState } from 'react';
import Tabs from './Tabs.jsx';
import DropZone from './DropZone.jsx';
import ImageEditor from './ImageEditor.jsx';
import ExportPanel from './ExportPanel.jsx';
import { ChevronDown } from './Icons.jsx';
import { TILINGS, tilingUsesOffset, tilingUsesSpacing } from '../lib/tilings.js';

const TABS = [
  { id: 'pattern', label: 'PATTERN' },
  { id: 'export', label: 'EXPORT' },
];

const GROUPS = [...new Set(TILINGS.map((t) => t.group))];

export default function Sidebar({
  settings,
  update,
  rotate90,
  flip,
  resetEdits,
  working,
  tile,
  cell,
  tileSize,
  showRegion,
  setShowRegion,
  showSeam,
  setShowSeam,
  onBrowse,
  isDragActive,
}) {
  const [tab, setTab] = useState('pattern');
  const current = TILINGS.find((t) => t.id === settings.tiling) || TILINGS[0];

  return (
    <aside className="sidebar">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="sidebar-body">
        {tab === 'pattern' && (
          <>
            <div className="card">
              <div className="row">
                <label className="row-label" htmlFor="tiling">
                  Tiling
                </label>
                <div className="select-wrap">
                  <select
                    id="tiling"
                    title="Choose a tiling"
                    value={settings.tiling}
                    onChange={(e) => update({ tiling: e.target.value })}
                  >
                    {GROUPS.map((g) => (
                      <optgroup key={g} label={g}>
                        {TILINGS.filter((t) => t.group === g).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <span className="select-face">
                    <b>{current.label}</b>
                    <ChevronDown />
                  </span>
                </div>
              </div>
              <div className="row divider">
                <label className="row-label" htmlFor="rotation">
                  Rotation
                </label>
                <input
                  id="rotation"
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={settings.patternRotation}
                  onChange={(e) => update({ patternRotation: Number(e.target.value) }, 'rotation')}
                  onDoubleClick={() => update({ patternRotation: 0 })}
                />
                <output className="mini-out">{settings.patternRotation}°</output>
              </div>
              {tilingUsesOffset(settings.tiling) && (
                <div className="row divider">
                  <label className="row-label" htmlFor="offset">
                    Offset
                  </label>
                  <input
                    id="offset"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.offset}
                    onChange={(e) => update({ offset: Number(e.target.value) }, 'offset')}
                    onDoubleClick={() => update({ offset: 0.5 })}
                  />
                  <output className="mini-out">{Math.round(settings.offset * 100)}%</output>
                </div>
              )}
              {tilingUsesSpacing(settings.tiling) && (
                <>
                  <div className="row divider">
                    <label className="row-label" htmlFor="gap">
                      Spacing
                    </label>
                    <input
                      id="gap"
                      type="range"
                      min="0"
                      max="200"
                      step="1"
                      value={settings.gap}
                      onChange={(e) => update({ gap: Number(e.target.value) }, 'gap')}
                      onDoubleClick={() => update({ gap: 0 })}
                    />
                    <output className="mini-out">{settings.gap}px</output>
                  </div>
                  {settings.gap > 0 && (
                    <div className="row divider">
                      <label className="row-label" htmlFor="bg">
                        Fill
                      </label>
                      <input
                        id="bg"
                        type="color"
                        className="swatch"
                        title="Spacing color"
                        value={settings.bg || '#000000'}
                        disabled={settings.bg === null}
                        onChange={(e) => update({ bg: e.target.value }, 'bg')}
                      />
                      <label className="check inline">
                        <input
                          type="checkbox"
                          checked={settings.bg === null}
                          onChange={(e) => update({ bg: e.target.checked ? null : '#000000' })}
                        />
                        <span className="box" />
                        Transparent
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="card">
              {working ? (
                <ImageEditor
                  working={working}
                  settings={settings}
                  tileSize={tileSize}
                  update={update}
                  rotate90={rotate90}
                  flip={flip}
                  resetEdits={resetEdits}
                  showRegion={showRegion}
                  setShowRegion={setShowRegion}
                  showSeam={showSeam}
                  setShowSeam={setShowSeam}
                  onBrowse={onBrowse}
                />
              ) : (
                <DropZone onBrowse={onBrowse} isDragActive={isDragActive} />
              )}
            </div>
          </>
        )}

        {tab === 'export' && (
          <ExportPanel tile={tile} cell={cell} rotation={settings.patternRotation} />
        )}
      </div>
    </aside>
  );
}
