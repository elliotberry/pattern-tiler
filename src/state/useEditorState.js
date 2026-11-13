import { useReducer, useMemo } from 'react';

export const FULL_CROP = { x: 0, y: 0, w: 1, h: 1 };

export const initialSettings = {
  tiling: 'p6m',
  patternRotation: 0,
  crop: FULL_CROP, // normalised to the working (flipped + rotated) image
  quarter: 0, // 90deg steps, clockwise
  angle: 0, // free rotation in degrees
  flipX: false,
  flipY: false,
  tileW: 256,
  tileH: 256,
  lockAspect: true,
  offset: 0.5, // brick / half-drop offset, 0..1
  gap: 0, // spacing between tiles (px)
  bg: null, // spacing color; null = transparent
  seamless: 0, // 0..1 edge blending strength
};

const COALESCE_MS = 700;
const MAX_HISTORY = 100;

const initialState = {
  past: [],
  present: initialSettings,
  future: [],
  lastKey: null,
  lastTime: 0,
};

function commit(state, next, key, time) {
  const coalesce = key && state.lastKey === key && time - state.lastTime < COALESCE_MS;
  const past = coalesce ? state.past : [...state.past, state.present].slice(-MAX_HISTORY);
  return { past, present: next, future: [], lastKey: key || null, lastTime: time };
}

function reducer(state, action) {
  const p = state.present;
  switch (action.type) {
    case 'SET':
      return commit(state, { ...p, ...action.patch }, action.key, action.time);
    case 'ROTATE90': {
      const { x, y, w, h } = p.crop;
      const cw = action.dir > 0;
      const crop = cw ? { x: 1 - y - h, y: x, w: h, h: w } : { x: y, y: 1 - x - w, w: h, h: w };
      return commit(state, { ...p, crop, quarter: (p.quarter + (cw ? 1 : 3)) % 4 }, null, action.time);
    }
    case 'FLIP': {
      const key = action.axis === 'x' ? 'flipX' : 'flipY';
      return commit(state, { ...p, [key]: !p[key], crop: FULL_CROP }, null, action.time);
    }
    case 'RESET_EDITS':
      return commit(
        state,
        { ...p, crop: FULL_CROP, quarter: 0, angle: 0, flipX: false, flipY: false },
        null,
        action.time
      );
    case 'LOAD':
      return {
        ...initialState,
        present: {
          ...initialSettings,
          tiling: p.tiling,
          patternRotation: p.patternRotation,
          tileW: action.tileW,
          tileH: action.tileH,
        },
      };
    case 'UNDO': {
      if (!state.past.length) return state;
      const past = state.past.slice(0, -1);
      return {
        past,
        present: state.past[state.past.length - 1],
        future: [p, ...state.future],
        lastKey: null,
        lastTime: 0,
      };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      return {
        past: [...state.past, p],
        present: state.future[0],
        future: state.future.slice(1),
        lastKey: null,
        lastTime: 0,
      };
    }
    default:
      return state;
  }
}

export function useEditorState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(
    () => ({
      // `key` coalesces rapid updates (slider / drag) into one undo step.
      update: (patch, key = null) => dispatch({ type: 'SET', patch, key, time: Date.now() }),
      rotate90: (dir) => dispatch({ type: 'ROTATE90', dir, time: Date.now() }),
      flip: (axis) => dispatch({ type: 'FLIP', axis, time: Date.now() }),
      resetEdits: () => dispatch({ type: 'RESET_EDITS', time: Date.now() }),
      load: (tileW, tileH) => dispatch({ type: 'LOAD', tileW, tileH }),
      undo: () => dispatch({ type: 'UNDO' }),
      redo: () => dispatch({ type: 'REDO' }),
    }),
    []
  );

  return {
    settings: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    ...actions,
  };
}
