# AGENTS.md — Letter Web

Instruções para agentes de desenvolvimento assistido por IA (Codex e similares)
trabalhando neste repositório. Leia antes de alterar qualquer código.

## 1. Descrição e arquitetura

**Letter Web** é um aplicativo web full-stack para criar e compartilhar
presentes digitais interativos. O autor monta o presente em um editor visual
no navegador; ao publicar, o conteúdo é enviado como JSON ao backend, que gera
um slug único e devolve um link público (`/presente/{slug}`) válido por
48 horas. O destinatário abre o link e vê uma caixa de presente animada que,
ao ser aberta, revela o conteúdo.

Arquitetura em duas aplicações independentes (monorepo simples, sem Turborepo/Nx):

```
Navegador (React SPA, sem react-router)
   │  fetch JSON  (VITE_API_BASE_URL ou /api relativo)
   ▼
Backend Spring Boot (REST, porta 8080)
   │  JPA/Hibernate
   ▼
PostgreSQL (Neon em produção) — tabela `presents`
```

Fluxo de dados principal:

1. `App.jsx` decide a tela pela URL (`/presente/{slug}` → página pública;
   senão SPA interna: home → editor → preview → publish).
2. O rascunho do presente vive no `localStorage` (chave `letter-web-draft`),
   junto com histórico de undo/redo em memória (`App.jsx`).
3. `PublishPage.jsx` faz `POST /api/presentes` com o JSON do presente.
4. `GiftController` → `GiftService` valida (`elements` precisa ser lista),
   gera slug (UUID sem hífens), grava com `expires_at = now + 48h`.
5. `PublicGiftPage.jsx` faz `GET /api/presentes/{slug}` e renderiza
   `GiftUnwrap` (caixa 3D + efeito de abertura) e depois o conteúdo.

## 2. Tecnologias

### Frontend (`frontend/`)
- **React 19** + **Vite 8** (JavaScript, sem TypeScript).
- ESLint 10 (`eslint.config.js`), plugins react-hooks e react-refresh.
- Sem bibliotecas de UI/estado: tudo com hooks nativos (`useState`,
  `useRef`, `useEffect`).
- Imagens de adornos e menu em `src/assets` (usadas via `import`).

### Backend (`backend/`)
- **Java 21**, **Spring Boot 4.0.9** (parent), Maven Wrapper (`mvnw`).
- Módulos: `spring-boot-starter-webmvc`, `data-jpa`, `validation` (+ variantes
  `*test`).
- **Jackson 3** (pacote `tools.jackson.databind`) para manipular JSON —
  atenção: é o Jackson novo (`tools.jackson`), não o `com.fasterxml.jackson`.
- **PostgreSQL** (driver runtime), coluna `jsonb` mapeada com
  `@JdbcTypeCode(SqlTypes.JSON)` + `Jackson3JsonFormatMapper`.
- Esquema do banco criado por `spring.sql.init` a partir de
  `src/main/resources/publication-schema.sql` (`ddl-auto=none`).
- Dockerfile multi-stage (Temurin 21) preparado para Render.

### Infra/banco
- PostgreSQL (Neon em produção; `.neon` e `.env.local` na raiz — **não
  versionar nem expor essas credenciais**).
- Frontend hospedado em Vercel (`vercel.json` reescreve
  `/presente/:slug` → `/`).

## 3. Organização das pastas

```
Letter-Web/
├── PRD.md, AGENTS.md, README.md               # docs principais (raiz)
├── .neon, .env.local                          # segredos locais — NÃO versionados
├── backend/
│   ├── src/main/java/com/letterweb/
│   │   ├── LetterwebBackendApplication.java
│   │   ├── config/        # CORS, headers, Clock, ClientIpResolver, Jackson mapper
│   │   ├── controller/    # GiftController (/api/presentes), HealthController, ApiExceptionHandler
│   │   ├── dto/           # GiftResponse (record), ApiError
│   │   ├── entity/        # Gift (JPA, tabela `presents`)
│   │   ├── repository/    # GiftRepository
│   │   └── service/       # GiftService + exceções de domínio
│   ├── src/main/resources/  # application.properties, publication-schema.sql
│   ├── src/test/java/...    # testes unitários (GiftService, ClientIpResolver, etc.)
│   └── Dockerfile, pom.xml, mvnw*
└── frontend/
    ├── src/
    │   ├── App.jsx           # roteamento por estado + persistência/undo
    │   ├── components/       # uma tela/peça por arquivo:
    │   │   ├── HomePage.jsx, GiftEditor.jsx, GiftPreview.jsx, PublishPage.jsx,
    │   │   │   PublicGiftPage.jsx          # telas
    │   │   ├── GiftCanvas.jsx, GiftUnwrap.jsx, AdornmentLibrary.jsx,
    │   │   │   AdornmentIcons.jsx, InteractiveTutorial.jsx  # peças do editor/presente
    │   │   └── boxModels.js  # imagens dos modelos de caixa
    │   ├── utils/            # api.js (base URL), spotify.js (parser de links)
    │   └── assets/           # adorno/, menu/, imagens do tema
    └── vite.config.js (proxy /api → :8080), vercel.json, eslint.config.js
```

## 4. Padrões de código

- **Frontend**: JavaScript com JSX; componentes como funções; um componente
  principal exportado por arquivo (`export default`); strings e comentários em
  português; sem CSS-in-JS (use `App.css`/`index.css`); nomes de estado claros
  e imutabilidade preservada (crie novos objetos, não mute).
- **Backend**: Java 21 com TABULAÇÃO (o código existente usa tabs); camadas
  controller → service → repository; DTOs como `record` (`GiftResponse`);
  construtores por injeção (sem `@Autowired` em campo); exceções de domínio
  traduzidas em `ApiError` pelo `ApiExceptionHandler`; use `Clock` injetado
  para datas (não `Instant.now()` direto) para manter testabilidade.
- **Commits**: mensagens curtas e descritivas em português ou inglês, um tema
  por commit.

## 5. Cuidados ao modificar o frontend

- **Não trocar o mecanismo de rotas**: a navegação é por `state` em `App.jsx`
  e por regex em `window.location.pathname`; não instalar react-router
  impulsivamente — o rewrite do Vercel (`/presente/:slug`) depende disso.
- **Estrutura do presente é um contrato implícito**: `GiftEditor`, `App.jsx`
  (merge com `emptyGift`), `GiftCanvas`, `GiftUnwrap`, `PublishPage` e o
  backend (`elements` obrigatório) presumem o mesmo formato. Mudanças de
  campo precisam atualizar `emptyGift` e a migração em `readSavedGift`.
- **`localStorage` pode falhar** (quota, modo privado): mantenha o tratamento
  de erro de `saveGift` e a mensagem amigável.
- **Elementos do canvas têm posições/tamanhos em unidades próprias** (canvas
  de 630 px de largura); alterar geometria afeta preview, editor e página
  pública simultaneamente.
- **Imagens são embutidas em base64 no JSON**; não aumentar os limites de
  `readAndOptimizeImage` sem avaliar o tamanho do payload e a quota do
  localStorage.
- **Links do Spotify**: qualquer mudança em `utils/spotify.js` deve manter os
  três formatos aceitos (URL web, URI `spotify:`, iframe) e os cinco tipos
  (track/album/playlist/episode/show).
- **Mensagens de erro amigáveis**: ao consumir a API no frontend, trate respostas
  que **não são JSON** (ex.: 502 de um proxy) sem expor o texto técnico do
  navegador ao usuário — veja `publishGift` em `PublishPage.jsx`.
- Rode `npm run lint` após editar; é a única verificação automática do
  frontend (não há testes).

## 6. Cuidados ao modificar o backend

- **Contrato da API é estável e consumido pelo frontend**:
  `POST /api/presentes` (corpo = JSON do presente com `elements`) e
  `GET /api/presentes/{slug}`. Respostas em `GiftResponse` (slug, content,
  createdAt, expiresAt). Mudar algo aqui exige mudar o frontend no mesmo
  commit/PR.
- **Validação de publicação** (`GiftService.publish`): conteúdo nulo, vazio,
  não-objeto ou sem `elements` (lista) → `InvalidGiftException`. Preserve
  essas regras.
- **Expiração de 48 h**: `AVAILABILITY = Duration.ofHours(48)`; consultas
  públicas filtram por `expiresAtAfter`. Não remova esse filtro.
- **JSONB**: a entidade usa `tools.jackson.databind.JsonNode` (Jackson 3) com
  `Jackson3JsonFormatMapper` configurado em `application.properties`. Não
  misturar com `com.fasterxml.jackson`.
- **Schema do banco**: gerenciado por `publication-schema.sql`
  (`spring.sql.init.mode=always`, `ddl-auto=none`). Alterações de tabela
  devem ser idempotentes (`CREATE TABLE IF NOT EXISTS`) e refletidas nesse
  arquivo — não ativar `ddl-auto=update` em produção.
- **Configuração por variáveis de ambiente** (`DB_*`, `PORT`,
  `CORS_ALLOWED_ORIGINS`, `TRUSTED_PROXY_IPS`): nunca colocar credenciais no
  código. O perfil `dev` (`application-dev.properties`) é só para local.
- Rode `./mvnw test` após editar; há testes em
  `src/test/java/com/letterweb/...` (service, config, controller).

## 7. Comandos

### Frontend (dentro de `frontend/`)
```bash
npm install          # instalar dependências
npm run dev          # dev server Vite (proxy /api → http://localhost:8080)
npm run lint         # ESLint
npm run build        # build de produção (dist/)
npm run preview      # servir o build local
```

### Backend (dentro de `backend/`)
```bash
./mvnw test                          # testes (Windows: .\mvnw test)
./mvnw spring-boot:run               # rodar em :8080 (precisa DB_* configurado)
./mvnw clean package                 # build (target/*.jar)
```
- Para desenvolvimento local, configure um PostgreSQL e exporte
  `DB_HOST/DB_PORT/DB_NAME/DB_USERNAME/DB_PASSWORD` (veja `backend/.env.example`).
- O Spring aplica `publication-schema.sql` automaticamente no boot.

### Docker
```bash
docker build -t letterweb-backend ./backend
docker run -p 8080:8080 --env-file backend/.env letterweb-backend
```

## 8. Orientações para preservar funcionalidades existentes

1. **Análise antes de editar**: leia o arquivo inteiro que vai modificar e os
   arquivos que o consomem (ex.: mudou `Gift`? confira `GiftService`,
   `GiftResponse`, `publication-schema.sql`, `PublishPage.jsx`).
2. **Não quebre o formato do presente** (`title`, `recipient`, `background`,
   `backgroundImage`, `fontFamily`, `textColor`, `appearance`, `unwrapping`
   com model/boxColor/ribbonColor/bowColor/effect, `elements[]`, `music`).
   Novos campos devem ser opcionais e mesclados com os defaults em `App.jsx`.
3. **Mantenha mensagens e textos em português**, incluindo os estados de
   erro/sucesso exibidos ao usuário.
4. **Teste o fluxo completo** após mudanças: home → editor → preview →
   publicar → abrir o link gerado → abrir a caixa. Em dev, backend e frontend
   rodando juntos (proxy do Vite cuida do CORS).
5. **Não remova arquivos utilitários "mortos aparentes"** sem verificar
   referências (ex.: `boxModels.js`, `adornments.jsx`, `ClientIpResolver` —
   este último tem testes dedicados).
6. **Segurança**: nunca introduza segredos no frontend (`VITE_*` vão para o
   bundle); mantenha CORS por allowlist; mantenha o container como
   usuário não-root.
7. **Escopo**: evite adicionar dependências ou refactors amplos sem
   necessidade; o projeto é acadêmico e prioriza clareza e rastreabilidade
   das mudanças.
