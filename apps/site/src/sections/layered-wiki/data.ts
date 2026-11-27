// 설명 탭 목차 : 수업 사이트 "개인별 프로젝트" 위키의 주차 순서와 제목 그대로
// 본문은 weeks/<주차>-<판>.md 에서 읽고, 파일이 없는 주차는 목차에서 흐리게 보인다
export interface Week {
  week: number
  title: string
}

export const Weeks: Week[] = [
  { week: 1, title: '문제 정의서' },
  { week: 2, title: '문제 정의서 수정, ReAct 흐름도' },
  { week: 3, title: 'Dify flow' },
  { week: 5, title: '역할 통신 설계도' },
  { week: 6, title: '모델 선택 근거' },
  { week: 7, title: '설계 명세서' },
  { week: 8, title: 'MVP 개선 로드맵' },
  { week: 10, title: 'Hermes Agent' },
  { week: 11, title: '인용 기반 Q&A (Dify)' },
]

export const RepoUrl = 'https://github.com/Yeonb0/layered-wiki-harness'

// 시연 API : 발표 PC 의 하니스 serve.demo_api (--cors-origin https://yeonbora.dev)
export const ApiBase = 'http://localhost:8090'
export const DemoSrc = '/projects/layered-wiki/demo/index.html'

// 주차 번호를 해시 · 파일 이름에 쓰는 두 자리로
export const pad = (n: number) => String(n).padStart(2, '0')
