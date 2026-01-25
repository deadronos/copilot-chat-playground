/* eslint-disable */
import path from "path"
import { defineConfig } from "vitest/config"

const testsRoot = path.resolve(__dirname, "../../tests/frontend").replace(/\\/g, '/')
const sharedEntry = path.resolve(__dirname, "../shared/src/index.ts").replace(/\\/g, "/")

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@copilot-playground/shared": sharedEntry,
      // Ensure tests that live outside the package (tests/frontend/...) can resolve React and testing libs
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-dom/client": path.resolve(__dirname, "node_modules/react-dom/client"),
      "@testing-library/react": path.resolve(__dirname, "node_modules/@testing-library/react"),
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
