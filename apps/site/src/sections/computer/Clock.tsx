// 3D LED 시계 : HH : MM : SS 를 보여 준다 (날짜 · 요일 없음)
// 크기는 tokens.css 변수로 고정 : 어떤 시간에도 폭이 변하지 않는다 (콜론은 문자를 바꾸지 않고 opacity 만 깜빡인다)
import { useEffect, useState } from 'react'
import SegmentDigit from './SegmentDigit'

const Two = (n: number) => String(n).padStart(2, '0')

const Colon = () => (
  <svg className="clock-colon" viewBox="0 0 30 96" aria-hidden="true">
    <g className="colon-dots">
      <rect x="11" y="31" width="8" height="8" />
      <rect x="11" y="57" width="8" height="8" />
    </g>
  </svg>
)

export default function Clock() {
  const [Time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setTime(Two(d.getHours()) + Two(d.getMinutes()) + Two(d.getSeconds()))
    }
    tick()
    const Id = setInterval(tick, 1000)
    return () => clearInterval(Id)
  }, [])

  const D = (i: number) => (Time ? Number(Time[i]) : null)
  return (
    <div className="clock" role="img" aria-label={Time ? `${Time.slice(0, 2)}시 ${Time.slice(2, 4)}분 ${Time.slice(4)}초` : '시계'}>
      <div className="clock-face">
        <SegmentDigit value={D(0)} />
        <SegmentDigit value={D(1)} />
        <Colon />
        <SegmentDigit value={D(2)} />
        <SegmentDigit value={D(3)} />
        <Colon />
        <SegmentDigit value={D(4)} />
        <SegmentDigit value={D(5)} />
      </div>
    </div>
  )
}
