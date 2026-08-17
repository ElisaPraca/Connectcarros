import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Hospedagem própria (Vercel, Netlify, Node, Cloudflare):
// defina NITRO_PRESET no ambiente de build. Padrão: node-server.
const preset = process.env["NITRO_PRESET"] ?? "node-server";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // Entrada SSR própria (wrapper de erro) em src/server.ts
      server: { entry: "server" },
    }),
    nitro({
      preset,
      // O preset "vercel" precisa escrever em .vercel/output (Build Output API).
      // Só padronizamos a saída em dist/ nos outros presets.
      ...(preset === "vercel"
        ? {}
        : {
            output: {
              dir: "dist",
              publicDir: "dist/client",
              serverDir: "dist/server",
            },
          }),
    }),
    viteReact(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
});
