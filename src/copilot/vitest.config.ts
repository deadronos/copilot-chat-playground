import path from "path"
import { defineConfig } from "vitest/config"

const testsRoot = path.resolve(__dirname, "../../tests/copilot")

export default defineConfig({
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
