// 뱃지 재질 · 반사 환경 · 평면 도형 → 3D 모델
import * as THREE from 'three'
import type { BadgeShape } from './types'

// ---------- 표면 텍스처 ----------
// 광낸 금 겉면 : 아주 옅은 잔 흠집과 얼룩 (거칠기 텍스처)
const surfaceTex = (): THREE.CanvasTexture => {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = 'rgb(30,30,30)'
  g.fillRect(0, 0, 512, 512)
  // 넓게 번진 얼룩 : 광이 고르지 않은 느낌
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = 30 + Math.random() * 90
    const G = g.createRadialGradient(x, y, 0, x, y, r)
    const v = Math.random() < 0.5 ? 0 : 255
    G.addColorStop(0, `rgba(${v},${v},${v},0.035)`)
    G.addColorStop(1, `rgba(${v},${v},${v},0)`)
    g.fillStyle = G
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // 잔 흠집 : 짧고 가는 선, 방향은 제각각
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const a = Math.random() * Math.PI
    const l = 6 + Math.random() * 40
    g.strokeStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`
    g.lineWidth = 0.4 + Math.random() * 0.7
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (Math.random() - 0.5) * 6, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l)
    g.stroke()
  }
  // 고운 입자
  const D = g.getImageData(0, 0, 512, 512)
  for (let i = 0; i < D.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14
    D.data[i] += n
    D.data[i + 1] += n
    D.data[i + 2] += n
  }
  g.putImageData(D, 0, 0)
  const T = new THREE.CanvasTexture(c)
  T.wrapS = T.wrapT = THREE.RepeatWrapping
  // 도형 좌표 (100 단위) 기준 : 텍스처 한 장이 뱃지 폭의 절반쯤
  T.repeat.set(1 / 55, 1 / 55)
  T.anisotropy = 8
  return T
}

// 면이 가로로만 살짝 굽은 것처럼 (원통) : 반사가 세로 일자 띠로 흐른다
const curveTex = (): THREE.CanvasTexture => {
  const N = 256
  const c = document.createElement('canvas')
  c.width = c.height = N
  const g = c.getContext('2d')!
  const D = g.createImageData(N, N)
  const a = 0.28
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const nx = ((x / (N - 1)) * 2 - 1) * a
      const l = Math.hypot(nx, 1)
      const i = (y * N + x) * 4
      D.data[i] = ((nx / l) * 0.5 + 0.5) * 255
      D.data[i + 1] = 0.5 * 255
      D.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255
      D.data[i + 3] = 255
    }
  g.putImageData(D, 0, 0)
  const T = new THREE.CanvasTexture(c)
  T.colorSpace = THREE.NoColorSpace
  // 도형 좌표 -50 ~ 50 → 0 ~ 1
  T.repeat.set(1 / 100, 1 / 100)
  T.offset.set(0.5, 0.5)
  return T
}

export type MaterialSet = {
  metal: (mat: string) => THREE.MeshPhysicalMaterial
  color: (hex: string) => THREE.MeshStandardMaterial
  dispose: () => void
}

export const makeMaterials = (): MaterialSet => {
  const Rough = surfaceTex()
  const Curve = curveTex()
  // 반사색 : 실제 금의 선형값
  const Gold = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 1, roughnessMap: Rough, normalMap: Curve })
  Gold.color.setRGB(1.0, 0.78, 0.36, THREE.LinearSRGBColorSpace)
  // 색 면 : 광 없는 무광 (반사는 금에만)
  const Colors = new Map<string, THREE.MeshStandardMaterial>()
  return {
    // 卍 (brushed) 도 다른 뱃지처럼 광낸 금이다 : 두께만 더 두껍다
    metal: () => Gold,
    color: (hex) => {
      let M = Colors.get(hex)
      if (!M) {
        M = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), metalness: 0, roughness: 0.92, envMapIntensity: 0.55 })
        Colors.set(hex, M)
      }
      return M
    },
    dispose: () => {
      Gold.dispose()
      Rough.dispose()
      Curve.dispose()
      Colors.forEach((M) => M.dispose())
    },
  }
}

// ---------- 반사 환경 ----------
// 보석 촬영 스튜디오 파노라마 (HDR) : 어두운 방 + 소프트박스 · 스폿 · 세로 띠 조명
// 장면 좌표 : 뱃지 면이 +z (카메라 쪽), 위가 +y
export const makeEnv = (R: THREE.WebGLRenderer): THREE.Texture => {
  const W = 512
  const H = 256
  const D = new Float32Array(W * H * 4)
  const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize()
  const soft = (d: number, r0: number, r1: number) => Math.max(0, Math.min(1, (r1 - d) / (r1 - r0)))
  // 둥근 소프트박스 · 작은 스폿 : 방향, 반지름 (라디안), 밝기, 색
  const Boxes = [
    { c: v3(-0.5, 0.5, 0.72), r: 0.42, k: 5.6, col: [1, 0.96, 0.9] },
    { c: v3(0.05, 0.75, 0.66), r: 0.18, k: 7.7, col: [1, 0.97, 0.92] },
    { c: v3(0.35, 0.55, 0.76), r: 0.06, k: 34, col: [1, 0.95, 0.85] },
    { c: v3(-0.15, -0.55, 0.82), r: 0.22, k: 1.4, col: [1, 0.92, 0.85] },
    { c: v3(0.1, 0.12, 1), r: 0.3, k: 1.2, col: [1, 0.93, 0.8] },
  ]
  // 세로 띠 조명 : 기울이면 금속 면을 가로지르며 번쩍인다
  const Strips = [
    { c: v3(0.72, 0, 0.7), w: 0.06, h: 0.95, k: 10 },
    { c: v3(-0.8, -0.1, 0.55), w: 0.04, h: 0.8, k: 6.8 },
    { c: v3(0.3, 0, 0.95), w: 0.025, h: 0.9, k: 8.5 },
    { c: v3(-0.35, 0, 0.94), w: 0.02, h: 0.9, k: 6 },
  ].map((S) => ({ ...S, side: new THREE.Vector3(0, 1, 0).cross(S.c).normalize() }))
  const dir = new THREE.Vector3()
  for (let row = 0; row < H; row++) {
    const lat = ((row + 0.5) / H - 0.5) * Math.PI
    for (let x = 0; x < W; x++) {
      const th = ((x + 0.5) / W - 0.5) * Math.PI * 2
      dir.set(Math.cos(lat) * Math.cos(th), Math.sin(lat), Math.cos(lat) * Math.sin(th))
      // 바탕 : 어두운 방, 위로 갈수록 조금 밝다. 뒤쪽 (-z) 은 빨간 방석
      let r = 0.03 + 0.04 * Math.max(dir.y, 0)
      let g = 0.026 + 0.035 * Math.max(dir.y, 0)
      let b = 0.024 + 0.03 * Math.max(dir.y, 0)
      if (dir.z < 0) {
        r += 0.09 * -dir.z
        g += 0.02 * -dir.z
        b += 0.02 * -dir.z
      }
      for (const B of Boxes) {
        const f = soft(Math.acos(Math.min(1, dir.dot(B.c))), B.r * 0.8, B.r) * B.k
        r += f * B.col[0]
        g += f * B.col[1]
        b += f * B.col[2]
      }
      for (const S of Strips) {
        if (dir.dot(S.c) < 0) continue
        const across = Math.abs(Math.asin(Math.max(-1, Math.min(1, dir.dot(S.side)))))
        const f = soft(across, S.w * 0.6, S.w) * soft(Math.abs(dir.y), S.h * 0.85, S.h) * S.k
        r += f
        g += f
        b += f
      }
      const i = (row * W + x) * 4
      D[i] = r
      D[i + 1] = g
      D[i + 2] = b
      D[i + 3] = 1
    }
  }
  const T = new THREE.DataTexture(D, W, H, THREE.RGBAFormat, THREE.FloatType)
  T.mapping = THREE.EquirectangularReflectionMapping
  T.needsUpdate = true
  const P = new THREE.PMREMGenerator(R)
  const out = P.fromEquirectangular(T).texture
  T.dispose()
  P.dispose()
  return out
}

// ---------- 평면 도형 → 3D 뱃지 ----------
// 높이 (도형 단위) : 바탕 금속 4.5 + 에나멜 2 + 솟은 금선 2.2
const Depth = {
  plate: { z: 0, depth: 4.5, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.3, bevelSegments: 4 },
  enamel: { z: 4.5, depth: 2.0, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0, bevelSegments: 2 },
  lines: { z: 4.5, depth: 2.2, bevelEnabled: true, bevelThickness: 1.0, bevelSize: 0.45, bevelSegments: 5 },
} as const

const toPath = <P extends THREE.Path>(flat: number[], P: P): P => {
  for (let i = 0; i < flat.length; i += 2) {
    const x = flat[i] - 50
    const y = 50 - flat[i + 1]
    if (i === 0) P.moveTo(x, y)
    else P.lineTo(x, y)
  }
  return P
}

export type BadgeParts = { g: THREE.ExtrudeGeometry; mat: string; kind: string }[]

export const badgeGeometry = (b: BadgeShape): BadgeParts =>
  b.layers.map((L) => {
    const shapes = L.polys.map((poly) => {
      const S = toPath(poly[0], new THREE.Shape())
      for (const h of poly.slice(1)) S.holes.push(toPath(h, new THREE.Path()))
      return S
    })
    const opt: THREE.ExtrudeGeometryOptions = { ...Depth[L.kind], curveSegments: 12 }
    // 통짜 금속 (卍) 은 더 두껍게
    if (L.mat === 'brushed') Object.assign(opt, { depth: 8, bevelThickness: 1.6, bevelSize: 1.2 })
    const g = new THREE.ExtrudeGeometry(shapes, opt)
    g.translate(0, 0, Depth[L.kind].z)
    return { g, mat: L.mat, kind: L.kind }
  })

// own : 뱃지마다 재질을 따로 둔다 (마우스 가까운 뱃지만 밝히려고 반사 세기를 따로 바꾼다)
export const makeBadge = (parts: BadgeParts, M: MaterialSet, own: boolean) => {
  const G = new THREE.Group()
  const metals: THREE.MeshPhysicalMaterial[] = []
  const colors: THREE.MeshStandardMaterial[] = []
  for (const { g, mat } of parts) {
    const isMetal = mat === 'gold' || mat === 'brushed' || mat === 'silver'
    let Mt: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial = isMetal ? M.metal(mat) : M.color(mat)
    if (own) Mt = Mt.clone()
    if (isMetal) metals.push(Mt as THREE.MeshPhysicalMaterial)
    else colors.push(Mt)
    G.add(new THREE.Mesh(g, Mt))
  }
  return { G, metals, colors }
}

// 뱃지 모양 그대로의 부드러운 그림자 : 바탕 판 모양을 흐리게 칠한 텍스처 (도형 -20 ~ 120 범위)
export const badgeShadowTex = (b: BadgeShape): THREE.CanvasTexture => {
  const N = 256
  const c = document.createElement('canvas')
  c.width = c.height = N
  const g = c.getContext('2d')!
  const k = N / 140
  g.filter = 'blur(7px)'
  g.fillStyle = 'rgba(18,0,3,1)'
  g.beginPath()
  for (const poly of b.layers.find((L) => L.kind === 'plate')?.polys ?? [])
    for (const ring of poly) {
      for (let i = 0; i < ring.length; i += 2) {
        const x = (ring[i] + 20) * k
        const y = (ring[i + 1] + 20) * k
        if (i === 0) g.moveTo(x, y)
        else g.lineTo(x, y)
      }
      g.closePath()
    }
  g.fill('evenodd')
  const T = new THREE.CanvasTexture(c)
  T.colorSpace = THREE.SRGBColorSpace
  return T
}

export const makeRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  R.setPixelRatio(Math.min(devicePixelRatio, 2))
  // 에나멜 색이 바래지 않도록 색을 덜 건드리는 톤 매핑
  R.toneMapping = THREE.NeutralToneMapping
  R.toneMappingExposure = 1
  R.outputColorSpace = THREE.SRGBColorSpace
  return R
}
