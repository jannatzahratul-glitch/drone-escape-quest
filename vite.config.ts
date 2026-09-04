// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * The dev devtools plugin injects a `data-tsd-source` prop into every JSX host
 * element. React Three Fiber elements (<mesh>, <group>, ...) are not DOM nodes,
 * so applyProps throws on that attribute and the canvas goes blank.
 * Strip it back out of the 3D scene modules (dev only).
 */
function stripTsdSourceFromR3F(): Plugin {
  return {
    name: "strip-tsd-source-from-r3f",
    enforce: "post",
    apply: "serve",
    transform(code, id) {
      if (!/src[\\/](game|components[\\/]game)[\\/]/.test(id)) return null;
      if (!code.includes("data-tsd-source")) return null;
      return {
        code: code.replace(/"data-tsd-source":\s*"[^"]*",?/g, ""),
        map: null,
      };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripTsdSourceFromR3F()],
  },
});
