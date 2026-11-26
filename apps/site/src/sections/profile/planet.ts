// 프로필 방의 아스키 행성 : 고리가 있는 행성을 문자 밝기로 그린다
// 빛은 light 방향 (마우스 쪽) 에서 오고, 표면 띠는 t (초) 에 따라 천천히 돈다
// 별은 <span class="star"> 로 감싸 노랑 포인트를 준다

export interface Light {
  x: number
  y: number
}

// 어두운 문자 → 밝은 문자
export const Ramp = ' .,:;-=+*#%$@'
const RingRamp = '.:-=+*'

// 칸마다 고정된 난수 : 별 자리를 정한다
const hash = (x: number, y: number): number => {
  const N = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return N - Math.floor(N)
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

export function drawPlanet(cols: number, rows: number, t: number, light: Light): string {
  const Cx = cols / 2
  const Cy = rows / 2
  const R = rows * 0.21
  let Lx = light.x
  let Ly = light.y
  let Lz = 0.75
  const Len = Math.hypot(Lx, Ly, Lz)
  Lx /= Len
  Ly /= Len
  Lz /= Len
  // 행성과 고리를 함께 살짝 기울인다
  const Tilt = -0.32
  const Ct = Math.cos(Tilt)
  const St = Math.sin(Tilt)
  let Out = ''
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // 문자 칸은 세로가 가로의 두 배라 가로 좌표를 반으로 줄인다
      const U0 = ((x - Cx) * 0.5) / R
      const V0 = (y - Cy) / R
      const u = U0 * Ct - V0 * St
      const v = U0 * St + V0 * Ct
      const D2 = u * u + v * v
      // 고리 : 납작한 타원 띠. 앞쪽 (아래 반) 은 행성을 가리고, 뒤쪽은 행성에 가려진다
      const Ry = v / 0.26
      const Rd = Math.hypot(u, Ry)
      const OnRing = Rd > 1.35 && Rd < 2.05 && Math.abs(Rd - 1.72) > 0.05
      const RingFront = OnRing && v > 0
      if (D2 < 1 && !RingFront) {
        const z = Math.sqrt(1 - D2)
        const Lat = Math.asin(v)
        const Lon = Math.atan2(u, z) + t * 0.25
        let b = u * Lx + v * Ly + z * Lz
        b += 0.12 * Math.sin(Lat * 9 + Math.sin(Lon * 2) * 0.8) + 0.05 * Math.sin(Lon * 7 + Lat * 3)
        // 그늘진 쪽도 윤곽이 보이게 바닥 밝기를 둔다
        b = 0.18 + 0.82 * clamp(b, 0, 1)
        Out += Ramp[Math.round(b * (Ramp.length - 1))]
      } else if (OnRing) {
        const b = 0.35 + 0.35 * Math.sin(Rd * 22) + 0.2 * (u * Lx + Ry * 0.2)
        Out += RingRamp[clamp(Math.round(b * 5), 0, 5)]
      } else if (hash(x, y) < 0.012) {
        // 별 : 천천히 깜빡인다
        Out += `<span class="star">${Math.sin(t * 2 + x + y) > 0.3 ? '*' : '.'}</span>`
      } else {
        Out += ' '
      }
    }
    Out += '\n'
  }
  return Out
}
