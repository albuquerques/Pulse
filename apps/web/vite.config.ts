import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:8787";

// Same origin on purpose: the browser only ever talks to the Vite origin, so the
// session cookie in T4 works and an E2E can block "**/api/**" without killing the
// dev server (T9-6 from the prototype). `preview` needs its own copy — Vite does
// not inherit server.proxy there, and the E2E runs against the preview server.
const proxy = {
  "/api": { target: API_URL, changeOrigin: true },
};

export default defineConfig({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
  build: { sourcemap: true },
});
