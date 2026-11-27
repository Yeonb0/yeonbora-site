// 콘텐츠 원본 : src/content/ (Obsidian 볼트) 의 wiki · posts · courses
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { fileURLToPath } from 'node:url'
import { graphAware } from '@/lib/content/graph-loader'
import { CourseSchema, PostSchema, WikiSchema, WeekSchema } from '@/lib/content/schemas'
import { slugFromPath } from '@/lib/content/wikilink'

// astro.config 의 remark 플러그인과 같은 경로 (색인 캐시 열쇠)
const ContentDir = fileURLToPath(new URL('./content', import.meta.url))

const fromFolder = (name: string) =>
  graphAware(
    glob({ pattern: '**/*.md', base: `./src/content/${name}`, generateId: ({ entry }) => slugFromPath(entry) }),
    ContentDir,
  )

export const collections = {
  wiki: defineCollection({ loader: fromFolder('wiki'), schema: WikiSchema }),
  posts: defineCollection({ loader: fromFolder('posts'), schema: PostSchema }),
  courses: defineCollection({ loader: fromFolder('courses'), schema: CourseSchema }),
  // Layered Wiki 설명 탭의 주차별 산출물 : 볼트 (src/content) 밖에 두어 위키 링크 그래프에 섞이지 않게 한다
  layeredWikiWeeks: defineCollection({ loader: glob({ pattern: '*.md', base: './src/sections/layered-wiki/weeks' }), schema: WeekSchema }),
}
