import { UploadIcon } from './Icons.jsx';

// Presentational empty state. The actual react-dropzone instance lives in App
// so that files can be dropped anywhere on the page.
export default function DropZone({ onBrowse, isDragActive }) {
  return (
    <button
      type="button"
      title="Upload an image"
      className={`dropzone${isDragActive ? ' active' : ''}`}
      onClick={onBrowse}
    >
      <UploadIcon />
      <strong>Drop an image here</strong>
      <span>or click to browse</span>
      <small>PNG, JPG, WebP, GIF, SVG</small>
    </button>
  );
}
