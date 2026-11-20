import { useRef, useState } from 'react'
import GiftEditor from './components/GiftEditor.jsx'
import GiftPreview from './components/GiftPreview.jsx'
import HomePage from './components/HomePage.jsx'
import PublishPage from './components/PublishPage.jsx'
import PublicGiftPage from './components/PublicGiftPage.jsx'
import './App.css'

const STORAGE_KEY = 'letter-web-draft'
const HISTORY_LIMIT = 50
const HISTORY_GROUP_DELAY = 500

const emptyGift = {
  title: 'Um presente feito com carinho',
  recipient: '',
  background: '#FFF4E8',
  backgroundImage: '',
  fontFamily: 'Georgia, serif',
  textColor: '#3A3036',
  appearance: 'paper',
  unwrapping: {
    model: 'classic',
    boxColor: '#F349A5',
    ribbonColor: '#FFCE12',
    bowColor: '#FFF4E8',
    effect: 'confetti',
  },
  elements: [],
  music: null,
}

function readSavedGift() {
  try {
    const savedGift = window.localStorage.getItem(STORAGE_KEY)
    if (!savedGift) return emptyGift

    const parsedGift = JSON.parse(savedGift)
    if (!parsedGift || typeof parsedGift !== 'object' || Array.isArray(parsedGift)) {
      return emptyGift
    }

    const merged = {
      ...emptyGift,
      ...parsedGift,
      unwrapping: { ...emptyGift.unwrapping, ...parsedGift.unwrapping },
    }
    if (merged.music?.url && !merged.elements?.some((el) => el.type === 'music')) {
      merged.elements = [
        ...(merged.elements || []),
        {
          id: `music-spotify`,
          type: 'music',
          url: merged.music.url,
          musicType: merged.music.type,
          originalUrl: merged.music.originalUrl || merged.music.url,
          width: 75,
          height: 30,
        },
      ]
    }
    return merged
  } catch (error) {
    console.error('Não foi possível carregar o rascunho salvo.', error)
    return emptyGift
  }
}

function readPublicSlug() {
  const match = window.location.pathname.match(/^\/presente\/([^/]+)\/?$/)
  if (!match) return null

  try {
    return decodeURIComponent(match[1])
  } catch {
    return ''
  }
}

function App() {
  const [publicSlug] = useState(readPublicSlug)
  const [page, setPage] = useState(() => publicSlug === null ? 'home' : 'public')
  const [gift, setGift] = useState(readSavedGift)
  const [saveError, setSaveError] = useState('')
  const giftRef = useRef(gift)
  const historyRef = useRef({ past: [], future: [], lastEditAt: 0 })
  const [historyAvailability, setHistoryAvailability] = useState({ canUndo: false, canRedo: false })

  const saveGift = (nextGift) => {
    giftRef.current = nextGift
    setGift(nextGift)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextGift))
      setSaveError('')
    } catch (error) {
      console.error('Não foi possível salvar o rascunho neste navegador.', error)
      setSaveError('Não foi possível salvar neste navegador. Tente remover arquivos grandes.')
    }
  }

  const updateHistoryAvailability = () => {
    setHistoryAvailability({
      canUndo: historyRef.current.past.length > 0,
      canRedo: historyRef.current.future.length > 0,
    })
  }

  const updateGift = (nextGiftOrUpdater) => {
    const currentGift = giftRef.current
    const nextGift = typeof nextGiftOrUpdater === 'function'
      ? nextGiftOrUpdater(currentGift)
      : nextGiftOrUpdater

    if (nextGift === currentGift) return

    const history = historyRef.current
    if (Date.now() - history.lastEditAt >= HISTORY_GROUP_DELAY) {
      history.past = [...history.past, currentGift].slice(-HISTORY_LIMIT)
    }
    history.future = []
    history.lastEditAt = Date.now()
    saveGift(nextGift)
    updateHistoryAvailability()
  }

  const undoGift = () => {
    const history = historyRef.current
    if (history.past.length === 0) return

    const previousGift = history.past.at(-1)
    history.past = history.past.slice(0, -1)
    history.future = [...history.future, giftRef.current].slice(-HISTORY_LIMIT)
    history.lastEditAt = 0
    saveGift(previousGift)
    updateHistoryAvailability()
  }

  const redoGift = () => {
    const history = historyRef.current
    if (history.future.length === 0) return

    const nextGift = history.future.at(-1)
    history.future = history.future.slice(0, -1)
    history.past = [...history.past, giftRef.current].slice(-HISTORY_LIMIT)
    history.lastEditAt = 0
    saveGift(nextGift)
    updateHistoryAvailability()
  }

  const resetGift = () => {
    updateGift({ ...emptyGift, elements: [] })
  }

  const openEditor = () => setPage('editor')

  return (
    <div className="app-shell">
      {page === 'home' && <HomePage onCreate={openEditor} />}
      {page === 'editor' && (
        <GiftEditor
          gift={gift}
          setGift={updateGift}
          saveError={saveError}
          canUndo={historyAvailability.canUndo}
          canRedo={historyAvailability.canRedo}
          onUndo={undoGift}
          onRedo={redoGift}
          onReset={resetGift}
          onBack={() => setPage('home')}
          onPreview={() => setPage('preview')}
          onPublish={() => setPage('publish')}
        />
      )}
      {page === 'preview' && (
        <GiftPreview
          gift={gift}
          onBack={openEditor}
          onPublish={() => setPage('publish')}
        />
      )}
      {page === 'publish' && (
        <PublishPage gift={gift} onBack={openEditor} onHome={() => setPage('home')} />
      )}
      {page === 'public' && <PublicGiftPage slug={publicSlug} />}
    </div>
  )
}

export default App
