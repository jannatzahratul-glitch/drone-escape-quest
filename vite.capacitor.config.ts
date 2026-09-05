// Standalone SPA build used only for the Capacitor Android shell.
// The game is fully client-side, so this bypasses the SSR/TanStack Start
// pipeline and emits plain static assets into capacitor-www/.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths()],
  build: {
    outDir: "capacitor-www",
    emptyOutDir: true,
    rollupOptions: { input: "app.html" },
    chunkSizeWarningLimit: 4000,
  },
});
