// Biblioteca de adornos: galeria única com todos os PNGs da pasta assets/adornos.
// Os desenhos SVG antigos são mantidos apenas para compatibilidade com
// presentes já criados antes da renovação (ids legados).

// Carrega todos os PNGs de adornos de uma vez (Vite resolve as URLs no build).
const pngFiles = import.meta.glob('../assets/adornos/*.png', { eager: true, query: '?url', import: 'default' })

// Nomes em português, derivados dos próprios arquivos.
const PNG_LABELS = {
  'birthday-cake': 'Bolo de aniversário',
  bow: 'Laço',
  butterflies: 'Borboletas',
  butterfly: 'Borboleta',
  cake: 'Bolo',
  cards: 'Cartas',
  clean: 'Limpeza',
  clown: 'Palhaço',
  confetti: 'Confete',
  cross: 'Cruz',
  cut: 'Tesoura',
  cute: 'Fofura',
  'daisy-flower': 'Margarida',
  feather: 'Pena',
  fire: 'Fogo',
  flower: 'Flor',
  gift: 'Presente',
  grape: 'Uva',
  'half-moon': 'Lua minguante',
  kiss: 'Beijo',
  layer: 'Camadas',
  livestock: 'Animais',
  'music-note': 'Nota musical',
  note: 'Bilhete',
  photo: 'Foto',
  rainbow: 'Arco-íris',
  rose: 'Rosa',
  sakura: 'Flor de cerejeira',
  shape: 'Forma',
  shining: 'Brilho',
  'shooting-star': 'Estrela cadente',
  smoke: 'Fumaça',
  star: 'Estrela',
  stars: 'Estrelinhas',
  strawberry: 'Morango',
  sun: 'Sol',
  sunflower: 'Girassol',
  sweets: 'Doces',
  'teddy-bear': 'Ursinho de pelúcia',
  teleport: 'Mágica',
  'up-loading': 'Envio',
  'witch-hat': 'Chapéu de bruxa',
}

function pngIdFromPath(path) {
  const file = path.split('/').pop() || ''
  return `png:${file.replace(/\.png$/i, '')}`
}

function labelFor(base, variant) {
  const baseLabel = PNG_LABELS[base] || base.replace(/-/g, ' ')
  return variant ? `${baseLabel} ${variant}` : baseLabel
}

// Lista da galeria: todos os PNGs, sem categorias nem filtros.
const pngAdornments = Object.entries(pngFiles)
  .map(([path, url]) => {
    const file = (path.split('/').pop() || '').replace(/\.png$/i, '')
    const match = file.match(/^(.*?)\s*\((\d+)\)$/)
    const base = match ? match[1] : file
    const variant = match ? Number(match[2]) : 0
    return {
      id: pngIdFromPath(path),
      label: labelFor(base.trim(), variant),
      src: url,
      png: true,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

// Mapa id -> PNG, para render e compatibilidade.
const PNG_BY_ID = Object.fromEntries(pngAdornments.map((item) => [item.id, item]))

/* ---------- Desenhos SVG legados (somente compatibilidade) ---------- */
const LEGACY_SVG_ICONS = {
  heart: {
    id: 'heart',
    label: 'Coração',
    path: <path d="M12 20.7C7.6 17.6 3 13.9 3 9.4 3 6.4 5.3 4.2 8 4.2c1.6 0 3.1.8 4 2.1a5 5 0 0 1 4-2.1c2.7 0 5 2.2 5 5.2 0 4.5-4.6 8.2-9 11.3z" />,
  },
  'heart-sparkle': {
    id: 'heart-sparkle',
    label: 'Coração com brilho',
    path: (
      <>
        <path d="M11 19.4C7 16.6 3.4 13.8 3.4 9.9c0-2.5 1.9-4.4 4.2-4.4 1.3 0 2.6.6 3.4 1.7a4.4 4.4 0 0 1 3.4-1.7c.4 0 .9.1 1.3.2-.4.8-.6 1.6-.6 2.5 0 2.7 1.9 4.9 4.4 5.2-1 2.5-4.2 4.9-8.5 6z" />
        <path d="M18.9 2.6l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6zM19.6 8.8l.4.9.9.4-.9.4-.4.9-.4-.9-.9-.4.9-.4z" />
      </>
    ),
  },
  sparkle: {
    id: 'sparkle',
    label: 'Brilho',
    path: <path d="M12 2.2c.5 4.7 4.6 8.8 9.3 9.3-4.7.5-8.8 4.6-9.3 9.3-.5-4.7-4.6-8.8-9.3-9.3 4.7-.5 8.8-4.6 9.3-9.3z" />,
  },
  stars: {
    id: 'stars',
    label: 'Estrelas',
    path: (
      <>
        <path d="M10 2.4c.4 3.4 3.3 6.3 6.7-3.4.4-6.3 3.3-6.7 6.7-.4-3.4-3.3-6.3-6.7-6.7 3.4-.4 6.3-3.3 6.7-6.7z" />
        <path d="M17.8 14.4c.2 1.7 1.6 3.1 3.3 3.3-1.7.2-3.1 1.6-3.3 3.3-.2-1.7-1.6-3.1-3.3-3.3 1.7-.2 3.1-1.6 3.3-3.3z" />
        <circle cx="5.2" cy="18.6" r="1.4" />
      </>
    ),
  },
  flower: {
    id: 'flower',
    label: 'Flor',
    path: (
      <>
        <circle cx="12" cy="12" r="2.8" />
        <path d="M12 3.4c1.8 0 3.2 1.4 3.2 3.1S13.8 9.7 12 9.7 8.8 8.3 8.8 6.5 10.2 3.4 12 3.4zM12 14.3c1.8 0 3.2 1.4 3.2 3.1s-1.4 3.2-3.2 3.2-3.2-1.4-3.2-3.2 1.4-3.1 3.2-3.1zM3.4 12c0-1.8 1.4-3.2 3.1-3.2S9.7 10.2 9.7 12s-1.4 3.2-3.2 3.2S3.4 13.8 3.4 12zM14.3 12c0-1.8 1.4-3.2 3.2-3.2s3.1 1.4 3.1 3.2-1.4 3.2-3.1 3.2-3.2-1.4-3.2-3.2z" />
      </>
    ),
  },
  butterfly: {
    id: 'butterfly',
    label: 'Borboleta',
    path: (
      <>
        <ellipse cx="12" cy="13" rx="1.1" ry="5.6" />
        <path d="M10.9 9.8C9.4 7.3 6.9 5.6 5 6c-1.9.5-2.3 2.8-.4 5.6 1.4 2 3.9 3 6.3 3.3zM13.1 9.8c1.5-2.5 4-4.2 5.9-3.8 1.9.5 2.3 2.8.4 5.6-1.4 2-3.9 3-6.3 3.3z" />
      </>
    ),
  },
  bow: {
    id: 'bow',
    label: 'Laço',
    path: (
      <>
        <circle cx="12" cy="10.2" r="2.1" />
        <path d="M10.3 9.7C6.8 7.3 3 7.8 3.5 10.6s4.2 1.9 6.8.5zM13.7 9.7c3.5-2.4 7.3-1.9 6.8.9s-4.2 1.9-6.8.5z" />
        <path d="m11.1 11.7-2.8 8c1.4-.5 2.8-.5 3.7-2.4zM12.9 11.7l2.8 8c-1.4-.5-2.8-.5-3.7-2.4z" />
      </>
    ),
  },
  letter: {
    id: 'letter',
    label: 'Carta',
    path: (
      <>
        <rect x="3" y="5.4" width="18" height="13.4" rx="2" />
        <path d="m4.4 7.6 7.6 5.6 7.6-5.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
}

export const ADORNMENT_ICONS = { ...LEGACY_SVG_ICONS, ...PNG_BY_ID }

// Galeria exibida na biblioteca: apenas os PNGs, juntos, sem classificação.
export const ADORNMENT_LIST = pngAdornments

export const ADORNMENT_CATEGORIES = []

export const EMOJI_TO_ID = {
  '💖': 'heart',
  '✿': 'flower',
  '✨': 'sparkle',
  '🦋': 'butterfly',
  '☀️': 'sun',
  '✳': 'sparkle',
  '♡': 'heart',
}

export function resolveAdornmentId(content) {
  if (!content) return 'heart'
  if (ADORNMENT_ICONS[content]) return content
  if (EMOJI_TO_ID[content]) return EMOJI_TO_ID[content]
  return 'heart'
}

export function isPngAdornment(content) {
  return Boolean(resolveAdornmentId(content).startsWith('png:'))
}

export function getPngAdornmentSrc(content) {
  return PNG_BY_ID[resolveAdornmentId(content)]?.src || null
}
