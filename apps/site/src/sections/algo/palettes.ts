// 접속 시각에 따라 바뀌는 꽃밭 색 : 새벽 · 낮 · 노을 · 밤
export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night'

export interface Palette {
  // 꽃 머리에 덧씌우는 CSS 필터 (낮은 없음)
  flower: string
  shade: string
  // 풀 뭉치 밝기 6단계 : 가운데 톤 · 끝 톤
  mids: string[]
  tips: string[]
  glow: string
  rim: string
  ground0: string
  haze: string
  // 화면 위에서 비치는 빛 · 아래쪽을 밝히는 막
  tint: string
  low: string
}

type Raw = Omit<Palette, 'low'>

const RAW: Record<TimeOfDay, Raw> = {
  day: { flower: 'none', shade: '#3f7526', mids: ['#5c9b33', '#6aa837', '#79b43c', '#89c045', '#9bcb50', '#aed45c'], tips: ['#b2da64', '#c1e270', '#cfe87c', '#dced8a', '#e7f29a', '#f1f6b0'], glow: '#f8fbd8', rim: 'rgba(255,255,230,.45)', ground0: '#b6d189', haze: 'rgba(215,233,225,.92)', tint: 'radial-gradient(ellipse 65% 60% at 10% -8%, rgba(255,247,205,.6), rgba(255,247,205,0) 70%)' },
  dawn: { flower: 'brightness(.96) sepia(.08)', shade: '#28472c', mids: ['#4a7a4a', '#568850', '#629458', '#70a060', '#80ac6a', '#92b876'], tips: ['#a9c48c', '#bccb94', '#cfd29e', '#dfd7aa', '#ecdab6', '#f6dec4'], glow: '#fbe6dc', rim: 'rgba(255,228,220,.4)', ground0: '#c2b89c', haze: 'rgba(246,212,212,.9)', tint: 'radial-gradient(ellipse 75% 60% at 85% -10%, rgba(255,196,200,.5), rgba(255,210,180,0) 72%)' },
  sunset: { flower: 'sepia(.18) brightness(.95)', shade: '#2e3e16', mids: ['#5a7426', '#68802a', '#788a2e', '#8a9434', '#9e9c3a', '#b0a242'], tips: ['#cfae52', '#dcb456', '#e8b85c', '#f2bc64', '#f7c472', '#fbd08a'], glow: '#ffe0b0', rim: 'rgba(255,214,160,.45)', ground0: '#d49a5c', haze: 'rgba(250,170,120,.85)', tint: 'radial-gradient(ellipse 80% 70% at 92% -5%, rgba(255,150,70,.55), rgba(255,120,60,0) 72%)' },
  // 밤 : 꽃이 은은하게 빛난다
  night: { flower: 'brightness(.95) drop-shadow(0 0 4px rgba(255,250,220,.9)) drop-shadow(0 0 14px rgba(255,244,200,.55))', shade: '#06151a', mids: ['#123430', '#163d38', '#1b4640', '#215049', '#285a52', '#30655c'], tips: ['#3f7d70', '#4a887a', '#579384', '#669f90', '#77ab9c', '#8cbaab'], glow: '#b9d8e6', rim: 'rgba(200,225,255,.22)', ground0: '#1a2c3c', haze: 'rgba(70,96,128,.8)', tint: 'radial-gradient(ellipse 55% 50% at 80% -5%, rgba(190,210,255,.28), rgba(190,210,255,0) 70%)' },
}

// 밝기 올리기 : 풀 색을 흰색 쪽으로 섞는다 (밤은 많이)
const LIFT: Record<TimeOfDay, number> = { day: 0.2, dawn: 0.16, sunset: 0.14, night: 0.24 }
// 화면 아래쪽을 밝히는 막의 색 (아래에서 위로 옅어진다)
const LOW: Record<TimeOfDay, [number, number, number, number]> = {
  day: [250, 255, 222, 0.32],
  dawn: [255, 240, 232, 0.26],
  sunset: [255, 232, 196, 0.26],
  night: [170, 212, 222, 0.18],
}

export const lift = (hex: string, t: number): string =>
  '#' +
  [1, 3, 5]
    .map((i) =>
      Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + 255 * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')

const build = (k: TimeOfDay): Palette => {
  const R = RAW[k]
  const t = LIFT[k]
  const [r, g, b, a] = LOW[k]
  return {
    ...R,
    mids: R.mids.map((c) => lift(c, t)),
    tips: R.tips.map((c) => lift(c, t * 0.8)),
    shade: lift(R.shade, t),
    ground0: lift(R.ground0, t),
    glow: lift(R.glow, t * 0.5),
    low: `linear-gradient(0deg, rgba(${r},${g},${b},${a}) 0%, rgba(${r},${g},${b},0) 48%)`,
  }
}

export const Palettes: Record<TimeOfDay, Palette> = {
  day: build('day'),
  dawn: build('dawn'),
  sunset: build('sunset'),
  night: build('night'),
}

// 새벽 5 ~ 8시, 낮 8 ~ 17시, 노을 17 ~ 20시, 밤 20 ~ 5시
export const timeOfDay = (hour: number): TimeOfDay => (hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'sunset' : 'night')

