/* eslint-disable */
import path from "path"
import { defineConfig } from "vitest/config"

const testsRoot = path
  .resolve(__dirname, "../../tests/backend")
  .replace(/\\/g, "/")
const testsShared = path
  .resolve(__dirname, "../../tests/shared")
  .replace(/\\/g, "/")
const sharedEntry = path
  .resolve(__dirname, "../shared/src/index.ts")
  .replace(/\\/g, "/")

export default defineConfig({
  resolve: {
    alias: {
      "@copilot-playground/shared": sharedEntry,
    },
  },
  test: {
    environment: "node",
    include: [
      `${testsRoot}/**/*.test.{ts,tsx}`,
      `${testsRoot}/**/*.spec.{ts,tsx}`,
      `${testsShared}/**/*.test.{ts,tsx}`,
      `${testsShared}/**/*.spec.{ts,tsx}`,
    ],
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],
      thresholds: {
        lines: 30,
        functions: 25,
        branches: 20,
        statements: 30,
      },
    },
  },
})
