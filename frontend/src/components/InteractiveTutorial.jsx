import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const TUTORIAL_STEPS = [
  {
    target: 'canvas',
    title: 'Área do Presente',
    description: 'Aqui você monta o presente e já vê o resultado em tempo real. Clique em um elemento para selecioná-lo e use as alças para arrastar, girar ou redimensionar. Nada é publicado ainda: tudo o que fizer aqui fica salvo como rascunho automático no seu navegador.',
  },
  {
    target: 'nav-style',
    category: 'style',
    title: 'Estilo & Caixa de Presente',
    description: 'Defina o título, o nome do destinatário e a cor de fundo da página. Escolha o estilo da página (suave ou clean), o modelo da caixinha, as cores da fita e do laço, e o efeito de abertura: confetes, corações, brilhos ou pétalas que voam quando a pessoa abrir o presente.',
  },
  {
    target: 'nav-text',
    category: 'text',
    title: 'Adicionar Textos',
    description: 'Adicione caixas de texto de três tipos: Título (H1), Subtítulo (H2) e Parágrafo (¶). Cada tipo já nasce com um tamanho adequado, e você pode mudar fonte, cor, tamanho e alinhamento no painel lateral. O texto adicionado aparece na área do presente, pronto para arrastar.',
  },
  {
    target: 'nav-uploads',
    category: 'uploads',
    title: 'Fotos & Carrossel',
    description: 'Envie fotos do seu computador: uma imagem solta, uma foto de fundo para a página inteira, ou várias fotos juntas formando um carrossel navegável. No painel de propriedades, um carrossel permite reordenar as fotos com as setas ↑ ↓ e remover alguma com ×.',
  },
  {
    target: 'nav-music',
    category: 'music',
    title: 'Música do Spotify',
    description: 'Dê uma trilha sonora ao seu presente! Cole o link de uma música, álbum ou playlist do Spotify para tocar diretamente na página do presente. Só é possível uma música por presente — colar outro link substitui a atual.',
  },
  {
    target: 'nav-elements',
    category: 'elements',
    title: 'Biblioteca de Adornos',
    description: 'Decore com corações, estrelas, laços e outros adornos fofos. Clique em um adorno para adicioná-lo e alterne entre os estilos colorido ou monocromático no painel lateral para combinar com o seu tema.',
  },
  {
    target: 'nav-layers',
    category: 'layers',
    title: 'Gerenciador de Camadas',
    description: 'Lista todos os itens da página, numerados. Útil quando um elemento fica escondido atrás de outro: clique na camada na lista e o elemento correspondente é selecionado no presente, pronto para ser movido ou editado.',
  },
  {
    target: 'history-actions',
    title: 'Desfazer, Refazer e Limpar',
    description: 'Experimente sem medo! As setas no topo desfazem e refazem qualquer alteração. Ao lado fica o botão "Limpar projeto": ele apaga tudo (textos, fotos, música, fundo e adornos) e recomeça do zero — ele pede confirmação antes, então nada é perdido por engano.',
  },
  {
    target: 'preview-button',
    title: 'Pré-visualizar',
    description: 'O botão "Pré-visualizar" (no topo, ao lado de Continuar) mostra exatamente como o destinatário vai abrir o presente: a caixinha, o efeito de abertura e a página montada. Use-o antes de publicar para conferir se textos, fotos, música e posições estão do jeito que você quer.',
  },
  {
    target: 'publish-button',
    title: 'Publicar o Presente',
    description: 'Quando estiver tudo pronto, clique em "Continuar": você confere um resumo final do presente e clica em "Publicar presente" para gerar um link seguro. A partir daí o link já pode ser enviado para a pessoa especial — e continua editável enquanto você quiser.',
  },
  {
    target: 'canvas',
    title: '✨ Dica final: o segredo do duplo clique',
    description: 'Quer editar algo que já está no presente? Dê dois cliques sobre o elemento: um texto abre a edição direto, uma foto ou carrossel abre as opções de foto, um adorno troca de modelo e a música abre a janela de link. Um clique seleciona, dois cliques editam — simples assim!',
  },
]

function findVisibleElement(targetName) {
  const elements = Array.from(document.querySelectorAll(`[data-tour="${targetName}"]`))
  for (const element of elements) {
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0 && element.offsetParent !== null) {
      return element
    }
  }
  return elements[0] || null
}

function calculateCardPosition(targetRect) {
  if (!targetRect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const cardWidth = Math.min(330, window.innerWidth - 24)
  const cardHeight = 220
  const padding = 14
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const spaceBelow = viewportHeight - targetRect.bottom
  const spaceAbove = targetRect.top
  const spaceRight = viewportWidth - targetRect.right

  let top
  let left

  if (targetRect.left < 160 && spaceRight > cardWidth + 20) {
    left = targetRect.right + padding
    top = Math.max(16, Math.min(viewportHeight - cardHeight - 16, targetRect.top - 10))
  } else if (targetRect.top < 100 && spaceBelow > cardHeight + 20) {
    top = targetRect.bottom + padding
    left = Math.max(12, Math.min(viewportWidth - cardWidth - 12, targetRect.left + (targetRect.width - cardWidth) / 2))
  } else if (spaceBelow >= cardHeight + padding) {
    top = targetRect.bottom + padding
    left = Math.max(12, Math.min(viewportWidth - cardWidth - 12, targetRect.left + (targetRect.width - cardWidth) / 2))
  } else if (spaceAbove >= cardHeight + padding) {
    top = targetRect.top - cardHeight - padding
    left = Math.max(12, Math.min(viewportWidth - cardWidth - 12, targetRect.left + (targetRect.width - cardWidth) / 2))
  } else {
    top = Math.max(16, viewportHeight - cardHeight - 24)
    left = Math.max(12, (viewportWidth - cardWidth) / 2)
  }

  return {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${cardWidth}px`,
  }
}

function InteractiveTutorial({ isOpen, onClose, onSelectCategory }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [isFinished, setIsFinished] = useState(false)
  const cardRef = useRef(null)

  const step = TUTORIAL_STEPS[currentStep]
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1

  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !step) return
    const element = findVisibleElement(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect({
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        bottom: Math.round(rect.bottom),
        right: Math.round(rect.right),
      })
    } else {
      setTargetRect(null)
    }
  }, [isOpen, step])

  const handleNext = useCallback(() => {
    if (isLastStep) {
      setIsFinished(true)
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }, [isLastStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    try {
      localStorage.setItem('letterweb_tutorial_seen', 'true')
    } catch {
      // Ignorar indisponibilidade de localStorage
    }
    onClose()
  }, [onClose])

  const handleFinish = useCallback(() => {
    try {
      localStorage.setItem('letterweb_tutorial_seen', 'true')
    } catch {
      // Ignorar indisponibilidade de localStorage
    }
    setIsFinished(false)
    setCurrentStep(0)
    onClose()
  }, [onClose])

  // When step changes, open corresponding category if applicable
  useEffect(() => {
    if (!isOpen) return
    if (step?.category && onSelectCategory) {
      onSelectCategory(step.category)
    }
  }, [isOpen, step, onSelectCategory])

  // Track window resizing, scroll, and orientation change
  useLayoutEffect(() => {
    if (!isOpen) return
    const frame = requestAnimationFrame(() => {
      updateTargetPosition()
    })

    window.addEventListener('resize', updateTargetPosition)
    window.addEventListener('scroll', updateTargetPosition, true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateTargetPosition)
      window.removeEventListener('scroll', updateTargetPosition, true)
    }
  }, [isOpen, updateTargetPosition])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleSkip()
      } else if (event.key === 'ArrowRight' && !isLastStep) {
        handleNext()
      } else if (event.key === 'ArrowLeft' && currentStep > 0) {
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStep, isLastStep, handleNext, handlePrev, handleSkip])

  if (!isOpen) return null

  const spotlightPadding = 6
  const spotlightX = targetRect ? Math.max(0, targetRect.left - spotlightPadding) : 0
  const spotlightY = targetRect ? Math.max(0, targetRect.top - spotlightPadding) : 0
  const spotlightW = targetRect ? targetRect.width + spotlightPadding * 2 : 0
  const spotlightH = targetRect ? targetRect.height + spotlightPadding * 2 : 0

  return (
    <div className="interactive-tutorial-overlay" role="dialog" aria-modal="true" aria-label="Tutorial do Letter Web">
      {/* SVG backdrop mask with cutout spotlight hole */}
      <svg className="tutorial-svg-mask" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={spotlightX}
                y={spotlightY}
                width={spotlightW}
                height={spotlightH}
                rx="10"
                ry="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(24, 16, 22, 0.72)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Glowing spotlight border around active element */}
      {targetRect && (
        <div
          className="tutorial-spotlight-ring"
          style={{
            top: `${spotlightY}px`,
            left: `${spotlightX}px`,
            width: `${spotlightW}px`,
            height: `${spotlightH}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Floating explanation card or completion dialog */}
      {!isFinished ? (
        <div
          ref={cardRef}
          className="tutorial-card"
          style={calculateCardPosition(targetRect)}
        >
          <header className="tutorial-card-header">
            <span className="tutorial-step-badge">
              Etapa {currentStep + 1} de {TUTORIAL_STEPS.length}
            </span>
            <button
              type="button"
              className="tutorial-close-btn"
              onClick={handleSkip}
              title="Pular tutorial"
              aria-label="Pular tutorial"
            >
              ✕
            </button>
          </header>

          <div className="tutorial-card-body">
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>

          <footer className="tutorial-card-footer">
            <button
              type="button"
              className="tutorial-link-btn"
              onClick={handleSkip}
            >
              Pular
            </button>
            <div className="tutorial-nav-buttons">
              <button
                type="button"
                className="button button-outline tutorial-btn-prev"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                ← Voltar
              </button>
              <button
                type="button"
                className="button button-primary tutorial-btn-next"
                onClick={handleNext}
              >
                {isLastStep ? 'Concluir ♡' : 'Próximo →'}
              </button>
            </div>
          </footer>
        </div>
      ) : (
        <div className="tutorial-finished-card" role="alertdialog">
          <span className="tutorial-celebrate-sparkle" aria-hidden="true">✨</span>
          <h2>Tudo pronto para criar!</h2>
          <p>
            Agora que você já conhece as ferramentas do Letter Web, solte sua imaginação e crie um presente digital inesquecível!
          </p>
          <button
            type="button"
            className="button button-primary tutorial-finish-button"
            onClick={handleFinish}
          >
            Começar a criar agora ♡
          </button>
        </div>
      )}
    </div>
  )
}

export default InteractiveTutorial