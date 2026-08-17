# Deploy do Connect IA

O projeto é 100% independente: React 19 + TanStack Start (SSR).
Toda a persistência usa **apenas** a planilha do Google (SheetDB) e o Google Drive
(serviço de upload já existente). Não há banco de dados nem serviço externo além disso.

## 1. Variáveis de ambiente

**Nenhuma variável é necessária.** As URLs da planilha e do serviço de upload estão
no código em `src/lib/legacy-integration.ts`.

## 2. Abas necessárias na planilha

Além das abas de checklist já existentes (`Check List Carros` e `Check List Ferramentas`),
crie duas abas para os cadastros, com os cabeçalhos exatamente nesta ordem na primeira linha:

**Aba `Tecnicos`**

| id | nome | ativo | criado_em |
| --- | --- | --- | --- |

**Aba `Veiculos`**

| id | placa | apelido | tecnico_id | pasta_drive | ativo | criado_em |
| --- | --- | --- | --- | --- | --- | --- |

Observações:
- `ativo` aceita `sim` / `nao`.
- `tecnico_id` guarda o `id` do técnico associado (o sistema preenche automaticamente).
- `pasta_drive` é o ID da pasta do Drive onde as fotos daquela placa serão salvas.
  Para as placas já conhecidas o sistema preenche sozinho; para placas novas, cole o ID
  da pasta do Drive nessa coluna.

## 3. Configuração da Vercel

Já incluída no repositório via `vercel.json`:

- Framework Preset: **Other** (`"framework": null`)
- Build Command: `npm run build`
- Output: gerado automaticamente em `.vercel/output` (Build Output API v3)
- `NITRO_PRESET=vercel` para gerar a função serverless de SSR

Não defina "Output Directory" manualmente no painel — deixe em branco.

## 4. Passos

1. Suba o código num repositório Git (ou faça upload do zip).
2. Importe o projeto na Vercel.
3. Deploy (sem variáveis de ambiente).

## 5. Rodar localmente

```bash
npm install
npm run dev            # http://localhost:8080
npm run build && npm run preview
```

## Outras hospedagens

- **Cloudflare Workers**: `NITRO_PRESET=cloudflare_module npm run build` e publique `.output`.
- **Node/VPS/Docker**: `NITRO_PRESET=node-server npm run build`, depois
  `node .output/server/index.mjs`.
