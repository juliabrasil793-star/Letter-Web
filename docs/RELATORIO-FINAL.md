# Relatório Final — Letter Web

Trabalho acadêmico de **Desenvolvimento de Software Assistido por Inteligência
Artificial**.

> **Nota de honestidade:** este relatório distingue o que foi **executado e
> observado** do que foi apenas **lido no código**. Verificações que dependiam
> de banco de dados ou serviços externos estão marcadas como não executadas,
> com o motivo.

---

## 1. Nome e objetivo

**Letter Web** é uma aplicação web full-stack para criar, personalizar e
compartilhar **presentes digitais interativos**. O autor monta o presente em um
editor visual (texto, fotos, stickers, música e uma caixa de presente animada),
publica e recebe um link público (`/presente/{slug}`) válido por 48 horas; o
destinatário abre o link e vê a caixa se abrir com efeitos, revelando o
conteúdo — sem cadastro nem instalação.

## 2. Tecnologias utilizadas

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 19, Vite 8, JavaScript (sem TypeScript), ESLint 10, hooks nativos, sem react-router |
| Backend | Java 21, Spring Boot 4.0.9, Spring Web MVC, Spring Data JPA, Jackson 3 (`tools.jackson`), Maven Wrapper |
| Banco de dados | PostgreSQL com coluna `jsonb` (schema criado por `publication-schema.sql`, `ddl-auto=none`) |
| Infraestrutura | Docker multi-stage (Temurin 21, usuário não-root), `vercel.json` com rewrite de rota |

## 3. Funcionalidades efetivamente implementadas

Confirmadas no código:

1. Navegação home → editor → pré-visualização → publicação, por estado + URL.
2. Rascunho automático no `localStorage` com desfazer/refazer e "limpar".
3. Editor visual: elementos de texto, imagem, carrossel, sticker e música,
   com mover, redimensionar, seleção múltipla e camadas.
4. Personalização de estilo, caixa de presente (modelo e cores) e efeito de abertura.
5. Upload de imagens com otimização automática (até 1200 px, qualidade 0,85).
6. Música do Spotify por URL, URI ou iframe (track/album/playlist/episode/show).
7. Publicação (`POST /api/presentes`) com slug UUID de 32 caracteres.
8. Página pública com caixa animada e efeitos (confetes, corações, brilhos,
   pétalas, papel picado).
9. Expiração de 48 horas com filtro `expiresAtAfter` na consulta pública.
10. Compartilhamento via Web Share API com fallback de cópia.
11. Tutorial interativo de 11 etapas no editor.
12. Biblioteca com 40+ adornos (PNGs).
13. Health check em `GET /api/health`.

## 4. Como a IA foi utilizada no desenvolvimento

O projeto seguiu um fluxo **assistido por IA com revisão humana**, em etapas
registradas nesta conversa:

1. **Análise do código existente** — a IA leu todo o código real antes de
   escrever qualquer documento (frontend, backend, schema, testes).
2. **Documentação base** — geração de `PRD.md`, `AGENTS.md` e da Skill
   `desenvolver-funcionalidade` a partir do comportamento real do sistema.
3. **Revisão de exatidão** — a IA corrigiu os próprios documentos com base em
   verificação no código: endpoint real do health check (`/api/health`, e não
   `/health`), caminhos padronizados, remoção de uma alegação não comprovada de
   desempenho ("O(1)") e separação entre *infraestrutura configurada* e
   *deploy confirmado*.
4. **Planejamento** — `docs/plans/PLANO-INICIAL.md` com análise de requisitos,
   etapas, dependências, riscos e 5 decisões levadas para aprovação humana.
5. **Decisão conjunta sobre escopo** — as decisões foram resolvidas com
   recomendação + motivo + impacto, e o escopo essencial foi reduzido ao que
   contribui para a entrega.
6. **Verificação assistida** — a IA executou lint, build, testes do backend,
   subiu o build de produção num navegador headless, percorreu o fluxo completo
   tirando screenshots e **encontrou um bug real** corrigido nesta etapa.

O processo está documentado na Skill (`.agents/skills/desenvolver-funcionalidade/SKILL.md`),
que orienta o agente nas cinco etapas: análise → dúvidas → planejamento →
implementação → verificação.

## 5. Finalidade do PRD.md

Definir **o que** o sistema é e deve fazer: descrição, objetivo, público-alvo,
problema resolvido, 13 requisitos funcionais e 5 não funcionais (cada um com o
local aproximado de implementação), regras de negócio, critérios de aceitação
e o que está fora do escopo. Serve como fonte de verdade para conferir se o
código atende ao proposto.

## 6. Finalidade do AGENTS.md

Orientar **como** o trabalho deve ser feito: arquitetura e fluxo de dados,
tecnologias e versões, organização de pastas, padrões de código (JS imutável no
frontend, tabulação e camadas no backend), cuidados ao mexer em frontend e
backend (contratos que não podem quebrar), comandos de execução/teste/build e
regras de preservação de funcionalidades.

## 7. Finalidade da Skill

Padronizar o **processo** de desenvolvimento de qualquer funcionalidade, para
que a IA não saia codando sem entender o sistema. Ela obriga cinco etapas —
análise, levantamento de dúvidas/ambiguidades, planejamento, implementação e
verificação — com instruções concretas sobre os arquivos acoplados deste
projeto e a regra de **não declarar concluído sem evidência de teste**.

## 8. Como o planejamento foi utilizado

O `PLANO-INICIAL.md` serviu de guia real nesta etapa final:

- A **Etapa A** (higiene do repositório) foi a primeira verificada: todos os
  itens exigidos já estavam cobertos pelos `.gitignore` — nenhuma alteração
  foi necessária (ver seção 11).
- As etapas **B, C e D2** foram avaliadas e **não executadas**, conforme a
  decisão de escopo da seção 8.1 e a orientação de não adicionar melhorias
  opcionais. O estado do plano foi atualizado para refletir isso.
- A seção 9 do plano (escopo essencial) continua válida como roteiro de
  evolução para trabalhos futuros.

## 9. Testes e verificações executados

### 9.1 Automatizados (executados nesta etapa)

| Verificação | Comando | Resultado |
|-------------|---------|-----------|
| Lint do frontend | `npm run lint` (em `frontend/`) | ✅ Aprovado — 0 erros, 0 avisos |
| Build do frontend | `npm run build` (em `frontend/`) | ✅ Aprovado — 99 módulos, bundle JS 311 KB (94 KB gzip) |
| Testes do backend | `.\mvnw.cmd test` (em `backend/`) | ✅ Aprovado — **17 testes, 0 falhas, 0 erros, 0 ignorados** |

Detalhe dos testes do backend (relatórios do Surefire):

| Classe | Testes |
|--------|--------|
| `GiftServiceTests` | 5 |
| `ClientIpResolverTests` | 3 |
| `LetterwebBackendApplicationTests` (integração) | 7 |
| `HealthControllerTests` | 1 |
| `Jackson3JsonFormatMapperTests` | 1 |

Os testes de integração exercitaram, pelos logs, publicação com elegibilidade,
rejeição por CORS de origem não permitida, 404 para presente ausente,
400 para presente sem `elements` e 400 para corpo JSON malformado.

> Não existem testes automatizados no frontend (essa é a etapa B do plano,
> não executada).

### 9.2 Funcional (executado com navegador headless)

Foi servido o **build de produção** (`frontend/dist`) e percorrido o fluxo com
automação de navegador (Chromium headless), com captura de console, de
requisições e de screenshots lidos visualmente:

| Cenário | Resultado |
|---------|-----------|
| Home renderiza (título, chamadas, imagens) | ✅ 0 erros de console, 0 requisições falhas |
| "Criar meu presente" abre o editor com tutorial interativo | ✅ |
| Painéis Texto, Elementos (adornos) e Música abrem | ✅ |
| Adicionar título atualiza o rascunho no `localStorage` | ✅ `<1 elemento tipo text>` |
| Pré-visualização exibe a caixa de presente | ✅ |
| Abrir a caixa revela o conteúdo | ✅ (título e mensagem exibidos) |
| Publicação com API disponível → link `http://.../presente/{slug}` | ✅ Link gerado e mensagem de compartilhamento montada |
| Abrir o link público → caixa → conteúdo | ✅ |
| Slug inexistente → mensagem "Este presente não está mais disponível." | ✅ |
| Publicação sem backend → mensagem de erro amigável | ✅ (após correção, ver seção 11) |

### 9.3 Não executados (com motivo)

| Verificação | Motivo |
|-------------|--------|
| Fluxo contra o **backend real + PostgreSQL** | O PostgreSQL 17 local está em execução, mas a senha do usuário não está disponível no ambiente, então o backend não pôde iniciar. O fluxo funcional foi verificado com **frontend de produção real** e uma emulação temporária da API (mesmo contrato), fora do repositório. |
| Expiração de 48 h em tempo real | Não testável sem banco; coberta apenas por teste unitário (`GiftServiceTests` usa `Clock` fixo). |
| Web Share API nativa | Depende do dispositivo/sistema; no Chrome headless cai no fallback de cópia. O código do fallback foi lido, não exercitado. |
| Upload de imagem grande interativo | O código de otimização foi lido; não foi exercitado pela automação. |
| Deploy em produção (Render/Vercel) | Fora de escopo; não há evidência de deploy ativo. Não foi feito nenhum deploy. |

## 10. Resultados reais de lint, testes e build

- `npm run lint` → **exit 0**, sem mensagens.
- `npm run build` → **exit 0**, `built in 1.29s`, sem avisos de erro.
- `.\mvnw.cmd test` → **exit 0**, `Tests run: 17, Failures: 0, Errors: 0, Skipped: 0`.

Avisos não bloqueantes observados no backend: Mockito auto-attach (depreciação
futura do JDK) e Java HotSpot class-sharing. Não afetam a execução.

## 11. Problemas encontrados e correções realizadas

| # | Problema | Situação | Ação |
|---|----------|----------|------|
| 1 | **Mensagem técnica vazando ao usuário**: em `PublishPage.publishGift`, `await response.json()` quebrava quando a resposta não era JSON (ex.: 502 do proxy), exibindo ao usuário `Failed to execute 'json' on 'Response': Unexpected end of JSON input`. | **Confirmado no navegador** | Corrigido em `frontend/src/components/PublishPage.jsx`: leitura tolerante do corpo (`try/catch`) e mensagem amigável em português. Revalidado no navegador: agora exibe "Não foi possível publicar o presente. Tente novamente em instantes." |
| 2 | Sem README na raiz — quem clonasse o repositório não teria instruções de execução. | Confirmado | Criado `README.md` com visão geral, links da documentação, variáveis de ambiente e comandos de execução. |
| 3 | Documentos do plano com status desatualizado ("nenhuma etapa implementada"). | Confirmado | Status do `PLANO-INICIAL.md` atualizado para refletir a realidade. |
| 4 | Etapa A exigia regras de `.gitignore`; todas já existiam. | Verificado com `git check-ignore` | **Nenhuma alteração** — registrar em vez de duplicar regras. |

Nenhuma funcionalidade existente foi removida ou alterada em comportamento,
exceto a mensagem de erro do cenário de falha acima (que ficou mais clara).

## 12. Como executar localmente

Pré-requisitos: Node.js 20+, JDK 21 e PostgreSQL. Passo a passo completo em
[`README.md`](../README.md). Resumo:

```bash
# 1) Banco: definir DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD

# 2) Backend (http://localhost:8080)
cd backend
./mvnw spring-boot:run        # Windows: .\mvnw.cmd spring-boot:run

# 3) Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Verificações: `npm run lint`, `npm run build`, `.\mvnw.cmd test`.

## 13. Limitações conhecidas

1. **Frontend sem testes automatizados** — a verificação é o lint e o teste
   funcional manual (etapa B do plano, não executada).
2. **Sem limpeza de presentes expirados** — os registros permanecem no banco;
   apenas deixam de ser retornados pela API (etapa D1, opcional).
3. **Sem limite de tamanho do payload nem rate limit** — `POST /api/presentes`
   é público e sem proteção contra abuso (etapas D2/D3, opcionais).
4. **Imagens embutidas em base64** no JSON, o que pode esgotar a quota do
   `localStorage` em presentes muito grandes.
5. **Desempenho do banco não medido** — não há benchmark.
6. **Bundle do frontend pesado** por causa de imagens decorativas (o GIF de
   logo tem ~27 MB e a imagem `amarelo.png` ~2,7 MB), o que deixa o primeiro
   carregamento do editor lento (observado: 6–36 s em ambiente local).
7. **Credenciais locais do Neon** (`env.local`/`.neon`) existem na máquina; não
   são versionadas, mas recomenda-se rotação da senha por precaução.
8. **Deploy não confirmado** — todo o teste funcional foi em ambiente local.

---

*Relatório produzido após auditoria do código real, execução das verificações
disponíveis e verificação funcional em navegador headless. Os itens marcados
como não executados na seção 9.3 são limitações de ambiente, não resultados
inventados.*
