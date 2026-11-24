import { useRef, useState } from 'react'
import GiftUnwrap from './GiftUnwrap.jsx'
import logoGif from '../assets/Pink and Yellow Retro Y2K Beauty Store Animated Logo (2).gif'
import imgPhoto from '../assets/adornos/photo.png'
import imgBow from '../assets/adornos/bow.png'
import imgShining from '../assets/adornos/shining.png'
import { apiUrl } from '../utils/api.js'

function getInitialShareMessage(link) {
  return `Preparei um presente digital especialmente para você! ♡\n\nFiz com muito carinho e quero que você veja essa surpresa.\n\nAbra seu presente aqui:\n${link}`
}

function PublishPage({ gift, onBack, onHome }) {
  const [publication, setPublication] = useState(null)
  const [copyState, setCopyState] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const linkInput = useRef(null)

  const publishGift = async () => {
    setPublication({ status: 'publishing' })
    setCopyState('')

    try {
      const response = await fetch(apiUrl('/api/presentes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gift),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Não foi possível publicar o presente.')
      }

      if (!result.slug) {
        throw new Error('O servidor não retornou o link do presente.')
      }

      const link = new URL(`/presente/${encodeURIComponent(result.slug)}`, window.location.origin).toString()
      setPublication({ status: 'published', link })
      setShareMessage(getInitialShareMessage(link))
    } catch (error) {
      setPublication({
        status: 'error',
        message: error instanceof TypeError
          ? 'Não foi possível conectar ao servidor. Verifique se o backend está em execução e tente novamente.'
          : error.message,
      })
    }
  }

  const handleShare = async () => {
    setCopyState('')
    if (navigator.share) {
      try {
        await navigator.share({
          title: gift.title || 'Um presente digital para você',
          text: shareMessage,
          url: publication.link,
        })
        setCopyState('Presente compartilhado com sucesso! ♡')
      } catch (error) {
        if (error.name === 'AbortError') {
          // Usuário cancelou ou fechou a janela nativa de compartilhamento sem compartilhar
          return
        }
        console.error('Falha no compartilhamento nativo:', error)
        await copyFullMessage()
      }
    } else {
      await copyFullMessage()
    }
  }

  const copyFullMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
      setCopyState('Mensagem e link copiados com carinho! Prontos para colar onde quiser ♡')
    } catch (error) {
      console.error('Não foi possível copiar a mensagem completa.', error)
      setCopyState('Seu navegador não permitiu copiar automaticamente. Selecione e copie o texto acima.')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publication.link)
      setCopyState('Link copiado!')
    } catch (error) {
      console.error('Não foi possível copiar o link do presente.', error)
      linkInput.current?.select()
      setCopyState('Seu navegador não permitiu copiar. Selecione e copie o link acima.')
    }
  }

  return (
    <main className="publish-page">
      <header className="preview-header">
        <button className="back-link" onClick={onBack}><span aria-hidden="true">←</span> Voltar ao editor</button>
        <a className="brand-link preview-brand" href="#" onClick={(event) => event.preventDefault()} aria-label="Letter Web">
          <img className="brand-logo" src={logoGif} alt="Letter Web" />
        </a>
        <span className="publish-step">ÚLTIMO PASSO</span>
      </header>
      <section className="publish-card">
        <div className="publish-illustration" aria-hidden="true"><img className="publish-photo" src={imgPhoto} alt="" draggable="false" /><span className="publish-star"><img src={imgShining} alt="" draggable="false" /></span><span className="publish-spark"><img src={imgBow} alt="" draggable="false" /></span></div>
        <span className="eyebrow">QUASE PRONTO PARA ESPALHAR CARINHO</span>
        <h1>Seu presente está<br /><span>cheio de você.</span></h1>
        <p className="publish-summary">“{gift.title || 'Um presente sem título'}” está pronto para ganhar o mundo — ou pelo menos o coração de alguém.</p>
        {publication?.status === 'published' ? (
          <div className="publish-share-container">
            <div className="demo-notice publish-success" role="status">
              <span aria-hidden="true">✓</span>
              <p><strong>Presente publicado!</strong> Seu link está pronto para compartilhar.</p>
            </div>

            <div className="share-message-box">
              <div className="share-message-header">
                <label className="field-label" htmlFor="share-message-textarea">
                  Mensagem para acompanhar seu presente
                </label>
                <span className="share-message-tip">Personalize a mensagem antes de enviar para quem você ama:</span>
              </div>
              <textarea
                id="share-message-textarea"
                className="text-input share-message-textarea"
                rows={5}
                value={shareMessage}
                onChange={(event) => setShareMessage(event.target.value)}
                aria-label="Mensagem explicativa para compartilhar com o presente"
              />
              <div className="share-buttons-row">
                <button
                  type="button"
                  className="button button-primary share-main-button"
                  onClick={handleShare}
                >
                  <span aria-hidden="true">♡</span> Compartilhar presente
                </button>
                <button
                  type="button"
                  className="button button-outline share-copy-button"
                  onClick={copyFullMessage}
                >
                  Copiar mensagem completa
                </button>
              </div>
            </div>

            <div className="share-direct-link-box">
              <label className="field-label" htmlFor="published-link">Ou copie somente o link direto</label>
              <div className="link-copy-row">
                <input
                  ref={linkInput}
                  id="published-link"
                  className="text-input"
                  value={publication.link}
                  readOnly
                  onFocus={(event) => event.target.select()}
                />
                <button type="button" className="button button-outline" onClick={copyLink}>Copiar link</button>
              </div>
            </div>

            {copyState && (
              <p className={`copy-feedback${copyState.startsWith('Seu navegador') ? ' copy-error' : ''}`} role="status">
                {copyState}
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="publish-summary">Publique para salvar seu presente e criar um link compartilhável válido por 48 horas.</p>
            {publication?.status === 'error' && (
              <div className="demo-notice publish-error" role="alert">
                <span aria-hidden="true">!</span>
                <p>{publication.message}</p>
              </div>
            )}
            <button
              className="button button-primary"
              onClick={publishGift}
              disabled={publication?.status === 'publishing'}
            >
              {publication?.status === 'publishing' ? 'Publicando…' : publication?.status === 'error' ? 'Tentar novamente' : 'Publicar presente'}
            </button>
          </>
        )}
        <div className="publish-actions">
          <button className="text-link" onClick={onBack}>Quero continuar editando</button>
          <button className="button button-dark" onClick={onHome}>Voltar ao início <span aria-hidden="true">→</span></button>
        </div>
      </section>
      <section className="publish-preview" aria-label="Prévia do presente">
        <span className="eyebrow">PRÉVIA DO PRESENTE</span>
        <GiftUnwrap gift={gift} />
      </section>
      <p className="publish-footnote">Seu rascunho continua salvo neste navegador ♡</p>
    </main>
  )
}

export default PublishPage
