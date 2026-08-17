# Connect IA — Checklist de Veículos e Ferramentas

Aplicação corporativa de checklist de veículos e ferramentas, com gestão de
técnicos, frota, histórico e controle semanal.

## Stack

- React 19 + TanStack Start (SSR) + TanStack Router / Query
- Vite 8 + Tailwind CSS v4
- Persistência dos checklists via API da planilha (SheetDB) e fotos no Drive

## Rodar localmente

```sh
npm install --legacy-peer-deps
cp .env.example .env   # preencha os valores
npm run dev            # http://localhost:8080
```

## Build e deploy

```sh
npm run build          # NITRO_PRESET=vercel para a Vercel
npm run preview
```

Consulte `DEPLOY.md` para o passo a passo de deploy (Vercel, Node ou Cloudflare).
