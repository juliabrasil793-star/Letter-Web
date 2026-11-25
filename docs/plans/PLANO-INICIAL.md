# Plano Inicial de Desenvolvimento — Letter Web

> **Status: CONCLUÍDO (com etapas opcionais não executadas).** Revisão da
> seção 8 concluída; ver histórico de decisões na seção 8.1. A Etapa A foi
> verificada sem necessidade de alteração; a Etapa B (Vitest) e as etapas C/D2
> **não foram implementadas** — decisão de escopo para a entrega acadêmica
> (ver `docs/RELATORIO-FINAL.md`, seção 11).

Documento base: `PRD.md` (requisitos), `AGENTS.md` (arquitetura e padrões),
`.agents/skills/desenvolver-funcionalidade/SKILL.md` (processo de desenvolvimento).

---

## 1. Análise dos requisitos do PRD

### 1.1 Requisitos funcionais já implementados (confirmados no código)

| Requisito | Situação | Observações de verificação |
|-----------|----------|---------------------------|
| RF01 — Navegação por páginas + `/presente/{slug}` | ✅ Implementado | Roteamento por `state` em `App.jsx` e regex em `readPublicSlug`; rewrite no `frontend/vercel.json` |
| RF02 — Rascunho automático + undo/redo | ✅ Implementado | `App.jsx`: `localStorage` (`letter-web-draft`), histórico de 50 estados, agrupamento de 500 ms |
| RF03 — Editor visual de elementos | ✅ Implementado | `GiftEditor.jsx` (~1150 linhas) + `GiftCanvas.jsx` (~600+ linhas), seleção múltipla, redimensionamento |
| RF04 — Personalização de estilo | ✅ Implementado | Cores, fundo, fontes, cores da caixa/laço/lacinho, modelos em `boxModels.js` |
| RF05 — Upload e otimização de imagens | ✅ Implementado | `readAndOptimizeImage` (1200 px / qualidade 0,85), bordas de foto, carrossel |
| RF06 — Música do Spotify | ✅ Implementado | `utils/spotify.js`: 3 formatos (URL, URI, iframe) × 5 tipos |
| RF07 — Publicação | ✅ Implementado | `POST /api/presentes`, slug UUID de 32 chars gerado no backend |
| RF08 — Página pública + desembrulho | ✅ Implementado | `GET /api/presentes/{slug}`, `GiftUnwrap.jsx` com 5 efeitos + "nenhum" |
| RF09 — Expiração de 48 h | ✅ Implementado | `findBySlugAndExpiresAtAfter`; 404 via `GiftNotFoundException` |
| RF10 — Compartilhamento | ✅ Implementado | Web Share API + fallback de cópia em `PublishPage.jsx` |
| RF11 — Tutorial interativo | ✅ Implementado | `InteractiveTutorial.jsx` (~350 linhas) |
| RF12 — Biblioteca de adornos | ✅ Implementado | 40+ PNGs em `frontend/src/assets/adornos` |
| RF13 — Health check | ✅ Implementado | `GET /api/health` (`HealthController.java`) — caminho corrigido no PRD |

### 1.2 Requisitos não funcionais

| Requisito | Situação | Observações |
|-----------|----------|-------------|
| RNF01 — Usabilidade | ✅ Implementado | Textos em português, estados de erro amigáveis |
| RNF02 — Desempenho | ⚠️ Parcial | Otimização de imagens implementada; **desempenho do banco não medido** (sem índice adicional além da PK, sem benchmark) |
| RNF03 — Segurança | ✅ Configurado | Headers, CORS por allowlist, proxies confiáveis, container não-root; **não auditado em runtime** |
| RNF04 — Portabilidade/implantação | ⚠️ Configurado, **deploy não confirmado** | Dockerfile e `vercel.json` existem; não há evidência no repositório de deploy ativo |
| RNF05 — Manutenibilidade | ✅ Implementado | Camadas no backend, testes unitários (`GiftServiceTests`, `ClientIpResolverTests`, `HealthControllerTests`, `Jackson3JsonFormatMapperTests`), lint no frontend; **frontend sem testes automatizados** |

### 1.3 Lacunas e riscos identificados no estado atual

1. **Sem testes no frontend** — única verificação é `npm run lint`.
2. **Sem limpeza de registros expirados** — a tabela `presents` cresce indefinidamente.
3. **Payloads grandes em base64** — imagens embutidas no JSON podem se aproximar do limite do `jsonb`/do payload HTTP e da quota do `localStorage`.
4. **Sem rate limit/abuse control** — `POST /api/presentes` é público; qualquer cliente pode gerar registros sem limite.
5. **Credenciais do Neon em `.env.local`** na raiz (fora do git, mas sensível).
6. **Sem medição de performance** — RNF02 afirma leitura por PK, mas não há evidência de medição.
7. **Arquivos residuais** no backend (`hs_err_pid*.log`, `replay_pid*.log`, `psqlout.txt`) que não devem ser versionados.

## 2. Proposta de etapas de desenvolvimento

Ordem sugerida (cada etapa é independente e passível de aprovação separada).
Nenhuma etapa altera contratos de API existentes sem alterar o frontend no
mesmo conjunto de mudanças (regra do `AGENTS.md`).

### Etapa A — Higiene do repositório (baixo risco)
- Adicionar ao `.gitignore` (raiz e backend): `hs_err_pid*.log`,
  `replay_pid*.log`, `psqlout.txt`, `target/`, `dist/`, `.env.local`, `.neon`.
- Revisar `.env.example` do backend/frontend (já ok, apenas conferir).
- **Arquivos afetados**: `.gitignore` (raiz), `backend/.gitignore`,
  `frontend/.gitignore`.
- **Verificação**: `git status` não mostra logs nem segredos.

### Etapa B — Cobertura de testes no frontend (médio risco, alto valor acadêmico)
- Propor infraestrutura de testes (ex.: Vitest + React Testing Library) —
  **requer nova dependência** (justificar conforme regra de escopo do AGENTS.md).
- Testes prioritários, na ordem:
  1. `utils/spotify.js` — os 3 formatos × 5 tipos + casos inválidos (puro JS, sem DOM);
  2. `utils/api.js` — resolução de `VITE_API_BASE_URL`;
  3. `App.jsx` — merge de `emptyGift` em `readSavedGift` (rascunho corrompido,
     `music` legado migrado para elemento `music-spotify`).
- **Arquivos afetados**: `frontend/package.json`, novos `*.test.jsx/js`,
  possivelmente `vite.config.js`.
- **Verificação**: `npm run lint` + novo `npm run test` passando.

### Etapa C — Testes de integração da API no backend (médio risco)
- Ampliar `GiftControllerTests`: publicação válida → 201 + `Location`;
  sem `elements` → 400; slug inexistente → 404; slug expirado → 404.
- Usar `Clock` fixo (já injetado) para simular expiração sem espera.
- **Arquivos afetados**: `backend/src/test/java/com/letterweb/controller/*`,
  possivelmente `application-test.properties`.
- **Verificação**: `.\mvnw test` (Windows) verde.

### Etapa D — Melhorias de robustez no backend (a definir com o professor)
Candidatas (escolher uma ou duas; nenhuma implementada):
- **D1. Limpeza de expirados**: método de exclusão agendado (`@Scheduled`) ou
  endpoint administrativo — altera `GiftRepository` + `GiftService` +
  `publication-schema.sql` (índice em `expires_at`, idempotente).
- **D2. Limite de tamanho do payload**: validação de tamanho do JSON antes de
  gravar (nova regra de negócio → atualizar PRD e `ApiExceptionHandler`).
- **D3. Rate limit simples por IP** usando `ClientIpResolver` (já existe e tem
  testes) — nova regra de negócio, requer atualização do PRD.
- **Verificação**: `.\mvnw test` + fluxo manual completo.

### Etapa E — Melhorias de UX/frontend (a definir)
Candidatas (nenhuma implementada):
- **E1. Mensagem de "presente expirado" distinta** (hoje não expirado e
  inexistente são tratados juntos — confirmar comportamento real em
  `PublicGiftPage.jsx` antes de decidir).
- **E2. Indicador de quota do localStorage** quando o rascunho está grande.
- **Verificação**: `npm run lint` + fluxo manual.

## 3. Funcionalidades existentes × possíveis melhorias

**Já implementadas (não reimplementar):** todo o fluxo home → editor → preview
→ publicar → abrir link; rascunho/undo/redo; editor com todos os tipos de
elemento; Spotify parser; expiração de 48 h; compartilhamento; tutorial;
biblioteca de adornos; health check; testes unitários do backend.

**Melhorias propostas (não implementadas):** etapas B–E acima. Fora de escopo
deste plano (listadas no PRD §9): contas de usuário, upload de imagens para o
servidor, rastreamento de visualizações, internacionalização.

## 4. Arquivos que poderão ser afetados por etapa

| Etapa | Frontend | Backend | Banco | Docs |
|-------|----------|---------|-------|------|
| A | `frontend/.gitignore` | `backend/.gitignore` | — | — |
| B | `package.json`, `vite.config.js`, novos testes | — | — | `AGENTS.md` (comando de teste) |
| C | — | `GiftControllerTests`, config de teste | — | — |
| D1 | — | `GiftRepository`, `GiftService`, nova classe agendada | `publication-schema.sql` | `PRD.md` (regra nova) |
| D2/D3 | — | `GiftService`, `ApiExceptionHandler` | — | `PRD.md` |
| E1/E2 | `PublicGiftPage.jsx` / `App.jsx`, `GiftEditor.jsx` | — | — | `PRD.md` |

⚠️ Qualquer mudança em `Gift`/`GiftService` exige conferir `GiftResponse`,
`publication-schema.sql`, `PublishPage.jsx` e `PublicGiftPage.jsx` no mesmo
conjunto de mudanças (contrato implícito documentado no `AGENTS.md` §5–6).

## 5. Dependências entre frontend, backend e banco

```
Publicação:  GiftEditor/PublishPage (frontend)
                │  POST /api/presentes { gift JSON com elements[] }
                ▼
             GiftController → GiftService.publish
                │  valida elements, gera slug, expires_at = clock + 48h
                ▼
             GiftRepository (JPA) → PostgreSQL `presents`
                (schema criado por publication-schema.sql no boot)

Visualização: PublicGiftPage (frontend, rota /presente/{slug})
                │  GET /api/presentes/{slug}
                ▼
             GiftService.findPublished → filtro expiresAtAfter → 404 se expirado
```

Pontos de acoplamento rígido (mudar um exige mudar o outro):
1. **Formato do presente** (`title`, `recipient`, `background`,
   `backgroundImage`, `fontFamily`, `textColor`, `appearance`, `unwrapping`
   {model, boxColor, ribbonColor, bowColor, effect}, `elements[]`, `music`):
   compartilhado por `App.jsx` (defaults), `GiftEditor`, `GiftCanvas`,
   `GiftUnwrap`, `PublishPage`, backend (validação de `elements`) e
   `readSavedGift` (migração de rascunhos antigos).
2. **Contrato da API**: `GiftResponse` (slug, content, createdAt, expiresAt)
   consumido por `PublishPage.jsx` e `PublicGiftPage.jsx`.
3. **Roteamento**: regex de `readPublicSlug` em `App.jsx` ⇄ rewrite do
   `vercel.json` — mudar um sem o outro quebra o link público.
4. **JSONB**: entidade com Jackson 3 (`tools.jackson`) +
   `Jackson3JsonFormatMapper` em `application.properties` — trocar a
   biblioteca quebra a persistência.
5. **Dev local**: proxy do Vite (`/api` → `localhost:8080`) depende do backend
   na porta 8080; `DB_*` configurados.

## 6. Testes e critérios de verificação (por etapa)

| Etapa | Verificação automatizada | Verificação manual |
|-------|--------------------------|--------------------|
| A | — | `git status` limpo |
| B | `npm run lint` + `npm run test` (novo) | — |
| C | `.\mvnw test` | — |
| D* | `.\mvnw test` + novos testes de serviço | fluxo completo: home → editor → preview → publicar → abrir link → abrir caixa |
| E* | `npm run lint` (+ testes da etapa B) | idem fluxo completo + casos de borda da funcionalidade |

Critérios de aceitação gerais (herdados do PRD §8): publicação gera link
válido; link expirado/inexistente mostra mensagem amigável; POST sem
`elements` → 400 sem registro; rascunho sobrevive a reload; desfazer/refazer
com limite de 50 estados; imagens grandes redimensionadas; Spotify nos 3
formatos × 5 tipos gera embed funcional.

Regra de honestidade (da SKILL): nenhuma etapa pode ser declarada concluída
sem evidência da execução dos testes correspondentes.

## 7. Riscos e ambiguidades

| # | Risco / ambiguidade | Impacto | Mitigação |
|---|---------------------|---------|-----------|
| R1 | Sem testes no frontend: refactors podem quebrar o editor silenciosamente | Alto | Etapa B antes de qualquer refactor de frontend |
| R2 | Payloads base64 grandes: risco de estourar quota do `localStorage` ou limite do `jsonb`/HTTP | Médio | Etapa D2; monitorar tamanho do rascunho no editor (E2) |
| R3 | Tabela `presents` cresce indefinidamente (sem limpeza) | Médio | Etapa D1 |
| R4 | Endpoint público sem rate limit permite abuso | Médio | Etapa D3; discutir escopo com o professor |
| R5 | Ambiguidade: mensagem para expirado × inexistente deve ser a mesma ou distinta? | Baixo | Confirmar comportamento atual em `PublicGiftPage.jsx` e decidir na Etapa E1 |
| R6 | `Clock` real vs. testes de expiração: depender de espera real tornaria testes lentos | Baixo | Usar `Clock` fixo/injetável (já padrão do projeto) |
| R7 | Ambiguidade: etapas D3 e E exigem novas dependências ou regras de negócio — precisam de aprovação | Médio | **Revisão humana obrigatória antes de cada etapa** |
| R8 | Segredos do Neon em `.env.local` | Alto (se vazarem) | Etapa A; considerar rotação da senha |
| R9 | Deploy não confirmado: ambiente de produção real é desconhecido para testes end-to-end | Médio | Tratar deploy como fora de escopo deste plano; confirmar com o usuário |

## 8. Decisões pendentes para revisão humana

> **Status da seção: RESOLVIDA** — decisões recomendadas e aprovadas em
> revisão documentada na seção 8.1. Nenhuma decisão exige aprovação adicional.

1. Aprovar a ordem das etapas A → E (ou cortar etapas).
2. Aprovar **adicionar dependências de teste no frontend** (Vitest + RTL) —
   quebra a regra "sem dependências sem necessidade", por isso exige decisão.
3. Escolher quais melhorias da Etapa D (D1/D2/D3) entram no escopo do trabalho.
4. Confirmar se há deploy real (Render/Vercel) para testar em produção ou se
   o trabalho permanece em ambiente local.
5. Decidir se a mensagem de presente expirado deve ser diferenciada (E1).

### 8.1 Decisões recomendadas (resolvidas)

| # | O que está sendo decidido | Recomendação | Motivo | Impacto no projeto |
|---|---------------------------|--------------|--------|--------------------|
| 1 | Ordem das etapas A → E | **Aprovar A → E nessa ordem**, com escopo reduzido: A, B e C são **essenciais**; D e E ficam **opcionais** (ver seção 9) | A é pré-requisito de integridade do repositório; B e C atacam as maiores lacunas de qualidade (RNF05) com risco controlado; D e E não bloqueiam a entrega | Reordenamento sem efeito no código existente; nenhuma funcionalidade atual é alterada |
| 2 | Adicionar dependências de teste no frontend (Vitest + RTL) | **Aprovar apenas Vitest**, sem React Testing Library nesta entrega | Os alvos de teste prioritários (`utils/spotify.js`, `utils/api.js`, merge de `emptyGift` em `App.jsx`) são funções puras/verificáveis sem DOM — RTL não é necessária para o essencial e adicionaria complexidade; Vitest reusa o próprio Vite do projeto | `package.json` +1 dependência dev +1 script `test`; nenhum código de produção muda |
| 3 | Melhorias da Etapa D (D1/D2/D3) | **Incluir apenas D2 (limite de tamanho do payload) no escopo essencial**; D1 e D3 ficam **opcionais/futuras** | D2 é a melhoria de menor custo e maior benefício de confiabilidade (protege o banco e o frontend de payloads que estouram quota/`jsonb`, risco R2); D1 (`@Scheduled`) exige ambiente/infra de agendamento para demonstrar e D3 (rate limit) introduz nova regra de negócio com risco de falso-positivo em rede de laboratório — nenhum dos dois é essencial para a entrega acadêmica | D2 altera `GiftService.publish` + `ApiExceptionHandler` (400 com mensagem amigável) + testes; PRD ganha uma regra de negócio; contrato público (`POST /api/presentes`) mantém a mesma forma, apenas passa a recusar payloads excessivos |
| 4 | Deploy real (Render/Vercel) | **Assumir ambiente local para a entrega**; deploy permanece fora de escopo | Não há evidência no repositório de deploy ativo (RNF04 é "configurado", não confirmado); a demo local (backend :8080 + `npm run dev` com proxy) é executável e testável sem depender de serviços externos | Nenhum; R9 fica encerrado como fora de escopo. Opcionalmente, se houver deploy real, pode ser demonstrado depois sem mudar o plano |
| 5 | Mensagem de expirado diferenciada (E1) | **Não implementar E1**: manter a mensagem única de "presente não disponível" | Do ponto de vista do destinatário não há valor em diferenciar (ambos os casos significam "o link já não serve"); mudar isso alteraria texto exibido em produção de uma funcionalidade que funciona; permanece como melhoria futura, caso haja tempo | Nenhuma mudança de código; R5 encerrada com a decisão de manter o comportamento atual |

## 9. Escopo final para implementação

### 9.1 Essencial para a entrega (implementar, nesta ordem)

| Etapa | Conteúdo | Arquivos afetados | Verificação |
|-------|----------|-------------------|-------------|
| A — Higiene do repositório | `.gitignore` cobrindo logs residuais, `target/`, `dist/`, `.env.local`, `.neon` | `.gitignore` (raiz), `backend/.gitignore`, `frontend/.gitignore` | `git status` não mostra logs nem segredos |
| B — Testes no frontend com Vitest | Testes de `utils/spotify.js` (3 formatos × 5 tipos + inválidos), `utils/api.js` e do merge de `emptyGift`/`readSavedGift` (rascunho corrompido, migração de `music` legado) | `frontend/package.json` (dev dep Vitest + script `test`), `frontend/vite.config.js` (bloco `test`), novos `*.test.js` | `npm run lint` + `npm run test` passando |
| C — Testes de integração da API | `GiftControllerTests`: 201+`Location` na publicação válida; 400 sem `elements`; 404 para slug inexistente; 404 para slug expirado (com `Clock` fixo) | `backend/src/test/java/com/letterweb/controller/*`, possivelmente `application-test.properties` | `.\mvnw test` verde |
| D2 — Limite de tamanho do payload | Validação do tamanho do JSON recebido antes de gravar; recusa com 400 e mensagem amigável; nova regra de negócio no PRD | `backend/.../service/GiftService.java`, `backend/.../controller/ApiExceptionHandler.java`, testes correspondentes, `PRD.md` | `.\mvnw test` + fluxo manual completo (home → editor → preview → publicar → abrir link → abrir caixa) |

### 9.2 Opcional / futuro (NÃO implementar nesta entrega)

- **D1** — limpeza agendada de registros expirados (requer infra de agendamento; melhor como melhoria futura).
- **D3** — rate limit por IP (nova regra de negócio; risco de falso-positivo; fora do escopo acadêmico).
- **E1** — mensagem diferenciada de expirado (decidido: manter comportamento atual).
- **E2** — indicador de quota do `localStorage` no editor (pode ser proposta futura se sobrar tempo).
- Deploy em produção (Render/Vercel) — fora de escopo; ambiente local assumido.
- Contas de usuário, upload de imagens para o servidor, rastreamento de visualizações, internacionalização (PRD §9).

### 9.3 Critério de "implementação pequena e demonstrável"

O escopo essencial (A + B + C + D2) altera: 3 `.gitignore`, 2 arquivos de
configuração de teste, `package.json` (+1 dev dep), alguns arquivos de teste
e 2 classes de produção no backend. **Nenhum arquivo de funcionalidade
existente do frontend é alterado.** O resultado é demonstrável com:

1. `npm run lint` + `npm run test` no frontend;
2. `.\mvnw test` no backend;
3. fluxo completo manual em ambiente local (§6), incluindo a recusa de um
   payload oversized com 400 (D2).

---

*Este plano não implementou nada. Próximo passo: implementar o escopo
essencial da seção 9.1, etapa por etapa, seguindo a SKILL
`desenvolver-funcionalidade` (análise → dúvidas → plano → implementação →
verificação) e reportando evidências de teste a cada etapa.*
