// 철학 방 : 갈림길 → 동 · 서양관 원형 홀 → 전시실 → 글
// 장면은 섬 안의 상태이고 주소 (?wing=&room=) 와 history 로 동기화한다
// 앞으로 갈 때는 누른 자리로 확대되며 넘어가고, 돌아갈 때는 들어왔던 자리로 줄어들며 돌아간다
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { navigate } from 'astro:transitions/client'
import { GlowOf, imageKey, originOf } from './places'
import { parentOf, parseScene, sceneToSearch } from './route'
import { idle, reduce } from './sceneMachine'
import type { MachineState } from './sceneMachine'
import { RoomsOf } from './types'
import type { Philosopher, Rect, Scene } from './types'
import { Crossroads } from './Crossroads'
import { Hall } from './Hall'
import { Room, framesOf, LastPortraitKey } from './Room'
import './museum.css'

export interface MuseumProps {
  philosophers: Philosopher[]
  // imageKey → 최적화된 사진 주소
  images: Record<string, string>
}

// 애니메이션 이름 : 앞으로 (fwd) 는 누른 자리로 확대, 뒤로 (back) 는 들어온 자리에서 줄어듦
type Anim = '' | 'arrive' | 'leave-fwd' | 'enter-fwd' | 'leave-back' | 'enter-back'

const same = (a: Scene | null, b: Scene | null) => !!a && !!b && sceneToSearch(a) === sceneToSearch(b)

// 사진을 미리 불러 decode 까지 끝낸다 (전환 중 깜빡임 방지)
const Loaded = new Map<string, Promise<void>>()
const preload = (src: string) => {
  if (!Loaded.has(src)) {
    const Img = new Image()
    Img.src = src
    Loaded.set(src, Img.decode().catch(() => undefined))
  }
  return Loaded.get(src)!
}

// 글에서 돌아왔는지 : 그 전시실의 철학자 id 가 sessionStorage 에 남아 있으면 그 액자에서 줄어드는 역연출
const returnedFrom = (scene: Scene, philosophers: Philosopher[]): Rect | null => {
  if (scene.kind !== 'room') return null
  let id: string | null = null
  try {
    id = sessionStorage.getItem(LastPortraitKey)
    sessionStorage.removeItem(LastPortraitKey)
  } catch {
    return null
  }
  if (!id) return null
  const Hit = framesOf(scene.room, philosophers).find((h) => h.id === id || h.partner === id)
  return Hit ? Hit.rect : null
}

export default function Museum({ philosophers, images }: MuseumProps) {
  const [init] = useState(() => {
    const { scene, canonical } = parseScene(location.search)
    // 허브에서 막 들어온 것인지 : 기록에 이 섬의 깊이가 이미 있으면 (글에서 돌아옴 · 뒤로가기) 보라색 번짐을 건너뛴다
    const fromHub = history.state?.museumDepth === undefined
    if (canonical !== location.search) history.replaceState({ ...history.state, museumDepth: 0 }, '', location.pathname + canonical)
    else history.replaceState({ ...history.state, museumDepth: history.state?.museumDepth ?? 0 }, '')
    const back = returnedFrom(scene, philosophers)
    return { scene, back, dusk: fromHub && !back }
  })
  const [state, dispatch] = useReducer(reduce, init.scene, (s): MachineState => (init.back ? { ...idle(s), phase: 'entering' } : idle(s)))
  const [anim, setAnim] = useState<Anim>(init.back ? 'enter-back' : 'arrive')
  // 확대 · 축소 원점 (사진 기준 %)
  const [focus, setFocus] = useState<Rect | null>(init.back)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const StageRef = useRef<HTMLDivElement>(null)
  const PendingHref = useRef<string | null>(null)
  // 타이머 · 이벤트에서 늘 최신 상태를 보도록 (오래된 클로저가 지난 상태로 기록을 쌓지 않게)
  const PhaseRef = useRef(state.phase)
  const AnimRef = useRef<Anim>(anim)
  const SceneRef = useRef(state.scene)
  PhaseRef.current = state.phase
  AnimRef.current = anim
  SceneRef.current = state.scene
  const ViewRef = useRef<HTMLDivElement>(null)

  const src = (s: Scene) => images[imageKey(s)]

  // 앞으로 가기 : 누른 자리 (origin) 로 확대
  // 받아들였으면 true : 전환 중이거나 초상화로 확대 중이면 거절한다 (누른 쪽이 상태를 되돌릴 수 있게)
  const go = useCallback((to: Scene, origin: Rect | null): boolean => {
    if (PhaseRef.current !== 'idle' || AnimRef.current !== '' || same(SceneRef.current, to)) return false
    preload(src(to))
    PendingHref.current = null
    history.pushState({ ...history.state, museumDepth: (history.state?.museumDepth ?? 0) + 1 }, '', location.pathname + sceneToSearch(to))
    dispatch({ type: 'go', to, origin })
    return true
  }, [])

  // 한 단계 뒤로 : 갈림길에서는 허브로 나간다
  const back = useCallback(() => {
    if (state.phase !== 'idle' || AnimRef.current !== '') return
    const Parent = parentOf(state.scene)
    if (!Parent) {
      navigate('/')
      return
    }
    // 이 섬이 쌓은 기록이 있으면 브라우저 뒤로가기와 같은 길로, 없으면 (공유 링크로 바로 들어옴) 기록을 바꿔 쓴다
    if ((history.state?.museumDepth ?? 0) > 0) history.back()
    else {
      preload(src(Parent))
      history.replaceState({ ...history.state, museumDepth: 0 }, '', location.pathname + sceneToSearch(Parent))
      dispatch({ type: 'go', to: Parent, origin: null })
    }
  }, [state.phase, state.scene, anim])

  // 브라우저 뒤로 · 앞으로 : 같은 방 안이면 ClientRouter 보다 먼저 받아 장면만 바꾼다
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      // 이 섬이 화면에 있고, 같은 방 안의 기록일 때만 (다른 페이지로 오가는 기록은 ClientRouter 몫)
      if (!ViewRef.current?.isConnected || !location.pathname.startsWith('/philosophy') || e.state?.museumDepth === undefined) return
      e.stopImmediatePropagation()
      // 초상화로 확대하던 중이면 글로 가지 않고 확대를 거둔다
      if (PendingHref.current) {
        PendingHref.current = null
        setFocus(null)
        setAnim('')
      }
      const { scene } = parseScene(location.search)
      preload(src(scene))
      dispatch({ type: 'pop', to: scene })
    }
    window.addEventListener('popstate', onPop, { capture: true })
    return () => window.removeEventListener('popstate', onPop, { capture: true })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [back])

  // 떠나기 시작 : 방향과 원점을 정한다
  useEffect(() => {
    if (state.phase !== 'leaving' || !state.next) return
    const isBack = same(parentOf(state.scene), state.next)
    if (isBack) {
      setFocus(originOf(state.scene))
      setAnim('leave-back')
    } else {
      setFocus(state.origin)
      setAnim('leave-fwd')
    }
  }, [state.phase, state.next])

  // 장면이 멈추면 다음에 갈 수 있는 장면 사진을 미리 불러 둔다
  useEffect(() => {
    if (state.phase !== 'idle') return
    const S = state.scene
    const Next: Scene[] =
      S.kind === 'crossroads'
        ? [{ kind: 'hall', wing: 'west' }, { kind: 'hall', wing: 'east' }]
        : S.kind === 'hall'
          ? RoomsOf[S.wing].map((room): Scene => ({ kind: 'room', wing: S.wing, room }))
          : []
    Next.forEach((n) => preload(src(n)))
    const P = parentOf(S)
    if (P) preload(src(P))
  }, [state.phase, state.scene])

  // 화면이 사진보다 좁으면 (모바일 세로) 장면마다 가운데에서 시작해 좌우로 밀어 본다
  useEffect(() => {
    const V = ViewRef.current
    if (V) V.scrollLeft = (V.scrollWidth - V.clientWidth) / 2
  }, [state.scene])

  const onAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (anim === 'leave-fwd' && PendingHref.current) {
      // 초상화로 확대가 끝나면 글로 간다
      navigate(PendingHref.current)
      return
    }
    if (anim === 'leave-fwd' || anim === 'leave-back') {
      const Next = state.next
      if (!Next) return
      const isBack = anim === 'leave-back'
      // 새 사진이 준비된 뒤 장면과 애니메이션을 한 번에 바꾼다 (사이에 빈 화면이 없게)
      preload(src(Next)).then(() => {
        if (!isBack) setFocus(null)
        setAnim(isBack ? 'enter-back' : 'enter-fwd')
        dispatch({ type: 'left' })
      })
    } else if (anim === 'enter-fwd' || anim === 'enter-back' || anim === 'arrive') {
      setAnim('')
      if (state.phase === 'entering') dispatch({ type: 'entered' })
    }
  }

  // 들어온 직후 홀의 문 : 전시실에서 돌아왔으면 그 문이 열린 채로 시작해 닫힌다
  const openFrom = anim === 'enter-back' && state.scene.kind === 'hall' && focus ? focus : null

  const StageStyle = {
    '--ox': focus ? `${focus.x + focus.w / 2}%` : '50%',
    '--oy': focus ? `${focus.y + focus.h / 2}%` : '50%',
    // 초상화로 확대할 때만 화면을 채울 만큼 (최대 6 배), 방 사이 이동은 1.5 배까지만 : 짧고 빠르게 밀고 들어간다
    '--zs': focus ? `${Math.min(state.scene.kind === 'room' ? 6 : 1.5, 90 / Math.min(focus.w, focus.h))}` : '1.6',
    '--glow': GlowOf(state.scene),
  } as CSSProperties

  const settled = state.phase === 'idle' && anim === ''

  return (
    <div className={`museum${init.dusk ? ' dusk' : ''}`} ref={ViewRef}>
      <div
        ref={StageRef}
        className={`stage${reduced ? ' reduced' : ''}`}
        data-anim={anim}
        data-kind={state.scene.kind}
        data-settled={settled}
        style={StageStyle}
        onAnimationEnd={onAnimationEnd}
        key={sceneToSearch(state.scene)}
      >
        <img className="scene" src={src(state.scene)} alt="" draggable={false} />
        {state.scene.kind === 'crossroads' && <Crossroads onGo={go} />}
        {state.scene.kind === 'hall' && <Hall wing={state.scene.wing} image={src(state.scene)} openFrom={openFrom} onGo={go} />}
        {state.scene.kind === 'room' && (
          <Room
            wing={state.scene.wing}
            room={state.scene.room}
            image={src(state.scene)}
            philosophers={philosophers}
            stageRef={StageRef}
            settled={settled}
            onPortrait={(rect, href) => {
              if (state.phase !== 'idle' || anim !== '') return
              PendingHref.current = href
              setFocus(rect)
              setAnim('leave-fwd')
            }}
          />
        )}
        <div className="backglow" />
        <button className="backzone" type="button" aria-label={state.scene.kind === 'crossroads' ? '허브로' : '뒤로'} onClick={back} />
      </div>
    </div>
  )
}
