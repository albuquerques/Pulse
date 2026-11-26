import { defineConfig } from "vite";

const API = process.env.PROTO_API_URL ?? "http://localhost:8787";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin on purpose: the e2e suite blocks "**/sync/**" to simulate an
    // unreachable API while Vite keeps serving the page.
    proxy: {
      "/sync": { target: API, changeOrigin: true },
      "/test": { target: API, changeOrigin: true },
    },
  },
});
