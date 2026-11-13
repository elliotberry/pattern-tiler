const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const SingleIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" />
  </svg>
);
export const TiledIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" />
    <path d="M12 4v16M4 12h16" />
  </svg>
);
export const MoonIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </svg>
);
export const SunIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const UndoIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </svg>
);
export const RedoIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H10a6 6 0 0 0 0 12h3" />
  </svg>
);
export const FullscreenIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const RotateLeftIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 4v6h6" />
    <path d="M3.5 10A9 9 0 1 1 5 17" />
  </svg>
);
export const RotateRightIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M21 4v6h-6" />
    <path d="M20.5 10A9 9 0 1 0 19 17" />
  </svg>
);
export const FlipHIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3v18" strokeDasharray="2 3" />
    <path d="M9 7L3 18h6zM15 7l6 11h-6z" />
  </svg>
);
export const FlipVIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 12h18" strokeDasharray="2 3" />
    <path d="M7 9L18 3v6zM7 15l11 6v-6z" />
  </svg>
);
export const ResetIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12a8 8 0 1 0 3-6.2" />
    <path d="M4 4v5h5" />
  </svg>
);
export const ChevronDown = (p) => (
  <svg {...base} width={14} height={14} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const UploadIcon = (p) => (
  <svg {...base} width={32} height={32} {...p}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </svg>
);
