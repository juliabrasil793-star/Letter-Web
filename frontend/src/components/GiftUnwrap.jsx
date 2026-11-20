import { useEffect, useRef, useState } from 'react'
import { GiftCanvas } from './GiftCanvas.jsx'
import presentRosa from '../assets/rosa.png'
import presentAmarelo from '../assets/amarelo.png'
import presentVerde from '../assets/verde.png'
import presentAzul from '../assets/azul.png'
import presentAzulBolinha from '../assets/azulbolinha.png'


// Mapa modelo -> imagem, para o modelo escolhido ser usado de fato na caixa.
const presentByModel = {
  azul: presentAzul,
  azulbolinha: presentAzulBolinha,
  rosa: presentRosa,
  amarelo: presentAmarelo,
  verde: presentVerde,
}



function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  const int = Number.parseInt(full, 16)
  if (Number.isNaN(int)) return null
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0))
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

// Mapeia a cor escolhida da caixa para o presente (PNG) mais próximo.
const presentHues = {
  [presentRosa]: 330,
  [presentAmarelo]: 50,
  [presentVerde]: 150,
  [presentAzul]: 210,
  [presentAzulBolinha]: 230,
}

function pickPresentImage(boxColor) {
  const rgb = hexToRgb(boxColor)
  if (!rgb) return presentRosa
  const { h, s, l } = rgbToHsl(rgb)
  if (s < 0.12 && l > 0.75) return presentAzulBolinha
  let best = presentRosa
  let bestDistance = Number.POSITIVE_INFINITY
  for (const [image, hue] of Object.entries(presentHues)) {
    const distance = Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue))
    if (distance < bestDistance) {
      bestDistance = distance
      best = image
    }
  }
  return best
}

const effectColors = {
  confetti: ['#F349A5', '#FFCE12', '#A9DCCB', '#B9A0E8', '#A9D9F5'],
  hearts: ['#F349A5', '#F6A77D', '#B9A0E8'],
  sparkles: ['#FFCE12', '#F349A5', '#B9A0E8', '#FFFFFF'],
  petals: ['#F6A77D', '#F49ABF', '#FBE2EF', '#A9DCCB'],
  paper: ['#F349A5', '#FFCE12', '#A9DCCB', '#B9A0E8', '#A9D9F5'],
}
const defaultSettings = {
  model: 'classic',
  boxColor: '#F349A5',
  ribbonColor: '#FFCE12',
  bowColor: '#FFF4E8',
  effect: 'none',
}

function OpeningEffect({ effect }) {
  if (!effectColors[effect]) return null

  return (
    <span className={`gift-opening-effect effect-${effect}`} aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => (
        <span
          className="gift-effect-particle"
          key={`${effect}-${index}`}
          style={{
            left: `${(index * 37) % 96 + 2}%`,
            backgroundColor: effectColors[effect][index % effectColors[effect].length],
            '--particle-delay': `${(index % 6) * 35}ms`,
            '--particle-duration': `${650 + (index % 5) * 70}ms`,
            '--particle-x': `${(index * 47) % 180 - 90}px`,
            '--particle-y': `${-65 - (index * 29) % 135}px`,
            '--particle-rotation': `${(index * 73) % 360}deg`,
          }}
        />
      ))}
    </span>
  )
}

function GiftBox({ settings, opening, onOpen }) {
  // O modelo escolhido no editor define a imagem; o fallback por cor
  // mantém compatibilidade com presentes antigos (classic/pop/dream).
  const presentImage = presentByModel[settings.model] || pickPresentImage(settings.boxColor)
  return (
    <button
      className={`gift-box-button${opening ? ' is-opening' : ''}`}
      type="button"
      onClick={onOpen}
      disabled={opening}
      aria-label="Abrir caixa de presente"
    >
      <span className={`gift-box-illustration gift-box-${settings.model}`} aria-hidden="true">
        <span className="gift-box-shadow" />
        <img className="gift-box-present" src={presentImage} alt="" draggable="false" />
      </span>
      <span className="gift-box-instruction">Toque ou clique para abrir</span>
    </button>
  )
}

function GiftUnwrap({ gift }) {
  const savedSettings = gift.unwrapping
  const [phase, setPhase] = useState('closed')
  const [effectVisible, setEffectVisible] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  if (!savedSettings || typeof savedSettings !== 'object' || Array.isArray(savedSettings)) {
    return <GiftCanvas gift={gift} recipientView />
  }

  const settings = { ...defaultSettings, ...savedSettings }

  const openGift = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setPhase('opened')
      return
    }

    setPhase('opening')
    setEffectVisible(settings.effect !== 'none')
    timers.current.push(window.setTimeout(() => setPhase('opened'), 860))
    timers.current.push(window.setTimeout(() => setEffectVisible(false), 860))
  }

  if (phase === 'opened') {
    return (
      <div className="gift-unwrapped-content">
        <GiftCanvas gift={gift} recipientView />
      </div>
    )
  }

  return (
    <section
      className={`gift-unwrapping${phase === 'opening' ? ' is-opening' : ''}`}
      style={{
        '--box-color': settings.boxColor,
        '--ribbon-color': settings.ribbonColor,
        '--bow-color': settings.bowColor,
      }}
      aria-label="Caixa de presente"
    >
      <div className="gift-opening-stage">
        <GiftBox settings={settings} opening={phase === 'opening'} onOpen={openGift} />
        {effectVisible && <OpeningEffect effect={settings.effect} />}
      </div>
      <p className="gift-unwrapping-caption" aria-live="polite">
        {phase === 'opening' ? 'Preparando uma surpresa…' : 'Um presente feito especialmente para você'}
      </p>
    </section>
  )
}

export default GiftUnwrap
