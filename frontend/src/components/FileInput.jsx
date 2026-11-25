import { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { FILE_RULES, validateFile } from '../services/storage';

const formatSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`);

export default function FileInput({ label, kind = 'pdf', file, onChange, required = false }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  const handle = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f, kind);
    if (err) {
      setError(err);
      onChange(null);
      e.target.value = '';
      return;
    }
    setError('');
    onChange(f);
  };

  const clear = () => {
    onChange(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="field">
      {label && <label>{label}{required && <span className="req"> *</span>}</label>}
      <input ref={inputRef} type="file" hidden accept={FILE_RULES[kind].accept} onChange={handle} />
      {file ? (
        <div className="file-chip">
          <FileText size={18} />
          <span className="file-name">{file.name}</span>
          <span className="muted">{formatSize(file.size)}</span>
          <button type="button" className="btn-icon" onClick={clear} aria-label="Remove file"><X size={16} /></button>
        </div>
      ) : (
        <button type="button" className={`file-drop ${error ? 'has-error' : ''}`} onClick={() => inputRef.current?.click()}>
          <UploadCloud size={22} />
          <span>Click to choose a file</span>
          <small>{FILE_RULES[kind].label}</small>
        </button>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
