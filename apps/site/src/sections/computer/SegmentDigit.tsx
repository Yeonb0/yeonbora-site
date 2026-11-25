// 7-세그먼트 숫자 하나 : 끝이 사선인 육각형 막대 7개
// 뒤에 같은 모양을 회색으로 몇 겹 깔아 두께 (옆면) 를 만들고, 기울기 (--mx, --my) 에 따라 옆면이 반대로 밀린다
import type { CSSProperties } from 'react'

const T = 10
const Gap = 1.7
const W = 56
const H = 96

const hex = (cx: number, cy: number, len: number, horizontal: boolean) => {
  const h = len / 2
  const t = T / 2
  const P = horizontal
    ? [[cx - h, cy], [cx - h + t, cy - t], [cx + h - t, cy - t], [cx + h, cy], [cx + h - t, cy + t], [cx - h + t, cy + t]]
    : [[cx, cy - h], [cx + t, cy - h + t], [cx + t, cy + h - t], [cx, cy + h], [cx - t, cy + h - t], [cx - t, cy - h + t]]
  return P.map((p) => p.join(',')).join(' ')
}

const LenH = W - T - Gap * 2
const LenV = (H - T) / 2 - Gap * 2
const Mid = H / 2
const L = T / 2
const R = W - T / 2
// a 위 · b 오른쪽 위 · c 오른쪽 아래 · d 아래 · e 왼쪽 아래 · f 왼쪽 위 · g 가운데
const Shapes = [
  hex(W / 2, L, LenH, true),
  hex(R, (L + Mid) / 2, LenV, false),
  hex(R, (Mid + H - L) / 2, LenV, false),
  hex(W / 2, H - L, LenH, true),
  hex(L, (Mid + H - L) / 2, LenV, false),
  hex(L, (L + Mid) / 2, LenV, false),
  hex(W / 2, Mid, LenH, true),
]
const Masks = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg']
const Names = 'abcdefg'

// 옆면 : 앞에서 뒤로 #8d8a96 → #4a4752
const Depth = 5
const Side = Array.from({ length: Depth }, (_, i) => {
  const k = (i + 1) / Depth
  const c = (a: number, b: number) => Math.round(a + (b - a) * k)
  return `rgb(${c(0x8d, 0x4a)}, ${c(0x8a, 0x47)}, ${c(0x96, 0x52)})`
})

// 옆면 한 겹의 밀림 : 기울기 반대 방향 + 아주 약간 아래로 (가만히 있어도 두께가 보인다)
export const sideShift = (k: number): CSSProperties => ({
  transform: `translate(calc(var(--mx, 0) * ${-1.1 * k}px), calc(var(--my, 0) * ${-1.1 * k}px + ${0.5 * k}px))`,
})

export default function SegmentDigit({ value }: { value: number | null }) {
  const On = value === null ? '' : Masks[value]
  // 옆면 겹마다 따로 된 svg : 기울기 (--mx, --my) 가 바뀌어도 겹을 다시 그리지 않고 합성기에서 옮기기만 한다
  // (한 svg 안의 <g> 를 옮기면 마우스가 움직이는 동안 매 프레임 svg 전체를 drop-shadow 까지 다시 그린다)
  // --clock-digit-w 가 viewBox 폭 (W) 과 같아 px 이동량이 예전과 같다
  return (
    <span className="seg-digit" aria-hidden="true">
      {/* 가장 깊은 (어두운) 겹부터 그린다 */}
      {Side.map((fill, i) => (
        <svg key={i} className="seg-layer seg-side" viewBox={`0 0 ${W} ${H}`} fill={fill} style={sideShift(i + 1)}>
          {Shapes.map((pts, s) => (
            <polygon key={s} points={pts} />
          ))}
        </svg>
      )).reverse()}
      <svg className="seg-layer" viewBox={`0 0 ${W} ${H}`}>
        <g className="seg-off">
          {Shapes.map((pts, s) => (
            <polygon key={s} points={pts} />
          ))}
        </g>
        <g className="seg-glow">
          {Shapes.map((pts, s) => (
            <polygon key={s} points={pts} className="seg-on" style={{ opacity: On.includes(Names[s]) ? 1 : 0 }} />
          ))}
        </g>
      </svg>
    </span>
  )
}
