import { ADORNMENT_LIST } from '../utils/adornments.jsx'
import { AdornmentIcon } from './AdornmentIcons.jsx'

function AdornmentLibrary({
  onChoose,
  activeId,
  style,
}) {
  // Galeria única: todos os adornos PNG juntos, sem categorias ou filtros.
  return (
    <div className="adornment-library">
      <div className="sticker-options adornment-grid">
        {ADORNMENT_LIST.map((adornment) => (
          <button
            type="button"
            key={adornment.id}
            className={(activeId || '') === adornment.id ? 'active' : ''}
            onClick={() => onChoose(adornment.id, style)}
            aria-label={`Adicionar ${adornment.label}`}
            title={adornment.label}
          >
            <AdornmentIcon id={adornment.id} styleType={style} />
            <span>{adornment.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default AdornmentLibrary
