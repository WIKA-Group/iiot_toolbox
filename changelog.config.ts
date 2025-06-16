import { x } from 'tinyexec'
import type { ChangelogConfig } from 'changelogen'

async function getGitTags() {
  const { stdout } = await x('git', ['--no-pager', 'tag', '-l', '--sort=-creatordate'])

  const tags = stdout.trim().split('\n').filter(Boolean)
  return {
    latestTag: tags[0] || '',
    penultimateTag: tags[1] || '',
  }
}

const { latestTag, penultimateTag } = await getGitTags()

console.log(`Latest tag used: ${latestTag}`, `Penultimate tag used: ${penultimateTag}`)

export default {
  from: penultimateTag,
  to: latestTag,
  output: false,
  noAuthors: true,
} satisfies Partial<ChangelogConfig>
