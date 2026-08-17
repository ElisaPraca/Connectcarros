# Deploy do Connect IA

O projeto é 100% independente: React 19 + TanStack Start (SSR) + Postgres/Supabase.
Nada no codigo depende de plataformas externas de build.

## 1. Variáveis de ambiente (obrigatório)

O `.env` **não** vai no zip/git. Sem essas variáveis o app quebra no primeiro acesso.
Use o `.env.example` como referência e cadastre na Vercel em
**Project Settings → Environment Variables** (marque Production, Preview e Development):

| Variável | Onde é usada |
| --- | --- |
| `VITE_SUPABASE_URL` | navegador |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | navegador |
| `VITE_SUPABASE_PROJECT_ID` | navegador |
| `SUPABASE_URL` | servidor (SSR) |
| `SUPABASE_PUBLISHABLE_KEY` | servidor (SSR) |
| `SUPABASE_PROJECT_ID` | servidor (SSR) |

Os valores atuais estão no `.env` do projeto (as chaves `VITE_*` são públicas por design).

## 2. Configuração da Vercel

Já incluída no repositório via `vercel.json`:

- Framework Preset: **Other** (`"framework": null`)
- Build Command: `npm run build`
- Output: gerado automaticamente em `.vercel/output` (Build Output API v3)
- `NITRO_PRESET=vercel` para gerar a função serverless de SSR em vez do bundle
  padrão para Cloudflare Workers

Não defina "Output Directory" manualmente no painel — deixe em branco.

## 3. Passos

1. Suba o código num repositório Git (ou faça upload do zip).
2. Importe o projeto na Vercel.
3. Cadastre as variáveis do passo 1.
4. Deploy.

## 4. Banco de dados

O banco continua no Supabase. Para usar um projeto Supabase próprio:

1. Crie um projeto novo.
2. Aplique as migrações em `supabase/migrations` (SQL Editor ou `supabase db push`).
3. Crie o bucket privado `checklist-photos` no Storage.
4. Troque as variáveis de ambiente pelos valores do seu projeto.

## 5. Rodar localmente

```bash
npm install
cp .env.example .env   # preencha os valores
npm run dev            # http://localhost:8080
npm run build && npm run preview
```

## Outras hospedagens

- **Cloudflare Workers**: `NITRO_PRESET=cloudflare_module npm run build` e publique `.output`.
- **Node/VPS/Docker**: `NITRO_PRESET=node-server npm run build`, depois
  `node .output/server/index.mjs`.
