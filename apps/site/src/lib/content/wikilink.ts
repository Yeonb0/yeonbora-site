// Obsidian 위키 링크 [[대상#제목|표시]] 를 읽는다
import { slug } from 'github-slugger'

export interface Wikilink {
  raw: string
  target: string
  heading?: string
  label?: string
}

// 앞에 ! 가 붙은 임베드는 링크가 아니다
const LinkRe = /(?<!!)\[\[([^\[\]\n]+?)\]\]/g

// 펜스 코드 · 인라인 코드를 같은 길이 공백으로 가려 위치를 유지한다
export const maskCode = (md: string): string =>
  md
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(`+)[^`\n]*?\1/g, (m) => ' '.repeat(m.length))

// [[ ]] 안쪽 글자 하나를 링크로 푼다 : 표 안에서 쓰는 \| 도 구분자로 본다
export const parseInner = (raw: string, inner: string): Wikilink => {
  const [Head, ...Rest] = inner.split(/\\?\|/)
  const Label = Rest.join('|').trim()
  const Hash = Head.indexOf('#')
  const Target = (Hash < 0 ? Head : Head.slice(0, Hash)).trim()
  const Link: Wikilink = { target: Target, raw }
  if (Hash >= 0) Link.heading = Head.slice(Hash + 1).trim()
  if (Label) Link.label = Label
  return Link
}

export const parseWikilinks = (md: string): Wikilink[] => {
  const Masked = maskCode(md)
  const Links: Wikilink[] = []
  for (const M of Masked.matchAll(LinkRe)) {
    const Raw = md.slice(M.index, M.index + M[0].length)
    Links.push(parseInner(Raw, Raw.slice(2, -2)))
  }
  return Links
}

// 링크 비교 키 : 곡선 따옴표 (‘ ’ ʼ) 를 곧은 ' 로, 앞뒤 공백 제거, 소문자
// Astro 의 smartypants 가 remark 플러그인보다 먼저 본문의 ' 를 ’ 로 바꾸므로 빌드와 CLI 가 같은 키를 써야 한다
export const linkKey = (s: string): string => s.replace(/[\u2018\u2019\u02BC]/g, "'").trim().toLowerCase()

// 주소용 slug : 폴더는 버리고 파일명만 쓴다 (제목 중복 금지라 겹치지 않는다)
export const slugFromPath = (path: string): string => {
  const Name = path.split('/').pop() ?? path
  return slug(Name.replace(/\.md$/, ''))
}

export const headingSlug = (heading: string): string => slug(heading)
