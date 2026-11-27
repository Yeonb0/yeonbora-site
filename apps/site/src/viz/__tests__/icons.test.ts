// 아이콘 경로의 바깥 상자가 (12, 12) 가운데에 오는지 : 직선 · 원호 끝점만 보는 간단한 계산
import { describe, expect, it } from 'vitest'
import { Icon } from '../StepControls'

// M · V · H · L · l · h · v · a · z 만 쓰는 경로의 꼭짓점 (원호는 지나는 원의 바깥까지 포함하지 않으므로 replay 는 따로 본다)
function points(d: string): [number, number][] {
  const Tok = d.match(/[a-zA-Z]|-?\d*\.?\d+/g)!
  const Out: [number, number][] = []
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  let cmd = ''
  let i = 0
  const n = () => Number(Tok[i++])
  while (i < Tok.length) {
    if (/[a-zA-Z]/.test(Tok[i])) cmd = Tok[i++]
    switch (cmd) {
      case 'M': x = n(); y = n(); sx = x; sy = y; cmd = 'L'; break
      case 'L': x = n(); y = n(); break
      case 'l': x += n(); y += n(); break
      case 'H': x = n(); break
      case 'h': x += n(); break
      case 'V': y = n(); break
      case 'v': y += n(); break
      case 'z': case 'Z': x = sx; y = sy; break
      default: throw new Error(cmd)
    }
    Out.push([x, y])
  }
  return Out
}

const center = (d: string) => {
  const P = points(d)
  const Xs = P.map((p) => p[0])
  const Ys = P.map((p) => p[1])
  return [(Math.min(...Xs) + Math.max(...Xs)) / 2, (Math.min(...Ys) + Math.max(...Ys)) / 2]
}

describe('icons are centered', () => {
  it.each(['prev', 'next', 'pause'] as const)('%s', (k) => {
    expect(center(Icon[k])).toEqual([12, 12])
  })
  it('play sits 0.5 right of center', () => {
    expect(center(Icon.play)).toEqual([12.5, 12])
  })
  it('replay ring + arrow box is centered', () => {
    // 고리 : 중심 (12, 13.5) 반지름 7 → y 6.5 ~ 20.5, 화살촉 끝 y 3.5 → 상자 y 3.5 ~ 20.5
    const M = Icon.replay.match(/^M12 ([\d.]+)V([\d.]+)/)!
    const Top = Number(M[2])
    const RingCenterY = Number(M[1]) + 7
    expect((Top + RingCenterY + 7) / 2).toBe(12)
  })
})
