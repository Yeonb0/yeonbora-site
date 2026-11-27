// 프로젝트 방 : 도트로 그린 방 한 장. Room.tsx 가 그린 골격 (root) 위에서 TV 속 CD 고르기, 창밖 하늘 · 날씨, 방 연출을 돌린다
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client'
import { blankArt, loadArt } from './art'
import { DiscSize, drawDisc } from './disc'
import { drawText } from './font'
import { canvas2d } from './pixel'
import { Ih, Iw, Pad, Patch, Tail, Tvr, Win, baseLayout, isSky, tvClip, zoomLayout } from './scene'
import type { Base } from './scene'
import { atHour, hourOf, lerpc, moonPhase, roomLook, weatherOf } from './sky'
import type { Project, Weather } from './types'
import { makeView } from './view'

export interface RoomOptions {
  root: HTMLElement
  projects: Project[]
  // 방 그림 주소
  scene: string
  // 허브에서 막 들어왔는지 : 아니면 (뒤로가기 · 새로고침) 방을 바로 보인다
  fromHub: boolean
}

interface Cd {
  el: HTMLElement
  ctx: CanvasRenderingContext2D
  img: ImageData
  art: Uint8ClampedArray
  // 인쇄면 회전 (도) 과 회전 속도
  a: number
  v: number
  key: string
}

// CD 가 손을 대고 있을 때 도는 최고 속도 (도 / 프레임)
const SpinMax = 2.4375
const SpinMaxReduce = 0.375
// 화면 속 이웃 CD 간격 (디스크 지름 대비)
const Gap = 0.72
const SeoulWeather = 'https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.978&current=weather_code'

export const mountRoom = ({ root, projects, scene, fromHub }: RoomOptions): (() => void) => {
  const Reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!
  const Off: (() => void)[] = []
  const on = (t: Window | Document | HTMLElement, type: string, fn: (e: never) => void, opt?: AddEventListenerOptions | boolean) => {
    t.addEventListener(type, fn as EventListener, opt)
    Off.push(() => t.removeEventListener(type, fn as EventListener, opt))
  }
  let Alive = true
  const Timers = new Set<number>()
  const later = (fn: () => void, ms: number) => {
    const Id = window.setTimeout(() => {
      Timers.delete(Id)
      if (Alive) fn()
    }, ms)
    Timers.add(Id)
    return Id
  }
  // 미리 취소한 타이머도 목록에서 뺀다 : clearTimeout 만 하면 TV 에 마우스를 넣었다 뺄 때마다 id 가 쌓인다
  const cancel = (Id: number) => {
    clearTimeout(Id)
    Timers.delete(Id)
  }
  const wait = (ms: number) => new Promise<void>((r) => later(r, Reduce ? Math.min(ms, 60) : ms))
  // CSS 변수는 값이 바뀔 때만 쓴다 : 매 프레임 같은 값을 쓰면 스타일을 다시 계산한다
  const Vars = new Map<string, string>()
  const setVar = (k: string, v: string) => {
    if (Vars.get(k) === v) return
    Vars.set(k, v)
    root.style.setProperty(k, v)
  }

  const World = $<HTMLElement>('.world')
  const Screen = $<HTMLElement>('.screen')
  const Stage = $<HTMLElement>('.stage')
  const PrevB = $<HTMLButtonElement>('.arrow.prev')
  const NextB = $<HTMLButtonElement>('.arrow.next')
  const Flash = $<HTMLElement>('.flash')
  const N = projects.length
  setVar('--tvclip', tvClip())

  let Interactive = false
  let Pos = 0
  let Target = 0
  let Index = 0
  let Hover = false
  let Zoomed = false
  let Zs = 1
  let Base: Base = { k: 1, ox: 0, oy: 0 }

  // ---------- CD ----------
  const Cds: Cd[] = projects.map((g, i) => {
    const El = document.createElement('div')
    El.className = 'cd'
    const Cv = document.createElement('canvas')
    Cv.width = Cv.height = DiscSize
    El.append(Cv)
    Stage.append(El)
    El.addEventListener('pointerenter', () => {
      if (i === Index) Hover = true
    })
    El.addEventListener('pointerleave', () => {
      Hover = false
    })
    const Ctx = Cv.getContext('2d')!
    return { el: El, ctx: Ctx, img: Ctx.createImageData(DiscSize, DiscSize), art: blankArt(g.color), a: Math.random() * 360, v: 0, key: '' }
  })
  // 그림이 오면 바꿔 끼우고 다시 그린다 (멈춰 있어도 다음 프레임에 한 번 그리게 한다)
  projects.forEach((g, i) =>
    loadArt(g.id)
      .then((A) => {
        if (!Alive) return
        Cds[i].art = A
        Cds[i].key = ''
        LastPos = NaN
      })
      .catch(() => {}),
  )
  const go = (i: number) => {
    Target = Math.max(0, Math.min(N - 1, i))
  }
  const Label = $<HTMLCanvasElement>('.label').getContext('2d')!
  let LabelOf = -1
  const showLabel = () => {
    if (LabelOf === Index) return
    LabelOf = Index
    drawText(Label, projects[Index].en)
  }

  // 빛은 마우스를 따라가지 않고 TV 왼쪽 위 (창문 쪽) 한 자리에 고정
  const lightAt = () => {
    const R = Screen.getBoundingClientRect()
    return [R.left + R.width * 0.12, R.top - R.height * 0.35]
  }

  // 드래그 : 손을 따라 디스크가 굴러가고, 놓으면 가장 가까운 디스크에 멈춘다
  let Drag: { x: number; last: number; start: number; t: number } | null = null
  let Moved = false
  let Vel = 0
  const Dsize = () => Cds[0].el.offsetWidth
  // 확대 전에는 TV 위의 드래그 · 클릭이 CD 를 건드리지 않는다 (TV 를 누르는 것으로만 받는다)
  on(Stage, 'pointerdown', (e: PointerEvent) => {
    if (!Zoomed) e.stopImmediatePropagation()
  }, true)
  on(Stage, 'pointerdown', (e: PointerEvent) => {
    if (!Interactive) return
    Drag = { x: e.clientX, last: e.clientX, start: Pos, t: performance.now() }
    Moved = false
    Vel = 0
    Stage.classList.add('drag')
    Stage.setPointerCapture(e.pointerId)
  })
  on(Stage, 'pointermove', (e: PointerEvent) => {
    if (!Drag) return
    const Sp = Dsize() * Gap * Zs
    const Dx = e.clientX - Drag.x
    if (Math.abs(Dx) > 5) Moved = true
    const Now = performance.now()
    Vel = (((e.clientX - Drag.last) / Math.max(1, Now - Drag.t)) * 16) / Sp
    Drag.last = e.clientX
    Drag.t = Now
    Pos = Math.max(-0.35, Math.min(N - 0.65, Drag.start - Dx / Sp))
    Target = Pos
  })
  const endDrag = (e: PointerEvent) => {
    if (!Drag) return
    Stage.classList.remove('drag')
    Drag = null
    if (Moved) return go(Math.round(Pos - Vel * 6))
    if (e.type === 'pointercancel') return go(Math.round(Pos))
    const Hit = Cds.findIndex((c) => c.el.contains(document.elementFromPoint(e.clientX, e.clientY)))
    if (Hit < 0) return
    if (Hit === Index && Math.abs(Pos - Index) < 0.05) openPage(Hit)
    else go(Hit)
  }
  on(Stage, 'pointerup', endDrag)
  on(Stage, 'pointercancel', endDrag)
  let WheelAt = 0
  on(
    Stage,
    'wheel',
    (e: WheelEvent) => {
      const Now = performance.now()
      const Dl = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (!Zoomed || Now - WheelAt < 180 || Math.abs(Dl) < 6) return
      WheelAt = Now
      go(Math.round(Target) + Math.sign(Dl))
    },
    { passive: true },
  )
  on(PrevB, 'click', () => go(Math.round(Target) - 1))
  on(NextB, 'click', () => go(Math.round(Target) + 1))

  const Spin = Reduce ? SpinMaxReduce : SpinMax
  // 방 그림이 옮겨지는 동안 (확대 · 화면 크기 전환 0.9s) 은 CD 가 멈춰 있어도 빛 방향을 다시 잰다
  let MoveUntil = 0
  let LastPos = NaN
  // CD 마다 마지막으로 쓴 스타일 : 같은 값이면 다시 쓰지 않는다 (스타일 재계산을 줄인다)
  const Written = Cds.map(() => ({ tf: '', op: '', z: '' }))
  const Rects: (DOMRect | null)[] = Cds.map(() => null)
  const place = (t: number) => {
    const Before = Pos
    if (!Drag) {
      Pos += (Target - Pos) * 0.12
      // 거의 다 왔으면 딱 맞춘다 : 끝없이 조금씩 다가가며 매 프레임 다시 그리지 않게
      if (Math.abs(Target - Pos) < 5e-4) Pos = Target
    }
    // 다 멈췄으면 (끌지 않음 · 제자리 · 돌지 않음 · 방이 옮겨지는 중이 아님) 아무것도 읽거나 쓰지 않는다
    const Moving = Drag || Hover || Pos !== LastPos || t < MoveUntil || Cds.some((c) => c.v !== 0)
    LastPos = Pos
    if (!Moving) return
    // 읽기를 먼저 몰아서 한다 : 쓰기 사이에 위치를 읽으면 CD 마다 레이아웃이 강제된다
    // (읽는 위치는 지난 프레임 것이라 빛 방향이 한 프레임 늦지만 눈에 띄지 않는다)
    const Sp = Dsize() * Gap
    const [Lx, Ly] = lightAt()
    Cds.forEach((c, i) => (Rects[i] = Math.abs(i - Pos) < 2.5 ? c.el.getBoundingClientRect() : null))
    // 옆으로 굴러가는 만큼 인쇄면도 돈다
    const Roll = (Pos - Before) * Sp * -0.5
    const Ni = Math.max(0, Math.min(N - 1, Math.round(Pos)))
    if (Ni !== Index) {
      Index = Ni
      Hover = false
    }
    const PrevOff = Math.round(Target) <= 0
    const NextOff = Math.round(Target) >= N - 1
    if (PrevB.disabled !== PrevOff) PrevB.disabled = PrevOff
    if (NextB.disabled !== NextOff) NextB.disabled = NextOff
    Cds.forEach((c, i) => {
      const d = i - Pos
      const Ad = Math.abs(d)
      const Sc = 1 - 0.4 * Math.min(Ad, 1) - 0.1 * Math.max(0, Math.min(Ad - 1, 2))
      const Ry = Math.max(-38, Math.min(38, -d * 30))
      const X = Math.sign(d) * (Math.min(Ad, 1) * Sp + Math.max(0, Ad - 1) * Sp * 0.55)
      const W = Written[i]
      const Tf = `translateX(${X.toFixed(2)}px) rotateY(${Ry.toFixed(2)}deg) scale(${Sc.toFixed(4)})`
      const Op = String(Math.max(0, 1 - 0.28 * Math.max(0, Ad - 0.4)))
      const Z = String(100 - Math.round(Ad * 10))
      if (W.tf !== Tf) c.el.style.transform = W.tf = Tf
      if (W.op !== Op) c.el.style.opacity = W.op = Op
      if (W.z !== Z) c.el.style.zIndex = W.z = Z
      const On = Hover && i === Index && !Drag
      c.v += ((On ? Spin : 0) - c.v) * (On ? 0.035 : 0.025)
      if (!On && Math.abs(c.v) < 1e-3) c.v = 0
      c.a += c.v + Roll
      const B = Rects[i]
      if (!B) return
      const Light = Math.atan2(Ly - (B.top + B.height / 2), Lx - (B.left + B.width / 2))
      const Key = `${c.a.toFixed(1)}:${Light.toFixed(3)}`
      if (Key === c.key) return
      c.key = Key
      drawDisc(c.img.data, c.art, c.a, Light)
      c.ctx.putImageData(c.img, 0, 0)
    })
  }

  // ---------- 방 그림 배치 + TV 확대 ----------
  const apply = () => {
    const Z = zoomLayout(innerWidth, innerHeight, Base, Zoomed)
    Zs = Z.s
    World.style.transform = `translate(${Z.tx}px, ${Z.ty}px) scale(${Z.s})`
    root.classList.toggle('zoom', Zoomed)
    // 방 그림 전환 (0.9s) 이 끝날 때까지 CD 빛 방향을 따라 잰다
    MoveUntil = performance.now() + 1000
  }
  const layoutWorld = () => {
    Base = baseLayout(innerWidth, innerHeight)
    setVar('--ww', Iw * Base.k + 'px')
    setVar('--wh', Ih * Base.k + 'px')
    setVar('--d', Tvr.h * Base.k * 0.64 + 'px')
    apply()
  }
  const zoom = (On: boolean) => {
    if (Zoomed === On || (On && !Interactive)) return
    Zoomed = On
    apply()
  }
  // 마우스 : TV 에 잠깐 머무르면 확대, 확대된 화면 밖으로 나가면 원래대로
  let Dwell = 0
  on(Screen, 'pointerenter', (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    cancel(Dwell)
    Dwell = later(() => zoom(true), 220)
  })
  on(Screen, 'pointerleave', (e: PointerEvent) => {
    cancel(Dwell)
    if (e.pointerType === 'mouse' && !Drag) zoom(false)
  })
  // 터치 : TV 를 누르면 확대, 확대된 화면 밖을 누르면 원래대로
  on(Screen, 'click', () => zoom(true))
  on(window, 'pointerdown', (e: PointerEvent) => {
    if (Zoomed && e.pointerType !== 'mouse' && !Screen.contains(e.target as Node)) zoom(false)
  })
  // 키보드 : Tab 으로 TV 에 오면 확대, TV 밖으로 나가면 원래대로
  on(Screen, 'focusin', () => {
    if (Screen.matches(':focus-visible') || Screen.querySelector(':focus-visible')) zoom(true)
  })
  on(Screen, 'focusout', (e: FocusEvent) => {
    if (!Screen.contains(e.relatedTarget as Node) && !Screen.matches(':hover')) zoom(false)
  })

  // 확대 전 방향키 : 여자애 패드의 누른 쪽 버튼이 반짝인다 (그림은 움직이지 않는다)
  const PadCtx = $<HTMLCanvasElement>('.padcv').getContext('2d')!
  const press = (Dir: number) => {
    // 왼쪽 방향키 자리 (26, 29) · 오른쪽 버튼 자리 (68, 23)
    const [Bx, By] = Dir < 0 ? [26, 29] : [68, 23]
    const frame = (k: number) => {
      PadCtx.clearRect(0, 0, Pad.w, Pad.h)
      PadCtx.fillStyle = 'rgba(255, 214, 120, 0.35)'
      PadCtx.fillRect(Bx - 2, By - 2, 6, 6)
      PadCtx.fillStyle = '#fff1a8'
      PadCtx.fillRect(Bx, By, 2, 2)
      // 십자 반짝임 : 한 번 퍼졌다가 줄어든다
      const R = k === 1 ? 4 : 3
      PadCtx.fillStyle = k === 1 ? '#fff6d0' : 'rgba(255, 240, 190, 0.6)'
      for (const [x, y] of [
        [0, -R],
        [0, R + 1],
        [-R, 0],
        [R + 1, 0],
      ])
        PadCtx.fillRect(Bx + x, By + y, 1, 1)
    }
    frame(0)
    later(() => frame(1), 60)
    later(() => frame(2), 130)
    later(() => PadCtx.clearRect(0, 0, Pad.w, Pad.h), 220)
  }

  on(window, 'keydown', (e: KeyboardEvent) => {
    if (!Interactive || e.altKey || e.ctrlKey || e.metaKey) return
    const T = e.target as HTMLElement
    if (T.closest('input, textarea, select')) return
    if (e.key === 'Escape') zoom(false)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const Dir = e.key === 'ArrowRight' ? 1 : -1
      if (!Zoomed) press(Dir)
      go(Math.round(Target) + Dir)
    }
    if (e.key === 'Enter' && !T.closest('a, button')) openPage(Index)
  })

  // ---------- 프로젝트 열기 : 가운데 CD 를 누르면 한 바퀴 힘차게 돌고, 저장소 · 서비스는 새 탭, 사이트 안 페이지는 같은 탭으로 연다 ----------
  const openPage = (i: number) => {
    Cds[i].v = Spin * 3
    const Href = projects[i].href
    if (Href.startsWith('/')) location.assign(Href)
    else window.open(Href, '_blank', 'noopener')
  }

  // ---------- 시간 · 날씨 ----------
  let Hour = hourOf(new Date())
  let Follow = true
  let Phase = moonPhase(Date.now())
  let Weather: Weather = 'clear'
  let WeatherMode: 'real' | Weather = 'real'
  let WeatherAbort: AbortController | null = null
  const fetchWeather = () => {
    WeatherAbort?.abort()
    WeatherAbort = new AbortController()
    fetch(SeoulWeather, { signal: WeatherAbort.signal })
      .then((r) => r.json())
      .then((d: { current?: { weather_code?: number } }) => {
        const Code = d.current?.weather_code
        if (Alive && WeatherMode === 'real' && typeof Code === 'number') Weather = weatherOf(Code)
      })
      .catch(() => {})
  }
  fetchWeather()
  const WeatherTimer = window.setInterval(fetchWeather, 15 * 60 * 1000)
  const ClockTimer = window.setInterval(() => {
    if (Follow) {
      Hour = hourOf(new Date())
      Phase = moonPhase(Date.now())
    }
    syncCtl()
  }, 30000)

  // 그림에서 떼어 낸 판 : 다시 그릴 창 칸, 바닥 창빛 자리, 고양이 꼬리
  const [WinMask, WmCtx] = canvas2d(Win.w, Win.h)
  const [PatchMask, PmCtx] = canvas2d(Patch.w, Patch.h)
  const WinCtx = $<HTMLCanvasElement>('.win').getContext('2d')!
  const PatchCtx = $<HTMLCanvasElement>('.patch').getContext('2d')!
  let MaskReady = false
  let TailPix: [number, number, string][] = []
  const Im = new Image()
  Im.onload = () => {
    if (!Alive) return
    const [TxCv, Tx] = canvas2d(Iw, Ih)
    Tx.drawImage(Im, 0, 0)
    // 유리 칸은 모두 다시 그리고, 화분 잎만 그대로 둔다
    const Md = WmCtx.createImageData(Win.w, Win.h)
    for (let y = 0; y < Win.h; y++) for (let x = 0; x < Win.w; x++) if (isSky(x + Win.x, y + Win.y)) Md.data[(y * Win.w + x) * 4 + 3] = 255
    WmCtx.putImageData(Md, 0, 0)
    // 바닥에 떨어진 푸른 달빛 칸
    const Pd = Tx.getImageData(Patch.x, Patch.y, Patch.w, Patch.h).data
    const Pm = PmCtx.createImageData(Patch.w, Patch.h)
    for (let i = 0; i < Pd.length; i += 4) if (Pd[i + 2] > Pd[i] + 40 && Pd[i + 2] > 140) Pm.data[i + 3] = 255
    PmCtx.putImageData(Pm, 0, 0)
    MaskReady = true
    // 꼬리 : 밝은 칸 (꼬리 털) 과 그 바로 옆 외곽선만 떼어 내고, 원래 자리는 팔걸이 색으로 메운다
    const Td = Tx.getImageData(Tail.x, Tail.y, Tail.w, Tail.h).data
    const Fur = new Uint8Array(Tail.w * Tail.h)
    for (let y = 0; y < Tail.h; y++)
      for (let x = 0; x < Tail.w; x++) {
        const K = (y * Tail.w + x) * 4
        if (x + Tail.x >= 1484 && y + Tail.y >= 628 && Td[K] + Td[K + 1] + Td[K + 2] > 200) Fur[y * Tail.w + x] = 1
      }
    const Grow = Fur.slice()
    for (let y = 0; y < Tail.h; y++)
      for (let x = 0; x < Tail.w; x++)
        if (
          !Fur[y * Tail.w + x] &&
          y + Tail.y >= 628 &&
          [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].some(([a, b]) => Fur[(y + b) * Tail.w + x + a])
        )
          Grow[y * Tail.w + x] = 2
    const Arm = Tx.getImageData(1500, 653, 1, 1).data
    const CoverCtx = $<HTMLCanvasElement>('.tail-cover').getContext('2d')!
    const Cover = CoverCtx.createImageData(Tail.w, Tail.h)
    TailPix = []
    for (let i = 0; i < Grow.length; i++) {
      if (!Grow[i]) continue
      const K = i * 4
      Cover.data.set([Arm[0], Arm[1], Arm[2], 255], K)
      TailPix.push([i % Tail.w, (i / Tail.w) | 0, `rgb(${Td[K]},${Td[K + 1]},${Td[K + 2]})`])
    }
    CoverCtx.putImageData(Cover, 0, 0)
    // 그림 전체 크기 (1536 x 864) 의 읽기용 캔버스는 여기서 다 썼다 : GC 를 기다리지 않고 바로 비운다
    TxCv.width = TxCv.height = 0
    bendTail(0)
  }
  Im.src = scene

  // 고양이 꼬리 살랑 : 4 ~ 8 초마다 한 번. 몸 쪽 (오른쪽 끝) 은 그대로, 끝으로 갈수록 더 휘어 올라간다
  const TailCtx = $<HTMLCanvasElement>('.tail-pix').getContext('2d')!
  const bendTail = (Amp: number) => {
    TailCtx.clearRect(0, 0, Tail.w, Tail.h)
    for (const [x, y, c] of TailPix) {
      const T = Math.max(0, (52 - x) / 46)
      TailCtx.fillStyle = c
      TailCtx.fillRect(x, y - Math.round(Amp * T * T), 1, 1)
    }
  }
  // 높이 (칸) 의 흐름 : 들렸다 → 살짝 내려갔다 → 한 번 더 까딱 → 제자리
  const SwishKeys = [
    [0, 0],
    [0.3, 4],
    [0.55, -1],
    [0.78, 2.5],
    [1, 0],
  ]
  let SwishRaf = 0
  const swish = () => {
    const T0 = performance.now()
    const step = (Now: number) => {
      if (!Alive) return
      const P = Math.min(1, (Now - T0) / 1400)
      let i = 0
      while (i < SwishKeys.length - 2 && SwishKeys[i + 1][0] <= P) i++
      const [Pa, Va] = SwishKeys[i]
      const [Pb, Vb] = SwishKeys[i + 1]
      const K = (P - Pa) / (Pb - Pa)
      bendTail(Va + (Vb - Va) * K * K * (3 - 2 * K))
      if (P < 1) SwishRaf = requestAnimationFrame(step)
    }
    if (!Reduce) SwishRaf = requestAnimationFrame(step)
    later(swish, 4000 + Math.random() * 4000)
  }
  later(swish, 2500)

  // 창밖 장면 + 가는 빗줄기 (창 크기 247 x 360 에서 2 칸 굵기로 따로 그린다)
  const View = makeView()
  const Rain = Array.from({ length: 120 }, () => [Math.random() * Win.w, Math.random() * Win.h, 7 + Math.random() * 4, 8 + Math.random() * 7])
  let NextBolt = 0
  let SkyAt = -1e9
  // 하늘 · 방 색은 시각 · 날씨가 바뀔 때만 다시 계산한다 (매 프레임 색 문자열을 새로 만들지 않게)
  let LookHour = NaN
  let LookWeather: Weather | '' = ''
  let S = atHour(Hour)
  let LightOf = -1
  let TvLight = 0
  const drawSky = (t: number) => {
    if (Hour !== LookHour || Weather !== LookWeather) {
      LookHour = Hour
      LookWeather = Weather
      S = atHour(Hour)
      const L = roomLook(S, Weather)
      setVar('--roomf', L.filter)
      setVar('--tint', L.tint)
      setVar('--tinta', L.tintA.toFixed(3))
      setVar('--aura', L.aura.toFixed(3))
      TvLight = L.tvLight
    }
    // 방으로 퍼지는 TV 빛 : 아주 미세하게 깜빡인다 (setVar 가 같은 값은 다시 쓰지 않는다)
    // CSS @property 애니메이션으로 옮겨 재 보니 오히려 스타일 재계산이 매 프레임 늘어 더 무거웠다
    const Flick = Reduce ? 1 : 1 + Math.sin(t / 90) * 0.02 + Math.sin(t / 37) * 0.015
    setVar('--tvl', (TvLight * Flick).toFixed(2))
    // 색은 보라에 지금 CD 색을 섞는다
    if (Index !== LightOf) {
      LightOf = Index
      setVar('--lightc', lerpc('#8b5cf6', projects[Index].color, 0.35))
    }
    // 맑음 · 흐림은 천천히 변하므로 자주 그리지 않는다. 비 · 눈은 매 프레임
    const Busy = Weather === 'rain' || Weather === 'snow'
    if (!MaskReady || (!Busy && t - SkyAt < 120)) return
    SkyAt = t
    View.draw({ t, sky: S, hour: Hour, phase: Phase, weather: Weather })
    WinCtx.globalCompositeOperation = 'source-over'
    WinCtx.clearRect(0, 0, Win.w, Win.h)
    WinCtx.imageSmoothingEnabled = false
    WinCtx.drawImage(View.canvas, 0, 0, Win.w, Win.h)
    if (Weather === 'rain') {
      WinCtx.fillStyle = lerpc(S.bot, '#ffffff', 0.5)
      WinCtx.globalAlpha = 0.75
      for (const d of Rain) {
        d[1] += Reduce ? d[2] * 0.3 : d[2]
        if (d[1] > Win.h + 20) {
          d[1] = -d[3]
          d[0] = Math.random() * Win.w
        }
        WinCtx.fillRect(d[0] | 0, d[1] | 0, 2, d[3] | 0)
      }
      WinCtx.globalAlpha = 1
    }
    WinCtx.globalCompositeOperation = 'destination-in'
    WinCtx.drawImage(WinMask, 0, 0)
    // 바닥 창빛 : 밤은 달빛 (그림 그대로), 낮 · 노을은 햇빛 색, 흐리면 옅게
    PatchCtx.globalCompositeOperation = 'source-over'
    PatchCtx.clearRect(0, 0, Patch.w, Patch.h)
    const Sun = 1 - S.night
    if (Sun > 0.02 && Weather !== 'rain') {
      PatchCtx.globalAlpha = Sun * (Weather === 'clear' ? 0.55 : 0.25)
      PatchCtx.fillStyle = Hour > 17 || Hour < 7 ? '#ffb07a' : '#ffeccc'
      PatchCtx.fillRect(0, 0, Patch.w, Patch.h)
      PatchCtx.globalAlpha = 1
      PatchCtx.globalCompositeOperation = 'destination-in'
      PatchCtx.drawImage(PatchMask, 0, 0)
    }
    // 천둥 : 비 올 때 가끔
    if (Weather === 'rain' && !Reduce && t > NextBolt) {
      if (NextBolt) Flash.animate([{ opacity: 0 }, { opacity: 0.7 }, { opacity: 0.1 }, { opacity: 0.5 }, { opacity: 0 }], { duration: 600, easing: 'steps(5)' })
      NextBolt = t + 9000 + Math.random() * 14000
    }
  }

  // 개발 서버 전용 조절기 : 시각 · 달 모양 · 날씨를 바꿔 본다
  const Ctl = root.querySelector<HTMLElement>('.ctl')
  const syncCtl = () => {
    if (!Ctl) return
    Ctl.querySelector<HTMLInputElement>('.hour')!.value = String(Hour)
    Ctl.querySelector<HTMLInputElement>('.phase')!.value = String(Phase)
    const H = Math.floor(Hour) % 24
    const M = Math.round((Hour % 1) * 60)
    Ctl.querySelector('.clock')!.textContent = `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`
    Ctl.querySelector('[data-t=now]')!.setAttribute('aria-pressed', String(Follow))
    Ctl.querySelectorAll<HTMLElement>('[data-w]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.w === WeatherMode)))
  }
  if (Ctl) {
    on(Ctl, 'input', (e: Event) => {
      const T = e.target as HTMLInputElement
      Follow = false
      if (T.classList.contains('hour')) Hour = +T.value
      if (T.classList.contains('phase')) Phase = +T.value
      syncCtl()
    })
    on(Ctl, 'click', (e: MouseEvent) => {
      const B = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (!B) return
      if (B.dataset.t === 'now') {
        Follow = true
        Hour = hourOf(new Date())
        Phase = moonPhase(Date.now())
      }
      if (B.dataset.w) {
        WeatherMode = B.dataset.w as typeof WeatherMode
        if (WeatherMode === 'real') fetchWeather()
        else Weather = WeatherMode
      }
      syncCtl()
    })
    syncCtl()
  }

  // ---------- 매 프레임 ----------
  let Raf = 0
  const frame = (t: number) => {
    place(t)
    showLabel()
    drawSky(t)
    Raf = requestAnimationFrame(frame)
  }

  // ---------- 들어오기 · 나가기 ----------
  const enter = async () => {
    if (fromHub && !Reduce) {
      // 허브 칸 색이 가라앉는 동안 기다렸다가 방이 밝아진다
      await wait(650)
      root.classList.add('ready')
      await wait(700)
    } else {
      root.classList.add('instant', 'ready')
      await wait(60)
      root.classList.remove('instant')
    }
    Interactive = true
  }
  // 방을 나갈 때 : 확대 중이면 원래대로 물러난 뒤 방이 어두워지며 넘어간다
  on(document, 'astro:before-preparation', (e: TransitionBeforePreparationEvent) => {
    if (e.to.pathname === location.pathname) return
    const Orig = e.loader
    e.loader = async () => {
      Interactive = false
      if (Zoomed) {
        Zoomed = false
        apply()
        await wait(450)
      }
      root.classList.remove('ready')
      await wait(450)
      await Orig()
    }
  })
  on(window, 'resize', layoutWorld)

  // ---------- 시작 ----------
  layoutWorld()
  Raf = requestAnimationFrame(frame)
  // 한 번 들어온 기록 : 뒤로가기 · 새로고침으로 돌아오면 허브 색 연출 없이 방을 바로 보인다 (Layout.astro 가 읽는다)
  history.replaceState({ ...history.state, projectsSeen: true }, '', location.pathname)
  enter()

  return () => {
    Alive = false
    cancelAnimationFrame(Raf)
    cancelAnimationFrame(SwishRaf)
    Timers.forEach((id) => clearTimeout(id))
    clearInterval(WeatherTimer)
    clearInterval(ClockTimer)
    WeatherAbort?.abort()
    Im.onload = null
    Off.forEach((f) => f())
    Cds.forEach((c) => c.el.remove())
    // 화면 밖 캔버스 : Safari 는 캔버스 메모리를 GC 전까지 한도에 센다
    for (const Cv of [WinMask, PatchMask, View.canvas]) Cv.width = Cv.height = 0
  }
}
