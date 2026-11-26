// CD 인쇄면 : 프로젝트마다 64 x 64 도트 키 아트 (임시). 돌릴 때 칸을 직접 읽으므로 그린 결과를 칸 배열로 돌려준다
import { canvas2d, pen, rnd } from './pixel'
import type { Pen } from './pixel'
import type { ProjectId } from './types'

type Draw = (p: Pen, R: () => number) => void

const Draws: Record<ProjectId, Draw> = {
  // 뿌기사주 : 밤하늘에 초승달, 붉은 글씨 부적 두 장
  'ppugi-saju': ({ px, rect, circ, vgrad }, R) => {
    vgrad(0, 0, 64, 64, ['#140a26', '#2a1450', '#5a2a6e'])
    for (let i = 0; i < 26; i++) px('#f6e7b0', (R() * 64) | 0, (R() * 40) | 0)
    circ('#f8d878', 48, 14, 7)
    circ('#2a1450', 51, 11.5, 6)
    // 부적 : 노란 종이 + 붉은 획
    const Talisman = (x: number, y: number) => {
      rect('#7a5410', x + 1, y + 1, 10, 24)
      rect('#f2c94c', x, y, 10, 24)
      rect('#fbe39a', x, y, 10, 1)
      rect('#c0182c', x + 4, y + 3, 2, 6)
      rect('#c0182c', x + 2, y + 10, 6, 1)
      rect('#c0182c', x + 2, y + 13, 6, 1)
      rect('#c0182c', x + 4, y + 15, 2, 6)
      px('#c0182c', x + 3, y + 20)
      px('#c0182c', x + 6, y + 19)
      circ('#c0182c', x + 5, y + 6, 1.4)
    }
    Talisman(8, 12)
    Talisman(14, 34)
    rect('#0c0618', 0, 58, 64, 6)
  },
  // 스킨텔러 : 분홍 바탕에 스포이트 병과 떨어지는 방울, 반짝임
  skinteller: ({ px, rect, circ, vgrad }) => {
    vgrad(0, 0, 64, 64, ['#ffe4ee', '#fbb6ce', '#f472b6', '#9d2a6a'])
    // 병 : 왼쪽 아래
    rect('#5a1838', 10, 30, 16, 24)
    rect('#fff4f8', 11, 31, 14, 22)
    rect('#f9a8c8', 11, 40, 14, 13)
    rect('#ffffff', 12, 32, 2, 18)
    rect('#5a1838', 14, 24, 8, 7)
    rect('#e05a92', 15, 25, 6, 5)
    // 스포이트 고무 : 위
    rect('#5a1838', 15, 14, 6, 11)
    rect('#c03a74', 16, 15, 4, 9)
    px('#f0a0c4', 16, 16)
    // 오른쪽 위 방울
    circ('#5a1838', 46, 18, 6)
    circ('#ffffff', 46, 18, 5)
    circ('#f9c6da', 46, 19, 3.5)
    rect('#5a1838', 45, 9, 3, 4)
    rect('#ffffff', 46, 10, 1, 4)
    px('#ffffff', 44, 16)
    // 반짝임
    for (const [x, y] of [
      [52, 44],
      [40, 52],
      [56, 30],
    ]) {
      px('#ffffff', x, y)
      px('#ffffff', x - 1, y)
      px('#ffffff', x + 1, y)
      px('#ffffff', x, y - 1)
      px('#ffffff', x, y + 1)
    }
  },
  // Pintos : 검은 화면의 초록 터미널, 스레드 막대가 번갈아 돈다
  pintos: ({ px, rect, vgrad }, R) => {
    vgrad(0, 0, 64, 64, ['#04140a', '#062012', '#0a3018'])
    for (let y = 0; y < 64; y += 2) rect('#03100a', 0, y, 64, 1)
    // 프롬프트 줄 : 위쪽
    const Lines = [
      [6, 8, 22],
      [6, 12, 34],
      [6, 16, 16],
    ]
    for (const [x, y, w] of Lines) {
      rect('#2ee66e', x, y, 2, 2)
      for (let k = 4; k < w; k += 2) if (R() > 0.25) rect('#1aa64c', x + k, y, 1, 2)
    }
    rect('#7dffad', 26, 16, 3, 2)
    // 스레드 : 아래쪽 막대 그래프 (실행 중인 하나만 밝게)
    const H = [10, 16, 7, 19, 12, 9]
    H.forEach((h, i) => {
      const X = 8 + i * 8
      rect(i === 3 ? '#7dffad' : '#1f8a46', X, 56 - h, 5, h)
      rect(i === 3 ? '#d8ffe6' : '#2ee66e', X, 56 - h, 5, 1)
    })
    rect('#2ee66e', 4, 57, 56, 1)
  },
  // CarorieWar : 노을 전장 위의 햄버거와 교차한 포크
  'carorie-war': ({ px, rect, circ, vgrad }) => {
    vgrad(0, 0, 64, 64, ['#ffd27a', '#f97316', '#b4301a', '#3a0c08'])
    // 포크 둘 : 위쪽에서 X 자
    for (let k = 0; k < 18; k++) {
      rect('#e8e8f0', 12 + k, 4 + k, 2, 2)
      rect('#e8e8f0', 50 - k, 4 + k, 2, 2)
    }
    for (const x of [8, 11, 14]) rect('#e8e8f0', x, 0, 1, 6)
    for (const x of [50, 53, 56]) rect('#e8e8f0', x, 0, 1, 6)
    // 햄버거 : 아래쪽
    circ('#8a3a10', 32, 46, 14)
    rect('#f97316', 0, 46, 64, 1)
    rect('#c8701e', 18, 40, 28, 6)
    for (let x = 21; x < 44; x += 5) px('#fbe6b0', x, 42)
    rect('#5ac24a', 17, 46, 30, 2)
    rect('#f2c230', 18, 48, 28, 2)
    rect('#5a2410', 18, 50, 28, 4)
    rect('#c8701e', 19, 54, 26, 4)
    rect('#3a0c08', 0, 58, 64, 6)
  },
  // Layered Wiki : 남색 바탕에 비껴 쌓인 문서 석 장
  'layered-wiki': ({ px, rect, vgrad }) => {
    vgrad(0, 0, 64, 64, ['#0c1238', '#1c2a7a', '#4361ee'])
    const Sheet = (x: number, y: number, c: string, hi: string) => {
      rect('#060a24', x + 1, y + 1, 18, 22)
      rect(c, x, y, 18, 22)
      rect(hi, x, y, 18, 1)
      for (let k = 0; k < 4; k++) rect('#8090d8', x + 3, y + 5 + k * 4, k % 2 ? 9 : 12, 1)
    }
    Sheet(6, 6, '#a8b4f0', '#d6ddff')
    Sheet(12, 12, '#c6cff8', '#eef1ff')
    Sheet(40, 36, '#e6eaff', '#ffffff')
    // 문서 사이를 잇는 링크 점선
    for (let k = 0; k < 10; k++) px('#bfe7ff', 32 + k, 30 + k)
    px('#ffffff', 52, 40)
  },
}

// 씨앗이 고정이라 늘 같은 그림이다 : 방에 다시 들어올 때마다 캔버스를 만들어 그리지 않고 처음 그린 칸 배열을 다시 쓴다 (읽기만 한다)
let Cache: Record<ProjectId, Uint8ClampedArray> | null = null
export const makeArts = (): Record<ProjectId, Uint8ClampedArray> => {
  if (Cache) return Cache
  const Out = {} as Record<ProjectId, Uint8ClampedArray>
  for (const id of Object.keys(Draws) as ProjectId[]) {
    const [Cv, X] = canvas2d(64, 64)
    Draws[id](pen(X), rnd(7))
    Out[id] = X.getImageData(0, 0, 64, 64).data
    Cv.width = Cv.height = 0
  }
  return (Cache = Out)
}
