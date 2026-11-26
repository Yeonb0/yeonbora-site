// 도트 그리기 도구 : 한 칸씩 찍기, 사각형, 원, 4 x 4 디더링 세로 그라데이션
import { hex } from './sky'

export const Bayer = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

export type Pen = ReturnType<typeof pen>

const HexRe = /^#[0-9a-f]{6}$/i

export const pen = (ctx: CanvasRenderingContext2D) => {
  const px = (c: string, x: number, y: number) => {
    ctx.fillStyle = c
    ctx.fillRect(x, y, 1, 1)
  }
  const rect = (c: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = c
    ctx.fillRect(x, y, w, h)
  }
  const circ = (c: string, cx: number, cy: number, r: number) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) px(c, x, y)
  }
  // 판 전체를 칸마다 fillRect 하면 (창밖 62 x 90 = 5,580 번) 비 · 눈 오는 동안 매 프레임 그만큼 부른다 : 칸 배열에 쓰고 한 번에 붙인다
  // (색이 모두 불투명한 #rrggbb 일 때만. 불투명한 색을 덮어 칠하는 것과 칸을 바꿔 넣는 것은 결과가 같다)
  let Buf: ImageData | null = null
  const vgrad = (x0: number, y0: number, w: number, h: number, Stops: string[]) => {
    if (Number.isInteger(x0) && Number.isInteger(y0) && Stops.every((c) => HexRe.test(c))) {
      if (!Buf || Buf.width !== w || Buf.height !== h) Buf = ctx.createImageData(w, h)
      const D = Buf.data
      const Rgb = Stops.map(hex)
      for (let y = y0; y < y0 + h; y++) {
        const T = ((y - y0) / Math.max(1, h - 1)) * (Stops.length - 1)
        const I = Math.min(Stops.length - 2, Math.floor(T))
        const F = T - I
        for (let x = x0; x < x0 + w; x++) {
          const C = F * 16 > Bayer[y & 3][x & 3] ? Rgb[I + 1] : Rgb[I]
          const K = ((y - y0) * w + (x - x0)) * 4
          D[K] = C[0]
          D[K + 1] = C[1]
          D[K + 2] = C[2]
          D[K + 3] = 255
        }
      }
      ctx.putImageData(Buf, x0, y0)
      return
    }
    for (let y = y0; y < y0 + h; y++) {
      const T = ((y - y0) / Math.max(1, h - 1)) * (Stops.length - 1)
      const I = Math.min(Stops.length - 2, Math.floor(T))
      const F = T - I
      for (let x = x0; x < x0 + w; x++) px(F * 16 > Bayer[y & 3][x & 3] ? Stops[I + 1] : Stops[I], x, y)
    }
  }
  return { px, rect, circ, vgrad }
}

// 매번 같은 그림이 나오도록 씨앗을 받는 난수
export const rnd = (seed: number) => {
  let X = seed
  return () => (X = (X * 9301 + 49297) % 233280) / 233280
}

export const canvas2d = (w: number, h: number) => {
  const Cv = document.createElement('canvas')
  Cv.width = w
  Cv.height = h
  return [Cv, Cv.getContext('2d', { willReadFrequently: true })!] as const
}
