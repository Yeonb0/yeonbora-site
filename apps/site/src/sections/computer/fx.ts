// 컴퓨터 방 효과 훅 : 마우스 기울기, 시계 화면보호기
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

const ClockKey = 'yeonbora:computer:clock-pos:v1'
const Reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 마우스 위치 → --mx, --my (-1 ~ 1, 부드럽게 따라간다). 터치 기기 · reduced motion 에서는 0 으로 둔다
// Locked 가 true 면 목표를 0 으로 고정한다 (화면보호기)
export function useTilt(Room: RefObject<HTMLElement | null>, Locked: RefObject<boolean>) {
  const Kick = useRef<() => void>(() => {})
  useEffect(() => {
    const el = Room.current
    if (!el) return
    el.style.setProperty('--mx', '0')
    el.style.setProperty('--my', '0')
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || Reduced()) return
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let raf = 0
    const tick = () => {
      const gx = Locked.current ? 0 : tx
      const gy = Locked.current ? 0 : ty
      cx += (gx - cx) * 0.14
      cy += (gy - cy) * 0.14
      if (Math.abs(gx - cx) < 0.001 && Math.abs(gy - cy) < 0.001) {
        cx = gx
        cy = gy
        raf = 0
      } else raf = requestAnimationFrame(tick)
      el.style.setProperty('--mx', cx.toFixed(4))
      el.style.setProperty('--my', cy.toFixed(4))
    }
    Kick.current = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1))
      ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1))
      Kick.current()
    }
    const onLeave = () => {
      tx = 0
      ty = 0
      Kick.current()
    }
    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [Room, Locked])
  return () => Kick.current()
}

export type SaverPhase = 'off' | 'on' | 'back'

// 시계 배치 + 화면보호기
// mover 는 left 0, top 0 에 두고 translate3d + scale 로만 움직인다 (크기는 tokens.css 의 고정값, 화면에 맞추는 건 scale 만)
// 30s 입력이 없으면 시계가 화면 안을 떠다니며 벽에서 반사되고, 입력이 생기면 0.9s 동안 제자리로 돌아온 뒤 아이콘이 돌아온다
export function useClockSaver(Screen: RefObject<HTMLElement | null>, Mover: RefObject<HTMLElement | null>, onChange: () => void, IdleMs = 30000) {
  const [Phase, setPhase] = useState<SaverPhase>('off')
  const Locked = useRef(false)
  const Change = useRef(onChange)
  Change.current = onChange

  useEffect(() => {
    const sc = Screen.current
    const mv = Mover.current
    if (!sc || !mv) return
    let phase: SaverPhase = 'off'
    let s = 1
    // 화면 맞춤 scale (base) 에 사용자가 모서리를 끌어 정한 배율 (k) 을 곱한다
    let base = 1
    let k = 1
    let x = 0
    let y = 0
    let vx = 0
    let vy = 0
    let raf = 0
    let last = 0
    let lastInput = performance.now()
    let backTimer = 0
    const set = (p: SaverPhase) => {
      phase = p
      Locked.current = p === 'on'
      setPhase(p)
      Change.current()
    }
    // 제자리 : 아래 40% 영역 안에서 사용자가 끌어 둔 위치 (비율 u, v : 0 ~ 1)
    let u = 0.5
    let v = 0.5
    try {
      const Saved = JSON.parse(localStorage.getItem(ClockKey) ?? 'null') as unknown
      if (Array.isArray(Saved) && (Saved.length === 2 || Saved.length === 3) && Saved.every((n) => typeof n === 'number' && n >= 0 && n <= 2)) {
        u = Math.min(Saved[0] as number, 1)
        v = Math.min(Saved[1] as number, 1)
        if (Saved.length === 3) k = Math.min(Math.max(Saved[2] as number, 0.4), 1.6)
      }
    } catch {
      // 저장된 위치를 못 읽으면 가운데
    }
    const Zone = () => {
      const m = Max()
      return { top: Math.min(sh * 0.6, m.y), m }
    }
    const Home = () => {
      const z = Zone()
      return { x: u * z.m.x, y: z.top + v * (z.m.y - z.top) }
    }
    // 화면 · 시계 크기는 layout (ResizeObserver) 에서만 잰다
    // 떠다니는 루프가 매 프레임 transform 을 쓴 뒤 offsetWidth 를 읽으면 스타일 · 레이아웃 계산이 강제된다
    let sw = sc.clientWidth
    let sh = sc.clientHeight
    let mw = mv.offsetWidth
    let mh = mv.offsetHeight
    const Max = () => ({ x: Math.max(0, sw - mw * s), y: Math.max(0, sh - mh * s) })
    const place = (nx: number, ny: number) => {
      x = nx
      y = ny
      mv.style.transform = `translate3d(${nx}px, ${ny}px, 0) scale(${s})`
    }
    // 배율 범위 : 0.4 배 ~ 화면 폭 · 아래 영역 높이에 맞는 최대
    const ClampK = (kk: number) => {
      const mx = Math.min(sw / (mw * base), (sh * 0.4) / (mh * base))
      return Math.min(Math.max(kk, 0.4), Math.max(0.4, mx))
    }
    // 화면 폭에서 계산한 scale : 모바일은 폭의 62%, 그 밖은 28%. 아래 40% 영역의 80% 를 넘지 않게 한다
    const layout = () => {
      sw = sc.clientWidth
      sh = sc.clientHeight
      mw = mv.offsetWidth
      mh = mv.offsetHeight
      if (!sw || !sh) return
      base = Math.min((sw * (sw < 500 ? 0.7 : 0.5)) / mw, (sh * 0.4 * 0.92) / mh)
      k = ClampK(k)
      s = base * k
      if (phase === 'on' && !Reduced()) {
        const m = Max()
        place(Math.min(Math.max(x, 0), m.x), Math.min(Math.max(y, 0), m.y))
      } else {
        const h = Home()
        place(h.x, h.y)
      }
    }
    const frame = (t: number) => {
      if (!last) last = t
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      const m = Max()
      let nx = x + vx * dt
      let ny = y + vy * dt
      if (nx <= 0) {
        nx = 0
        vx = Math.abs(vx)
      } else if (nx >= m.x) {
        nx = m.x
        vx = -Math.abs(vx)
      }
      if (ny <= 0) {
        ny = 0
        vy = Math.abs(vy)
      } else if (ny >= m.y) {
        ny = m.y
        vy = -Math.abs(vy)
      }
      place(nx, ny)
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      set('on')
      if (Reduced()) return
      const Sign = () => (Math.random() < 0.5 ? -1 : 1)
      vx = 46 * Sign()
      vy = 32 * Sign()
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const wake = () => {
      lastInput = performance.now()
      if (phase !== 'on') return
      cancelAnimationFrame(raf)
      set('back')
      const h = Home()
      if (Reduced()) {
        place(h.x, h.y)
        set('off')
        return
      }
      mv.style.transition = 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)'
      place(h.x, h.y)
      backTimer = window.setTimeout(() => {
        mv.style.transition = ''
        set('off')
      }, 900)
    }
    // 아래 영역에서 시계 끌기
    let Grab: { dx: number; dy: number } | null = null
    const onGrab = (e: PointerEvent) => {
      if (phase !== 'off' || e.button !== 0 || (e.target as HTMLElement).closest('.clock-handle')) return
      Grab = { dx: e.clientX - x - sc.getBoundingClientRect().left, dy: e.clientY - y - sc.getBoundingClientRect().top }
      mv.setPointerCapture(e.pointerId)
    }
    const onDrag = (e: PointerEvent) => {
      if (!Grab) return
      const z = Zone()
      const Box = sc.getBoundingClientRect()
      place(Math.min(Math.max(e.clientX - Box.left - Grab.dx, 0), z.m.x), Math.min(Math.max(e.clientY - Box.top - Grab.dy, z.top), z.m.y))
    }
    const onDrop = () => {
      if (!Grab) return
      Grab = null
      const z = Zone()
      u = z.m.x ? x / z.m.x : 0.5
      v = z.m.y > z.top ? (y - z.top) / (z.m.y - z.top) : 0.5
      save()
    }
    const save = () => {
      try {
        localStorage.setItem(ClockKey, JSON.stringify([u, v, k]))
      } catch {
        // 저장소를 못 쓰면 이번 방문에만 유지
      }
    }
    // 모서리 끌기 : 반대쪽 모서리를 고정하고 배율만 바꾼다
    let Size: { right: boolean; bottom: boolean; ax: number; ay: number } | null = null
    const onSizeDown = (e: PointerEvent) => {
      const H = (e.target as HTMLElement).closest<HTMLElement>('.clock-handle')
      if (!H || phase !== 'off' || e.button !== 0) return
      const right = H.dataset.corner?.includes('r') ?? false
      const bottom = H.dataset.corner?.includes('b') ?? false
      const w = mw * s
      const h = mh * s
      Size = { right, bottom, ax: right ? x : x + w, ay: bottom ? y : y + h }
      H.setPointerCapture(e.pointerId)
      e.stopPropagation()
    }
    const onSizeMove = (e: PointerEvent) => {
      if (!Size) return
      const Box = sc.getBoundingClientRect()
      const px = e.clientX - Box.left
      const py = e.clientY - Box.top
      const wanted = Math.max(Math.abs(px - Size.ax) / mw, Math.abs(py - Size.ay) / mh)
      k = ClampK(wanted / base)
      s = base * k
      const w = mw * s
      const h = mh * s
      const m = Max()
      const z = Zone()
      place(Math.min(Math.max(Size.right ? Size.ax : Size.ax - w, 0), m.x), Math.min(Math.max(Size.bottom ? Size.ay : Size.ay - h, z.top), m.y))
    }
    const onSizeUp = () => {
      if (!Size) return
      Size = null
      const z = Zone()
      u = z.m.x ? x / z.m.x : 0.5
      v = z.m.y > z.top ? (y - z.top) / (z.m.y - z.top) : 0.5
      save()
    }
    mv.addEventListener('pointerdown', onSizeDown, true)
    mv.addEventListener('pointermove', onSizeMove)
    mv.addEventListener('pointerup', onSizeUp)
    mv.addEventListener('pointercancel', onSizeUp)
    mv.addEventListener('pointerdown', onGrab)
    mv.addEventListener('pointermove', onDrag)
    mv.addEventListener('pointerup', onDrop)
    mv.addEventListener('pointercancel', onDrop)
    const Events = ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'] as const
    Events.forEach((n) => window.addEventListener(n, wake, { passive: true }))
    const Check = window.setInterval(() => {
      if (phase === 'off' && performance.now() - lastInput > IdleMs) start()
    }, 500)
    const Ro = new ResizeObserver(layout)
    Ro.observe(sc)
    layout()
    return () => {
      mv.removeEventListener('pointerdown', onSizeDown, true)
      mv.removeEventListener('pointermove', onSizeMove)
      mv.removeEventListener('pointerup', onSizeUp)
      mv.removeEventListener('pointercancel', onSizeUp)
      mv.removeEventListener('pointerdown', onGrab)
      mv.removeEventListener('pointermove', onDrag)
      mv.removeEventListener('pointerup', onDrop)
      mv.removeEventListener('pointercancel', onDrop)
      Events.forEach((n) => window.removeEventListener(n, wake))
      clearInterval(Check)
      clearTimeout(backTimer)
      cancelAnimationFrame(raf)
      Ro.disconnect()
    }
  }, [Screen, Mover, IdleMs])

  return { Phase, Locked }
}
