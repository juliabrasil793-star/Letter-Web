# PRD — Letter Web

## 1. Nome e descrição do sistema

**Letter Web** é uma aplicação web full-stack para criação, personalização e
compartilhamento de **presentes digitais interativos** (cartas virtuais
animadas). O usuário monta visualmente um presente — com texto, fotos,
stickers, música e uma "caixa de presente" 3D que é aberta pelo destinatário —
e publica um link único que pode ser enviado a outra pessoa, sem que a pessoa
que recebe precise criar conta.

O presente é persistido no backend como conteúdo JSON e acessado por uma URL
do tipo `/presente/{slug}` por até **48 horas** após a publicação.

## 2. Objetivo

Permitir que qualquer pessoa crie, de forma simples e visual, um presente
digital personalizado e o compartilhe por link, proporcionando ao destinatário
uma experiência de "desembrulhar" um presente (caixa com laço, efeito ao
abrir, música) diretamente no navegador.

## 3. Público-alvo

- Pessoas físicas que desejam enviar mensagens afetivas (aniversários,
  datas comemorativas, agradecimentos).
- Destinatários desses presentes, que só precisam abrir um link (sem cadastro,
  sem instalação de aplicativo).
- Equipe acadêmica/desenvolvedores que mantêm e evoluem o projeto.

## 4. Problema que resolve

Mensagens digitais comuns (WhatsApp, e-mail) são planas e pouco emocionantes.
Letter Web resolve isso oferecendo:

- Um **editor visual** (tipo canvas) para montar o presente sem programar.
- Uma **experiência de desembrulho** (caixa de presente animada com efeitos),
  que torna a entrega da mensagem um momento.
- **Compartilhamento sem atrito**: um link com prazo de validade, sem conta
  nem login, para quem recebe.

## 5. Requisitos funcionais (implementados)

| ID | Requisito | Onde está implementado |
|----|-----------|------------------------|
| RF01 | **Navegação por páginas**: home → editor → preview → publicação; página pública do presente via URL `/presente/{slug}` (rotas resolvidas por `window.location.pathname`, sem react-router). | `frontend/src/App.jsx`, `frontend/src/components/HomePage.jsx`, `frontend/src/components/GiftPreview.jsx`, `frontend/src/components/PublicGiftPage.jsx`, `frontend/vercel.json` (rewrite da rota) |
| RF02 | **Rascunho automático e histórico**: o presente em edição é salvo automaticamente no `localStorage` (chave `letter-web-draft`) e o editor oferece **desfazer/refazer** (limite de 50 estados, agrupando edições em 500 ms) e **limpar** o rascunho. | `App.jsx` (`saveGift`, `updateGift`, `undoGift`, `redoGift`, `resetGift`) |
| RF03 | **Editor visual de elementos**: adicionar, mover, redimensionar (alças nw/ne/sw/se), editar e excluir elementos sobre um canvas de 630 px de largura, com seleção múltipla e movimentação em grupo. Tipos de elemento: texto (título/subtítulo/parágrafo), imagem, carrossel de fotos, sticker/adorno, player de música (Spotify embed). | `frontend/src/components/GiftEditor.jsx`, `frontend/src/components/GiftCanvas.jsx`, `frontend/src/components/AdornmentLibrary.jsx`, `frontend/src/components/AdornmentIcons.jsx` |
| RF04 | **Personalização de estilo**: cor de fundo, imagem de fundo, fonte (4 opções), cor do texto e aparência do cartão; definição da caixa de presente (modelo `classic`, cores de caixa/laço/lacinho). | `frontend/src/components/GiftEditor.jsx` (categorias "Estilo do presente", "Elementos"), `frontend/src/components/GiftCanvas.jsx`, `frontend/src/components/boxModels.js` |
| RF05 | **Upload e otimização de imagens**: upload local de imagens com redimensionamento automático (máx. 1200×1200, qualidade 0,85, conversão PNG→JPEG quando aplicável) para manter o rascunho leve no `localStorage`; suporte a bordas de foto configuráveis e carrossel de fotos. | `frontend/src/components/GiftEditor.jsx` (`readAndOptimizeImage`, `PhotoBorderControls`), `frontend/src/components/GiftCanvas.jsx` (`PhotoCarousel`) |
| RF06 | **Música do Spotify**: o usuário cola URL, URI ou iframe do Spotify; o sistema extrai e converte para a URL de embed oficial, suportando track, album, playlist, episode e show. | `frontend/src/utils/spotify.js` (`parseSpotifyUrl`) |
| RF07 | **Publicação do presente**: envio do conteúdo JSON ao backend `POST /api/presentes`, que gera um `slug` único de 32 caracteres (UUID sem hífens) e retorna o link público `https://<origem>/presente/{slug}`. | `frontend/src/components/PublishPage.jsx`, `backend/src/main/java/com/letterweb/controller/GiftController.java`, `backend/src/main/java/com/letterweb/service/GiftService.java` |
| RF08 | **Página pública do presente**: o destinatário abre o link e o frontend busca `GET /api/presentes/{slug}`; o presente é exibido com a **animação de desembrulho** (caixa, laço e efeito de abertura: confetes, corações, brilhos, pétalas ou papel picado) e depois o conteúdo. | `frontend/src/components/PublicGiftPage.jsx`, `frontend/src/components/GiftUnwrap.jsx` |
| RF09 | **Expiração do presente**: o backend grava `created_at` e `expires_at` (48 h) e só retorna presentes não expirados (`findBySlugAndExpiresAtAfter`); presente inexistente ou expirado retorna erro tratado (HTTP 404). | `backend/src/main/java/com/letterweb/service/GiftService.java`, `backend/src/main/java/com/letterweb/repository/GiftRepository.java`, `backend/src/main/java/com/letterweb/controller/ApiExceptionHandler.java` |
| RF10 | **Compartilhamento**: botão de compartilhar usando a Web Share API nativa quando disponível, com *fallback* de copiar a mensagem completa (link + texto) para a área de transferência; botão separado para copiar apenas o link. | `frontend/src/components/PublishPage.jsx` (`handleShare`, `copyFullMessage`, `copyLink`) |
| RF10b | **Tratamento de falha da API na publicação**: se a resposta não for JSON ou indicar erro, o usuário recebe mensagem amigável em português (sem texto técnico). | `frontend/src/components/PublishPage.jsx` (`publishGift`) |
| RF11 | **Tutorial interativo no editor**: passo a passo guiado (overlay com destaque de elementos) que orienta o uso do editor e permite pular direto para uma categoria. | `frontend/src/components/InteractiveTutorial.jsx` |
| RF12 | **Biblioteca de adornos**: catálogo de stickers (roses, laços, borboletas, estrelas, bolo, etc.) em `frontend/src/assets/adornos`, inseríveis no canvas. | `frontend/src/components/AdornmentLibrary.jsx`, `frontend/src/components/AdornmentIcons.jsx` |
| RF13 | **Health check**: endpoint `GET /api/health` (responde `{ "status": "ok" }`, sem expor informações internas) para verificação de disponibilidade do backend. | `backend/src/main/java/com/letterweb/controller/HealthController.java` |

## 6. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| RNF01 | **Usabilidade**: interface em português, com tutorial interativo e estados de erro amigáveis (ex.: falha de conexão, rascunho não salvo). |
| RNF02 | **Desempenho**: otimização automática de imagens no cliente (limites de 1200 px / ~400 KB) para manter o rascunho e o payload de publicação leves; a consulta pública é feita pelo `slug`, que é a chave primária da tabela `presents` (o banco cria um índice de chave primária; a performance real não foi medida neste projeto). |
| RNF03 | **Segurança**: cabeçalhos de segurança configurados (`SecurityHeadersConfiguration`), CORS restrito a origens configuradas por variável de ambiente (`CORS_ALLOWED_ORIGINS`), resolução de IP de cliente com proxies confiáveis (`TRUSTED_PROXY_IPS`), container roda com usuário não-root; segredos apenas por variáveis de ambiente (nunca em `VITE_*`). |
| RNF04 | **Portabilidade/implantação**: backend empacotado em Docker multi-stage (Java 21 / Temurin) configurado para Render; frontend configurado para Vercel (reescrita da rota `/presente/:slug` em `frontend/vercel.json`); banco PostgreSQL gerenciado (Neon, credenciais em `.neon`/`.env.local` na raiz). *Nota*: isso é infraestrutura **configurada** no repositório; nenhum deploy foi confirmado pela análise do código. |
| RNF05 | **Manutenibilidade**: código organizado em camadas no backend (controller/service/repository/entity/dto/config), componentes React por tela, testes unitários no backend (`GiftServiceTests`, `ClientIpResolverTests`, `HealthControllerTests`, etc.) e lint no frontend (ESLint). |

## 7. Regras de negócio

1. **Validade de 48 horas**: todo presente publicado expira 48 horas após a
   criação; expirados deixam de ser acessíveis pela API (o registro permanece
   no banco; não há limpeza automática implementada).
2. **Formato do conteúdo**: só é aceito um objeto JSON que contenha a chave
   `elements` como lista; caso contrário a publicação falha com erro 400
   (`InvalidGiftException`).
3. **Slug único**: o identificador público é gerado no servidor a partir de um
   UUID (32 caracteres alfanuméricos); o cliente não escolhe o slug.
4. **Sem autenticação**: não há login; a publicação e a visualização são
   públicas. Quem tem o link vê o presente.
5. **Rascunho local**: o rascunho vive apenas no navegador do autor
   (`localStorage`); o servidor não guarda rascunhos.
6. **Música apenas via Spotify embed**: somente links/URIs/iframes válidos do
   Spotify são aceitos, convertidos para `https://open.spotify.com/embed/...`.
7. **Erros padronizados**: falhas da API retornam um objeto `ApiError`
   (mensagem amigável em português) tratado pelo `ApiExceptionHandler`; o
   frontend também trata respostas que não são JSON (ex.: 502 de proxy) com
   mensagem amigável, sem exibir texto técnico ao usuário.

## 8. Critérios de aceitação

- **Publicar**: dado um presente válido no editor, ao clicar em publicar o
  sistema exibe um link do formato `<origem>/presente/{slug}` e permite
  copiá-lo ou compartilhá-lo via Web Share API.
- **Abrir link válido**: ao acessar `/presente/{slug}` de um presente não
  expirado, o destinatário vê a caixa de presente, consegue abrir com o efeito
  escolhido pelo autor e então visualiza título, textos, fotos, stickers e
  música.
- **Link expirado ou inexistente**: ao acessar um slug inexistente ou expirado
  (mais de 48 h), o usuário recebe uma mensagem clara de que o presente não
  está disponível (não vê dados parciais).
- **Conteúdo inválido**: um POST sem `elements` (lista) retorna 400 com
  mensagem amigável e não cria registro.
- **Persistência do rascunho**: recarregar a página durante a edição mantém o
  presente em edição; desfazer/refazer funcionam com o histórico limitado a 50
  estados; "limpar" restaura o presente vazio.
- **Upload de imagem grande**: uma foto maior que 1200 px é redimensionada
  automaticamente sem travar o editor.
- **Música**: colar URL, URI ou iframe de Spotify (track/album/playlist/
  episode/show) resulta em um player de embed funcional no presente.

## 9. Escopo fora da versão atual (melhorias futuras — não implementado)

- Conta de usuário, histórico dos presentes publicados pelo autor e edição de
  presentes já publicados.
- Exclusão manual de presentes e limpeza automática de expirados no banco.
- Upload de imagens para o servidor (hoje as imagens vão embutidas em base64
  dentro do JSON).
- Rastreamento de visualizações (quantas pessoas abriram o presente).
- Internacionalização da interface.
