// bit stuffing : 입력 비트가 한 칸씩 나가며 1 이 5개 이어지면 0 이 끼워진다
import { useMemo } from 'react'
import { contrast, Role } from '../palette'
import { StepControls } from '../StepControls'
import { useSteps } from '../steps'
import type { VizProps } from '../types'
import { useReducedMotion } from '../useReducedMotion'
import { frames, type Frame } from './stuff'

const Cell = 30
const Gap = 4
const Pad = 16
const LabelW = 96
// 한 칸이 넘어가는 기본 시간 (ms)
const StepMs = 650
// 끝 화면을 보여 주는 시간 (ms)
const HoldMs = 1800

// 읽는 자리는 포인트 남색, 끼운 비트는 포인트 노랑 (config accent)
const { bg: Bg, fg: Fg, dim: Dim, line: Line, primary: Primary, navyText: Reading } = Role

type Labels = { input: string; output: string; count: string }

const readLabels = (v: unknown): Labels => {
  const L = (typeof v === 'object' && v ? v : {}) as Partial<Labels>
  return { input: L.input ?? '', output: L.output ?? '', count: L.count ?? '' }
}

export default function BitStuffing({ values }: VizProps) {
  const Input = String(values.input ?? '')
  const Speed = Number(values.speed) || 1
  const Accent = String(values.accent ?? Role.point)
  // 끼운 비트 칸 위 글자 : 강조 색이 밝으면 어두운 글자
  const OnAccent = contrast(Accent, Role.onPoint) >= contrast(Accent, Fg) ? Role.onPoint : Fg
  const Size = Number(values.size) || 420
  const Loop = values.loop !== false
  const Lab = readLabels(values.labels)
  const Reduced = useReducedMotion()

  const Frames = useMemo<Frame[]>(() => {
    try {
      return frames(Input)
    } catch {
      return []
    }
  }, [Input])

  const Steps = useSteps(Frames.length, { stepMs: StepMs, holdMs: HoldMs, speed: Speed, loop: Loop, reduced: Reduced })
  const k = Math.min(Steps.k, Math.max(Frames.length - 1, 0))
  const LastIdx = Math.max(Frames.length - 1, 0)

  if (Frames.length === 0) return <div style={{ background: Bg, borderRadius: 8, minHeight: 120 }} />

  const F = Frames[k]
  // 0 을 끼우는 칸에서는 다섯 칸을 모두 강조
  const Filled = F.stuffed ? 5 : F.count
  const Final = Frames[LastIdx]
  const Inserted = new Set(Frames.filter((f) => f.stuffed).map((f) => f.out.length - 1))
  const Cols = Math.max(Input.length, Final.out.length)
  const W = Pad * 2 + LabelW + Cols * (Cell + Gap)
  const cellX = (i: number) => Pad + LabelW + i * (Cell + Gap)
  const RowIn = Pad
  const RowOut = RowIn + Cell + 24
  const RowCount = RowOut + Cell + 28
  const H = RowCount + 10 + Pad

  return (
    <div style={{ width: `min(${Size}px, 100%)`, margin: '0 auto', background: Bg, borderRadius: 8, paddingBottom: 6 }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${Lab.input} ${Input} → ${Lab.output} ${Final.out}`} style={{ display: 'block', width: '100%' }}>
        <text x={Pad} y={RowIn + Cell / 2} fill={Dim} fontSize={12} dominantBaseline="middle">
          {Lab.input}
        </text>
        <text x={Pad} y={RowOut + Cell / 2} fill={Dim} fontSize={12} dominantBaseline="middle">
          {Lab.output}
        </text>
  
        {Input.split('').map((b, i) => {
          const Done = i <= F.inPos
          const Now = i === F.inPos
          return (
            <g key={`in${i}`} opacity={Done && !Now ? 0.45 : 1}>
              <rect x={cellX(i)} y={RowIn} width={Cell} height={Cell} rx={4} fill="none" stroke={Now ? Reading : Line} strokeWidth={Now ? 2 : 1} />
              <text x={cellX(i) + Cell / 2} y={RowIn + Cell / 2 + 1} fill={Fg} fontSize={15} fontFamily="ui-monospace, monospace" textAnchor="middle" dominantBaseline="middle">
                {b}
              </text>
            </g>
          )
        })}
  
        {F.out.split('').map((b, i) => {
          const Stuffed = Inserted.has(i)
          const Newest = i === F.out.length - 1
          return (
            <g key={`out${i}`}>
              <rect x={cellX(i)} y={RowOut} width={Cell} height={Cell} rx={4} fill={Stuffed ? Accent : 'none'} stroke={Stuffed ? Accent : Newest ? Primary : Line} strokeWidth={Newest ? 2 : 1} />
              <text x={cellX(i) + Cell / 2} y={RowOut + Cell / 2 + 1} fill={Stuffed ? OnAccent : Fg} fontSize={15} fontFamily="ui-monospace, monospace" textAnchor="middle" dominantBaseline="middle">
                {b}
              </text>
            </g>
          )
        })}
  
        <text x={Pad} y={RowCount} fill={Dim} fontSize={12} dominantBaseline="middle">
          {Lab.count}
        </text>
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={`c${i}`} cx={Pad + LabelW + i * 18 + 6} cy={RowCount} r={6} fill={i < Filled ? (F.stuffed ? Accent : Primary) : 'none'} stroke={F.stuffed ? Accent : Line} />
        ))}
      </svg>
      <StepControls k={k} last={LastIdx} playing={Steps.playing} dispatch={Steps.dispatch} accent={Primary} />
    </div>
  )
}
