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

Variáveis em `.env` (não versionado): URL do Supabase, chave anon, chaves só servidor conforme [docs/SECURITY.md](../../docs/SECURITY.md).

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
