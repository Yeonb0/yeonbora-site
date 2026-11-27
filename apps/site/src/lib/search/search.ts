// 허브 검색 : 빌드 때 만든 색인 (search-index.json) 을 브라우저에서 거른다
export interface SearchItem {
  kind: 'blog' | 'wiki'
  title: string
  href: string
  // 본문 앞부분 (마크다운을 걷어낸 글자)
  text: string
  aliases: string[]
  tags: string[]
  // 결과 칩 : 블로그는 인문 / 기술, 위키는 카테고리 이름
  label: string
  // 블로그 : hum · tech
  section?: 'hum' | 'tech'
  date?: string
}

// 마크다운 → 한 줄 글자. 위키 링크는 보이는 글자만, 그림 · 코드 블록은 뺀다
export const plainText = (md: string, max: number): string => {
  const S = md
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, ' ')
    .replace(/<!--[\s\S]*?-->|%%[\s\S]*?%%/g, ' ')
    .replace(/!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\[([^\]|#]*)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_, t: string, l?: string) => l ?? t)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    // 표 : 구분 줄은 빼고 칸 나눔 | 은 띄어쓰기로
    .replace(/^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-*:?\s*$/gm, ' ')
    .replace(/\|/g, ' ')
    // 수식 명령 \text{} · \frac{}{} 등 : 명령 이름과 괄호만 걷어낸다
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/(\*\*|__|==|~~|`|\$+|\*|_)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return S.length > max ? `${S.slice(0, max)}…` : S
}

const has = (s: string, w: string) => s.toLowerCase().includes(w)

// 모든 낱말이 들어 있는 것만, 점수 순 (제목이 같음 > 제목 시작 > 제목 포함 > 별칭 · 태그 > 본문)
export const searchItems = (Items: SearchItem[], query: string): SearchItem[] => {
  const Q = query.trim().toLowerCase()
  if (!Q) return []
  const Words = Q.split(/\s+/)
  const Scored: [number, number, SearchItem][] = []
  Items.forEach((It, i) => {
    const T = It.title.toLowerCase()
    const Extra = [...It.aliases, ...It.tags].join(' ').toLowerCase()
    if (!Words.every((w) => has(T, w) || has(Extra, w) || has(It.text, w))) return
    let Score = 0
    if (T === Q) Score += 100
    if (T.startsWith(Q)) Score += 40
    for (const w of Words) Score += has(T, w) ? 20 : has(Extra, w) ? 10 : 2
    Scored.push([Score, i, It])
  })
  return Scored.sort((a, b) => b[0] - a[0] || a[1] - b[1]).map((x) => x[2])
}
