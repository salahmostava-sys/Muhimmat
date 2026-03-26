import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "./frontend"),
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@app": path.resolve(__dirname, "./frontend/app"),
      "@modules": path.resolve(__dirname, "./frontend/modules"),
      "@shared": path.resolve(__dirname, "./frontend/shared"),
      "@services": path.resolve(__dirname, "./frontend/services"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "./dist"),
    emptyOutDir: true,
  },
});
