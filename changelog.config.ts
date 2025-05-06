import { execFileSync } from 'node:child_process'
import type { ChangelogConfig } from 'changelogen'

function getGitTags() {
  const stdout = execFileSync('git', ['--no-pager', 'tag', '-l', '--sort=-creatordate'], { encoding: 'utf8' })
  const tags = stdout.trim().split('\n').filter(Boolean)
  return {
    latestTag: tags[0] || '',
    penultimateTag: tags[1] || '',
  }
}

const { latestTag, penultimateTag } = getGitTags()

export default {
  from: penultimateTag,
  to: latestTag,
  output: false,
  noAuthors: true,
} satisfies Partial<ChangelogConfig>
