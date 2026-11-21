import { useLayoutEffect, useRef, useState } from 'react'
import { AdornmentIcon } from './AdornmentIcons.jsx'
import logoicon from '../assets/logoicon.png'
import shining from '../assets/adornos/shining.png'

const CANVAS_BASE_WIDTH = 630
const BASE_CANVAS_HEIGHT = 510

function normalizeFontFamily(font) {
  if (!font) return 'Georgia, serif'
  if (font === 'cursive' || font.includes('cursive') || font.includes('Caveat') || font.includes('Dancing Script')) {
    return "'Caveat', 'Dancing Script', cursive"
  }
  return font
}

const resizeHandles = [
  ['nw', 'Canto superior esquerdo'],
  ['n', 'Lateral superior'],
  ['ne', 'Canto superior direito'],
  ['e', 'Lateral direita'],
  ['se', 'Canto inferior direito'],
  ['s', 'Lateral inferior'],
  ['sw', 'Canto inferior esquerdo'],
  ['w', 'Lateral esquerda'],
]

function getDefaultSize(element) {
  if (element.width) return element.width
  if (element.type === 'image' || element.type === 'carousel') return 70
  if (element.type === 'music') return 75
  if (element.type === 'sticker') return 14
  return 82
}

function getDefaultHeight(element) {
  if (element.height) return element.height
  if (element.type === 'image' || element.type === 'carousel') return 38
  if (element.type === 'music') return 30
  if (element.type === 'sticker') return 14
  if (element.role === 'title') return 20
  if (element.role === 'subtitle') return 16
  return 19
}

function getElementGeometry(element, index) {
  const width = getDefaultSize(element)
  const height = getDefaultHeight(element)
  const x = Math.max(width / 2, Math.min(100 - width / 2, element.x ?? 50))
  const fallbackY = 18 + index * 19
  const y = Math.max(height / 2, element.y ?? fallbackY)
  return { x, y, width, height }
}

function getVisibleElementPolygon(element) {
  const bounds = element.getBoundingClientRect()
  const stage = element.closest('.gift-site-content')
  const scaleFactor = stage ? (stage.getBoundingClientRect().width / (stage.offsetWidth || CANVAS_BASE_WIDTH)) : 1
  const width = element.offsetWidth * scaleFactor
  const height = element.offsetHeight * scaleFactor
  const transform = window.getComputedStyle(element).transform
  const matrix = transform.match(/^matrix\(([^)]+)\)$/)
  const values = matrix?.[1].split(',').map(Number)
  const angle = values ? Math.atan2(values[1], values[0]) : 0
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  const centerX = bounds.left + bounds.width / 2
  const centerY = bounds.top + bounds.height / 2

  return [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2, height / 2],
  ].map(([x, y]) => [
    centerX + x * cosine - y * sine,
    centerY + x * sine + y * cosine,
  ])
}

function polygonsIntersect(first, second) {
  for (const polygon of [first, second]) {
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index]
      const end = polygon[(index + 1) % polygon.length]
      const axis = [start[1] - end[1], end[0] - start[0]]
      const firstProjection = first.map(([x, y]) => x * axis[0] + y * axis[1])
      const secondProjection = second.map(([x, y]) => x * axis[0] + y * axis[1])
      const firstMin = Math.min(...firstProjection)
      const firstMax = Math.max(...firstProjection)
      const secondMin = Math.min(...secondProjection)
      const secondMax = Math.max(...secondProjection)

      if (firstMax < secondMin - 0.01 || secondMax < firstMin - 0.01) return false
    }
  }

  return true
}

function getPhotoBorderStyle(element) {
  const borderWidth = element.borderEnabled === false ? 0 : element.borderWidth ?? 5
  return {
    borderWidth: `${borderWidth}px`,
    borderColor: element.borderColor || '#ffffff',
    borderRadius: `${element.borderRadius ?? 4}px`,
    boxShadow: element.borderEnabled === false ? 'none' : undefined,
  }
}

function updateGroupPosition(selectedElements, deltaX, deltaY, onUpdateSelection) {
  const minimumX = Math.max(...selectedElements.map((item) => item.width / 2 - item.x))
  const maximumX = Math.min(...selectedElements.map((item) => 100 - item.width / 2 - item.x))
  const minimumY = Math.max(...selectedElements.map((item) => item.height / 2 - item.y))
  const groupDeltaX = Math.max(minimumX, Math.min(maximumX, deltaX))
  const groupDeltaY = Math.max(minimumY, deltaY)

  onUpdateSelection(selectedElements.map((item) => ({
    id: item.id,
    x: item.x + groupDeltaX,
    y: item.y + groupDeltaY,
  })))
}

function startGroupTextMove(event, element, selectedElements, onUpdateSelection, onDrag) {
  if (event.button !== 0 || !onUpdateSelection) return

  event.stopPropagation()
  const stage = event.currentTarget.closest('.gift-site-content')
  const elementNode = event.currentTarget.closest('.canvas-element')
  if (!stage || !elementNode) return

  const startX = event.clientX
  const startY = event.clientY
  const stageRect = stage.getBoundingClientRect()
  const stageWidth = stageRect.width
  const scaleFactor = (stageWidth / (stage.offsetWidth || CANVAS_BASE_WIDTH)) || 1
  let dragged = false

  const finish = () => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', finish)
    document.removeEventListener('pointercancel', finish)
  }

  const move = (moveEvent) => {
    const distanceX = moveEvent.clientX - startX
    const distanceY = moveEvent.clientY - startY
    if (!dragged && Math.hypot(distanceX, distanceY) < 4) return

    if (!dragged) {
      dragged = true
      onDrag(elementNode)
      document.getSelection()?.removeAllRanges()
    }

    moveEvent.preventDefault()
    updateGroupPosition(
      selectedElements,
      distanceX / stageWidth * 100,
      distanceY / (BASE_CANVAS_HEIGHT * scaleFactor) * 100,
      onUpdateSelection,
    )
  }

  document.addEventListener('pointermove', move, { passive: false })
  document.addEventListener('pointerup', finish, { once: true })
  document.addEventListener('pointercancel', finish, { once: true })
}

function GiftText({
  element,
  gift,
  align,
  recipientView,
  selected,
  selectedElements,
  onSelect,
  onUpdate,
  onUpdateSelection,
  onMarkDragged,
  onConsumeDraggedClick,
}) {
  const textRef = useRef(null)
  const TextTag = element.role === 'title' ? 'h1' : element.role === 'subtitle' ? 'h2' : 'p'

  useLayoutEffect(() => {
    const textNode = textRef.current
    if (textNode && document.activeElement !== textNode && textNode.textContent !== element.content) {
      textNode.textContent = element.content
    }
  }, [element.content])

  return (
    <TextTag
      ref={textRef}
      className={`canvas-text canvas-text-${element.role || 'paragraph'}`}
      style={{
        color: element.color || gift.textColor || '#3A3036',
        fontFamily: normalizeFontFamily(element.font || gift.fontFamily),
        fontSize: `${element.size || (element.role === 'title' ? 42 : element.role === 'subtitle' ? 25 : 17)}px`,
        textAlign: align,
      }}
      contentEditable={!recipientView}
      suppressContentEditableWarning
      role={recipientView ? undefined : 'textbox'}
      aria-label={recipientView ? undefined : 'Editar texto diretamente'}
      onClick={(event) => {
        if (!recipientView) {
          event.stopPropagation()
          if (onConsumeDraggedClick?.(event)) return
          if (!selected) onSelect?.(element.id)
        }
      }}
      onInput={(event) => {
        if (!recipientView) onUpdate?.(element.id, { content: event.currentTarget.textContent })
      }}
      onPointerDown={(event) => {
        if (!recipientView && selected && selectedElements.length > 0) {
          startGroupTextMove(event, element, selectedElements, onUpdateSelection, onMarkDragged)
          return
        }
        event.stopPropagation()
      }}
    />
  )
}

function startElementInteraction(event, element, mode, direction, onUpdate, selectedElements, onUpdateSelection, onDrag) {
  event.preventDefault()
  event.stopPropagation()
  const stage = event.currentTarget.closest('.gift-site-content')
  if (!stage) return
  const elementNode = event.currentTarget.closest('.canvas-element')
  let dragged = false

  const stageRect = stage.getBoundingClientRect()
  const stageWidth = stageRect.width
  const scaleFactor = (stageWidth / (stage.offsetWidth || CANVAS_BASE_WIDTH)) || 1

  const interaction = {
    mode,
    direction,
    startX: event.clientX,
    startY: event.clientY,
    startRotation: element.rotation || 0,
    startElement: {
      x: element.x ?? 50,
      y: element.y ?? 50,
      width: getDefaultSize(element),
      height: getDefaultHeight(element),
    },
    stage: stageRect,
    scaleFactor,
  }
  const elementBounds = event.currentTarget.closest('.canvas-element')?.getBoundingClientRect()
  if (mode === 'rotate' && elementBounds) {
    interaction.centerX = elementBounds.left + elementBounds.width / 2
    interaction.centerY = elementBounds.top + elementBounds.height / 2
    interaction.startAngle = Math.atan2(event.clientY - interaction.centerY, event.clientX - interaction.centerX)
  }

  const handlePointerMove = (moveEvent) => {
    const current = interaction
    if (!dragged && current.mode === 'move' && Math.hypot(
      moveEvent.clientX - current.startX,
      moveEvent.clientY - current.startY,
    ) >= 4) {
      dragged = true
      onDrag?.(elementNode)
    }

    if (current.mode === 'rotate') {
      const angle = Math.atan2(moveEvent.clientY - current.centerY, moveEvent.clientX - current.centerX)
      const delta = ((angle - current.startAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      const degrees = current.startRotation + delta * 180 / Math.PI
      const rotation = ((degrees + 180) % 360 + 360) % 360 - 180
      onUpdate(element.id, { rotation })
      return
    }

    const deltaX = (moveEvent.clientX - current.startX) / current.stage.width * 100
    const deltaY = (moveEvent.clientY - current.startY) / (BASE_CANVAS_HEIGHT * current.scaleFactor) * 100
    if (current.mode === 'move' && selectedElements?.length > 1 && onUpdateSelection) {
      updateGroupPosition(selectedElements, deltaX, deltaY, onUpdateSelection)
      return
    }

    let { x, y, width, height } = current.startElement

    if (current.mode === 'move') {
      x += deltaX
      y += deltaY
    } else {
      if (current.direction.includes('e')) width += deltaX
      if (current.direction.includes('w')) width -= deltaX
      if (current.direction.includes('s')) height += deltaY
      if (current.direction.includes('n')) height -= deltaY
      width = Math.min(96, Math.max(8, width))
      height = Math.min(92, Math.max(8, height))
      if (current.direction.includes('w')) x += (current.startElement.width - width) / 2
      if (current.direction.includes('e')) x += (width - current.startElement.width) / 2
      if (current.direction.includes('n')) y += (current.startElement.height - height) / 2
      if (current.direction.includes('s')) y += (height - current.startElement.height) / 2
    }

    x = Math.max(width / 2, Math.min(100 - width / 2, x))
    y = Math.max(height / 2, y)
    onUpdate(element.id, {
      x,
      y,
      width,
      height,
      ...(['image', 'carousel'].includes(element.type) ? { size: width } : {}),
    })
  }

  const stopInteraction = () => {
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', stopInteraction)
    document.removeEventListener('pointercancel', stopInteraction)
  }

  document.addEventListener('pointermove', handlePointerMove)
  document.addEventListener('pointerup', stopInteraction, { once: true })
  document.addEventListener('pointercancel', stopInteraction, { once: true })
}

function PhotoCarousel({ element, selected, isSelected, multiSelected, selectedElements, onSelect, onUpdate, onUpdateSelection, onConsumeDraggedClick, onMarkDragged, onDelete, recipientView }) {
  const photos = element.images || []
  const [recipientIndex, setRecipientIndex] = useState(() => Math.max(0, Math.min(element.currentIndex || 0, Math.max(0, photos.length - 1))))

  if (photos.length === 0) return null

  const currentIndex = recipientView
    ? Math.max(0, Math.min(recipientIndex, photos.length - 1))
    : Math.max(0, Math.min(element.currentIndex || 0, photos.length - 1))

  const showPhoto = (index) => {
    const nextIndex = Math.max(0, Math.min(index, photos.length - 1))
    if (recipientView) {
      setRecipientIndex(nextIndex)
    } else {
      onUpdate(element.id, { currentIndex: nextIndex })
    }
  }

  return (
    <div
      className={`canvas-element canvas-element-carousel align-${element.alignment || 'center'}${selected || multiSelected ? ' is-selected' : ''}${multiSelected ? ' is-multi-selected' : ''}`}
      data-element-id={element.id}
      style={{
        left: `${element.x}%`,
        top: `${element.y * BASE_CANVAS_HEIGHT / 100}px`,
        width: `${element.width}%`,
        height: `${element.height * BASE_CANVAS_HEIGHT / 100}px`,
        '--element-rotation': `${element.rotation || 0}deg`,
      }}
      onClick={(event) => {
        if (recipientView || onConsumeDraggedClick?.(event)) return
        if (!isSelected) onSelect?.(element.id)
      }}
      onPointerDown={(event) => {
        if (recipientView || event.target.closest('button')) return
        if (!isSelected) {
          onSelect(element.id)
          return
        }
        startElementInteraction(event, element, 'move', '', onUpdate, selectedElements, onUpdateSelection, onMarkDragged)
      }}
      role="group"
      aria-label={`Carrossel com ${photos.length} fotos`}
    >
      {selected && !recipientView && (
        <ElementControls
          element={element}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
      <div className="carousel-frame" style={getPhotoBorderStyle(element)}>
        <img
          src={photos[currentIndex].src}
          alt={photos[currentIndex].name || `Foto ${currentIndex + 1}`}
          draggable="false"
        />
      </div>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-previous"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              showPhoto((currentIndex - 1 + photos.length) % photos.length)
            }}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Foto anterior"
            title="Foto anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-next"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              showPhoto((currentIndex + 1) % photos.length)
            }}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Próxima foto"
            title="Próxima foto"
          >
            ›
          </button>
        </>
      )}
      {photos.length > 1 && (
        <div className="carousel-indicators" aria-label={`Foto ${currentIndex + 1} de ${photos.length}`}>
          {photos.map((photo, index) => (
            <button
              key={photo.id || `${photo.name}-${index}`}
              type="button"
              className={index === currentIndex ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                showPhoto(index)
              }}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label={`Mostrar foto ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ElementControls({ element, onUpdate, onDelete }) {
  const startInteraction = (event, mode, direction = '') => {
    startElementInteraction(event, element, mode, direction, onUpdate)
  }

  return (
    <>
      <div
        className={`element-selection-toolbar${(element.y ?? 50) < 17 ? ' toolbar-below' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="element-drag-handle"
          onPointerDown={(event) => startInteraction(event, 'move')}
          aria-label="Arrastar elemento"
          title="Arraste para mover"
        >
          ⠿
        </button>
        <button
          className="element-rotate-handle"
          onPointerDown={(event) => startInteraction(event, 'rotate')}
          aria-label="Girar elemento"
          title="Arraste para girar"
        >
          ↻
        </button>
        <span>{element.type === 'text' ? 'Texto selecionado' : element.type === 'image' ? 'Imagem selecionada' : element.type === 'carousel' ? 'Carrossel selecionado' : element.type === 'music' ? 'Spotify selecionado' : 'Adorno selecionado'}</span>
        <button className="element-delete-button" onClick={() => onDelete(element.id)} aria-label="Excluir elemento" title="Excluir elemento">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 3h8l1 2h4v2H3V5h4l1-2Zm-3 6h14l-1 12H6L5 9Zm4 2v8h2v-8H9Zm4 0v8h2v-8h-2Z" />
          </svg>
        </button>
      </div>
      {resizeHandles.map(([direction, label]) => (
        <button
          className={`element-resize-handle resize-${direction}`}
          key={direction}
          onPointerDown={(event) => startInteraction(event, 'resize', direction)}
          aria-label={`Redimensionar: ${label}`}
          title={`Redimensionar: ${label}`}
          type="button"
        />
      ))}
    </>
  )
}

function GiftCanvas({
  gift,
  selectedId,
  selectedIds = [],
  onSelect,
  onSelectMany,
  onUpdateElement,
  onUpdateMultipleElements,
  onDeleteElement,
  recipientView = false,
}) {
  const scalerRef = useRef(null)
  const canvasRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [canvasHeight, setCanvasHeight] = useState(0)

  useLayoutEffect(() => {
    const scaler = scalerRef.current
    const canvas = canvasRef.current
    if (!scaler || !canvas) return

    const updateDimensions = () => {
      const containerWidth = scaler.getBoundingClientRect().width
      if (containerWidth > 0) {
        const nextScale = Math.min(1, containerWidth / CANVAS_BASE_WIDTH)
        setScale(nextScale)
      }
      if (canvas) {
        setCanvasHeight(canvas.offsetHeight)
      }
    }

    updateDimensions()

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })

    resizeObserver.observe(scaler)
    resizeObserver.observe(canvas)

    window.addEventListener('resize', updateDimensions)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [gift])

  const [selectionBox, setSelectionBox] = useState(null)
  const selectionGesture = useRef(null)
  const draggedElement = useRef(null)
  const draggedElementTimeout = useRef(null)
  const backgroundStyle = {
    backgroundColor: gift.background || '#FFF4E8',
    backgroundImage: gift.backgroundImage ? `url("${gift.backgroundImage}")` : undefined,
    backgroundSize: gift.backgroundImage ? 'cover' : undefined,
    backgroundPosition: gift.backgroundImage ? 'center' : undefined,
    fontFamily: normalizeFontFamily(gift.fontFamily),
    color: gift.textColor || '#3A3036',
  }

  const markElementDragged = (element) => {
    draggedElement.current = element
    clearTimeout(draggedElementTimeout.current)
    draggedElementTimeout.current = setTimeout(() => {
      draggedElement.current = null
    }, 750)
  }

  const consumeDraggedClick = (event) => {
    const targetElement = event.currentTarget.closest('.canvas-element') || event.currentTarget
    if (draggedElement.current !== targetElement) return false
    draggedElement.current = null
    clearTimeout(draggedElementTimeout.current)
    event.preventDefault()
    event.stopPropagation()
    return true
  }

  const startSelection = (event) => {
    if (recipientView || !onSelectMany || event.button !== 0) return
    if (!event.target.closest('.gift-site-content')) return
    if (event.target.closest('.canvas-element, button, input, select, textarea, [contenteditable="true"]')) return

    const stage = event.currentTarget.querySelector('.gift-site-content')
    if (!stage) return

    const stageBounds = stage.getBoundingClientRect()
    const scaleFactor = (stageBounds.width / (stage.offsetWidth || CANVAS_BASE_WIDTH)) || 1
    const startX = (event.clientX - stageBounds.left) / scaleFactor
    const startY = (event.clientY - stageBounds.top) / scaleFactor
    selectionGesture.current = {
      pointerId: event.pointerId,
      stageBounds,
      scaleFactor,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      moved: false,
      canSelectArea: event.pointerType !== 'touch',
    }
    if (event.pointerType !== 'touch') {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      setSelectionBox({ left: startX, top: startY, width: 0, height: 0 })
    }
  }

  const updateSelection = (event) => {
    const gesture = selectionGesture.current
    if (!gesture || gesture.pointerId !== event.pointerId || !gesture.canSelectArea) return

    gesture.currentX = (event.clientX - gesture.stageBounds.left) / gesture.scaleFactor
    gesture.currentY = (event.clientY - gesture.stageBounds.top) / gesture.scaleFactor
    if (!gesture.moved && Math.hypot(
      (gesture.currentX - gesture.startX) * gesture.scaleFactor,
      (gesture.currentY - gesture.startY) * gesture.scaleFactor,
    ) >= 4) {
      gesture.moved = true
    }
    if (!gesture.moved) return

    setSelectionBox({
      left: Math.min(gesture.startX, gesture.currentX),
      top: Math.min(gesture.startY, gesture.currentY),
      width: Math.abs(gesture.currentX - gesture.startX),
      height: Math.abs(gesture.currentY - gesture.startY),
    })
  }

  const finishSelection = (event) => {
    const gesture = selectionGesture.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    selectionGesture.current = null
    setSelectionBox(null)
    gesture.currentX = (event.clientX - gesture.stageBounds.left) / gesture.scaleFactor
    gesture.currentY = (event.clientY - gesture.stageBounds.top) / gesture.scaleFactor
    if (!gesture.moved) {
      onSelect(null)
      return
    }

    const selection = {
      left: Math.min(gesture.startX, gesture.currentX) * gesture.scaleFactor + gesture.stageBounds.left,
      right: Math.max(gesture.startX, gesture.currentX) * gesture.scaleFactor + gesture.stageBounds.left,
      top: Math.min(gesture.startY, gesture.currentY) * gesture.scaleFactor + gesture.stageBounds.top,
      bottom: Math.max(gesture.startY, gesture.currentY) * gesture.scaleFactor + gesture.stageBounds.top,
    }
    const selectionPolygon = [
      [selection.left, selection.top],
      [selection.right, selection.top],
      [selection.right, selection.bottom],
      [selection.left, selection.bottom],
    ]
    const selected = [...event.currentTarget.querySelectorAll('.gift-site-content [data-element-id]')]
      .filter((element) => polygonsIntersect(getVisibleElementPolygon(element), selectionPolygon))
      .map((element) => element.dataset.elementId)
      .filter((id, index, ids) => id && ids.indexOf(id) === index)

    onSelectMany(selected)
  }

  const cancelSelection = (event) => {
    if (selectionGesture.current?.pointerId !== event.pointerId) return
    selectionGesture.current = null
    setSelectionBox(null)
  }
  const contentHeight = Math.max(
    BASE_CANVAS_HEIGHT,
    ...gift.elements.map((element, index) => {
      const geometry = getElementGeometry(element, index)
      return (geometry.y + geometry.height / 2) * BASE_CANVAS_HEIGHT / 100 + 32
    }),
  )
  const selectedElements = gift.elements
    .map((element, index) => selectedIds.includes(element.id)
      ? { ...element, ...getElementGeometry(element, index) }
      : null)
    .filter(Boolean)

  const isScaled = scale < 0.999
  const scaledHeight = isScaled && canvasHeight > 0 ? Math.ceil(canvasHeight * scale) : undefined

  return (
    <div
      className="gift-canvas-scaler"
      ref={scalerRef}
      style={{
        width: '100%',
        maxWidth: `${CANVAS_BASE_WIDTH}px`,
        height: scaledHeight ? `${scaledHeight}px` : undefined,
        position: 'relative',
        marginInline: 'auto',
      }}
    >
      <article
        ref={canvasRef}
        className={`gift-canvas${recipientView ? ' gift-canvas-recipient' : ' gift-canvas-editor'}`}
        style={{
          ...backgroundStyle,
          width: `${CANVAS_BASE_WIDTH}px`,
          minWidth: `${CANVAS_BASE_WIDTH}px`,
          maxWidth: `${CANVAS_BASE_WIDTH}px`,
          transform: isScaled ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
          position: isScaled ? 'absolute' : 'relative',
          left: 0,
          top: 0,
          flexShrink: 0,
        }}
        aria-label="Pré-visualização do presente"
        onPointerDown={startSelection}
        onPointerMove={updateSelection}
        onPointerUp={finishSelection}
        onPointerCancel={cancelSelection}
      >
        <div className={`gift-site gift-site-${gift.appearance || 'paper'}`}>
          <header className="gift-site-nav">
            <span className="gift-site-mark" aria-hidden="true"><img src={logoicon} alt="" draggable="false" /></span>
            <span className="gift-site-title">{gift.title || 'Seu presente'}</span>
            {gift.recipient && <span className="gift-site-recipient">feito para {gift.recipient}</span>}
          </header>
          <div className="gift-site-content" style={{ minHeight: `${contentHeight}px` }}>
            {gift.elements.length === 0 && !recipientView ? (
              <div className="canvas-empty">
                <span className="empty-sparkle"><img src={shining} alt="" draggable="false" /></span>
                <strong>Sua página começa aqui</strong>
                <span>Adicione textos, fotos e detalhes do seu jeito.</span>
              </div>
            ) : (
              <div className="canvas-elements">
                {gift.elements.map((element, index) => {
                  const selected = selectedIds.includes(element.id) && !recipientView
                  const active = selectedId === element.id && !recipientView
                  const align = element.alignment || 'center'
                  const elementGeometry = getElementGeometry(element, index)
                  const geometry = {
                    left: `${elementGeometry.x}%`,
                    top: `${elementGeometry.y * BASE_CANVAS_HEIGHT / 100}px`,
                    width: `${elementGeometry.width}%`,
                    height: `${elementGeometry.height * BASE_CANVAS_HEIGHT / 100}px`,
                    '--element-rotation': `${element.rotation || 0}deg`,
                  }
                  if (element.type === 'carousel') {
                    return (
                      <PhotoCarousel
                        element={{ ...element, ...elementGeometry }}
                        key={element.id}
                        selected={active}
                        isSelected={selected}
                        multiSelected={selectedIds.length > 1 && selected}
                        selectedElements={selectedElements}
                        onSelect={onSelect}
                        onUpdate={onUpdateElement}
                        onUpdateSelection={onUpdateMultipleElements}
                        onConsumeDraggedClick={consumeDraggedClick}
                        onMarkDragged={markElementDragged}
                        onDelete={onDeleteElement}
                        recipientView={recipientView}
                      />
                    )
                  }

                  return (
                    <div
                      className={`canvas-element canvas-element-${element.type}${element.type === 'image' ? ` align-${align}` : ''}${selected ? ' is-selected' : ''}${selectedIds.length > 1 && selected ? ' is-multi-selected' : ''}`}
                      data-element-id={element.id}
                      key={element.id}
                      style={geometry}
                      onClick={(event) => {
                        if (recipientView || consumeDraggedClick(event)) return
                        if (!selected) onSelect?.(element.id)
                      }}
                      onPointerDown={(event) => {
                        if (recipientView || event.target.closest('button, [contenteditable="true"]')) return
                        if (!selected) {
                          onSelect?.(element.id)
                          return
                        }
                        startElementInteraction(
                          event,
                          { ...element, ...elementGeometry },
                          'move',
                          '',
                          onUpdateElement,
                          selectedElements,
                          onUpdateMultipleElements,
                          markElementDragged,
                        )
                      }}
                      onKeyDown={(event) => {
                        if (!recipientView && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault()
                          onSelect?.(element.id)
                        }
                      }}
                      role={recipientView ? undefined : 'group'}
                      tabIndex={recipientView ? undefined : 0}
                      aria-label={recipientView ? undefined : 'Selecionar elemento'}
                    >
                      {active && (
                        <ElementControls
                          element={{ ...element, ...elementGeometry }}
                          onUpdate={onUpdateElement}
                          onDelete={onDeleteElement}
                        />
                      )}
                      {element.type === 'text' && (
                        <GiftText
                          element={element}
                          gift={gift}
                          align={align}
                          recipientView={recipientView}
                          selected={selected}
                          selectedElements={selectedElements}
                          onSelect={onSelect}
                          onUpdate={onUpdateElement}
                          onUpdateSelection={onUpdateMultipleElements}
                          onMarkDragged={markElementDragged}
                          onConsumeDraggedClick={consumeDraggedClick}
                        />
                      )}
                      {element.type === 'image' && (
                        <img
                          src={element.content}
                          alt={element.name || 'Foto do presente'}
                          style={getPhotoBorderStyle(element)}
                          draggable="false"
                        />
                      )}
                      {element.type === 'sticker' && (
                        <span className="canvas-sticker" role="img" aria-label="Adorno">
                          <AdornmentIcon
                            id={element.content}
                            styleType={element.adornmentStyle || 'monochrome'}
                          />
                        </span>
                      )}
                      {element.type === 'music' && (
                        <div className="canvas-spotify-frame">
                          <iframe
                            title="Player oficial do Spotify"
                            src={element.url}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            style={{ borderRadius: '12px', border: 0, width: '100%', height: '100%', display: 'block' }}
                          />
                          {!recipientView && (!selected || selectedIds.length > 1) && (
                            <div
                              className="canvas-spotify-overlay"
                              title="Clique para selecionar e mover o Spotify"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {selectionBox && (
              <div
                className="canvas-selection-marquee"
                style={{
                  left: `${selectionBox.left}px`,
                  top: `${selectionBox.top}px`,
                  width: `${selectionBox.width}px`,
                  height: `${selectionBox.height}px`,
                }}
                aria-hidden="true"
              />
            )}
            {!gift.elements.some((el) => el.type === 'music') && gift.music?.url ? (
              <div className="gift-spotify-container">
                <iframe
                  title="Player oficial do Spotify"
                  src={gift.music.url}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            ) : gift.music?.src ? (
              <audio className="gift-audio" controls src={gift.music.src}>
                Seu navegador não oferece suporte para áudio.
              </audio>
            ) : null}
          </div>
          <footer className="gift-site-footer"><span>feito com carinho</span><span aria-hidden="true">♡</span></footer>
        </div>
      </article>
    </div>
  )
}

export { GiftCanvas }
