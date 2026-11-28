// posts 를 읽는 곳은 모두 이 함수를 쓴다 : draft 글은 빌드에서 빼고, 개발 서버에서는 보여 준다
import { getCollection, type CollectionEntry } from 'astro:content'

export type Post = CollectionEntry<'posts'>

export const isVisible = (p: Post, dev: boolean = import.meta.env.DEV): boolean => dev || !p.data.draft

export const getPosts = (filter?: (p: Post) => boolean): Promise<Post[]> => getCollection('posts', (p) => isVisible(p) && (filter ? filter(p) : true))
