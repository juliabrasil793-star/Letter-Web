import { useRef, useState } from 'react'
import { GiftCanvas } from './GiftCanvas.jsx'
import logoGif from '../assets/Pink and Yellow Retro Y2K Beauty Store Animated Logo (2).gif'
import { parseSpotifyUrl } from '../utils/spotify.js'
import { AdornmentIcon } from './AdornmentIcons.jsx'
import AdornmentLibrary from './AdornmentLibrary.jsx'
import boxModels from './boxModels.js'

const colors = ['#FFF4E8', '#FAD5E8', '#B9A0E8', '#A9DCCB', '#A9D9F5', '#F6A77D', '#FFCE12']


const openingEffects = [
  { value: 'confetti', label: 'Confetes' },
  { value: 'hearts', label: 'Corações flutuantes' },
  { value: 'sparkles', label: 'Brilhos e estrelinhas' },
  { value: 'petals', label: 'Pétalas de flores' },
  { value: 'paper', label: 'Papel picado' },
  { value: 'none', label: 'Nenhum efeito' },
]
const fonts = [
  { value: 'Georgia, serif', label: 'Clássica' },
  { value: 'Arial, sans-serif', label: 'Simples' },
  { value: "'Caveat', 'Dancing Script', cursive", label: 'Manuscrita' },
  { value: 'Outfit, sans-serif', label: 'Divertida' },
]
const textTypes = [
  { role: 'title', label: 'Título', sample: 'Uma surpresa especial' },
  { role: 'subtitle', label: 'Subtítulo', sample: 'Feita especialmente para você' },
  { role: 'paragraph', label: 'Parágrafo', sample: 'Escreva sua mensagem com carinho...' },
]
// Ícones PNG da navegação lateral (pasta assets/menu)
import iconStyle from '../assets/menu/gift.png'
import iconElements from '../assets/menu/shape.png'
import iconText from '../assets/menu/text.png'
import iconUploads from '../assets/menu/up-loading.png'
import iconMusic from '../assets/menu/music-note.png'
import iconLayers from '../assets/menu/layer.png'
import iconShining from '../assets/adornos/shining.png'

const editorCategories = [
  { id: 'style', label: 'Estilo do presente', icon: iconStyle },
  { id: 'elements', label: 'Elementos', icon: iconElements },
  { id: 'text', label: 'Texto', icon: iconText },
  { id: 'uploads', label: 'Uploads', icon: iconUploads },
  { id: 'music', label: 'Música', icon: iconMusic },
  { id: 'layers', label: 'Camadas', icon: iconLayers },
]

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readAndOptimizeImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      if (typeof dataUrl !== 'string') {
        reject(new Error('Não foi possível ler este arquivo.'))
        return
      }

      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        resolve(dataUrl)
        return
      }

      const img = new Image()
      img.onload = () => {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        if (width <= maxWidth && height <= maxHeight && file.size < 400 * 1024) {
          resolve(dataUrl)
          return
        }

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(dataUrl)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(outputType, quality))
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    }
    reader.onerror = () => reject(new Error(`Não foi possível abrir ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

function getElementHeight(element) {
  if (element.height) return element.height
  if (element.type === 'image' || element.type === 'carousel') return 38
  if (element.type === 'music') return 30
  if (element.type === 'sticker') return 14
  if (element.role === 'title') return 20
  if (element.role === 'subtitle') return 16
  return 19
}

function getElementY(element, index) {
  return element.y ?? 18 + index * 19
}

function PhotoBorderControls({ element, onUpdate }) {
  const borderEnabled = element.borderEnabled !== false
  const borderWidth = element.borderWidth ?? 5
  const borderColor = element.borderColor || '#ffffff'
  const borderRadius = element.borderRadius ?? 4
  const idPrefix = `photo-border-${element.id}`

  return (
    <div className="photo-border-properties">
      <label className="border-toggle" htmlFor={`${idPrefix}-enabled`}>
        <input
          id={`${idPrefix}-enabled`}
          type="checkbox"
          checked={borderEnabled}
          onChange={(event) => onUpdate(element.id, { borderEnabled: event.target.checked })}
        />
        Mostrar borda da foto
      </label>
      {borderEnabled && (
        <>
          <label className="field-label" htmlFor={`${idPrefix}-width`}>Espessura — {borderWidth}px</label>
          <input
            id={`${idPrefix}-width`}
            className="range-input"
            type="range"
            min="0"
            max="20"
            value={borderWidth}
            onChange={(event) => onUpdate(element.id, { borderWidth: Number(event.target.value) })}
          />
          <label className="field-label" htmlFor={`${idPrefix}-color`}>Cor da borda</label>
          <input
            id={`${idPrefix}-color`}
            className="property-color"
            type="color"
            value={borderColor}
            onChange={(event) => onUpdate(element.id, { borderColor: event.target.value })}
          />
          <label className="field-label" htmlFor={`${idPrefix}-radius`}>Arredondamento — {borderRadius}px</label>
          <input
            id={`${idPrefix}-radius`}
            className="range-input"
            type="range"
            min="0"
            max="48"
            value={borderRadius}
            onChange={(event) => onUpdate(element.id, { borderRadius: Number(event.target.value) })}
          />
        </>
      )}
    </div>
  )
}

function GiftEditor({ gift, setGift, saveError, canUndo, canRedo, onUndo, onRedo, onReset, onBack, onPreview, onPublish }) {
  const imageInput = useRef(null)
  const carouselInput = useRef(null)
  const backgroundInput = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [activeCategory, setActiveCategory] = useState('style')
  const [panelView, setPanelView] = useState('category')
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true)
  const [uploadError, setUploadError] = useState('')
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false)
  const [spotifyInputUrl, setSpotifyInputUrl] = useState('')
  const [spotifyError, setSpotifyError] = useState('')

  const selectElement = (id, selectedElement = gift.elements.find((item) => item.id === id)) => {
    setSelectedId(id)
    setSelectedIds(id ? [id] : [])
    if (id) {
      setActiveCategory(selectedElement?.type === 'text' ? 'text' : selectedElement?.type === 'image' || selectedElement?.type === 'carousel' ? 'uploads' : selectedElement?.type === 'music' ? 'music' : 'elements')
      setPanelView('properties')
      setIsSidePanelOpen(true)
    } else {
      setPanelView('category')
    }
  }

  const selectElements = (ids) => {
    const uniqueIds = [...new Set(ids)]
    setSelectedIds(uniqueIds)
    setSelectedId(uniqueIds[0] ?? null)
    if (uniqueIds.length > 0) {
      const element = gift.elements.find((item) => item.id === uniqueIds[0])
      setActiveCategory(element?.type === 'text' ? 'text' : element?.type === 'image' || element?.type === 'carousel' ? 'uploads' : element?.type === 'music' ? 'music' : 'elements')
      setPanelView('properties')
      setIsSidePanelOpen(true)
    } else {
      setPanelView('category')
    }
  }

  const openCategory = (category) => {
    setActiveCategory(category)
    setPanelView('category')
    setIsSidePanelOpen(true)
  }

  const updateGift = (updates) => setGift((current) => ({ ...current, ...updates }))
  const updateUnwrapping = (updates) => updateGift({
    unwrapping: { ...gift.unwrapping, ...updates },
  })

  const handleReset = () => {
    const confirmed = window.confirm(
      'Tem certeza de que deseja limpar o presente? Textos, fotos, música, fundo e adornos serão removidos.',
    )
    if (!confirmed) return

    onReset()
    selectElements([])
  }

  const openSpotifyModal = () => {
    const musicEl = gift.elements.find((el) => el.type === 'music')
    setSpotifyInputUrl(musicEl?.originalUrl || gift.music?.originalUrl || '')
    setSpotifyError('')
    setIsSpotifyModalOpen(true)
  }

  const handleMusicButtonClick = () => {
    const musicEl = gift.elements.find((el) => el.type === 'music')
    if (musicEl) {
      selectElement(musicEl.id)
    }
    openSpotifyModal()
  }

  const handleApplySpotify = () => {
    const raw = spotifyInputUrl.trim()
    if (!raw) {
      setSpotifyError('Por favor, cole um link do Spotify.')
      return
    }
    const parsed = parseSpotifyUrl(raw)
    if (!parsed) {
      setSpotifyError('Link do Spotify inválido. Cole o link de uma música, álbum ou playlist (ex: https://open.spotify.com/track/...).')
      return
    }
    const musicData = {
      url: parsed.url,
      type: parsed.type,
      id: parsed.id,
      originalUrl: raw,
    }

    const existingMusic = gift.elements.find((el) => el.type === 'music')
    if (existingMusic) {
      updateElement(existingMusic.id, {
        url: parsed.url,
        musicType: parsed.type,
        originalUrl: raw,
      })
      selectElement(existingMusic.id)
      updateGift({ music: musicData })
    } else {
      updateGift({ music: musicData })
      addElement({
        type: 'music',
        url: parsed.url,
        musicType: parsed.type,
        originalUrl: raw,
        width: 75,
        height: 30,
      })
    }

    setIsSpotifyModalOpen(false)
    setSpotifyError('')
  }

  const handleRemoveSpotify = () => {
    setGift((current) => ({
      ...current,
      music: null,
      elements: current.elements.filter((el) => el.type !== 'music'),
    }))
    const musicEl = gift.elements.find((el) => el.type === 'music')
    if (selectedIds.includes(musicEl?.id)) selectElement(null)
    setIsSpotifyModalOpen(false)
    setSpotifyError('')
  }

  const addElement = (element) => {
    const defaultWidth = element.width
      ?? (['image', 'carousel'].includes(element.type) ? element.size : undefined)
      ?? (element.type === 'music' ? 75 : undefined)
      ?? (element.type === 'sticker' ? 14 : 82)
    const defaultHeight = element.height
      ?? (element.type === 'image' || element.type === 'carousel' ? 38 : element.type === 'music' ? 30 : element.type === 'sticker' ? 14 : 20)
    const lastElementBottom = gift.elements.reduce((bottom, current, index) => (
      Math.max(bottom, getElementY(current, index) + getElementHeight(current) / 2)
    ), 0)
    const nextElement = {
      id: makeId(),
      x: 50,
      y: element.y ?? (gift.elements.length === 0
        ? Math.max(defaultHeight / 2, 18)
        : lastElementBottom + defaultHeight / 2 + 8),
      width: defaultWidth,
      height: defaultHeight,
      ...element,
    }
    setGift((current) => ({ ...current, elements: [...current.elements, nextElement] }))
    selectElement(nextElement.id, nextElement)
  }

  const updateElement = (id, updates) => {
    setGift((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === id ? { ...element, ...updates } : element,
      ),
    }))
  }

  const updateMultipleElements = (updates) => {
    const updatesById = new Map(updates.map(({ id, ...properties }) => [id, properties]))
    setGift((current) => ({
      ...current,
      elements: current.elements.map((element) => (
        updatesById.has(element.id)
          ? { ...element, ...updatesById.get(element.id) }
          : element
      )),
    }))
  }

  const removeSelected = () => {
    setGift((current) => {
      const target = current.elements.find((element) => element.id === selectedId)
      return {
        ...current,
        elements: current.elements.filter((element) => element.id !== selectedId),
        music: target?.type === 'music' ? null : current.music,
      }
    })
    selectElement(null)
  }

  const removeElement = (id) => {
    setGift((current) => {
      const target = current.elements.find((element) => element.id === id)
      return {
        ...current,
        elements: current.elements.filter((element) => element.id !== id),
        music: target?.type === 'music' ? null : current.music,
      }
    })
    if (selectedIds.includes(id)) selectElement(null)
  }

  const handleImageUpload = async (event, type) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length === 0) return
    setUploadError('')

    try {
      const images = await Promise.all(files.map(async (file) => ({
        id: makeId(),
        src: await readAndOptimizeImage(file),
        name: file.name,
      })))

      if (type === 'background') {
        updateGift({ backgroundImage: images[0].src })
      } else if (type === 'carousel') {
        // Se já houver um carrossel (seja o selecionado ou qualquer existente), adiciona ao mesmo carrossel
        const targetCarousel = gift.elements.find((element) => element.id === selectedId && element.type === 'carousel')
          || gift.elements.find((element) => element.type === 'carousel')

        if (targetCarousel) {
          const updatedImages = [...targetCarousel.images, ...images]
          updateElement(targetCarousel.id, { images: updatedImages })
          selectElement(targetCarousel.id)
        } else {
          addElement({
            type: 'carousel',
            images,
            currentIndex: 0,
            size: 80,
            alignment: 'center',
          })
        }
      } else {
        addElement({
          type: 'image',
          content: images[0].src,
          name: images[0].name,
          size: 70,
          alignment: 'center',
        })
      }
    } catch (error) {
      console.error('Não foi possível adicionar as imagens selecionadas.', error)
      setUploadError(error.message)
    }
  }

  const updateCarouselPhoto = (id, photoIndex, direction) => {
    setGift((current) => ({
      ...current,
      elements: current.elements.map((element) => {
        if (element.id !== id || element.type !== 'carousel') return element
        const nextIndex = photoIndex + direction
        if (nextIndex < 0 || nextIndex >= element.images.length) return element
        const images = [...element.images]
        ;[images[photoIndex], images[nextIndex]] = [images[nextIndex], images[photoIndex]]

        let currentIndex = element.currentIndex ?? 0
        if (currentIndex === photoIndex) {
          currentIndex = nextIndex
        } else if (currentIndex === nextIndex) {
          currentIndex = photoIndex
        }
        return { ...element, images, currentIndex }
      }),
    }))
  }

  const removeCarouselPhoto = (id, photoIndex) => {
    setGift((current) => {
      const target = current.elements.find((element) => element.id === id)
      if (!target || target.type !== 'carousel') return current

      const nextImages = target.images.filter((_, index) => index !== photoIndex)
      if (nextImages.length === 0) {
        if (selectedIds.includes(id)) selectElement(null)
        return {
          ...current,
          elements: current.elements.filter((element) => element.id !== id),
        }
      }

      const nextCurrentIndex = Math.max(0, Math.min(target.currentIndex || 0, nextImages.length - 1))
      return {
        ...current,
        elements: current.elements.map((element) => (
          element.id === id
            ? { ...element, images: nextImages, currentIndex: nextCurrentIndex }
            : element
        )),
      }
    })
  }

  const selectedElement = gift.elements.find((element) => element.id === selectedId)

  return (
    <main
      className={`editor-page${isSidePanelOpen ? ' side-panel-open' : ' side-panel-closed'}${panelView === 'properties' ? ' show-element-properties' : ''}`}
      data-active-category={activeCategory}
    >
      <header className="editor-header">
        <div className="editor-header-brand">
          <a className="brand-link editor-brand" href="#" onClick={(event) => event.preventDefault()} aria-label="Letter Web">
            <img className="brand-logo" src={logoGif} alt="Letter Web" />
          </a>
          <button className="back-link" onClick={onBack}><span aria-hidden="true">←</span> Sair do editor</button>
        </div>
        <div className="editor-header-actions">
          <div className="history-actions" role="group" aria-label="Histórico de alterações">
            <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Desfazer" title="Desfazer">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 7 4 12l5 5v-3h5a4 4 0 0 1 4 4h2a6 6 0 0 0-6-6H9V7Z" />
              </svg>
            </button>
            <button type="button" onClick={onRedo} disabled={!canRedo} aria-label="Refazer" title="Refazer">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 7 5 5-5 5v-3h-5a4 4 0 0 0-4 4H4a6 6 0 0 1 6-6h5V7Z" />
              </svg>
            </button>
          </div>
          <button type="button" className="button button-outline reset-project-button" onClick={handleReset}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5V2L7.5 6.5 12 11V8a6 6 0 1 1-5.65 8H3.2A9 9 0 1 0 12 5Z" />
            </svg>
            <span>Limpar projeto</span>
          </button>
          {saveError ? (
            <span className="save-error" role="status">{saveError}</span>
          ) : (
            <span className="saved-status"><span aria-hidden="true">●</span> Rascunho salvo</span>
          )}
          <button className="button button-outline" onClick={onPreview}>Pré-visualizar <span aria-hidden="true">↗</span></button>
          <button className="button button-primary compact-button" onClick={onPublish}>Continuar <span aria-hidden="true">→</span></button>
        </div>
      </header>

      <div className="editor-workspace">
        <nav className="editor-category-nav" aria-label="Categorias do editor">
          <div className="editor-category-list">
            {editorCategories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`editor-category-button${activeCategory === category.id && isSidePanelOpen ? ' active' : ''}`}
                aria-pressed={activeCategory === category.id && isSidePanelOpen}
                onClick={() => openCategory(category.id)}
              >
                <img className="editor-category-icon" src={category.icon} alt="" />
                <span>{category.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="editor-rail-expand"
            aria-label={isSidePanelOpen ? 'Recolher painel lateral' : 'Expandir painel lateral'}
            title={isSidePanelOpen ? 'Recolher painel lateral' : 'Expandir painel lateral'}
            onClick={() => setIsSidePanelOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={isSidePanelOpen ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
            </svg>
          </button>
        </nav>

        <aside className="tool-panel">
          <div className="panel-title">
            <span className="eyebrow">SEU ESPAÇO CRIATIVO</span>
            <h1>{editorCategories.find((category) => category.id === activeCategory)?.label}</h1>
          </div>

          {activeCategory === 'style' && (
            <>
              <span className="field-label">Nome e destinatário</span>
              <div className="tool-group">
                <label className="field-label" htmlFor="gift-title">Nome da página</label>
                <input id="gift-title" className="text-input" value={gift.title} onChange={(event) => updateGift({ title: event.target.value })} placeholder="Um presente feito com carinho" />
                <label className="field-label" htmlFor="gift-recipient">Para quem é?</label>
                <input id="gift-recipient" className="text-input" value={gift.recipient} onChange={(event) => updateGift({ recipient: event.target.value })} placeholder="Um nome especial" />
              </div>
              <div className="tool-divider" />
              <span className="field-label">Textos</span>
              <div className="tool-group">
                <label className="field-label" htmlFor="page-font">Fonte dos textos</label>
                <select id="page-font" className="text-input" value={gift.fontFamily} onChange={(event) => updateGift({ fontFamily: event.target.value })}>
                  {fonts.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                </select>
                <label className="field-label" htmlFor="page-text-color">Cor padrão dos textos</label>
                <input id="page-text-color" className="property-color" type="color" value={gift.textColor} onChange={(event) => updateGift({ textColor: event.target.value })} />
              </div>
              <div className="tool-divider" />
              <span className="field-label">Cor de fundo</span>
              <div className="color-options" role="group" aria-label="Cor de fundo do presente">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`color-swatch${gift.background === color ? ' active' : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Usar cor ${color}`}
                    aria-pressed={gift.background === color}
                    onClick={() => updateGift({ background: color })}
                  />
                ))}
                <label className="custom-color-label" htmlFor="custom-color">Escolher outra cor <input id="custom-color" type="color" value={gift.background} onChange={(event) => updateGift({ background: event.target.value })} /></label>
              </div>
              <div className="tool-divider" />
              <span className="field-label">Estilo da página</span>
              <select id="page-appearance" className="text-input" value={gift.appearance} onChange={(event) => updateGift({ appearance: event.target.value })}>
                <option value="paper">Papel com textura</option>
                <option value="soft">Suave e arredondado</option>
                <option value="clean">Simples e clean</option>
              </select>
              <div className="tool-divider" />
              <span className="field-label">Abertura do presente</span>
              <span className="field-label">Modelo da caixa</span>
              <div className="box-model-options" role="radiogroup" aria-label="Modelo da caixa">
                {boxModels.map((model) => (
                  <button
                    key={model.value}
                    type="button"
                    role="radio"
                    aria-checked={gift.unwrapping.model === model.value}
                    className={gift.unwrapping.model === model.value ? 'box-model-option is-selected' : 'box-model-option'}
                    onClick={() => updateUnwrapping({ model: model.value })}
                  >
                    <span className="box-model-preview"><img src={model.image} alt={model.label} /></span>
                    <span className="box-model-name">{model.label}</span>
                  </button>
                ))}
              </div>
              <label className="field-label" htmlFor="gift-opening-effect">Efeito da abertura</label>
              <select id="gift-opening-effect" className="text-input" value={gift.unwrapping.effect} onChange={(event) => updateUnwrapping({ effect: event.target.value })}>
                {openingEffects.map((effect) => <option key={effect.value} value={effect.value}>{effect.label}</option>)}
              </select>
              <p className="gift-box-settings-hint">As escolhas ficam salvas junto com o link publicado.</p>
            </>
          )}

          {activeCategory === 'text' && (
            <>
              <span className="field-label">Adicionar texto</span>
              <div className="tool-buttons">
            <div className="tool-group">
              {textTypes.map((textType) => (
                <button key={textType.role} onClick={() => addElement({
                  type: 'text',
                  role: textType.role,
                  content: textType.sample,
                  color: '',
                  font: '',
                  size: textType.role === 'title' ? 42 : textType.role === 'subtitle' ? 25 : 17,
                  alignment: 'center',
                })}>
                  <span className={`tool-icon ${textType.role === 'title' ? 'tool-pink' : 'tool-cream'}`}>{textType.role === 'title' ? 'H1' : textType.role === 'subtitle' ? 'H2' : '¶'}</span>
                  <span><strong>{textType.label}</strong><small>Adicionar à página</small></span><b>+</b>
                </button>
              ))}
            </div>
              </div>
              <p className="editor-category-hint">Escolha um estilo para adicionar uma nova caixa de texto ao presente.</p>
            </>
          )}

          {activeCategory === 'elements' && (
            <>
              <span className="field-label">Adicionar elementos</span>
              <div className="tool-buttons">
            <button type="button" onClick={() => addElement({ type: 'sticker', content: 'heart' })}><span className="tool-icon tool-yellow"><AdornmentIcon id="heart" /></span><span><strong>Adorno</strong><small>Adicionar um ícone</small></span><b>+</b></button>
              </div>
              <div className="editor-tool-section" id="adornment-library">
                <span className="field-label">Biblioteca de adornos</span>
                <AdornmentLibrary
                  onChoose={(id, adornmentStyle) => addElement({
                    type: 'sticker',
                    content: id,
                    adornmentStyle,
                  })}
                />
              </div>
            </>
          )}

          {activeCategory === 'uploads' && (
            <>
              <span className="field-label">Envie arquivos para o presente</span>
              <div className="tool-buttons">
            <button type="button" onClick={() => imageInput.current?.click()}><span className="tool-icon tool-mint">▧</span><span><strong>Imagem</strong><small>Enviar uma foto</small></span><b>+</b></button>
            <button type="button" onClick={() => carouselInput.current?.click()}><span className="tool-icon tool-lilac">▤</span><span><strong>Carrossel</strong><small>Selecionar várias fotos</small></span><b>+</b></button>
              </div>
              <div className="tool-divider" />
              <span className="field-label">Imagem de fundo</span>
              <button className="background-image-button" onClick={() => backgroundInput.current?.click()}>
                {gift.backgroundImage ? 'Trocar imagem de fundo' : 'Enviar imagem de fundo'}
              </button>
              {gift.backgroundImage && <button className="remove-background-button" onClick={() => updateGift({ backgroundImage: '' })}>Remover imagem de fundo</button>}
              {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}
              <p className="editor-category-hint">Imagens e carrosséis enviados são adicionados diretamente à página.</p>
            </>
          )}


          {activeCategory === 'music' && (
            <>
              <span className="field-label">Música do presente</span>
              <div className="tool-buttons">
            <button type="button" onClick={handleMusicButtonClick}><span className="tool-icon tool-lilac">♫</span><span><strong>Música</strong><small>Spotify</small></span><b>{(gift.elements.some((el) => el.type === 'music') || gift.music?.url) ? '✓' : '+'}</b></button>
          </div>
              {gift.music && (
                <div className="music-attached">
                  <span>♫</span>
                  <div>
                    <strong>{gift.music.type === 'album' ? 'Álbum do Spotify' : gift.music.type === 'playlist' ? 'Playlist do Spotify' : 'Música do Spotify'}</strong>
                    <small title={gift.music.originalUrl || gift.music.url}>{gift.music.originalUrl || gift.music.name || 'Spotify incorporado'}</small>
                  </div>
                  <div className="music-attached-actions">
                    <button type="button" className="music-action-btn" onClick={openSpotifyModal} aria-label="Substituir música do Spotify" title="Substituir música">✎</button>
                    <button type="button" className="music-action-btn" onClick={() => updateGift({ music: null })} aria-label="Remover música do Spotify" title="Remover música">×</button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeCategory === 'layers' && (
            <>
              <span className="field-label">Elementos na página</span>
              <p className="editor-category-hint">Selecione uma camada para editar no canvas.</p>
              {gift.elements.length === 0 ? (
                <div className="layers-empty"><span><img src={iconShining} alt="" draggable="false" /></span><p>Não há elementos nesta página ainda.</p></div>
              ) : (
                <div className="category-layer-list">
                  <span className="field-label">Elementos na página</span>
                  {gift.elements.map((element, index) => (
                    <button className={`layer-item${selectedIds.includes(element.id) ? ' active' : ''}`} key={element.id} onClick={() => selectElement(element.id)}>
                      <span>{element.type === 'text' ? element.role === 'title' ? 'H1' : element.role === 'subtitle' ? 'H2' : '¶' : element.type === 'image' ? '▧' : element.type === 'carousel' ? '▤' : element.type === 'music' ? '♫' : <AdornmentIcon id={element.content} />}</span>
                      <span>{element.type === 'text' ? (element.content.slice(0, 20) || 'Texto vazio') : element.type === 'image' ? 'Imagem' : element.type === 'carousel' ? `Carrossel · ${element.images.length} fotos` : element.type === 'music' ? 'Música (Spotify)' : 'Adorno'}</span>
                      <small>{String(index + 1).padStart(2, '0')}</small>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <input ref={imageInput} className="visually-hidden" type="file" accept="image/*" onChange={(event) => handleImageUpload(event, 'image')} />
          <input ref={carouselInput} className="visually-hidden" type="file" accept="image/*" multiple onChange={(event) => handleImageUpload(event, 'carousel')} />
          <input ref={backgroundInput} className="visually-hidden" type="file" accept="image/*" onChange={(event) => handleImageUpload(event, 'background')} />
          {activeCategory === 'elements' && <div className="editor-tip"><span><img src={iconShining} alt="" draggable="false" /></span><p>Adicione adornos ou selecione uma camada para ajustar.</p></div>}
        </aside>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div><span className="eyebrow">PRÉ-VISUALIZAÇÃO AO VIVO</span><strong>{gift.title || 'Sua página sem título'}</strong></div>
          </div>
          <div className="canvas-viewport">
            <GiftCanvas
              gift={gift}
              selectedId={selectedId}
              selectedIds={selectedIds}
              onSelect={selectElement}
              onSelectMany={selectElements}
              onUpdateElement={updateElement}
              onUpdateMultipleElements={updateMultipleElements}
              onDeleteElement={removeElement}
            />
          </div>
          <p className="canvas-hint">Selecione um elemento na página para editar · As mudanças aparecem na hora</p>
        </section>

        <aside className="properties-panel">
          <span className="eyebrow">{panelView === 'properties' && selectedElement ? 'AJUSTES DO ELEMENTO' : 'ESTILO DO PRESENTE'}</span>
          <h2>{panelView === 'properties' && selectedElement ? 'Editar seleção' : 'Modelos e aparência'}</h2>
          {panelView === 'category' && activeCategory === 'models' && (
            <div className="page-properties">
              <label className="field-label" htmlFor="page-font">Fonte dos textos</label>
              <select id="page-font" className="text-input" value={gift.fontFamily} onChange={(event) => updateGift({ fontFamily: event.target.value })}>
                {fonts.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
              </select>
              <label className="field-label" htmlFor="page-text-color">Cor padrão dos textos</label>
              <input id="page-text-color" className="property-color" type="color" value={gift.textColor} onChange={(event) => updateGift({ textColor: event.target.value })} />
              <label className="field-label" htmlFor="page-appearance">Estilo da página</label>
              <select id="page-appearance" className="text-input" value={gift.appearance} onChange={(event) => updateGift({ appearance: event.target.value })}>
                <option value="paper">Papel com textura</option>
                <option value="soft">Suave e arredondado</option>
                <option value="clean">Simples e clean</option>
              </select>
              <div className="gift-box-settings">
                <div className="tool-divider" />
                <span className="field-label">Abertura do presente</span>
                <span className="field-label">Modelo da caixa</span>
                <div className="box-model-options" role="radiogroup" aria-label="Modelo da caixa">
                  {boxModels.map((model) => (
                    <button
                      key={model.value}
                      type="button"
                      role="radio"
                      aria-checked={gift.unwrapping.model === model.value}
                      className={gift.unwrapping.model === model.value ? 'box-model-option is-selected' : 'box-model-option'}
                      onClick={() => updateUnwrapping({ model: model.value })}
                    >
                      <span className="box-model-preview"><img src={model.image} alt={model.label} /></span>
                      <span className="box-model-name">{model.label}</span>
                    </button>
                  ))}
                </div>
                <label className="field-label" htmlFor="gift-opening-effect">Efeito da abertura</label>
                <select
                  id="gift-opening-effect"
                  className="text-input"
                  value={gift.unwrapping.effect}
                  onChange={(event) => updateUnwrapping({ effect: event.target.value })}
                >
                  {openingEffects.map((effect) => <option key={effect.value} value={effect.value}>{effect.label}</option>)}
                </select>
                <p className="gift-box-settings-hint">As escolhas ficam salvas junto com o link publicado.</p>
              </div>
            </div>
          )}

          {panelView === 'properties' && selectedElement && (
            <div className="element-properties">
              <div className="property-heading"><strong>Editar elemento</strong><button onClick={removeSelected} aria-label="Remover elemento">×</button></div>
              {selectedElement.type === 'text' && (
                <>
                  <label className="field-label" htmlFor="edit-message">Conteúdo</label>
                  <textarea id="edit-message" className="text-input message-input" value={selectedElement.content} onChange={(event) => updateElement(selectedId, { content: event.target.value })} rows="4" />
                  <label className="field-label" htmlFor="text-role">Tipo de texto</label>
                  <select
                    id="text-role"
                    className="text-input"
                    value={selectedElement.role || 'paragraph'}
                    onChange={(event) => updateElement(selectedId, {
                      role: event.target.value,
                      size: event.target.value === 'title' ? 42 : event.target.value === 'subtitle' ? 25 : 17,
                    })}
                  >
                    {textTypes.map((textType) => <option key={textType.role} value={textType.role}>{textType.label}</option>)}
                  </select>
                  <label className="field-label" htmlFor="text-font">Fonte</label>
                  <select id="text-font" className="text-input" value={selectedElement.font || gift.fontFamily} onChange={(event) => updateElement(selectedId, { font: event.target.value })}>
                    {fonts.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                  </select>
                  <label className="field-label" htmlFor="text-size">Tamanho — {selectedElement.size || 17}px</label>
                  <input id="text-size" className="range-input" type="range" min="12" max="64" value={selectedElement.size || 17} onChange={(event) => updateElement(selectedId, { size: Number(event.target.value) })} />
                  <label className="field-label" htmlFor="text-color">Cor do texto</label>
                  <input id="text-color" className="property-color" type="color" value={selectedElement.color || gift.textColor} onChange={(event) => updateElement(selectedId, { color: event.target.value })} />
                  <label className="field-label" htmlFor="text-alignment">Alinhamento</label>
                  <select id="text-alignment" className="text-input" value={selectedElement.alignment || 'center'} onChange={(event) => updateElement(selectedId, { alignment: event.target.value })}>
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                  </select>
                </>
              )}
              <label className="field-label" htmlFor="element-rotation">
                Rotação — {Math.round(selectedElement.rotation || 0)}°
              </label>
              <input
                id="element-rotation"
                className="range-input"
                type="range"
                min="-180"
                max="180"
                step="1"
                value={Math.round(selectedElement.rotation || 0)}
                onChange={(event) => updateElement(selectedId, { rotation: Number(event.target.value) })}
              />
              {selectedElement.type === 'image' && (
                <>
                  <p className="property-description">Imagem adicionada: {selectedElement.name}</p>
                  <label className="field-label" htmlFor="image-size">Tamanho — {selectedElement.size || 70}%</label>
                  <input id="image-size" className="range-input" type="range" min="20" max="100" value={selectedElement.width || selectedElement.size || 70} onChange={(event) => updateElement(selectedId, { size: Number(event.target.value), width: Number(event.target.value) })} />
                  <label className="field-label" htmlFor="image-alignment">Posição</label>
                  <select id="image-alignment" className="text-input" value={selectedElement.alignment || 'center'} onChange={(event) => updateElement(selectedId, { alignment: event.target.value })}>
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                  </select>
                  <PhotoBorderControls element={selectedElement} onUpdate={updateElement} />
                </>
              )}
              {selectedElement.type === 'carousel' && (
                <>
                  <p className="property-description">Fotos do carrossel ({selectedElement.images.length}). Use as setas para mudar a ordem ou remova uma imagem.</p>
                  <button type="button" className="background-image-button" onClick={() => carouselInput.current?.click()}>
                    + Adicionar mais fotos
                  </button>
                  <label className="field-label" htmlFor="carousel-size">Tamanho — {selectedElement.size || 80}%</label>
                  <input id="carousel-size" className="range-input" type="range" min="30" max="100" value={selectedElement.width || selectedElement.size || 80} onChange={(event) => updateElement(selectedId, { size: Number(event.target.value), width: Number(event.target.value) })} />
                  <label className="field-label" htmlFor="carousel-alignment">Posição</label>
                  <select id="carousel-alignment" className="text-input" value={selectedElement.alignment || 'center'} onChange={(event) => updateElement(selectedId, { alignment: event.target.value })}>
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                  </select>
                  <PhotoBorderControls element={selectedElement} onUpdate={updateElement} />
                  <div className="carousel-photo-list">
                    {selectedElement.images.map((image, index) => (
                      <div className="carousel-photo-row" key={image.id || `${image.name}-${index}`}>
                        <img src={image.src} alt="" />
                        <span title={image.name}>{image.name || `Foto ${index + 1}`}</span>
                        <button
                          type="button"
                          onClick={() => updateCarouselPhoto(selectedId, index, -1)}
                          disabled={index === 0}
                          aria-label={`Mover para cima`}
                          title="Mover para cima"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCarouselPhoto(selectedId, index, 1)}
                          disabled={index === selectedElement.images.length - 1}
                          aria-label={`Mover para baixo`}
                          title="Mover para baixo"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCarouselPhoto(selectedId, index)}
                          aria-label={`Remover foto`}
                          title="Remover foto"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {selectedElement.type === 'music' && (
                <>
                  <div className="music-property-card">
                    <div className="music-property-header">
                      <span className="spotify-modal-icon" aria-hidden="true">♫</span>
                      <div>
                        <strong>Spotify oficial</strong>
                        <small>{selectedElement.musicType === 'album' ? 'Álbum' : selectedElement.musicType === 'playlist' ? 'Playlist' : 'Música'}</small>
                      </div>
                    </div>
                    <p className="property-description">
                      {selectedElement.originalUrl || selectedElement.url}
                    </p>
                    <button
                      type="button"
                      className="button button-outline compact-button"
                      style={{ width: '100%', marginTop: '8px' }}
                      onClick={openSpotifyModal}
                    >
                      Substituir música do Spotify
                    </button>
                  </div>

                  <label className="field-label" htmlFor="music-size">
                    Largura — {Math.round(selectedElement.width || 75)}%
                  </label>
                  <input
                    id="music-size"
                    className="range-input"
                    type="range"
                    min="30"
                    max="100"
                    value={Math.round(selectedElement.width || 75)}
                    onChange={(event) => updateElement(selectedId, { width: Number(event.target.value) })}
                  />

                  <label className="field-label" htmlFor="music-height">
                    Altura — {Math.round(selectedElement.height || 30)}%
                  </label>
                  <input
                    id="music-height"
                    className="range-input"
                    type="range"
                    min="15"
                    max="70"
                    value={Math.round(selectedElement.height || 30)}
                    onChange={(event) => updateElement(selectedId, { height: Number(event.target.value) })}
                  />

                  <button
                    type="button"
                    className="remove-background-button"
                    style={{ marginTop: '16px' }}
                    onClick={() => removeElement(selectedId)}
                  >
                    Remover música da página
                  </button>
                </>
              )}
              {selectedElement.type === 'sticker' && (
                <>
                  <span className="field-label" style={{ marginTop: '14px' }}>Trocar modelo do adorno</span>
                  <AdornmentLibrary
                    key={selectedElement.id}
                    activeId={selectedElement.content || 'heart'}
                    style={selectedElement.adornmentStyle || 'monochrome'}
                    onStyleChange={(adornmentStyle) => updateElement(selectedId, { adornmentStyle })}
                    onChoose={(id, adornmentStyle) => updateElement(selectedId, {
                      content: id,
                      adornmentStyle,
                    })}
                  />
                </>
              )}
            </div>
          )}
        </aside>
      </div>

      <nav className="mobile-editor-tabs" aria-label="Painéis do editor">
        {editorCategories.map((category) => (
          <button
            type="button"
            key={category.id}
            className={`editor-category-button${activeCategory === category.id && isSidePanelOpen ? ' active' : ''}`}
            aria-expanded={activeCategory === category.id && isSidePanelOpen}
            onClick={() => openCategory(category.id)}
          >
            <img className="editor-category-icon" src={category.icon} alt="" />
            <span>{category.label}</span>
          </button>
        ))}
        <button
          type="button"
          className="mobile-collapse-action"
          aria-label={isSidePanelOpen ? 'Recolher painel' : 'Abrir painel lateral'}
          title={isSidePanelOpen ? 'Recolher painel' : 'Abrir painel lateral'}
          onClick={() => setIsSidePanelOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={isSidePanelOpen ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
          </svg>
        </button>
      </nav>

      {isSpotifyModalOpen && (
        <div className="spotify-modal-backdrop" onClick={() => setIsSpotifyModalOpen(false)}>
          <div
            className="spotify-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="spotify-modal-title"
          >
            <div className="spotify-modal-header">
              <div className="spotify-modal-title-group">
                <span className="spotify-modal-icon" aria-hidden="true">♫</span>
                <h2 id="spotify-modal-title">
                  {gift.music ? 'Música do Spotify' : 'Adicionar música do Spotify'}
                </h2>
              </div>
              <button
                type="button"
                className="spotify-modal-close"
                onClick={() => setIsSpotifyModalOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className="spotify-modal-desc">
              Cole o link de uma <strong>música</strong>, <strong>álbum</strong> ou <strong>playlist</strong> do Spotify para tocar na sua página.
            </p>

            <div className="spotify-input-group">
              <label htmlFor="spotify-url-input" className="field-label">
                Link do Spotify
              </label>
              <input
                id="spotify-url-input"
                type="url"
                className="text-input"
                placeholder="https://open.spotify.com/track/..."
                value={spotifyInputUrl}
                onChange={(event) => {
                  setSpotifyInputUrl(event.target.value)
                  setSpotifyError('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleApplySpotify()
                }}
                autoFocus
              />
              {spotifyError && (
                <p className="spotify-error-msg" role="alert">
                  {spotifyError}
                </p>
              )}
            </div>

            {(() => {
              const preview = parseSpotifyUrl(spotifyInputUrl)
              if (!preview) return null
              return (
                <div className="spotify-preview-container">
                  <span className="field-label">Pré-visualização do player oficial</span>
                  <iframe
                    title="Pré-visualização do Spotify"
                    src={preview.url}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ borderRadius: '12px', border: 0 }}
                  />
                </div>
              )
            })()}

            <div className="spotify-modal-actions">
              {gift.music ? (
                <button
                  type="button"
                  className="button button-outline button-danger"
                  onClick={handleRemoveSpotify}
                >
                  Remover música
                </button>
              ) : <div />}
              <div className="spotify-modal-actions-right">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setIsSpotifyModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleApplySpotify}
                >
                  {gift.music ? 'Substituir música' : 'Adicionar música'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default GiftEditor
