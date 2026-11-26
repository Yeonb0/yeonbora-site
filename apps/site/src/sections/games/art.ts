// CD 인쇄면 : 게임마다 64 x 64 도트 키 아트 (임시). 돌릴 때 칸을 직접 읽으므로 그린 결과를 칸 배열로 돌려준다
import { canvas2d, pen, rnd } from './pixel'
import type { Pen } from './pixel'
import type { GameId } from './types'

type Draw = (p: Pen, R: () => number) => void

const Draws: Record<GameId, Draw> = {
  'exorcism-school': ({ px, rect, circ, vgrad }, R) => {
    vgrad(0, 0, 64, 64, ['#120818', '#2a0c22', '#5a1426'])
    for (let i = 0; i < 22; i++) px('#e8d8c8', (R() * 64) | 0, (R() * 34) | 0)
    circ('#c8283a', 45, 17, 9)
    circ('#e04a52', 43.5, 15.5, 6.5)
    px('#a01e2e', 46, 19)
    px('#a01e2e', 42, 14)
    px('#a01e2e', 48, 14)
    // 부적
    rect('#efe0b0', 9, 8, 7, 19)
    rect('#b3182a', 12, 10, 1, 6)
    rect('#b3182a', 10, 17, 5, 1)
    rect('#b3182a', 12, 19, 1, 6)
    px('#b3182a', 11, 23)
    px('#b3182a', 13, 22)
    // 학교 지붕과 건물
    rect('#0a0510', 0, 52, 64, 12)
    for (let y = 30; y < 40; y++) {
      const Hw = (y - 30) * 2.6 + 4
      rect('#0a0510', 32 - Hw, y, Hw * 2, 1)
    }
    rect('#0a0510', 13, 40, 38, 12)
    for (let x = 17; x < 48; x += 4) {
      px(x % 8 ? '#f2c66d' : '#3a2020', x, 43)
      px(x % 12 ? '#3a2020' : '#f2c66d', x, 47)
    }
    rect('#f2c66d', 30, 48, 3, 4)
  },
  factory: ({ px, rect, circ, vgrad }) => {
    vgrad(0, 0, 64, 64, ['#ffd27a', '#f39a33', '#b4481a', '#5a1f0c'])
    circ('#fff0b8', 34, 27, 8)
    // 굴뚝 연기
    for (const [x, y, r] of [
      [20, 11, 3],
      [23, 7, 4],
      [27, 4, 3],
      [45, 14, 3],
      [48, 9, 4],
    ])
      circ('#e9d4c0', x, y, r)
    rect('#2a1208', 18, 14, 4, 24)
    rect('#2a1208', 44, 18, 4, 20)
    rect('#2a1208', 8, 38, 48, 14)
    // 톱니 지붕
    for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) rect('#2a1208', 8 + i * 8, 34 + k, 8 - k * 2, 1)
    for (let x = 12; x < 54; x += 5) px('#ffb347', x, 43)
    // 컨베이어
    rect('#3a2a22', 0, 53, 64, 4)
    for (let x = 1; x < 64; x += 4) px('#7a5a48', x, 55)
    for (const x of [6, 22, 38, 54]) {
      rect('#c98a4a', x, 49, 5, 4)
      px('#e0a868', x, 49)
    }
    rect('#1a0c06', 0, 57, 64, 7)
  },
  'fake-mmo': ({ px, rect, circ, vgrad }, R) => {
    vgrad(0, 0, 64, 64, ['#070b2a', '#141f66', '#2c3fa6'])
    for (let i = 0; i < 40; i++) px(R() > 0.7 ? '#bfe7ff' : '#ffffff', (R() * 64) | 0, (R() * 40) | 0)
    circ('#f4f1ff', 48, 14, 6)
    circ('#0b1240', 50.5, 12, 5)
    for (let x = 0; x < 64; x++) {
      const Y = Math.round(47 - 6 * Math.sin((x / 64) * Math.PI))
      rect('#0b1030', x, Y, 1, 64 - Y)
    }
    // 성 : 가운데 구멍에 가리지 않게 오른쪽 아래 언덕 위에
    rect('#0e1438', 40, 38, 16, 10)
    rect('#0e1438', 38, 32, 4, 16)
    rect('#0e1438', 54, 32, 4, 16)
    rect('#0e1438', 45, 28, 6, 10)
    for (const [x, y] of [
      [39, 31],
      [55, 31],
      [46, 27],
      [49, 27],
    ])
      px('#0e1438', x, y)
    rect('#0e1438', 47, 23, 1, 4)
    px('#f472b6', 48, 23)
    px('#f472b6', 49, 23)
    px('#f472b6', 48, 24)
    for (const [x, y] of [
      [39, 36],
      [55, 36],
      [47, 32],
      [44, 42],
      [51, 42],
      [47, 42],
    ])
      px('#ffd76d', x, y)
    // 작은 기사
    rect('#0b1030', 14, 44, 2, 4)
    px('#0b1030', 14, 43)
    rect('#c8c9d4', 17, 41, 1, 5)
    // HP · MP 막대
    rect('#000000', 4, 4, 18, 3)
    rect('#e0443e', 5, 5, 13, 1)
    rect('#000000', 4, 8, 14, 3)
    rect('#3e7be0', 5, 9, 8, 1)
  },
  'cheer-typing': ({ px, rect, circ, vgrad }, R) => {
    vgrad(0, 0, 64, 64, ['#0b1236', '#1d2a6e', '#3a2a7a'])
    // 조명탑
    for (const [x, y] of [
      [6, 4],
      [55, 4],
    ]) {
      rect('#2a2a3a', x + 1, y + 3, 2, 20)
      rect('#fff7c2', x - 1, y, 6, 3)
      circ('rgba(255,247,194,0.25)', x + 2, y + 1, 7)
    }
    // 관중석
    for (let y = 26; y < 37; y++)
      for (let x = 0; x < 64; x++) px(R() > 0.55 ? ['#f472b6', '#fde047', '#ffffff', '#a78bfa'][(R() * 4) | 0] : '#1a1430', x, y)
    // 잔디와 내야
    for (let y = 37; y < 64; y++) rect((y >> 2) & 1 ? '#2f8f4a' : '#38a356', 0, y, 64, 1)
    for (let y = 42; y < 64; y++) {
      const Hw = (y - 42) * 1.1
      rect('#c98a5a', 32 - Hw, y, Hw * 2, 1)
    }
    for (let y = 47; y < 60; y++) {
      const Hw = Math.max(0, 6 - Math.abs(y - 53))
      if (Hw) rect('#38a356', 32 - Hw, y, Hw * 2, 1)
    }
    px('#ffffff', 32, 44)
    px('#ffffff', 22, 53)
    px('#ffffff', 42, 53)
    rect('#ffffff', 31, 61, 3, 1)
  },
}

export const makeArts = (): Record<GameId, Uint8ClampedArray> => {
  const Out = {} as Record<GameId, Uint8ClampedArray>
  for (const id of Object.keys(Draws) as GameId[]) {
    const [, X] = canvas2d(64, 64)
    Draws[id](pen(X), rnd(7))
    Out[id] = X.getImageData(0, 0, 64, 64).data
  }
  return Out
}
