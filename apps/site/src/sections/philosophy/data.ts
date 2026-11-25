// 철학 방 임시 데이터 : Phase 2 에서 posts collection (field : philosophy, topic) 으로 옮긴다
// 중세 · 현대 · 불가 · 제자백가는 일단 비워 둔다 (빈 액자 3개)
import type { Philosopher } from './types'

export const Philosophers: Philosopher[] = [
  // 고대 : 소크라테스 · 플라톤 · 아리스토텔레스는 크게, 소크라테스 이전 철학자들은 작게
  { id: 'socrates', name: '소크라테스', label: 'SOCRATES', wing: 'west', room: 'ancient', weight: 3, posts: [] },
  { id: 'plato', name: '플라톤', label: 'PLATO', wing: 'west', room: 'ancient', weight: 3, pair: 'aristotle', posts: [] },
  { id: 'aristotle', name: '아리스토텔레스', label: 'ARISTOTLE', wing: 'west', room: 'ancient', weight: 3, posts: [] },
  { id: 'thales', name: '탈레스', label: 'THALES', wing: 'west', room: 'ancient', weight: 1, posts: [] },
  { id: 'pythagoras', name: '피타고라스', label: 'PYTHAGORAS', wing: 'west', room: 'ancient', weight: 1, posts: [] },
  { id: 'heraclitus', name: '헤라클레이토스', label: 'HERACLITUS', wing: 'west', room: 'ancient', weight: 1, posts: [] },
  { id: 'parmenides', name: '파르메니데스', label: 'PARMENIDES', wing: 'west', room: 'ancient', weight: 1, posts: [] },
  { id: 'democritus', name: '데모크리토스', label: 'DEMOCRITUS', wing: 'west', room: 'ancient', weight: 1, posts: [] },
  // 근대
  { id: 'kant', name: '칸트', label: 'KANT', wing: 'west', room: 'modern', weight: 3, posts: [] },
  // 유가
  { id: 'confucius', name: '공자', label: '孔子', wing: 'east', room: 'confucian', weight: 3, posts: [] },
  { id: 'mencius', name: '맹자', label: '孟子', wing: 'east', room: 'confucian', weight: 3, posts: [] },
  { id: 'xunzi', name: '순자', label: '荀子', wing: 'east', room: 'confucian', weight: 3, posts: [] },
  { id: 'zhuxi', name: '주희', label: '朱熹', wing: 'east', room: 'confucian', weight: 2, posts: [] },
  { id: 'yihwang', name: '이황', label: '李滉', wing: 'east', room: 'confucian', weight: 2, posts: [] },
  { id: 'yii', name: '이이', label: '李珥', wing: 'east', room: 'confucian', weight: 2, posts: [] },
  // 도가
  { id: 'laozi', name: '노자', label: '老子', wing: 'east', room: 'daoist', weight: 3, posts: [] },
  { id: 'zhuangzi', name: '장자', label: '莊子', wing: 'east', room: 'daoist', weight: 3, posts: [] },
  { id: 'wangbi', name: '왕필', label: '王弼', wing: 'east', room: 'daoist', weight: 1, posts: [] },
]
