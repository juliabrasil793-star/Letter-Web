import logoGif from '../assets/Pink and Yellow Retro Y2K Beauty Store Animated Logo (2).gif'
import imgNote from '../assets/adornos/note.png'
import imgStars from '../assets/adornos/stars (1).png'
import imgBow from '../assets/adornos/bow.png'
import imgPhoto from '../assets/adornos/photo.png'
import imgDaisy from '../assets/adornos/daisy-flower.png'
import imgButterflies from '../assets/adornos/butterflies.png'
import imgSun from '../assets/adornos/sun.png'
import imgSakura from '../assets/adornos/sakura.png'
import imgShining from '../assets/adornos/shining.png'

const steps = [
  { number: '01', icon: imgNote, title: 'Comece do zero', text: 'Escolha as cores e imagine o clima do seu presente.' },
  { number: '02', icon: imgStars, title: 'Monte do seu jeito', text: 'Junte fotos, palavras, música e pequenos detalhes.' },
  { number: '03', icon: imgBow, title: 'Compartilhe carinho', text: 'Veja como ficou e publique um link para compartilhar.' },
]

const possibilities = [
  { icon: imgPhoto, title: 'Fotos que contam', color: 'mint' },
  { icon: imgNote, title: 'Palavras suas', color: 'pink' },
  { icon: imgDaisy, title: 'Cores e formas', color: 'lilac' },
  { icon: imgButterflies, title: 'Uma trilha sonora', color: 'yellow' },
]

function HomePage({ onCreate }) {
  return (
    <main className="home-page">
      <header className="site-header">
        <a className="brand-link" href="#inicio" aria-label="Letter Web — início">
          <img className="brand-logo" src={logoGif} alt="Letter Web" />
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#possibilidades">O que criar</a>
        </nav>
        <button className="button button-outline header-cta" onClick={onCreate}>
          Começar agora <span aria-hidden="true">↗</span>
        </button>
      </header>

      <section className="hero-section" id="inicio">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-star">✳</span> UM PEDACINHO SEU, EM FORMA DE PRESENTE</span>
          <h1>Carinho não vem pronto.<br /><span>Você inventa.</span></h1>
          <p>Crie um presente digital do seu jeitinho: com fotos, palavras, cores e aquela música que só vocês entendem.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={onCreate}>
              Criar meu presente <span aria-hidden="true">→</span>
            </button>
            <a className="text-link" href="#como-funciona">Descobrir como funciona <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-note"><span>✦</span> Grátis para criar. Feito com afeto.</div>
        </div>
        <div className="hero-art" aria-hidden="true">
        <div className="art-sun"><img src={imgSun} alt="" draggable="false" /></div>
        <div className="art-note art-note-one">feito<br />por você</div>
        <div className="art-card">
            <div className="art-card-top"><span>PARA ALGUÉM ESPECIAL</span><img className="art-card-star" src={imgShining} alt="" draggable="false" /></div>
            <div className="art-photo"><img className="art-photo-img" src={imgPhoto} alt="" draggable="false" /><i>um dia<br />bem nosso</i></div>
            <p>Você deixa<br />tudo mais <em>bonito.</em></p>
            <div className="art-card-bottom"><span>COM AMOR, SEMPRE</span><span>♡</span></div>
        </div>
        <div className="art-sticker art-sticker-heart"><img src={imgBow} alt="" draggable="false" /></div>
        <div className="art-sticker art-sticker-flower"><img src={imgSakura} alt="" draggable="false" /></div>
        <div className="art-note art-note-two">100%<br />original</div>
        <div className="art-doodle"><img src={imgShining} alt="" draggable="false" /></div>
        </div>
        <div className="hero-stamp" aria-hidden="true">feito<br />à mão<br /><span>♡</span></div>
      </section>

      <div className="ticker" aria-label="Seu presente, suas regras">
        <div>SEU PRESENTE, SUAS REGRAS <span>✳</span> UM MUNDO DE POSSIBILIDADES <span>✳</span> FEITO COM CARINHO <span>✳</span> SEM MODELOS PRONTOS <span>✳</span></div>
      </div>

      <section className="how-section section-wrap" id="como-funciona">
        <div className="section-heading">
          <span className="eyebrow">FÁCIL DE COMEÇAR, IMPOSSÍVEL DE COPIAR</span>
          <h2>Do primeiro rabisco<br />ao <span>“não acredito!”</span></h2>
          <p>Sem modelos prontos. Sem regras. Só você criando algo que tem a cara de alguém especial.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <span className="step-icon"><img src={step.icon} alt="" draggable="false" /></span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="possibilities-section" id="possibilidades">
        <div className="possibilities-inner section-wrap">
          <div className="possibilities-copy">
            <span className="eyebrow">A IMAGINAÇÃO É A FERRAMENTA</span>
            <h2>Não tem certo.<br /><span>Tem a sua cara.</span></h2>
            <p>Uma colagem meio tortinha? Uma carta cheia de fotos? Uma playlist com uma mensagem? Você escolhe cada pedacinho.</p>
            <button className="button button-dark" onClick={onCreate}>Quero criar <span aria-hidden="true">↗</span></button>
          </div>
          <div className="possibilities-grid">
            {possibilities.map((item) => (
              <div className={`possibility-card ${item.color}`} key={item.title}>
                <span><img src={item.icon} alt="" draggable="false" /></span><strong>{item.title}</strong>
              </div>
            ))}
            <div className="possibility-aside">misture tudo.<br />invente mais. <span>✳</span></div>
          </div>
        </div>
      </section>

      <section className="closing-section">
        <span className="closing-sparkle" aria-hidden="true"><img src={imgShining} alt="" draggable="false" /></span>
        <p>Tem alguém que merece<br /><span>um presente seu?</span></p>
        <button className="button button-dark" onClick={onCreate}>Criar meu presente <span aria-hidden="true">→</span></button>
      </section>

      <footer className="site-footer">
        <a className="brand-link footer-brand" href="#inicio" aria-label="Letter Web — início">
          <img className="brand-logo" src={logoGif} alt="Letter Web" />
        </a>
        <p>Feito com carinho, para espalhar carinho.</p>
        <span className="footer-sparkle"><img src={imgStars} alt="" draggable="false" /></span>
      </footer>
    </main>
  )
}

export default HomePage
