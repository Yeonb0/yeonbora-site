// 프로젝트 방 데이터 : 공개 저장소와 출시한 서비스만 넣는다 (비공개 저장소는 방문자에게 404 라 뺀다)
// 순서 = TV 화면 속 CD 순서
import type { Project, ProjectId } from './types'

export const Projects: Project[] = [
  { id: 'ppugi-saju', en: 'Ppugi Saju', color: '#e0a92e', href: 'https://ppugi-saju.kr' },
  { id: 'skinteller', en: 'SkinTeller', color: '#f472b6', href: 'https://github.com/Yeonb0/hackerthon-team-ildangbaek' },
  { id: 'pintos', en: 'Pintos', color: '#22c55e', href: 'https://github.com/Yeonb0/2026-Operating-System' },
  { id: 'carorie-war', en: 'CarorieWar', color: '#f97316', href: 'https://github.com/channi3714/CarorieWar' },
  { id: 'layered-wiki', en: 'Layered Wiki', color: '#4361ee', href: 'https://github.com/Yeonb0/layered-wiki-harness' },
]

export const ProjectIds = Projects.map((p) => p.id) as ProjectId[]
