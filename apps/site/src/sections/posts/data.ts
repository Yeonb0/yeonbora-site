// 기술 블로그 바탕화면의 폴더 : 깃블로그 카테고리 그대로, posts frontmatter 의 topic 으로 나눈다
import type { Tier } from './desk'

export interface Folder {
  id: string
  name: string
  // 이 폴더로 모이는 topic 값 (소문자로 비교)
  topics: string[]
  // 24 x 24 stroke 글리프
  glyph: string
}

const Circle = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`

export const Glyphs = {
  recent: Circle(12, 12, 8) + 'M12 8v4l3 2',
  cpp: 'M13 8a5 5 0 1 0 0 8M16 12h5M18.5 9.5v5',
  java: 'M6 10h10v5a4 4 0 0 1 -4 4h-2a4 4 0 0 1 -4 -4zM16 11h1.5a2 2 0 0 1 0 4H16M9 4c0 2 2 2 2 4M13 4c0 2 2 2 2 4',
  pl: 'M8 8l-4 4l4 4M16 8l4 4l-4 4M14 5l-4 14',
  language: 'M4 5h16v11H10l-4 4v-4H4zM8 9h8M8 12h5',
  ds: 'M4 5h16v4H4zM4 10h16v4H4zM4 15h16v4H4z',
  dm: 'M4 18l4 -12l4 12M14 12h6M17 9l3 3l-3 3',
  algorithm: Circle(12, 5, 2) + Circle(6, 18, 2) + Circle(18, 18, 2) + 'M12 7v4M12 11l-5 5M12 11l5 5',
  os: 'M4 5h16v14H4zM4 9h16M7 7h0.01M10 7h0.01',
  system: 'M7 7h10v10H7zM10 10h4v4h-4zM9 4v3M12 4v3M15 4v3M9 17v3M12 17v3M15 17v3M4 9h3M4 12h3M4 15h3M17 9h3M17 12h3M17 15h3',
  network: Circle(12, 5, 2) + Circle(5, 18, 2) + Circle(19, 18, 2) + 'M11 7l-5 9M13 7l5 9M7 18h10',
  architecture: 'M3 8h5v8H3zM10 8h4v8h-4zM16 8h5v8h-5zM8 12h2M14 12h2',
  graphics: 'M12 4l8 15H4zM8 11.5l4 7.5l4 -7.5z',
  devlog: 'M4 6h16v12H4zM7 10l3 2l-3 2M12 15h5',
  boj: 'M8 4h8v5a4 4 0 0 1 -8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1 -3 4M12 13v4M9 20h6',
  gem: 'M7 4h10l4 5l-9 11L3 9zM3 9h18M10 4l-2 5l4 11M14 4l2 5l-4 11',
  etc: Circle(6, 12, 1) + Circle(12, 12, 1) + Circle(18, 12, 1),
}

export const Folders: Folder[] = [
  { id: 'cpp', name: 'C / C++', topics: ['c-cpp', 'cpp', 'c', 'c++'], glyph: Glyphs.cpp },
  { id: 'java', name: 'Java', topics: ['java'], glyph: Glyphs.java },
  { id: 'pl', name: 'Programming Language', topics: ['programming-language', 'pl'], glyph: Glyphs.pl },
  // 언어 자체를 익힌 글 (CSS · HTML · JavaScript 시리즈), 프로그래밍 언어론은 위 pl 폴더에 따로 둔다
  { id: 'language', name: 'Language', topics: ['web', 'language'], glyph: Glyphs.language },
  { id: 'ds', name: 'Data Structure', topics: ['data-structure', 'ds'], glyph: Glyphs.ds },
  { id: 'dm', name: 'Discrete Math', topics: ['discrete-math', 'dm'], glyph: Glyphs.dm },
  { id: 'algorithm', name: 'Algorithm', topics: ['algorithm'], glyph: Glyphs.algorithm },
  { id: 'os', name: 'Operating System', topics: ['os', 'operating-system', 'operation-system'], glyph: Glyphs.os },
  { id: 'system', name: 'Computer System', topics: ['computer-system', 'system'], glyph: Glyphs.system },
  { id: 'network', name: 'Network', topics: ['network'], glyph: Glyphs.network },
  { id: 'architecture', name: 'Computer Architecture', topics: ['computer-architecture', 'architecture'], glyph: Glyphs.architecture },
  { id: 'graphics', name: 'Graphics', topics: ['computer-graphics', 'graphics'], glyph: Glyphs.graphics },
  { id: 'devlog', name: 'DevLog', topics: ['devlog'], glyph: Glyphs.devlog },
  { id: 'boj', name: 'BOJ', topics: ['boj'], glyph: Glyphs.boj },
]

export const EtcFolder: Folder = { id: 'etc', name: '기타', topics: [], glyph: Glyphs.etc }
export const RecentFolder = { id: 'recent', name: '최근 글', glyph: Glyphs.recent }

// 처음 열려 있는 폴더
export const DefaultFolder = 'network'

// 깃블로그 사이드바의 티어 색 : [선 · 글자, 어두운 바탕, 선택 바탕]
export const TierColors: Record<Tier, [string, string, string]> = {
  Bronze: ['#996C53', '#3a2a22', '#4a352a'],
  Silver: ['#DCDCDC', '#38383f', '#47474f'],
  Gold: ['#FFEE8B', '#3d3a24', '#4d4930'],
  Platinum: ['#A9FFB0', '#263a2a', '#304a35'],
}
