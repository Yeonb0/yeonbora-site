// 프로젝트 방 데이터 : 공개 저장소와 출시한 서비스, 사이트 안 프로젝트 페이지만 넣는다 (비공개 저장소는 방문자에게 404 라 뺀다)
// 순서 = TV 화면 속 CD 순서
import type { Project, ProjectId } from './types'

export const Projects: Project[] = [
  { id: 'ppugi-saju', en: 'Ppugi Saju', color: '#8cc06a', href: 'https://ppugi-saju.kr' },
  { id: 'skinteller', en: 'SkinTeller', color: '#9b8cf5', href: 'https://github.com/Yeonb0/hackerthon-team-ildangbaek' },
  { id: 'pintos', en: 'Pintos', color: '#22c55e', href: 'https://github.com/Yeonb0/2026-Operating-System' },
  { id: 'carorie-war', en: 'CarorieWar', color: '#e1272e', href: 'https://github.com/channi3714/CarorieWar' },
  { id: 'layered-wiki', en: 'Layered Wiki', color: '#a88bfa', href: '/projects/layered-wiki/' },
]

export const ProjectIds = Projects.map((p) => p.id) as ProjectId[]
