// 단계형 시각화 조작 막대 : 다시보기 · 이전 · 재생 / 일시정지 · 다음 + 지금 위치
import type { Dispatch } from 'react'
import { Role } from './palette'
import type { StepAction } from './steps'

interface Props {
  k: number
  last: number
  playing: boolean
  dispatch: Dispatch<StepAction>
  // 강조 색 (재생 버튼)
  accent?: string
}

const { fg: Fg, dim: Dim, line: Line } = Role

// 모든 아이콘은 24 x 24 칸의 가운데 (12, 12) 에 맞춘다
// 재생 삼각형만 무게중심이 왼쪽이라 0.5 오른쪽에 둔다
export const Icon = {
  replay: 'M12 6.5V3.5L7 7.5l5 4V8.5a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z',
  prev: 'M6 6h2v12H6zM9.5 12 18 6v12z',
  next: 'M16 6h2v12h-2zM6 6l8.5 6L6 18z',
  play: 'M7 5v14l11-7z',
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
}

function Btn({ label, path, onClick, disabled, color }: { label: string; path: string; onClick: () => void; disabled?: boolean; color?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{ boxSizing: 'border-box', width: 44, height: 44, minHeight: 44, padding: 0, display: 'grid', placeItems: 'center', background: 'none', border: `1px solid ${color ?? Line}`, borderRadius: 10, color: Fg, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer', touchAction: 'manipulation' }}
    >
      <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true">
        <path d={path} fill="currentColor" />
      </svg>
    </button>
  )
}

export function StepControls({ k, last, playing, dispatch, accent }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0 4px' }}>
      <Btn label="다시보기" path={Icon.replay} onClick={() => dispatch({ type: 'replay' })} />
      <Btn label="이전" path={Icon.prev} disabled={k <= 0} onClick={() => dispatch({ type: 'prev' })} />
      <Btn label={playing ? '일시정지' : '재생'} path={playing ? Icon.pause : Icon.play} color={accent} onClick={() => dispatch({ type: 'toggle' })} />
      <Btn label="다음" path={Icon.next} disabled={k >= last} onClick={() => dispatch({ type: 'next' })} />
      <span style={{ minWidth: 52, color: Dim, fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        {k + 1} / {last + 1}
      </span>
    </div>
  )
}
