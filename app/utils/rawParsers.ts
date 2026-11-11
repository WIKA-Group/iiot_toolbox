const rawParsers = import.meta.glob<string>(
  '../../node_modules/@w2a-iiot/raw-javascript-parsers/dist/*/index.js',
  { query: '?raw', import: 'default' },
)

export async function loadRawParser(rawDir: string): Promise<string | undefined> {
  const suffix = `/${rawDir}/index.js`
  const key = Object.keys(rawParsers).find(path => path.endsWith(suffix))
  return key ? rawParsers[key]?.() : undefined
}
