// 허브에 놓일 섹션 목록
// 새 섹션은 여기 한 줄 + src/sections/<id>/ 폴더 + src/pages/<id>/index.astro 로 끝난다
export interface Section {
  id: string
  label: string
  href: string
  glyph: string
}

export const Sections: Section[] = [
  { id: 'posts', label: '글', href: '/posts/', glyph: '✎' },
  { id: 'computer', label: '컴퓨터', href: '/computer/', glyph: '⌨' },
  { id: 'algo', label: '알고리즘', href: '/algo/', glyph: '◇' },
  { id: 'games', label: '게임', href: '/games/', glyph: '◈' },
]

export const findSection = (id: string): Section => {
  const Found = Sections.find((s) => s.id === id)
  if (!Found) throw new Error(`unknown section : ${id}`)
  return Found
}
