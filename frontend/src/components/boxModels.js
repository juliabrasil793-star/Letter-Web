import azul from '../assets/azul.png'
import azulbolinha from '../assets/azulbolinha.png'
import rosa from '../assets/rosa.png'
import amarelo from '../assets/amarelo.png'
import verde from '../assets/verde.png'

// Modelos de caixa derivados das imagens disponíveis em src/assets.
// Os nomes das opções vêm dos próprios arquivos.
const boxModels = [
  { value: 'azul', label: 'Azul', image: azul },
  { value: 'azulbolinha', label: 'Azul com bolinhas', image: azulbolinha },
  { value: 'rosa', label: 'Rosa', image: rosa },
  { value: 'amarelo', label: 'Amarelo', image: amarelo },
  { value: 'verde', label: 'Verde', image: verde },
]

export const defaultBoxModel = 'rosa'

export function getBoxModel(value) {
  return boxModels.find((model) => model.value === value) || null
}

export function getBoxImage(value) {
  return getBoxModel(value)?.image || null
}

// Modelos antigos ('classic', 'pop', 'dream') não têm imagem própria;
// nesse caso a imagem é escolhida pela cor da caixa (fallback legado).
export function resolvePresentImage(value, fallback) {
  return getBoxImage(value) || fallback
}

export default boxModels
