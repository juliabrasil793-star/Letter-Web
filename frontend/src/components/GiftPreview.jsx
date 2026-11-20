import GiftUnwrap from './GiftUnwrap.jsx'
import logoGif from '../assets/Pink and Yellow Retro Y2K Beauty Store Animated Logo (2).gif'
import imgShining from '../assets/adornos/shining.png'

function GiftPreview({ gift, onBack, onPublish }) {
  return (
    <main className="preview-page">
      <header className="preview-header">
        <button className="back-link" onClick={onBack}><span aria-hidden="true">←</span> Voltar ao editor</button>
        <a className="brand-link preview-brand" href="#" onClick={(event) => event.preventDefault()} aria-label="Letter Web">
          <img className="brand-logo" src={logoGif} alt="Letter Web" />
        </a>
        <span className="preview-label"><img src={imgShining} alt="" draggable="false" /> ASSIM VAI APARECER PARA QUEM RECEBER</span>
        <button className="button button-primary compact-button" onClick={onPublish}>Continuar <span aria-hidden="true">→</span></button>
      </header>
      <section className="recipient-view" aria-label="Pré-visualização do presente">
        <GiftUnwrap gift={gift} />
      </section>
      <p className="preview-disclaimer">Esta é uma prévia local. Seu presente ainda não foi publicado.</p>
    </main>
  )
}

export default GiftPreview
