import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

/**
 * This codebase imports from the `src` root as bare specifiers
 * ("components/ui/Button", "utils/cn", "NotificationContext"). That mapping
 * lived only in jsconfig.json, which vite-tsconfig-paths@3 does not read, so
 * bare specifiers failed to resolve in a production build. Resolve them here
 * instead -- tried before node_modules, and only when the file really exists,
 * so a real package of the same name still wins.
 */
const EXTENSIONS = ["", ".jsx", ".js", ".mjs", ".json", "/index.jsx", "/index.js"];

const srcRootResolver = () => ({
  name: "src-root-resolver",
  enforce: "pre",
  resolveId(source) {
    if (
      !source ||
      source.startsWith(".") ||
      source.startsWith("/") ||
      source.startsWith("\0") ||
      path.isAbsolute(source)
    ) {
      return null;
    }

    const base = path.join(srcDir, source);
    // Keep the resolver inside src/ even if a specifier contains "..".
    if (!base.startsWith(srcDir)) return null;

    for (const extension of EXTENSIONS) {
      const candidate = `${base}${extension}`;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }

    return null;
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  // This changes the out put dir from dist to build
  // comment this out if that isn't relevant for your project
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000,
  },
  plugins: [srcRootResolver(), tsconfigPaths(), react(), tagger()],
  server: {
    port: "4001",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: ['.amazonaws.com', '.builtwithrocket.new'],
  }
});
