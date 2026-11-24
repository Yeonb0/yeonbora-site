// 컴퓨터 방 : 흰 모니터 + 검은 바탕화면 + 아이콘, 아이콘을 누르면 창이 열린다
// 창은 겹쳐 열 수 있고 제목줄을 끌어 옮긴다 (모바일은 화면을 덮는 시트, 끌기 없음)
// 방을 나갈 때는 들어올 때의 순서를 거꾸로 거친다 (아이콘 → 화면 → 모니터)
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client'
import { navigate } from 'astro:transitions/client'
import { DesktopItems, Langs, PlCourse } from './desktop'
import type { DesktopItem, LangItem } from './desktop'
import { Icons } from './icons'
import { PlaceholderPosts } from './placeholder'
import type { PlaceholderPost } from './placeholder'
import './computer.css'

// 창 하나 : kind 에 따라 내용이 달라진다
interface Win {
  key: string
  kind: 'course' | 'folder' | 'lang'
  title: string
  color: string
  // 글을 거르는 기준
  courses: string[]
  topic: string
  tag: string
  // 열린 아이콘의 data-icon 값 (앞쪽이 가까운 것, 없으면 뒤쪽으로)
  origins: string[]
  x: number
  y: number
  w: number
  h: number
  closing: boolean
}

const Reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const IsMobile = () => window.matchMedia('(max-width: 640px)').matches
// 창 열기는 아직 끈다 (화면만 먼저 확정) : true 로 바꾸면 아이콘을 눌러 창이 열린다
const WindowsEnabled = false
const Ease = 'cubic-bezier(0.4, 0, 0.2, 1)'

const Svg = ({ d, size, children }: { d: string[]; size?: number; children?: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((p) => (
      <path key={p} d={p} />
    ))}
    {children}
  </svg>
)

const postsOf = (w: Win): PlaceholderPost[] =>
  PlaceholderPosts.filter((p) => {
    if (p.field !== 'computer') return false
    if (w.kind === 'lang') return p.tags.includes(w.tag)
    return (p.course && w.courses.includes(p.course)) || p.topic === w.topic
  }).sort((a, b) => b.date.localeCompare(a.date))

export default function Desktop() {
  const [wins, setWins] = useState<Win[]>([])
  const [leaving, setLeaving] = useState(false)
  const ScreenRef = useRef<HTMLDivElement | null>(null)
  const WinRefs = useRef(new Map<string, HTMLElement>())
  const Opened = useRef(0)

  const originRect = (origins: string[]): DOMRect | null => {
    for (const id of origins) {
      const El = document.querySelector(`[data-icon="${id}"]`)
      if (El) return El.getBoundingClientRect()
    }
    return null
  }

  const open = useCallback((w: Omit<Win, 'x' | 'y' | 'w' | 'h' | 'closing'>) => {
    // 폴더 창만 먼저 연다 (과목 · 언어 글 목록 창은 WindowsEnabled 로 켠다)
    if (!WindowsEnabled && w.kind !== 'folder') return
    setWins((cur) => {
      const Found = cur.find((c) => c.key === w.key && !c.closing)
      // 이미 열려 있으면 맨 위로만 올린다
      if (Found) return [...cur.filter((c) => c !== Found), Found]
      const Box = ScreenRef.current?.getBoundingClientRect()
      const sw = Box?.width ?? 800
      const sh = Box?.height ?? 500
      const ww = Math.min(440, sw - 24)
      const wh = Math.min(380, sh - 24)
      const n = Opened.current++ % 6
      return [
        ...cur.filter((c) => c.key !== w.key),
        { ...w, w: ww, h: wh, x: Math.max(12, (sw - ww) / 2 + (n - 2) * 28), y: Math.max(12, (sh - wh) / 2 + (n - 2) * 24), closing: false },
      ]
    })
  }, [])

  const openItem = (it: DesktopItem, origins: string[]) => {
    if (it.kind === 'link' && it.href) {
      navigate(it.href)
      return
    }
    open({ key: it.id, kind: it.kind === 'folder' ? 'folder' : 'course', title: it.label, color: it.color, courses: it.courses, topic: it.id, tag: '', origins })
  }

  const openLang = (l: LangItem) =>
    open({ key: `lang-${l.id}`, kind: 'lang', title: l.label, color: l.color, courses: [], topic: '', tag: l.id, origins: [`lang-${l.id}`, 'pl'] })

  const close = useCallback((key: string) => {
    setWins((cur) => cur.map((c) => (c.key === key ? { ...c, closing: true } : c)))
  }, [])

  const front = (key: string) =>
    setWins((cur) => {
      const Found = cur.find((c) => c.key === key)
      return Found && cur[cur.length - 1] !== Found ? [...cur.filter((c) => c !== Found), Found] : cur
    })

  const remove = useCallback((key: string, origins: string[]) => {
    setWins((cur) => cur.filter((c) => c.key !== key))
    // 닫힌 뒤 포커스를 열었던 아이콘으로 돌려 준다
    for (const id of origins) {
      const El = document.querySelector<HTMLElement>(`[data-icon="${id}"]`)
      if (El) {
        El.focus()
        break
      }
    }
  }, [])

  // Esc : 맨 위 창 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setWins((cur) => {
        const Top = [...cur].reverse().find((c) => !c.closing)
        return Top ? cur.map((c) => (c === Top ? { ...c, closing: true } : c)) : cur
      })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // 방 나가기 : 아이콘 → 화면 → 모니터 순서로 꺼진 뒤에 페이지를 넘긴다
  useEffect(() => {
    const onPrep = (e: Event) => {
      const Ev = e as TransitionBeforePreparationEvent
      const Orig = Ev.loader
      Ev.loader = async () => {
        setLeaving(true)
        await new Promise((r) => setTimeout(r, Reduced() ? 150 : 1100))
        await Orig()
      }
    }
    document.addEventListener('astro:before-preparation', onPrep)
    return () => document.removeEventListener('astro:before-preparation', onPrep)
  }, [])

  return (
    <div className="room" data-leaving={leaving} style={{ '--n': DesktopItems.length } as CSSProperties}>
      <div className="monitor">
        <div className="bezel">
          <div className="screen" ref={ScreenRef}>
            <ul className="icons">
              {DesktopItems.map((it, i) => (
                <li
                  key={it.id}
                  style={{ '--i': i, '--r': DesktopItems.length - 1 - i, '--col': it.group, '--row': DesktopItems.slice(0, i).filter((o) => o.group === it.group).length + 1 } as CSSProperties}
                >
                  <button type="button" className="icon" data-icon={it.id} style={{ '--c': it.color } as CSSProperties} onClick={() => openItem(it, [it.id])}>
                    <img src={it.src} alt="" draggable={false} />
                    <span>{it.label}</span>
                  </button>
                  {it.desc && (
                    <span className="tip" role="tooltip">
                      {it.desc}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {wins.map((w, z) => (
              <Window
                key={w.key}
                win={w}
                z={z}
                screen={ScreenRef}
                reg={(el) => (el ? WinRefs.current.set(w.key, el) : WinRefs.current.delete(w.key))}
                originRect={() => originRect(w.origins)}
                onFront={() => front(w.key)}
                onClose={() => close(w.key)}
                onRemoved={() => remove(w.key, w.origins)}
                onMove={(x, y) => setWins((cur) => cur.map((c) => (c.key === w.key ? { ...c, x, y } : c)))}
              >
                {w.kind === 'folder' ? (
                  <ul className="folder">
                    {[PlCourse].map((it) => (
                      <li key={it.id}>
                        <button type="button" className="icon" data-icon={it.id} style={{ '--c': it.color } as CSSProperties} onClick={() => openItem(it, [it.id, 'pl'])}>
                          <img src={it.src} alt="" draggable={false} />
                          <span>{it.label}</span>
                        </button>
                      </li>
                    ))}
                    {Langs.map((l) => (
                      <li key={l.id}>
                        <button type="button" className="icon" data-icon={`lang-${l.id}`} style={{ '--c': l.color } as CSSProperties} onClick={() => openLang(l)}>
                          <img src={l.src} alt="" draggable={false} />
                          <span>{l.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <PostList win={w} />
                )}
              </Window>
            ))}
          </div>
        </div>
        <div className="stand" aria-hidden="true" />
      </div>
    </div>
  )
}

// 글 목록 : 과목 페이지 링크 + 글 링크 (학교 방과 같은 /courses · /posts 페이지로 잇는다)
function PostList({ win }: { win: Win }) {
  const Posts = postsOf(win)
  return (
    <div className="list">
      {win.courses.length > 0 && (
        <p className="course-links">
          {win.courses.map((c) => (
            <a key={c} href={`/courses/${c}`}>
              {c}
            </a>
          ))}
        </p>
      )}
      {Posts.length === 0 ? (
        <p className="empty">글이 없습니다</p>
      ) : (
        <ul>
          {Posts.map((p) => (
            <li key={p.slug}>
              <a href={`/posts/${p.slug}`}>
                <time>{p.date}</time>
                <span>{p.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface WindowProps {
  win: Win
  z: number
  screen: React.RefObject<HTMLDivElement | null>
  reg: (el: HTMLElement | null) => void
  originRect: () => DOMRect | null
  onFront: () => void
  onClose: () => void
  onRemoved: () => void
  onMove: (x: number, y: number) => void
  children: React.ReactNode
}

function Window({ win, z, screen, reg, originRect, onFront, onClose, onRemoved, onMove, children }: WindowProps) {
  const El = useRef<HTMLElement | null>(null)
  const Drag = useRef<{ dx: number; dy: number } | null>(null)

  // 아이콘 위치 → 창 크기로 커지는 애니메이션 (reduced 이면 페이드만)
  const play = (reverse: boolean) => {
    const Node = El.current
    if (!Node) return null
    const From = originRect()
    const To = Node.getBoundingClientRect()
    const Fade = Reduced() || !From
    const Small = Fade
      ? { opacity: 0 }
      : {
          opacity: 0,
          transform: `translate(${From!.left + From!.width / 2 - (To.left + To.width / 2)}px, ${From!.top + From!.height / 2 - (To.top + To.height / 2)}px) scale(${From!.width / To.width}, ${From!.height / To.height})`,
        }
    const Big = Fade ? { opacity: 1 } : { opacity: 1, transform: 'none' }
    return Node.animate(reverse ? [Big, Small] : [Small, Big], { duration: Reduced() ? 120 : 300, easing: Ease, fill: 'both' })
  }

  useLayoutEffect(() => {
    play(false)
    El.current?.focus({ preventScroll: true })
    // 열릴 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!win.closing) return
    const A = play(true)
    if (!A) {
      onRemoved()
      return
    }
    A.finished.then(onRemoved, onRemoved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.closing])

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    onFront()
    if (IsMobile() || (e.target as HTMLElement).closest('button')) return
    Drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMoveEv = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!Drag.current) return
    const Box = screen.current?.getBoundingClientRect()
    if (!Box) return
    // 제목줄이 화면 밖으로 나가지 않게 가둔다
    const x = Math.min(Math.max(e.clientX - Drag.current.dx, 0), Box.width - win.w)
    const y = Math.min(Math.max(e.clientY - Drag.current.dy, 0), Box.height - 36)
    onMove(x, y)
  }

  return (
    <section
      ref={(n) => {
        El.current = n
        reg(n)
      }}
      className="win"
      data-closing={win.closing}
      tabIndex={-1}
      aria-label={win.title}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: z + 1, '--c': win.color } as CSSProperties}
      onPointerDown={onFront}
    >
      <div className="titlebar" onPointerDown={onDown} onPointerMove={onMoveEv} onPointerUp={() => (Drag.current = null)} onPointerCancel={() => (Drag.current = null)}>
        <span className="dot" aria-hidden="true" />
        <h2>{win.title}</h2>
        <button type="button" className="close" aria-label="닫기" onClick={onClose}>
          <Svg d={Icons.close} size={16} />
        </button>
      </div>
      <div className="body">{children}</div>
    </section>
  )
}
