import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // web-ifc ships WASM + dynamic workers — don't let Vite pre-bundle them
  optimizeDeps: {
    exclude: ["web-ifc"],
  },
  assetsInclude: ["**/*.wasm"],
  server: {
    // headers: {
    //   // Required for SharedArrayBuffer (multi-threaded WASM parsing)
    //   "Cross-Origin-Opener-Policy": "same-origin",
    //   "Cross-Origin-Embedder-Policy": "require-corp",
    // },
  },
});
