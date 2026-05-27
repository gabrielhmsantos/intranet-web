# Instruções para agentes — `apps/web`

Aplicação **Next.js 16** (App Router) + **React 19**: UI no browser e **BFF** (Route Handlers) para operações sensíveis. Contexto do monorepo: [`../../AGENTS.md`](../../AGENTS.md).

## Stack

- Next.js 16, React 19, TypeScript
- Estilos: Tailwind CSS 4
- UI: **shadcn/ui** ([`components.json`](components.json))
- Ícones: `@hugeicons/react` (quando aplicável)
- Dados / auth: **Supabase** (cliente browser com anon + JWT; cliente servidor com privilégios onde necessário)

## Estrutura de pastas

| Pasta | Conteúdo |
|-------|----------|
| `app/` | Rotas, layouts, Route Handlers (`app/api/.../route.ts`) |
| `components/` | Componentes UI (padrão shadcn) |
| `lib/` | Utilitários, clientes Supabase **só servidor** |
| `public/` | Assets estáticos |

Agrupar rotas com route groups `(nome)` quando fizer sentido. Lógica de domínio sensível no **servidor** (BFF), não no bundle do cliente.

## BFF (Route Handlers)

Usar Route Handlers para:

- Convites e **Supabase Auth Admin** (`createUser`, etc.)
- Mutações que não devem expor `service_role` no browser
- INSERT em `notifications` em mutações de negócio (ex.: edição/cancelamento de evento)

Validar sempre: sessão, tenant, papel de negócio antes de Admin API ou escritas privilegiadas.

## Supabase no frontend

- Browser: chave **anon** + JWT do utilizador; confiar em **RLS**.
- Servidor: `service_role` ou cliente elevado **apenas** em Route Handlers / Server Components / server actions — **nunca** em componentes `'use client'` nem em `NEXT_PUBLIC_*`.
- Leitura e “marcar lida” em `notifications`: conforme RLS (destinatário na própria linha).

## UI e acessibilidade

- Seguir [docs/UI_SPEC.md](../../docs/UI_SPEC.md) para layouts, componentes e padrões visuais.
- Reutilizar componentes shadcn existentes; adicionar novos via CLI do projeto quando necessário.
- Manter componentes focados; extrair subcomponentes se o ficheiro crescer demais.

## Comandos

Executar a partir de `apps/web/`:

```bash
pnpm install
pnpm dev      # desenvolvimento
pnpm build    # build de produção
pnpm lint     # ESLint
pnpm start    # servidor após build
```

Variáveis em `apps/web/.env.local` (não versionado; ver `.env.local.example`):

| Variável | Obrigatória (EP-2) | Uso |
|----------|:------------------:|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | Cliente browser + servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | Sessão utilizador (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | sim (servidor) | Convites, Auth Admin — **nunca** no cliente |

Sem estas variáveis, o modo **demo** EP-1 (`dev_auth` / selector de perfil) permanece em development.

Migração `invite_tokens`: coordenar `npx supabase db push` com a equipa antes de aplicar em cloud partilhado.

## EP-3 — Colaboradores e organograma

Rotas BFF (sessão + RLS; autorização em `lib/people-roles.ts`):

| Rota | Métodos | Papéis mutação |
|------|---------|----------------|
| `/api/employees` | GET, POST | POST: `tenant_admin`, `hr` |
| `/api/employees/[id]` | GET, PATCH | PATCH: `tenant_admin`, `hr` |
| `/api/employees/[id]/deactivate` | POST | `tenant_admin`, `hr` |
| `/api/employees/[id]/reactivate` | POST | `tenant_admin`, `hr` |
| `/api/departments` | GET, POST | POST: `tenant_admin`, `hr` |
| `/api/departments/[id]` | PATCH, DELETE | `tenant_admin`, `hr` |

- Lista/ficha: colaboradores **activos** visíveis a todos os papéis tenant; **inactivos** só `tenant_admin`/`hr` (RLS + BFF → 404 para outros).
- Organograma (`/organograma`): leitura para `employee`/`manager`; «Gerir departamentos» só RH/admin.
- `platform_admin` redireccionado para área plataforma — fora do escopo EP-3 tenant.
- Convites: reutilizar `POST /api/invites` (EP-2); rejeita colaborador `inactive`.
- Dados organograma: RSC via `lib/org-chart/load-org-chart.ts` (sem rota pública `/api/org-chart`).

## EP-4 — Eventos internos

Rotas BFF (sessão + RLS; autorização em `lib/events/roles.ts`):

| Rota | Métodos | Papéis mutação |
|------|---------|----------------|
| `/api/events` | GET, POST | POST: `tenant_admin`, `hr` |
| `/api/events/[id]` | GET, PATCH | PATCH: `tenant_admin`, `hr` |
| `/api/events/[id]/cancel` | POST | `tenant_admin`, `hr` |
| `/api/tenant/settings` | PATCH | `tenant_admin` (timezone) |

- Lista/detalhe: todos os papéis tenant; gestor/colaborador **sem** criar/editar/cancelar.
- `INSERT` em `notifications`: **apenas** BFF com `service_role` em cancelamento e alteração de data/hora; RLS nega `authenticated`.
- Lembretes agendados e bandeja completa: **EP-5** (`notification-service`).
- Migração: `supabase/migrations/20260526120000_ep4_internal_events.sql` — coordenar `db push` com a equipa.

## EP-7 — Administração da plataforma

Rotas BFF (`requirePlatformAdmin()` em `lib/platform/require-platform-admin.ts`; agregação cross-tenant só com `service_role`):

| Rota | Métodos | Notas |
|------|---------|-------|
| `/api/platform/tenants/summary` | GET | Dashboard agregados (sem PII) |
| `/api/platform/tenants` | POST | Provisionamento + token `bootstrap` |
| `/api/platform/invites/expired` | GET | Lista bootstrap expirados (com email) |
| `/api/platform/invites/[inviteId]/renew` | POST | Novo link 7 dias |
| `/api/platform/invites/[inviteId]/delete` | POST | FR-019 — só tenant órfão |

- UI: `/plataforma/dashboard`, `/plataforma/tenants/novo`, `/plataforma/convites-expirados`.
- Activar bootstrap: ramo em `/api/invites/[token]/validate` e `activate` (`kind=bootstrap`).
- Migração: `supabase/migrations/20260527140000_ep7_platform_admin.sql` — coordenar `db push` com a equipa.

## Verificação antes de concluir

- [ ] `pnpm lint` e `pnpm build` sem erros.
- [ ] Nenhum segredo em código cliente ou variáveis públicas.
- [ ] Novas rotas API com validação de entrada (ex.: Zod) quando aplicável.
- [ ] UI alinhada a shadcn e UI_SPEC.

## Skills úteis

- `.agents/skills/next-best-practices/`
- `.agents/skills/vercel-react-best-practices/`
- `.agents/skills/shadcn/`

## Evitar

- Expor `service_role` ou tokens Admin no cliente.
- Permitir que utilizadores façam INSERT em `notifications` pela UI.
- Refactors fora do escopo da tarefa.
- Criar ficheiros em `docs/` sem pedido explícito.
