// 프로젝트 방 섬 : 방 그림 · TV 골격만 그리고, 장면과 연출은 room.ts 가 맡는다
import { useEffect, useRef } from 'react'
import { mountRoom } from './room'
import type { Project } from './types'
import './room.css'

interface Props {
  projects: Project[]
  scene: string
}

// 12 x 12 도트 화살표 버튼 : 외곽선 · 바탕 · 윗면 빛 · 화살표
const Arrow = ({ dir }: { dir: 'prev' | 'next' }) => {
  const Ic = Array.from({ length: 7 }, (_, k) => {
    const D = 3 - Math.abs(k - 3)
    return dir === 'prev' ? [6 - D, 3 + k] : [4 + D, 3 + k]
  })
  return (
    <button className={`arrow ${dir}`} type="button" aria-label={dir === 'prev' ? '이전 CD' : '다음 CD'}>
      <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
        <path className="ol" d="M2 0h8v1h1v1h1v8h-1v1h-1v1H2v-1H1v-1H0V2h1V1h1z" />
        <path className="face" d="M2 1h8v1h1v8h-1v1H2v-1H1V2h1z" />
        <path className="hi" d="M2 1h8v1H2zM1 2h1v3H1z" />
        <g className="ic">
          {Ic.map(([x, y]) => (
            <rect key={y} x={x} y={y} width="2" height="1" />
          ))}
        </g>
      </svg>
    </button>
  )
}

export default function Room({ projects, scene }: Props) {
  const RootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const Root = RootRef.current
    if (!Root) return
    return mountRoom({ root: Root, projects, scene, fromHub: document.documentElement.hasAttribute('data-enter-hub') })
  }, [projects, scene])

  return (
    <div className="projects-room" ref={RootRef}>
      <div className="world">
        <div className="bg" style={{ backgroundImage: `url(${scene})` }} />
        <canvas className="win" width={247} height={360} />
        <canvas className="patch" width={400} height={105} />
        <canvas className="tailcv tail-cover" width={58} height={34} />
        <canvas className="tailcv tail-pix" width={58} height={34} />
        <canvas className="padcv" width={96} height={72} />
        <div className="tint" />
        <div className="flash" />
        <div className="tvlight" />
        <div className="tvaura" />
        <div className="screen" tabIndex={0} role="group" aria-label="TV" aria-roledescription="CD 고르기">
          <div className="stage" />
          <Arrow dir="prev" />
          <Arrow dir="next" />
          <canvas className="label" width={200} height={10} aria-hidden="true" />
          <div className="screenglow" />
          <div className="glass" />
        </div>
      </div>
      {import.meta.env.DEV && (
        <div className="ctl">
          <input type="range" className="hour" min={0} max={24} step={0.25} aria-label="시각" />
          <span className="clock" />
          <button type="button" data-t="now" aria-pressed="true">
            지금
          </button>
          <input type="range" className="phase" min={0} max={1} step={0.01} aria-label="달 모양" />
          {(['real', 'clear', 'cloudy', 'rain', 'snow'] as const).map((w) => (
            <button key={w} type="button" data-w={w} aria-pressed={w === 'real'}>
              {{ real: '실제 날씨', clear: '맑음', cloudy: '흐림', rain: '비', snow: '눈' }[w]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
