import fs from "fs"
import path from "path"

const MAX_APP_LINES = 550
const appPath = path.resolve("src/backend/src/app.ts")

if (!fs.existsSync(appPath)) {
  console.error(`[router-guard] Missing ${appPath}`)
  process.exit(1)
}

const contents = fs.readFileSync(appPath, "utf8")
const lineCount = contents.split(/\r?\n/).length

if (lineCount > MAX_APP_LINES) {
  console.error(
    `[router-guard] src/backend/src/app.ts has ${lineCount} lines (max ${MAX_APP_LINES}). ` +
      "Move logic into src/backend/src/services/* and keep routes thin."
  )
  process.exit(1)
}

console.log(
  `[router-guard] src/backend/src/app.ts line count OK (${lineCount}/${MAX_APP_LINES}).`
)
