// 학교 방 임시 데이터 : Phase 2 에서 courses collection 으로 옮긴다
// 학년 기준 : 2022 ~ 2024년 1 ~ 3학년, 2026년 4학년, 2027년 (예정) 5학년

export type CategoryKey = 'gen' | 'phil' | 'rel' | 'cse'

export interface Year {
  n: number
  color: string
  // 학년 색이 밝아서 분류 색을 검정 쪽으로 섞어야 하는 학년
  light: boolean
  courses: string[]
}

export const Years: Year[] = [
  {
    n: 1,
    color: '#FFB400',
    light: true,
    courses: ['현대동아시아의형성', '성찰과성장', '알바트로스세미나', '동서고전세미나', '독일언어와문화I', '동양철학개론', '논리학개론', '세계종교입문', '프랑스언어와문화I', '한국철학사', '서양고대철학사', '소크라테스이전철학과소크라테스철학', '한국그리스도교의이해', '중국문화속의유교와도교', '법과지식재산'],
  },
  {
    n: 2,
    color: '#7209B7',
    light: false,
    courses: ['문화유산현장실습1', '서양철학사', '플라톤철학', '근현대중국철학사2', '힌두교의이해', '고대근동의종교', '도교의중심사상', '철학적인간학', '독일언어와문화II', '아리스토텔레스철학', '위진·당철학사', '힌두교강독', '과학사', '기초인공지능프로그래밍', '인문사회글쓰기'],
  },
  {
    n: 3,
    color: '#3A0CA3',
    light: false,
    courses: ['기초C언어', '도가철학', '유가철학', '칸트철학', '종교의이해', '미적분학I', '이산구조', '디지털회로개론', 'JAVA언어', '자료구조', '선형대수학', '종교학답사I', '디지털 시대의 종교', '종교연구방법론'],
  },
  {
    n: 4,
    color: '#4361EE',
    light: false,
    courses: ['컴퓨터시스템개론', '컴퓨터아키텍처', '프로그래밍언어', '기초머신러닝', '기초컴퓨터그래픽스', '컴퓨터네트워크', '알고리즘설계와분석', '운영체제', '기초컴파일러구성', '소프트웨어공학', '실전 AI 에이전트 시스템 설계 · 구축', '종교간의대화', '그리스도교강독'],
  },
  {
    n: 5,
    color: '#4CC9F0',
    light: true,
    courses: ['데이터베이스시스템', '시스템프로그래밍', 'Creative Solution'],
  },
]

export const Categories: { key: CategoryKey; label: string }[] = [
  { key: 'gen', label: '교양' },
  { key: 'phil', label: '철학' },
  { key: 'rel', label: '종교학' },
  { key: 'cse', label: '컴퓨터공학' },
]

// 여기 없는 과목은 교양
const Members: Record<Exclude<CategoryKey, 'gen'>, string[]> = {
  phil: ['동양철학개론', '논리학개론', '한국철학사', '서양고대철학사', '소크라테스이전철학과소크라테스철학', '서양철학사', '플라톤철학', '근현대중국철학사2', '아리스토텔레스철학', '위진·당철학사', '도가철학', '유가철학', '칸트철학'],
  rel: ['세계종교입문', '한국그리스도교의이해', '중국문화속의유교와도교', '힌두교의이해', '고대근동의종교', '도교의중심사상', '힌두교강독', '종교의이해', '종교학답사I', '디지털 시대의 종교', '종교연구방법론', '종교간의대화', '그리스도교강독'],
  cse: ['기초C언어', '이산구조', '디지털회로개론', 'JAVA언어', '자료구조', '컴퓨터시스템개론', '컴퓨터아키텍처', '프로그래밍언어', '기초머신러닝', '기초컴퓨터그래픽스', '컴퓨터네트워크', '알고리즘설계와분석', '운영체제', '기초컴파일러구성', '소프트웨어공학', '실전 AI 에이전트 시스템 설계 · 구축', '데이터베이스시스템', '시스템프로그래밍'],
}

export const categoryOf = (course: string): CategoryKey => {
  if (Members.phil.includes(course)) return 'phil'
  if (Members.rel.includes(course)) return 'rel'
  if (Members.cse.includes(course)) return 'cse'
  return 'gen'
}

// 분류 색 : 학년 색에 흰색 (밝은 학년은 검정) 을 분류 순서대로 더 많이 섞는다
export const categoryColor = (year: Year, index: number): string => {
  let t = year.light ? [0.38, 0.5, 0.62, 0.74][index] : [0.12, 0.24, 0.36, 0.48][index]
  let mix = year.light ? 0 : 255
  if (year.n === 2) t = [0.28, 0.36, 0.42, t][index]
  if (year.n === 4 && index === 2) {
    t = 0.3
    mix = 0
  }
  if (year.n === 4 && index === 3) t = 0.34
  const Rgb = [1, 3, 5].map((k) => Math.round(parseInt(year.color.slice(k, k + 2), 16) * (1 - t) + mix * t))
  return `rgb(${Rgb.join(', ')})`
}

// 과목 이름의 글자 폭 (한글 1, 영문 · 숫자 0.6, 공백 0.35)
export const nameUnits = (name: string): number => {
  let u = 0
  for (const ch of name) u += ch === ' ' ? 0.35 : ch.charCodeAt(0) < 128 ? 0.6 : 1
  return u
}
