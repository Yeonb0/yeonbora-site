// 시간 · 날씨 계산 : 하늘 색, 방 필터, 달 위상, 날씨 코드. 그리기 없이 숫자만 다룬다
import type { SkyKey, Weather } from './types'

export const hex = (h: string): [number, number, number] => [1, 3, 5].map((q) => parseInt(h.slice(q, q + 2), 16)) as [number, number, number]
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpc = (a: string, b: string, t: number) => {
  const A = hex(a)
  const B = hex(b)
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('')
}

// 시간대 기준점 : 새벽 · 아침 · 낮 · 노을 · 저녁 · 밤
export const Keys: SkyKey[] = [
  { h: 0, top: '#070b22', bot: '#1b2150', br: 1, sa: 1, se: 0, hr: 0, tint: '#000000', ta: 0, night: 1 },
  { h: 4.8, top: '#070b22', bot: '#1b2150', br: 1, sa: 1, se: 0, hr: 0, tint: '#000000', ta: 0, night: 1 },
  { h: 6.3, top: '#3a3a7a', bot: '#f2a28e', br: 1.3, sa: 1, se: 0.1, hr: -8, tint: '#ffb0a0', ta: 0.35, night: 0.25 },
  { h: 8.5, top: '#4a8fe0', bot: '#bfe3ff', br: 2.05, sa: 0.92, se: 0.14, hr: -14, tint: '#fff4e0', ta: 0.7, night: 0 },
  { h: 16, top: '#4a8fe0', bot: '#bfe3ff', br: 2.05, sa: 0.92, se: 0.14, hr: -14, tint: '#fff4e0', ta: 0.7, night: 0 },
  { h: 18.2, top: '#4a3a8a', bot: '#ff9a5a', br: 1.45, sa: 1.05, se: 0.25, hr: -18, tint: '#ff9a5a', ta: 0.5, night: 0.15 },
  { h: 19.6, top: '#1c1a4e', bot: '#6a4a8e', br: 1.08, sa: 1, se: 0.06, hr: -6, tint: '#a080ff', ta: 0.25, night: 0.7 },
  { h: 21, top: '#070b22', bot: '#1b2150', br: 1, sa: 1, se: 0, hr: 0, tint: '#000000', ta: 0, night: 1 },
  { h: 24, top: '#070b22', bot: '#1b2150', br: 1, sa: 1, se: 0, hr: 0, tint: '#000000', ta: 0, night: 1 },
]

// 0 ~ 24 시 사이 어느 시각이든 앞뒤 기준점을 섞는다
export const atHour = (h: number): SkyKey => {
  const H = h >= 0 && h < 24 ? h : ((h % 24) + 24) % 24
  let i = 0
  while (i < Keys.length - 2 && Keys[i + 1].h <= H) i++
  const A = Keys[i]
  const B = Keys[i + 1]
  const T = Math.min(1, Math.max(0, (H - A.h) / (B.h - A.h)))
  return {
    h: H,
    top: lerpc(A.top, B.top, T),
    bot: lerpc(A.bot, B.bot, T),
    br: lerp(A.br, B.br, T),
    sa: lerp(A.sa, B.sa, T),
    se: lerp(A.se, B.se, T),
    hr: lerp(A.hr, B.hr, T),
    tint: lerpc(A.tint, B.tint, T),
    ta: lerp(A.ta, B.ta, T),
    night: lerp(A.night, B.night, T),
  }
}

export const hourOf = (d: Date) => d.getHours() + d.getMinutes() / 60

// 달 위상 : 0 삭 (안 보임) · 0.25 상현 · 0.5 보름 · 0.75 하현. 기준 삭 2000-01-06 18:14 UTC, 삭망월 29.53059 일
export const moonPhase = (ms: number) => {
  const Days = (ms - Date.UTC(2000, 0, 6, 18, 14)) / 86400000
  return (((Days / 29.53059) % 1) + 1) % 1
}
// 밝은 면의 비율 (0 ~ 1) : 둘레 빛의 세기에 쓴다
export const moonLit = (phase: number) => 0.5 - 0.5 * Math.cos(2 * Math.PI * phase)

// Open-Meteo 날씨 코드 (WMO) → 창밖 날씨 네 가지
export const weatherOf = (code: number): Weather =>
  code <= 1 ? 'clear' : code <= 48 ? 'cloudy' : (code >= 71 && code <= 77) || code === 85 || code === 86 ? 'snow' : 'rain'

// 방에 입히는 값 : 비 · 흐림은 어둡고 푸르게, 눈은 조금 밝고 차갑게. TV 빛은 밤에 진하고 낮에는 거의 없다
export const roomLook = (S: SkyKey, w: Weather) => {
  const Wb = w === 'rain' ? 0.8 : w === 'cloudy' ? 0.9 : w === 'snow' ? 1.05 : 1
  return {
    filter: `brightness(${(S.br * Wb).toFixed(3)}) saturate(${(S.sa * (w === 'clear' ? 1 : 0.8)).toFixed(3)}) sepia(${S.se.toFixed(3)}) hue-rotate(${S.hr.toFixed(1)}deg)`,
    tint: w === 'rain' ? '#6a80b0' : w === 'snow' ? '#dfe8ff' : S.tint,
    tintA: w === 'clear' ? S.ta : Math.max(S.ta * 0.5, 0.3),
    aura: 0.05 + 0.42 * S.night,
    tvLight: 0.04 + 0.7 * S.night,
  }
}
