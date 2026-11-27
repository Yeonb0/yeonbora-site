// 콘텐츠 원본 : src/content/ (Obsidian 볼트) 의 wiki · posts · courses
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { CourseSchema, PostSchema, WikiSchema } from '@/lib/content/schemas'
import { slugFromPath } from '@/lib/content/wikilink'

const fromFolder = (name: string) => glob({ pattern: '**/*.md', base: `./src/content/${name}`, generateId: ({ entry }) => slugFromPath(entry) })

export const collections = {
  wiki: defineCollection({ loader: fromFolder('wiki'), schema: WikiSchema }),
  posts: defineCollection({ loader: fromFolder('posts'), schema: PostSchema }),
  courses: defineCollection({ loader: fromFolder('courses'), schema: CourseSchema }),
}
