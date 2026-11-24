// 허브에 놓일 섹션 목록
// 새 섹션은 여기 한 줄 + src/sections/<id>/ 폴더 + src/pages/<id>/index.astro 로 끝난다
export interface Section {
  id: string
  label: string
  href: string
  // 허브 칸에 호버했을 때 칠할 색 : 남보라 → 보라 → 자주 순으로 색상과 밝기가 함께 달라진다
  fill: string
  // 호버 전 아이콘 색 : fill 과 같은 색 계열의 밝은 톤
  tint: string
  // 24x24 stroke 아이콘의 path 목록
  icon: string[]
}

export const Sections: Section[] = [
  {
    id: 'posts',
    label: '글',
    href: '/posts/',
    fill: '#3b2f8f',
    tint: '#9a9cf7',
    icon: ['M4 20h4L19 9l-4-4L4 16z', 'M13 7l4 4'],
  },
  {
    id: 'computer',
    label: '컴퓨터',
    href: '/computer/',
    fill: '#6d28d9',
    tint: '#b197fc',
    icon: ['M3 4h18v12H3z', 'M8 20h8', 'M12 16v4'],
  },
  {
    id: 'algo',
    label: '알고리즘',
    href: '/algo/',
    fill: '#9333ea',
    tint: '#d09bfd',
    icon: [
      'M8 6a2 2 0 1 1-4 0a2 2 0 1 1 4 0',
      'M20 6a2 2 0 1 1-4 0a2 2 0 1 1 4 0',
      'M14 18a2 2 0 1 1-4 0a2 2 0 1 1 4 0',
      'M7.5 7.5l3.5 8.5',
      'M16.5 7.5L13 16',
      'M8 6h8',
    ],
  },
  {
    id: 'games',
    label: '게임',
    href: '/games/',
    fill: '#a21caf',
    tint: '#f09afb',
    icon: ['M7 7h10a5 5 0 0 1 0 10H7a5 5 0 0 1 0-10z', 'M7 10v4', 'M5 12h4', 'M16 11h.01', 'M18 13h.01'],
  },
]

export const findSection = (id: string): Section => {
  const Found = Sections.find((s) => s.id === id)
  if (!Found) throw new Error(`unknown section : ${id}`)
  return Found
}
