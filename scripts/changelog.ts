import { existsSync, unlinkSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { x } from 'tinyexec'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const changelogPath = path.resolve(__dirname, '../CHANGELOG.md')

// remove CHANGELOG.md file if it exists
if (existsSync(changelogPath)) {
  unlinkSync(changelogPath)
}

// call pnpm dlx changelogen --output with tinyexec
await x('pnpm', [
  'dlx',
  'changelogen',
  '--output',
])

// remove every line until the one that starts with [compare changes]
const lines = readFileSync(changelogPath, 'utf8').split('\n')
const idx = lines.findIndex(line => line.startsWith('[compare changes]'))
if (idx !== -1) {
  writeFileSync(changelogPath, lines.slice(idx).join('\n'))
}
