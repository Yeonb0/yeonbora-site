// 종교학 방 : 뱃지 진열 상자. Room.tsx 가 그린 골격 (root) 위에서 three.js 장면과 상자 연출을 돌린다
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client'
import { Badges } from './badges'
import { badgeGeometry, badgeShadowTex, makeBadge, makeEnv, makeMaterials, makeRenderer } from './materials'
import type { BadgeParts } from './materials'
import { docsSearch, parseDocs } from './route'
import type { Religion, ReligionId, View } from './types'

export interface RoomOptions {
  root: HTMLElement
  religions: Religion[]
  velvet: { wide: string; tall: string }
  // 허브에서 막 들어왔는지 : 아니면 (글에서 돌아오기 · 새로고침) 상자를 연 채로 바로 보인다
  fromHub: boolean
}

// 방석의 오목하게 눌린 8곳 (velvet.webp 에서 찾은 비율 좌표). 휴대폰은 방석을 세워 2열
const TuftsWide: [number, number][] = [
  [0.1847, 0.2918],
  [0.3915, 0.2883],
  [0.6154, 0.2895],
  [0.8284, 0.2918],
  [0.1847, 0.6576],
  [0.3922, 0.6552],
  [0.6154, 0.6529],
  [0.8298, 0.6517],
]
// 세운 방석 : 왼쪽으로 90° 돌렸으므로 (x, y) → (y, 1 - x). 위 두 줄이 동양 종교
const TuftsTall: [number, number][] = TuftsWide.map(([x, y]): [number, number] => [y, 1 - x]).sort(
  (p, q) => Math.round(p[1] * 8) - Math.round(q[1] * 8) || p[0] - q[0],
)
// 방석 그림은 안쪽 판의 0.6% 안쪽에 꽉 차게 놓인다
const Inset = 0.006
// 손으로 꽂은 듯 조금씩 다른 기울기
const Rots = [-0.07, 0.05, -0.03, 0.08, -0.05, 0.03, -0.08, 0.05]
const CamD = 2.4

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

// 면 조명 (RectAreaLight) 계산표 : 전역 UniformsLib 에 한 번만 넣는다 (init 은 부를 때마다 큰 표로 텍스처를 새로 만든다)
// 텍스처의 GPU 사본은 렌더러마다 따로 올라가므로 방을 다시 열어 새 렌더러가 생겨도 그대로 쓸 수 있다
// 단, 텍스처를 올린 렌더러는 그 텍스처에 dispose 리스너를 걸어 둔다 : 방을 떠날 때 dispose 해서 떼지 않으면
// 전역 텍스처가 지난 렌더러 (WebGL 컨텍스트 · 장면 전체) 를 계속 붙잡는다
let LtcReady = false
const LtcKeys = ['LTC_FLOAT_1', 'LTC_FLOAT_2', 'LTC_HALF_1', 'LTC_HALF_2'] as const

interface Slot {
  r: Religion
  i: number
  Pivot: THREE.Group
  G: THREE.Group
  metals: THREE.MeshPhysicalMaterial[]
  colors: THREE.MeshStandardMaterial[]
  Shade: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  Btn: HTMLButtonElement
  rot: number
  lift: number
  liftT: number
  hidden: boolean
}

interface HistoryState {
  religionDepth?: number
  religionView?: View
  religionId?: ReligionId
}

export const mountRoom = ({ root, religions, velvet, fromHub }: RoomOptions): (() => void) => {
  if (!LtcReady) {
    RectAreaLightUniformsLib.init()
    LtcReady = true
  }
  const Reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const NoHover = matchMedia('(hover: none)').matches
  const Small = () => innerWidth <= 700
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!
  const Off: (() => void)[] = []
  const on = <K extends keyof WindowEventMap>(t: Window | Document | HTMLElement, type: K | string, fn: (e: never) => void, opt?: AddEventListenerOptions) => {
    t.addEventListener(type, fn as EventListener, opt)
    Off.push(() => t.removeEventListener(type, fn as EventListener, opt))
  }
  let Alive = true
  // 기다리는 타이머 : 방을 떠나면 모두 취소한다. 기다리던 연출은 이어지지 않고 (promise 가 끝나지 않음) 떨어져 나간 DOM 을 붙잡지 않는다
  const Timers = new Set<number>()
  const wait = (ms: number) =>
    new Promise<void>((r) => {
      const T = window.setTimeout(
        () => {
          Timers.delete(T)
          r()
        },
        Reduce ? Math.min(ms, 60) : ms,
      )
      Timers.add(T)
    })

  // ---------- 장면 ----------
  const Mats = makeMaterials()
  const Geo = new Map<string, BadgeParts>()
  const partsOf = (id: string) => {
    let P = Geo.get(id)
    if (!P) {
      P = badgeGeometry(Badges.find((b) => b.id === id)!)
      Geo.set(id, P)
    }
    return P
  }

  const TrayCanvas = $<HTMLCanvasElement>('.badges3d')
  const Tray = makeRenderer(TrayCanvas)
  const Scene = new THREE.Scene()
  Scene.environment = makeEnv(Tray)
  // 원근 카메라 : 자리마다 보는 각도가 조금씩 달라서 평평한 금속 면에도 반사 그라데이션이 생긴다
  const Cam = new THREE.PerspectiveCamera((2 * Math.atan(0.5 / CamD) * 180) / Math.PI, 1, 0.1, 50)
  // 왼쪽 위에서 오는 주광
  const Key = new THREE.DirectionalLight(0xfff1dc, 0.9)
  Scene.add(Key, Key.target)
  const ShadowGeo = new THREE.PlaneGeometry(1, 1)

  const Hits = $<HTMLDivElement>('.hits')
  const Slots: Slot[] = religions.map((r, i) => {
    const { G, metals, colors } = makeBadge(partsOf(r.id), Mats, true)
    // 도형 100 단위 → 장면 단위 (layout 에서 크기를 맞춘다)
    G.scale.setScalar(0.01)
    const Pivot = new THREE.Group()
    Pivot.add(G)
    const Shade = new THREE.Mesh(
      ShadowGeo,
      new THREE.MeshBasicMaterial({ map: badgeShadowTex(Badges.find((b) => b.id === r.id)!), transparent: true, depthWrite: false }),
    )
    Shade.renderOrder = -1
    Scene.add(Shade, Pivot)
    const Btn = document.createElement('button')
    Btn.className = 'hit'
    Btn.type = 'button'
    Btn.setAttribute('aria-label', r.name)
    Hits.appendChild(Btn)
    const S: Slot = { r, i, Pivot, G, metals, colors, Shade, Btn, rot: Rots[i % Rots.length], lift: 0, liftT: 0, hidden: false }
    on(Btn, 'pointerenter', () => (S.liftT = 1))
    on(Btn, 'pointerleave', () => (S.liftT = 0))
    on(Btn, 'focus', () => (S.liftT = 1))
    on(Btn, 'blur', () => (S.liftT = 0))
    on(Btn, 'click', () => pick(S))
    return S
  })

  let Aspect = 1
  let Size = 0.2
  const Velvet = $<HTMLImageElement>('.velvet')
  // 방석 장면을 다시 그릴지 : 크기가 바뀌었거나 (setSize 가 캔버스를 비운다) 빛 · 뱃지 들림 값이 지난번 그린 것과 다를 때만
  // 아무것도 움직이지 않으면 WebGL 캔버스는 마지막 그림을 그대로 보여 준다
  let TrayDirty = true
  const layout = () => {
    TrayDirty = true
    const w = TrayCanvas.clientWidth
    const h = TrayCanvas.clientHeight
    if (!w || !h) return
    Tray.setSize(w, h, false)
    const small = Small()
    const Src = small ? velvet.tall : velvet.wide
    if (Velvet.getAttribute('src') !== Src) Velvet.src = Src
    const T = small ? TuftsTall : TuftsWide
    // 장면 단위 : 캔버스 높이 = 1, 왼쪽 위가 (0, 0)
    Aspect = w / h
    Cam.aspect = Aspect
    Cam.position.set(Aspect / 2, -0.5, CamD)
    Cam.updateProjectionMatrix()
    const pos = T.map(([fx, fy]) => [(Inset + fx * (1 - 2 * Inset)) * Aspect, Inset + fy * (1 - 2 * Inset)])
    // 뱃지 크기 : 이웃한 눌린 자리 사이 거리의 56%
    let gap = Infinity
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) gap = Math.min(gap, Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]))
    Size = gap * 0.56
    for (const S of Slots) {
      const [x, y] = pos[S.i]
      S.Pivot.position.set(x, -y, 0)
      S.G.scale.setScalar(Size / 100)
      Object.assign(S.Btn.style, { left: `${(x / Aspect) * 100}%`, top: `${y * 100}%`, width: `${((Size * 1.1) / Aspect) * 100}%` })
    }
    Key.position.set(Aspect / 2 - 1.2, 1.1, 6)
    Key.target.position.set(Aspect / 2, -0.5, 0)
  }
  const RO = new ResizeObserver(layout)
  RO.observe(TrayCanvas)

  // ---------- 빛 : 마우스 쪽 뱃지만 반짝인다 ----------
  let Interactive = false
  const Torch = { mx: -1e4, my: -1e4, x: -10, y: -10, on: 0, onT: 0 }
  on(window, 'pointermove', (e: PointerEvent) => {
    if (!Interactive || Reduce || e.pointerType !== 'mouse') return
    Torch.mx = e.clientX
    Torch.my = e.clientY
    Torch.onT = 1
  })
  on(document.documentElement, 'pointerleave', () => (Torch.onT = 0))
  const TorchLight = new THREE.PointLight(0xfff3df, 0, 0, 1.4)
  // 세로로 긴 가는 조명 : 마우스 앞에 세워 두어 금 면의 각도에 맞는 자리에 세로 일자 반사가 생긴다
  const TrayBar = new THREE.RectAreaLight(0xfff2dc, 0, 0.05, 1)
  Scene.add(TorchLight, TrayBar)

  // 뚜껑이 열린 뒤 빛이 왼쪽에서 오른쪽으로 지나가며 뱃지를 하나씩 밝힌다
  let SweepK = -1
  const sweep = () => {
    if (Reduce) return
    const t0 = performance.now()
    const f = (t: number) => {
      if (!Alive) return
      SweepK = Math.min(1, (t - t0) / 1500)
      if (SweepK < 1) requestAnimationFrame(f)
      else SweepK = -1
    }
    requestAnimationFrame(f)
  }

  // ---------- 들어 올린 뱃지 : 화면 전체 캔버스 ----------
  const LiftCanvas = $<HTMLCanvasElement>('.lift3d')
  const LiftR = makeRenderer(LiftCanvas)
  const LiftScene = new THREE.Scene()
  LiftScene.environment = makeEnv(LiftR)
  const LiftCam = new THREE.PerspectiveCamera(28, 1, 1, 20000)
  const LiftKey = new THREE.DirectionalLight(0xfff1dc, 1.4)
  LiftKey.position.set(-300, 400, 600)
  const LiftBar = new THREE.RectAreaLight(0xfff2dc, 0, 10, 100)
  LiftScene.add(LiftKey, LiftBar)
  type Pose = { x: number; y: number; s: number }
  const Lift = {
    on: false,
    G: null as THREE.Group | null,
    from: { x: 0, y: 0, s: 0 } as Pose,
    to: { x: 0, y: 0, s: 0 } as Pose,
    k: 0,
    kT: 0,
    last: null as number | null,
    rot: 0,
    settled: false,
    done: null as (() => void) | null,
  }
  const U = { q: new THREE.Quaternion(), px: 0, py: 0, zoom: 1, vx: 0, vy: 0, drag: false, reset: false }
  const resetUser = () => Object.assign(U, { q: new THREE.Quaternion(), px: 0, py: 0, zoom: 1, vx: 0, vy: 0, drag: false, reset: false })
  const Identity = new THREE.Quaternion()
  // 매 프레임 · 끌 때마다 쓰는 임시 회전 : 새로 만들지 않고 다시 쓴다 (GC 를 줄인다)
  const TmpQ = new THREE.Quaternion()
  const TmpE = new THREE.Euler()
  const turnBy = (x: number, y: number, z = 0) => TmpQ.setFromEuler(TmpE.set(x, y, z))
  const sizeLift = () => {
    LiftR.setSize(innerWidth, innerHeight, false)
    // 화면 1px = 장면 1 단위가 되도록 카메라 거리를 맞춘다
    LiftCam.aspect = innerWidth / innerHeight
    LiftCam.position.set(innerWidth / 2, -innerHeight / 2, innerHeight / 2 / Math.tan((14 * Math.PI) / 180))
    LiftCam.updateProjectionMatrix()
  }
  on(window, 'resize', sizeLift)
  sizeLift()

  const drawLift = (t: number) => {
    // 화면 주사율과 상관없이 같은 빠르기로 : 지난 그림 이후 흐른 시간으로 다가간다
    const dt = Math.min(0.1, (t - (Lift.last ?? t)) / 1000)
    Lift.last = t
    Lift.k = lerp(Lift.k, Lift.kT, Reduce ? 1 : 1 - Math.exp(-dt * 6.5))
    if (Math.abs(Lift.k - Lift.kT) < 0.002) Lift.k = Lift.kT
    const e = Lift.k
    const x = lerp(Lift.from.x, Lift.to.x, e)
    const y = lerp(Lift.from.y, Lift.to.y, e)
    const s = lerp(Lift.from.s, Lift.to.s, e)
    // 손을 놓으면 돌던 힘이 서서히 줄어든다. 제자리로 돌아갈 때는 사용자가 바꾼 것을 풀어 준다
    if (!U.drag) {
      U.q.premultiply(turnBy(U.vy, U.vx))
      U.vx *= 0.92
      U.vy *= 0.92
    }
    if (Lift.kT === 0 || U.reset) {
      U.q.slerp(Identity, 0.15)
      U.px = lerp(U.px, 0, 0.15)
      U.py = lerp(U.py, 0, 0.15)
      U.zoom = lerp(U.zoom, 1, 0.15)
      if (U.reset && Math.abs(U.zoom - 1) < 0.01 && U.q.angleTo(Identity) < 0.01) U.reset = false
    }
    const G = Lift.G!
    G.position.set(x + U.px * e, -(y + U.py * e), 0)
    G.scale.setScalar((s * lerp(1, U.zoom, e)) / 100)
    // 자리만 옮길 때 (문서 화면 오가기) 는 기울기를 처음부터 다시 잡지 않는다
    const er = Lift.settled ? 1 : e
    G.quaternion.copy(U.q).multiply(turnBy(0.18 * er, 0, Lift.rot * (1 - er)))
    // 마우스 쪽에 세로로 긴 가는 조명 (마우스가 없으면 뱃지 위를 천천히 오간다)
    const HasMouse = Torch.mx > -1e3 && !NoHover
    const lx = HasMouse ? Torch.mx : x + Math.sin(t / 1800) * s * 0.35
    const ls = s * lerp(1, U.zoom, e)
    LiftBar.position.set(lx, -(y + U.py * e), LiftCam.position.z * 0.5)
    LiftBar.lookAt(lx, -(y + U.py * e), 0)
    LiftBar.width = ls * 0.16
    LiftBar.height = ls * 3
    LiftBar.intensity = 14 * e
    LiftR.render(LiftScene, LiftCam)
    if (Lift.kT === 0 && Lift.k < 0.01) {
      Lift.on = false
      Lift.last = null
      LiftR.clear()
      // 다 내려앉은 뒤에야 방석 위 뱃지를 다시 보인다
      const Done = Lift.done
      Lift.done = null
      Done?.()
    }
  }

  // ---------- 그리기 ----------
  let Raf = 0
  const Sig = new Float64Array(4 + Slots.length * 2)
  const Drawn = new Float64Array(Sig.length).fill(NaN)
  const frame = (t: number) => {
    if (!Alive) return
    let tx: number
    let ty: number
    let lit: number
    const R = TrayCanvas.getBoundingClientRect()
    if (SweepK >= 0) {
      const e = 1 - Math.pow(1 - SweepK, 2)
      tx = lerp(-0.3, Aspect + 0.3, e)
      ty = -0.5
      lit = Math.min(1, Math.sin(SweepK * Math.PI) * 3)
    } else if (NoHover && Interactive && !Reduce) {
      // 마우스가 없는 기기 : 빛이 천천히 뱃지 사이를 오간다
      tx = Aspect / 2 + Math.sin(t / 2600) * Aspect * 0.42
      ty = -0.5 + Math.sin(t / 3900) * 0.22
      lit = 1
    } else {
      tx = ((Torch.mx - R.left) / R.width) * Aspect
      ty = -(Torch.my - R.top) / R.height
      Torch.on = lerp(Torch.on, Torch.onT, 0.1)
      lit = Torch.on
    }
    Torch.x = lerp(Torch.x, tx, SweepK >= 0 ? 1 : 0.25)
    Torch.y = lerp(Torch.y, ty, SweepK >= 0 ? 1 : 0.25)
    TorchLight.position.set(Torch.x, Torch.y, Size * 0.9)
    TorchLight.intensity = lit * 0.2
    TrayBar.position.set(Torch.x, Torch.y, CamD * 0.55)
    TrayBar.lookAt(Torch.x, Torch.y, 0)
    TrayBar.width = Size * 0.12
    TrayBar.height = Size * 2.2
    TrayBar.intensity = lit * 14
    // 가까운 뱃지일수록 금이 주변 빛을 더 많이 비춘다
    const Rad = Size * 1.05
    for (const S of Slots) {
      const g = Math.exp(-((S.Pivot.position.x - Torch.x) ** 2 + (S.Pivot.position.y - Torch.y) ** 2) / (Rad * Rad)) * lit
      for (const M of S.metals) M.envMapIntensity = 0.28 + g * 3.4
      for (const M of S.colors) M.envMapIntensity = 0.45 + g * 0.12
      // 호버 · 포커스 : 방석에서 살짝 들리고, 그림자가 오른쪽 아래로 밀리며 옅어진다
      S.lift = lerp(S.lift, S.liftT, 0.15)
      S.Pivot.visible = !S.hidden
      S.Pivot.position.z = S.lift * Size * 0.25
      S.Pivot.rotation.set(S.lift * 0.05, 0, S.rot)
      S.Pivot.scale.setScalar(1 + S.lift * 0.06)
      S.Shade.visible = !S.hidden
      S.Shade.position.set(S.Pivot.position.x + Size * (0.07 + S.lift * 0.1), S.Pivot.position.y - Size * (0.09 + S.lift * 0.12), -0.01)
      S.Shade.rotation.z = S.rot
      S.Shade.scale.setScalar(Size * 1.4 * (1 + S.lift * 0.08))
      S.Shade.material.opacity = 0.75 - S.lift * 0.25
    }
    Sig[0] = Torch.x
    Sig[1] = Torch.y
    Sig[2] = lit
    Sig[3] = Size
    for (const S of Slots) {
      Sig[4 + S.i * 2] = S.lift
      Sig[5 + S.i * 2] = S.hidden ? 1 : 0
    }
    let Changed = TrayDirty
    for (let i = 0; !Changed && i < Sig.length; i++) Changed = !(Math.abs(Sig[i] - Drawn[i]) < 1e-4)
    if (Changed) {
      TrayDirty = false
      Drawn.set(Sig)
      Tray.render(Scene, Cam)
    }
    if (Lift.on) drawLift(t)
    Raf = requestAnimationFrame(frame)
  }

  // ---------- 들어 올린 뱃지 만지기 ----------
  // 끌기 : 돌리기 · 오른쪽 / Shift 끌기 : 옮기기 · 휠 / 두 손가락 집기 : 확대 · 두 번 누르기 : 처음 모습
  const Ptrs = new Map<number, { x: number; y: number }>()
  let Mode: 'turn' | 'move' | 'pinch' | null = null
  let Moved = 0
  let Pinch = { d: 1, z: 1, mx: 0, my: 0, px: 0, py: 0 }
  const clampZoom = (z: number) => Math.max(0.6, Math.min(3.2, z))
  // 뱃지 위를 눌렀는지 : 화면에서 뱃지가 차지하는 원 안인지로 가늠한다
  const onBadge = (cx: number, cy: number) => Math.hypot(cx - (Lift.to.x + U.px), cy - (Lift.to.y + U.py)) < (Lift.to.s * U.zoom) / 2 + 20
  on(LiftCanvas, 'pointerdown', (e: PointerEvent) => {
    if (View !== 'held') return
    LiftCanvas.setPointerCapture(e.pointerId)
    Ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
    Moved = 0
    U.drag = true
    U.vx = U.vy = 0
    if (Ptrs.size === 2) {
      const [a, b] = [...Ptrs.values()]
      Pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: U.zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, px: U.px, py: U.py }
      Mode = 'pinch'
    } else Mode = e.button === 2 || e.shiftKey ? 'move' : 'turn'
  })
  on(LiftCanvas, 'pointermove', (e: PointerEvent) => {
    const P = Ptrs.get(e.pointerId)
    if (!P) return
    const dx = e.clientX - P.x
    const dy = e.clientY - P.y
    P.x = e.clientX
    P.y = e.clientY
    Moved += Math.abs(dx) + Math.abs(dy)
    if (Mode === 'pinch' && Ptrs.size === 2) {
      const [a, b] = [...Ptrs.values()]
      U.zoom = clampZoom((Pinch.z * Math.hypot(a.x - b.x, a.y - b.y)) / Pinch.d)
      U.px = Pinch.px + (a.x + b.x) / 2 - Pinch.mx
      U.py = Pinch.py + (a.y + b.y) / 2 - Pinch.my
    } else if (Mode === 'move') {
      U.px += dx
      U.py += dy
    } else if (Mode === 'turn') {
      // 끈 방향으로 굴린다 : 가로로 끌면 세로축, 세로로 끌면 가로축
      U.vx = dx * 0.01
      U.vy = dy * 0.01
      U.q.premultiply(turnBy(U.vy, U.vx))
    }
  })
  const up = (e: PointerEvent) => {
    if (!Ptrs.has(e.pointerId)) return
    Ptrs.delete(e.pointerId)
    // 두 손가락 중 하나를 떼면 남은 손가락으로 이어서 돌린다
    if (Ptrs.size === 1) {
      Mode = 'turn'
      return
    }
    if (Ptrs.size) return
    U.drag = false
    // 끌지 않고 누르기 : 뱃지 위면 문서 화면, 밖이면 제자리로
    if (Moved < 5 && Mode !== 'pinch') {
      if (onBadge(e.clientX, e.clientY)) openDocs()
      else goBack()
    }
    Mode = null
  }
  on(LiftCanvas, 'pointerup', up)
  on(LiftCanvas, 'pointercancel', up)
  on(LiftCanvas, 'contextmenu', (e: Event) => e.preventDefault())
  on(
    LiftCanvas,
    'wheel',
    (e: WheelEvent) => {
      if (View !== 'held') return
      e.preventDefault()
      U.zoom = clampZoom(U.zoom * Math.exp(-e.deltaY * 0.0015))
    },
    { passive: false },
  )
  on(LiftCanvas, 'dblclick', () => View === 'held' && (U.reset = true))
  // 키보드 : 화살표 돌리기, + / - 확대 · 축소, 0 처음으로, Esc 한 단계 뒤로
  on(window, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && View !== 'box') return goBack()
    if (View !== 'held') return
    const Turn = ({ ArrowLeft: [0, -0.25], ArrowRight: [0, 0.25], ArrowUp: [-0.25, 0], ArrowDown: [0.25, 0] } as Record<string, number[]>)[e.key]
    if (Turn) {
      e.preventDefault()
      U.q.premultiply(turnBy(Turn[0], Turn[1]))
    } else if (e.key === '+' || e.key === '=') U.zoom = clampZoom(U.zoom * 1.2)
    else if (e.key === '-') U.zoom = clampZoom(U.zoom / 1.2)
    else if (e.key === '0') U.reset = true
  })

  // ---------- 상태 : 상자 → 들기 → 문서 ----------
  const Docs = $<HTMLElement>('.docs')
  const DocsTitle = $<HTMLElement>('.docs h1')
  const DocsList = $<HTMLElement>('.docs-list')
  const Dimmer = $<HTMLElement>('.dimmer')
  let View: View = 'box'
  let Picked: Slot | null = null
  const Held = (): Pose => ({ x: innerWidth / 2, y: innerHeight * 0.42, s: Math.min(innerWidth * 0.5, innerHeight * 0.42, 320) })
  const Header = (): Pose => ({ x: innerWidth / 2, y: 96, s: 100 })
  const slotPose = (S: Slot): Pose => {
    const r = S.Btn.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.width / 1.1 }
  }
  // 지금 화면에 보이는 자리에서 새 자리로 옮긴다
  const glide = (to: Pose) => {
    const e = Lift.k
    Lift.from = {
      x: lerp(Lift.from.x, Lift.to.x, e) + U.px * e,
      y: lerp(Lift.from.y, Lift.to.y, e) + U.py * e,
      s: lerp(Lift.from.s, Lift.to.s, e) * lerp(1, U.zoom, e),
    }
    U.px = U.py = 0
    U.zoom = 1
    U.reset = true
    Lift.to = to
    Lift.k = 0
    Lift.kT = 1
    Lift.settled = true
  }

  // 기록 : 이 방 안에서 쌓은 깊이 (religionDepth). 0 이면 뒤로가기 대신 바로 한 단계 위로 바꾼다
  const St = (): HistoryState => (history.state ?? {}) as HistoryState
  const push = (view: View, id: ReligionId | undefined, search: string) =>
    history.pushState({ ...history.state, religionDepth: (St().religionDepth ?? 0) + 1, religionView: view, religionId: id }, '', location.pathname + search)
  const goBack = () => {
    if (View === 'box') return
    if ((St().religionDepth ?? 0) > 0) return history.back()
    // 문서 화면 주소로 바로 들어온 경우 : 기록을 늘리지 않고 한 단계씩 올라간다
    if (View === 'docs') {
      history.replaceState({ ...history.state, religionView: 'held', religionId: Picked?.r.id }, '', location.pathname)
      closeDocs()
    } else {
      history.replaceState({ ...history.state, religionView: 'box', religionId: undefined }, '', location.pathname)
      putBack()
    }
  }

  // 1. 한 번 누르면 : 방석에서 뽑혀 떠오르고, 끌어서 돌리고 옮기고 확대할 수 있다
  const pick = (S: Slot, record = true) => {
    if (Picked || !Interactive) return
    Picked = S
    View = 'held'
    if (Lift.G) LiftScene.remove(Lift.G)
    const { G } = makeBadge(partsOf(S.r.id), Mats, false)
    // 돌리는 축이 뱃지 두께의 가운데를 지나도록
    G.children.forEach((m) => m.position.set(0, 0, -4))
    LiftScene.add(G)
    Lift.G = G
    resetUser()
    Lift.rot = S.rot
    Lift.settled = false
    Lift.from = slotPose(S)
    Lift.to = Held()
    Lift.k = 0
    Lift.kT = 1
    Lift.on = true
    Lift.done = null
    S.hidden = true
    LiftCanvas.classList.add('live')
    Dimmer.classList.add('on')
    if (record) push('held', S.r.id, '')
  }

  // 2. 들고 있는 뱃지를 한 번 더 누르면 : 뱃지가 위로 올라가 제목 자리에 앉고 그 종교의 문서 화면이 열린다
  const openDocs = async (record = true) => {
    if (View !== 'held' || !Picked) return
    View = 'docs'
    const R = Picked.r
    if (record) push('docs', R.id, docsSearch(R.id))
    LiftCanvas.classList.remove('live')
    glide(Header())
    DocsTitle.textContent = R.name
    DocsList.replaceChildren(
      ...(R.posts.length
        ? R.posts.map((p) => {
            const Li = document.createElement('li')
            const A = document.createElement('a')
            A.href = `/posts/${p.slug}`
            A.textContent = p.title
            Li.append(A)
            return Li
          })
        : [Object.assign(document.createElement('li'), { className: 'empty', textContent: '준비 중' })]),
    )
    Docs.scrollTop = 0
    Docs.classList.add('on')
    // 글 목록은 전환이 끝난 뒤에
    await wait(560)
    if (View === 'docs') Docs.classList.add('ready')
  }
  const closeDocs = async () => {
    View = 'held'
    Docs.classList.remove('ready')
    await wait(150)
    Docs.classList.remove('on')
    glide(Held())
    LiftCanvas.classList.add('live')
  }

  // 3. 뱃지 밖을 누르거나 뒤로 : 방석의 제자리로. 내려앉은 뒤에 방석 위 뱃지를 다시 보인다
  const putBack = () => {
    if (!Picked) return
    const S = Picked
    View = 'box'
    glide(slotPose(S))
    Lift.settled = false
    Lift.kT = 0
    Lift.k = 1
    Lift.to = Lift.from
    Lift.from = slotPose(S)
    U.drag = false
    LiftCanvas.classList.remove('live')
    Dimmer.classList.remove('on')
    Lift.done = () => {
      S.hidden = false
      Picked = null
    }
  }

  on(window, 'popstate', async (e: PopStateEvent) => {
    if (!root.isConnected || !location.pathname.startsWith('/religion')) return
    const S = (e.state ?? {}) as HistoryState
    const v = S.religionView ?? 'box'
    if (View === 'docs' && v !== 'docs') await closeDocs()
    if (View === 'held' && v === 'box') putBack()
    // 앞으로 가기
    const Target = Slots.find((x) => x.r.id === S.religionId)
    if (View === 'box' && v !== 'box' && Target && Interactive) pick(Target, false)
    if (View === 'held' && v === 'docs') openDocs(false)
  })
  on(Dimmer, 'click', () => View === 'held' && goBack())
  // 뱃지 자리 버튼을 비껴 누른 탭 : 기울어진 3D 상자 안의 버튼은 휴대폰 브라우저에 따라 손가락 위치와 어긋나게 판정된다
  // 화면에 보이는 버튼 자리 (getBoundingClientRect 는 원근까지 반영한다) 에서 가장 가까운 뱃지를 고른다
  on($<HTMLElement>('.stage'), 'click', (e: MouseEvent) => {
    if (Picked || !Interactive || (e.target as HTMLElement).closest('.hit')) return
    let Best: Slot | null = null
    let BestD = Infinity
    for (const S of Slots) {
      const B = S.Btn.getBoundingClientRect()
      const d = Math.hypot(e.clientX - (B.left + B.width / 2), e.clientY - (B.top + B.height / 2))
      if (d < B.width * 0.75 && d < BestD) [Best, BestD] = [S, d]
    }
    if (Best) pick(Best)
  })
  // 문서 화면 : 돌아가기 버튼이나 글 목록 밖 빈 곳을 누르면 든 뱃지로 돌아간다
  on(Docs, 'click', (e: MouseEvent) => {
    // 열리는 중에는 받지 않는다 : 두 번 누르기의 두 번째 누름이 열자마자 닫지 않게
    if (View !== 'docs' || !Docs.classList.contains('ready')) return
    const T = e.target as HTMLElement
    if (T.closest('.docs-back') || !T.closest('.docs-list, h1')) goBack()
  })

  // ---------- 열고 닫기 ----------
  const Box = $<HTMLElement>('.box')
  const Latches = [...root.querySelectorAll<HTMLElement>('.latch')]
  const enter = async () => {
    if (fromHub && !Reduce) {
      // 허브 칸 색이 가라앉는 동안 기다렸다가 : 상자 → 걸쇠 → 뚜껑 → 빛
      await wait(700)
      Box.classList.add('shown')
      await wait(650)
      Latches[0].classList.add('up')
      await wait(110)
      Latches[1].classList.add('up')
      await wait(260)
      Box.classList.add('open')
      await wait(500)
      Interactive = true
      await wait(400)
      sweep()
    } else {
      // 글에서 돌아오거나 새로고침 : 열린 상자를 짧게 드러낸다
      root.classList.add('instant')
      Box.classList.add('shown', 'open')
      Latches.forEach((l) => l.classList.add('up'))
      await wait(60)
      root.classList.remove('instant')
      Interactive = true
    }
  }

  // 방을 나갈 때 : 글로 가면 문서 화면이 옅어지고, 그 밖 (홈 등) 으로 가면 뚜껑을 닫고 걸쇠를 잠근 뒤 넘어간다
  on(document, 'astro:before-preparation', (e: TransitionBeforePreparationEvent) => {
    if (e.to.pathname === location.pathname) return
    const Orig = e.loader
    e.loader = async () => {
      Interactive = false
      if (View === 'docs') {
        Docs.classList.remove('ready')
        await wait(200)
      } else {
        if (Picked) {
          putBack()
          await wait(700)
        }
        Box.classList.remove('open')
        Box.classList.add('closing')
        await wait(820)
        Latches[1].classList.remove('up')
        await wait(100)
        Latches[0].classList.remove('up')
        await wait(250)
      }
      await Orig()
    }
  })

  // ---------- 시작 ----------
  layout()
  Raf = requestAnimationFrame(frame)
  const { id: DeepId, canonical } = parseDocs(location.search)
  history.replaceState(
    { ...history.state, religionDepth: St().religionDepth ?? 0, religionView: DeepId ? 'docs' : 'box', religionId: DeepId ?? undefined },
    '',
    location.pathname + canonical,
  )
  enter().then(() => {
    // 문서 화면 주소로 바로 들어오면 : 그 뱃지를 들어 제목 자리에 앉힌다
    const Target = DeepId && Slots.find((x) => x.r.id === DeepId)
    if (!Alive || !Target) return
    pick(Target, false)
    openDocs(false)
  })

  return () => {
    Alive = false
    cancelAnimationFrame(Raf)
    Timers.forEach((T) => clearTimeout(T))
    Timers.clear()
    RO.disconnect()
    Off.forEach((f) => f())
    for (const S of Slots) {
      S.Shade.material.map?.dispose()
      S.Shade.material.dispose()
      S.metals.forEach((M) => M.dispose())
      S.colors.forEach((M) => M.dispose())
    }
    Geo.forEach((P) => P.forEach(({ g }) => g.dispose()))
    ShadowGeo.dispose()
    Mats.dispose()
    const Ltc = THREE.UniformsLib as unknown as Partial<Record<(typeof LtcKeys)[number], THREE.Texture>>
    for (const K of LtcKeys) Ltc[K]?.dispose()
    Scene.environment?.dispose()
    LiftScene.environment?.dispose()
    // dispose 만으로는 WebGL 컨텍스트가 GC 전까지 남는다 : 방을 오갈수록 쌓여 브라우저 한도 (약 16개) 에 닿지 않게 바로 놓는다
    Tray.dispose()
    Tray.forceContextLoss()
    LiftR.dispose()
    LiftR.forceContextLoss()
  }
}
