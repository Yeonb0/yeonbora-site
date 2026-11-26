// 프로필 내용 : 깃허브 프로필 README 에 있던 자기소개를 옮겨 왔다

export interface Row {
  k: string
  v: string
  href?: string
}

export const Me = {
  name: 'Boyeon Kim',
  handle: '@Yeonb0',
  motto: 'PER ASPERA AD ASTRA',
  intro:
    '서강대학교에서 컴퓨터공학 · 철학 · 종교학을 함께 공부하고 있습니다. 모바일 · 웹 프론트엔드를 중심으로 만들고, 만든 것과 배운 것을 글과 위키로 쌓아 둡니다.',
}

export const Stack: Row[] = [
  { k: 'Mobile', v: 'React Native, Expo, TypeScript, TanStack Query, Zustand' },
  { k: 'Web', v: 'Next.js, React, Astro, HTML / CSS' },
  { k: 'Backend', v: 'Spring Boot, Java, JPA, Flyway, PostgreSQL / MySQL' },
  { k: 'Systems', v: 'C / C++, Pintos, x86-64 Assembly' },
  { k: 'AI · Tooling', v: 'Python, Dify, llama.cpp, Jupyter' },
  { k: 'Knowledge', v: 'Obsidian, Quartz, Notion, GitHub Actions' },
]

export const Projects: Row[] = [
  {
    k: 'SkinTeller',
    v: '피부 반응으로 나에게 맞는 화장품을 찾는 스킨케어 분석 앱. 프론트엔드 단독 담당',
    href: 'https://github.com/Yeonb0/hackerthon-team-ildangbaek',
  },
  { k: '뿌기사주', v: '수험생을 위한 수능 응원 사주 + 합격 부적 웹서비스', href: 'https://ppugi-saju.kr' },
  { k: '라멘티드', v: '평점이 가게가 아니라 라멘 한 그릇에 붙는 기록 지도 앱', href: 'https://github.com/Yeonb0/ramented' },
  { k: 'Layered Wiki', v: '개인 · 팀 · 전사 3계층 위키 에이전트 평가 하네스', href: 'https://github.com/Yeonb0/layered-wiki-harness' },
  { k: 'Pintos', v: '운영체제 수업 프로젝트', href: 'https://github.com/Yeonb0/2026-Operating-System' },
]

export const Activities: Row[] = [
  { k: '4학년', v: '멋쟁이 사자처럼 14기 프론트엔드 · 중앙 해커톤 · 창업경진대회' },
  { k: '4학년', v: 'AI/ML · Spring · 서버 엔지니어 · 정보처리기사 스터디' },
  { k: '2 ~ 3학년', v: 'SGAEM' },
  { k: '1 ~ 2학년', v: '난섹션 학생회' },
  { k: '1학년', v: '서만창 · 철학 개론 · 분석 철학 · 니체 강독 · 맹자 강독 스터디' },
]

export const Contact: Row[] = [
  { k: 'GitHub', v: 'GitHub', href: 'https://github.com/Yeonb0' },
  { k: 'Email', v: 'kby7576@sogang.ac.kr', href: 'mailto:kby7576@sogang.ac.kr' },
]
