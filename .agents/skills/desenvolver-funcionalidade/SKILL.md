# Skill: desenvolver-funcionalidade (Letter Web)

Use esta skill **sempre que o usuário pedir para desenvolver, alterar ou corrigir
uma funcionalidade** do Letter Web (frontend, backend, banco de dados ou integração
entre eles). Ela descreve o processo obrigatório, em cinco etapas, do pedido até a
verificação final.

Objetivo: garantir que qualquer mudança respeite o funcionamento real do sistema
(arquitetura React SPA + Spring Boot + PostgreSQL, descrita em `AGENTS.md` e
`PRD.md`), sem quebrar funcionalidades existentes nem introduzir inventos.

---

## Etapa 1 — Análise da solicitação

Antes de qualquer código:

1. **Leia o pedido com atenção** e identifique: qual funcionalidade, em qual
   camada (frontend, backend, banco) e qual problema concreto resolve.
2. **Consulte a documentação viva**: `PRD.md` (requisitos e regras de negócio)
   e `AGENTS.md` (arquitetura, padrões e cuidados). Verifique se o pedido
   conflita com alguma regra já documentada (ex.: validade de 48 h, validação
   de `elements`, sem autenticação).
3. **Explore o código afetado antes de editar**: leia os arquivos que serão
   modificados E os que os consomem. Exemplos de pares acoplados:
   - mudou `Gift`/`GiftService` → confira `GiftController`, `GiftResponse`,
     `publication-schema.sql`, `PublishPage.jsx`, `PublicGiftPage.jsx`;
   - mudou o formato do presente → confira `emptyGift` e `readSavedGift` em
     `App.jsx`, `GiftCanvas`, `GiftUnwrap`, `GiftEditor`;
   - mudou `utils/spotify.js` → confira o uso em `GiftEditor` e o tipo
     `music` em `GiftCanvas`/`GiftUnwrap`.
4. **Distingua o que já existe do que é novo**: nunca descreva como existente
   uma funcionalidade que ainda não está implementada; se o pedido envolver
   algo fora do escopo atual (contas de usuário, upload de arquivos para o
   servidor, rastreio de visualizações...), sinalize isso ao usuário.

## Etapa 2 — Identificação de dúvidas e ambiguidades

1. Liste as **ambiguidades reais** do pedido (comportamento esperado em casos
   de borda: presente expirado, `localStorage` cheio, link inválido do
   Spotify, imagem muito grande...).
2. Para cada ambiguidade, decida entre:
   - resolver com base no **comportamento já existente** do projeto (preferir
     sempre), ou
   - **perguntar ao usuário** quando a decisão alterar contrato de API, regra
     de negócio ou experiência do destinatário.
3. **Não presuma requisitos que não existem.** Se o pedido conflitar com uma
   regra documentada (ex.: remover o filtro de expiração), explique o conflito
   antes de executar.
4. Defina explicitamente o **fora de escopo** desta mudança.

## Etapa 3 — Planejamento da solução

1. Descreva o plano em **passos verificáveis**, indicando arquivos exatos que
   serão criados/alterados em cada camada.
2. Verifique dependências cruzadas antes de começar:
   - mudança de API backend ⇄ frontend deve ir **no mesmo commit/PR**;
   - mudança de tabela deve ser refletida em `publication-schema.sql`
     (idempotente, `CREATE TABLE IF NOT EXISTS`) — nunca `ddl-auto=update`;
   - novos campos do presente devem ser **opcionais** e mesclados com os
     defaults de `emptyGift` em `App.jsx`.
3. Planeje a **regressão**: liste os testes/verificações existentes que podem
   quebrar (`./mvnw test` no backend; `npm run lint` no frontend) e o fluxo
   manual completo (home → editor → preview → publicar → abrir link → abrir
   caixa).
4. Se o plano exigir nova dependência ou refactor amplo, justifique
   explicitamente — o projeto prioriza mínimo escopo e clareza.

## Etapa 4 — Implementação

1. **Leia cada arquivo inteiro antes de editá-lo** e aplique mudanças com
   ferramentas de edição in-place (nunca apague e recrie arquivos).
2. Siga os padrões do projeto:
   - Frontend: JSX funcional, hooks nativos, imutabilidade, textos em
     português, um `export default` por arquivo de componente, CSS em
     `App.css`/`index.css`.
   - Backend: Java 21 com tabulação, camadas controller → service →
     repository, DTOs como `record`, injeção por construtor, exceções de
     domínio (`InvalidGiftException`, `GiftNotFoundException`) traduzidas em
     `ApiError`, datas via `Clock` injetado, JSON com `tools.jackson`
     (Jackson 3 — nunca `com.fasterxml`).
3. **Nunca coloque segredos** no código ou em variáveis `VITE_*` (vão para o
   bundle). Configuração do backend só por variáveis de ambiente (`DB_*`,
   `PORT`, `CORS_ALLOWED_ORIGINS`, `TRUSTED_PROXY_IPS`).
4. Mantenha **mensagens de erro/sucesso amigáveis em português**.
5. Preserve contratos existentes:
   - `POST /api/presentes` / `GET /api/presentes/{slug}` e `GiftResponse`;
   - validação de `elements` (lista) em `GiftService.publish`;
   - expiração de 48 h com filtro `expiresAtAfter`;
   - roteamento por `state` + `window.location.pathname` (sem react-router);
   - os três formatos e cinco tipos de link Spotify aceitos.
6. Não modifique arquivos alheios ao escopo combinado (inclui logs, arquivos
   de segredo e artefatos de build).

## Etapa 5 — Verificação e testes

Execute, na ordem, e **não declare "pronto" sem evidência**:

1. **Frontend** (dentro de `frontend/`): `npm run lint` — obrigatório após
   qualquer edição; `npm run build` quando houver mudança estrutural.
2. **Backend** (dentro de `backend/`): `./mvnw test` (Windows: `.\mvnw test`)
   — inclui testes de service, config e controller.
3. **Fluxo completo manual** (ou automatizado quando disponível): rodar
   backend + `npm run dev` e testar home → editor → preview → publicar →
   abrir o link `/presente/{slug}` → abrir a caixa → conteúdo + música.
4. **Casos de borda do que foi alterado**: presente expirado, POST sem
   `elements`, rascunho corrompido no `localStorage`, erro de conexão,
   link Spotify inválido.
5. **Relato final honesto**: diga o que foi verificado com evidência e o que
   não pôde ser verificado (ex.: ambiente sem PostgreSQL, deploy, Web Share
   API em desktop). Nunca confirme funcionamento sem ter executado a
   verificação.
6. Ao final, resuma: arquivos alterados/criados, decisão sobre cada
   ambiguidade da Etapa 2 e próximos passos pendentes, se houver.
