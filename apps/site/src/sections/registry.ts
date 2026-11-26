// 사이트의 섹션 (방) 목록
// 새 섹션은 여기 한 줄 + src/sections/<id>/ 폴더 + src/pages/<id>/index.astro 로 끝난다
export interface Section {
  id: string
  label: string
  // 허브 칸에 호버했을 때 아이콘 아래에 보이는 영어 이름
  en: string
  href: string
  // 허브에 칸으로 놓이는지 : 서재 (posts) 처럼 허브 밖에서 들어가는 섹션은 false
  hub: boolean
  // 허브 칸에 호버했을 때 칠할 색 : 허브 순서대로 남보라 → 보라 → 자주로 색상과 밝기가 함께 달라진다
  fill: string
  // 호버 전 아이콘 색 : fill 과 같은 색 계열의 밝은 톤
  tint: string
  // 24x24 stroke 아이콘의 path 목록
  icon: string[]
}

export const Sections: Section[] = [
  {
    id: 'school',
    label: '학교',
    en: 'School',
    href: '/school/',
    hub: true,
    fill: '#3b2f8f',
    tint: '#9a9cf7',
    // 학사모
    icon: ['M2 9l10-5 10 5-10 5z', 'M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5', 'M22 9v6'],
  },
  {
    id: 'computer',
    label: '컴퓨터',
    en: 'Computer',
    href: '/computer/',
    hub: true,
    fill: '#5530c0',
    tint: '#a8a0fb',
    icon: ['M3 4h18v12H3z', 'M8 20h8', 'M12 16v4'],
  },
  {
    id: 'philosophy',
    label: '철학',
    en: 'Philosophy',
    href: '/philosophy/',
    hub: true,
    fill: '#6d28d9',
    tint: '#b197fc',
    // 전구 : 유리구 + 받침 3줄 + 필라멘트
    icon: [
      'M9 16.5c0-1.6-.6-2.6-1.6-3.7A5.5 5.5 0 1 1 16.6 12.8c-1 1.1-1.6 2.1-1.6 3.7',
      'M9 16.5h6',
      'M9.5 19h5',
      'M10.5 21.5h3',
      'M10.5 16.5V13l1.5 1 1.5-1v3.5',
    ],
  },
  {
    id: 'religion',
    label: '종교학',
    en: 'Religion',
    href: '/religion/',
    hub: true,
    fill: '#9333ea',
    tint: '#d09bfd',
    // 연꽃 : 좌우 대칭 꽃잎 5장 + 수면 2줄
    icon: [
      'M12 4C9.5 6.5 9.5 10.5 12 14C14.5 10.5 14.5 6.5 12 4z',
      'M12 14C8.5 13.5 6 11 5.5 7.5C8.5 8 10.5 10 12 14z',
      'M12 14C15.5 13.5 18 11 18.5 7.5C15.5 8 13.5 10 12 14z',
      'M12 14C8 15.5 4 14.5 2.5 11.5C5 11 8 12 12 14z',
      'M12 14C16 15.5 20 14.5 21.5 11.5C19 11 16 12 12 14z',
      'M5 17.5h14',
      'M8 20h8',
    ],
  },
  {
    id: 'algo',
    label: '알고리즘',
    en: 'Algorithm',
    href: '/algo/',
    hub: true,
    fill: '#a21caf',
    tint: '#f09afb',
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
    id: 'projects',
    label: '프로젝트',
    en: 'Project',
    href: '/projects/',
    hub: true,
    fill: '#86198f',
    tint: '#e7a3f5',
    // CD : 원판 + 가운데 구멍 + 빛 받은 호
    icon: ['M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0', 'M14.5 12a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0', 'M12 6.5a5.5 5.5 0 0 1 5.5 5.5'],
  },
  {
    // 서재 : 모든 글의 공통 목록. 허브 입구 위치는 미정
    id: 'posts',
    label: '서재',
    en: 'Library',
    href: '/posts/',
    hub: false,
    fill: '#3b2f8f',
    tint: '#9a9cf7',
    // 펼친 책
    icon: ['M2 5c3-1 7-1 10 1v14c-3-2-7-2-10-1z', 'M22 5c-3-1-7-1-10 1v14c3-2 7-2 10-1z'],
  },
]

// 허브에 놓이는 칸 : 데스크톱 3 x 2, 모바일 2 x 3
export const HubSections: Section[] = Sections.filter((s) => s.hub)

export const findSection = (id: string): Section => {
  const Found = Sections.find((s) => s.id === id)
  if (!Found) throw new Error(`unknown section : ${id}`)
  return Found
}
