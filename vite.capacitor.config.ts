// Standalone SPA build used only for the Capacitor Android shell.
// The game is fully client-side, so this bypasses the SSR/TanStack Start
// pipeline and emits plain static assets into capacitor-www/.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import type { Plugin } from "vite";
import { renameSync } from "fs";
import { resolve } from "path";

// Capacitor requires the web dir to contain index.html as the entry point,
// but our SPA HTML source is app.html (kept separate to avoid clashing with
// any TanStack Start index.html). After the build emits app.html into
// capacitor-www/, rename it to index.html so `cap sync` accepts it.
function renameAppHtmlToIndex(): Plugin {
  return {
    name: "rename-app-html-to-index",
    closeBundle() {
      const dir = resolve(process.cwd(), "capacitor-www");
      try {
        renameSync(resolve(dir, "app.html"), resolve(dir, "index.html"));
      } catch {
        // ignore if file missing
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths(), renameAppHtmlToIndex()],
  build: {
    outDir: "capacitor-www",
    emptyOutDir: true,
    rollupOptions: { input: "app.html" },
    chunkSizeWarningLimit: 4000,
  },
});
