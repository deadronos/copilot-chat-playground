/* eslint-disable */
import path from "path"
import { defineConfig } from "vitest/config"

const testsRoot = path
  .resolve(__dirname, "../../tests/backend")
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
    ],
    globals: true,
    passWithNoTests: true,
  },
})
