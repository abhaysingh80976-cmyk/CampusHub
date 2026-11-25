import { initials } from '../utils/helpers';

export default function Avatar({ src, name, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  return src ? (
    <img className="avatar" src={src} alt={name || 'avatar'} style={style} />
  ) : (
    <div className="avatar avatar-fallback" style={style}>{initials(name)}</div>
  );
}
