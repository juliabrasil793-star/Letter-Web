import { useEffect, useState } from 'react'
import GiftUnwrap from './GiftUnwrap.jsx'
import logoGif from '../assets/Pink and Yellow Retro Y2K Beauty Store Animated Logo (2).gif'
import imgShining from '../assets/adornos/shining.png'
import { apiUrl } from '../utils/api.js'

function PublicGiftPage({ slug }) {
  const [result, setResult] = useState({ status: 'loading' })

  // Presentes são privados por link: não podem ser indexados por buscadores.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const loadGift = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/presentes/${encodeURIComponent(slug)}`),
          { signal: controller.signal },
        )

        if (response.status === 404) {
          setResult({ status: 'unavailable' })
          return
        }

        if (!response.ok) {
          throw new Error('Não foi possível carregar este presente.')
        }

        const publication = await response.json()
        if (!publication.gift || typeof publication.gift !== 'object') {
          throw new Error('O servidor retornou um presente inválido.')
        }

        setResult({ status: 'loaded', gift: publication.gift })
      } catch (error) {
        if (error.name === 'AbortError') return

        setResult({
          status: 'error',
          message: error instanceof TypeError
            ? 'Não foi possível conectar ao servidor. Tente novamente mais tarde.'
            : error.message,
        })
      }
    }

    loadGift()
    return () => controller.abort()
  }, [slug])

  return (
    <main className="preview-page">
      <header className="preview-header">
        <a className="brand-link preview-brand" href="/" aria-label="Letter Web">
          <img className="brand-logo" src={logoGif} alt="Letter Web" />
        </a>
        <span className="preview-label"><img src={imgShining} alt="" draggable="false" /> UM PRESENTE FEITO COM CARINHO</span>
      </header>
      {result.status === 'loading' && (
        <p className="public-gift-message" role="status">Carregando seu presente…</p>
      )}
      {result.status === 'unavailable' && (
        <section className="publish-card public-gift-message" role="alert">
          <h1>Este presente não está mais disponível.</h1>
          <p>O link pode estar incorreto ou o presente pode ter expirado.</p>
          <a className="button button-primary" href="/">Voltar ao início</a>
        </section>
      )}
      {result.status === 'error' && (
        <section className="publish-card public-gift-message" role="alert">
          <h1>Não foi possível abrir o presente.</h1>
          <p>{result.message}</p>
          <a className="button button-primary" href="/">Voltar ao início</a>
        </section>
      )}
      {result.status === 'loaded' && (
        <section className="recipient-view" aria-label="Presente compartilhado">
          <GiftUnwrap gift={result.gift} />
        </section>
      )}
    </main>
  )
}

export default PublicGiftPage
