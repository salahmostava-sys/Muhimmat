import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(__dirname, "./frontend/vitest.setup.ts")],
    include: [
      "frontend/app/**/*.{test,spec}.{ts,tsx}",
      "frontend/modules/**/*.{test,spec}.{ts,tsx}",
      "frontend/shared/**/*.{test,spec}.{ts,tsx}",
      "frontend/services/**/*.{test,spec}.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      include: [
        "frontend/app/**/*.{ts,tsx}",
        "frontend/modules/**/*.{ts,tsx}",
        "frontend/shared/**/*.{ts,tsx}",
        "frontend/services/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "frontend/shared/test/**",
        "frontend/services/supabase/types.ts",
        "frontend/app/main.tsx",
        "frontend/app/vite-env.d.ts",
      ],
      thresholds: {
        lines: 2,
        functions: 12,
        branches: 20,
        statements: 2,
      },
    },
  },
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./frontend/app"),
      "@services": path.resolve(__dirname, "./frontend/services"),
      "@modules": path.resolve(__dirname, "./frontend/modules"),
      "@shared": path.resolve(__dirname, "./frontend/shared"),
    },
  },
});
