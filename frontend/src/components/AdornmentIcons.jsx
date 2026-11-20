import { ADORNMENT_ICONS, isPngAdornment, getPngAdornmentSrc, resolveAdornmentId } from '../utils/adornments.jsx'

export function AdornmentIcon({ id, className = '', style = {}, styleType = 'monochrome' }) {
  const resolved = resolveAdornmentId(id)

  if (isPngAdornment(resolved)) {
    const src = getPngAdornmentSrc(resolved)
    if (src) {
      return (
        <span
          className={`adornment-svg-wrap adornment-png ${className}`}
          style={{ display: 'inline-block', width: '100%', height: '100%', lineHeight: 0, ...style }}
        >
          <img src={src} alt="" draggable="false" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
        </span>
      )
    }
  }

  const item = ADORNMENT_ICONS[resolved] || ADORNMENT_ICONS.heart
  const colorful = styleType === 'colorful' && !item.png

  return (
    <span
      className={`adornment-svg-wrap${colorful ? ' adornment-colorful' : ''} ${className}`}
      style={{ display: 'inline-block', width: '100%', height: '100%', lineHeight: 0, '--adornment-color': style.color || 'currentColor', ...style }}
    >
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="var(--adornment-color)" stroke="none" aria-hidden="true">
        {item.path}
      </svg>
    </span>
  )
}
