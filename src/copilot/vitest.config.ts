import path from "path"
import { defineConfig } from "vitest/config"

// Normalize to POSIX forward slashes so fast-glob matches correctly on Windows
const testsRoot = path.resolve(__dirname, "../../tests/copilot").replace(/\\/g, "/");

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
