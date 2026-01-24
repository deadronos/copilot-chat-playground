import path from "path"
import { defineConfig } from "vitest/config"

const testsRoot = path.resolve(__dirname, "../../tests/frontend").replace(/\\/g, '/')

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: [
      `${testsRoot}/**/*.test.{ts,tsx}`,
      `${testsRoot}/**/*.spec.{ts,tsx}`,
    ],
    globals: true,
    passWithNoTests: true,
  },
})
