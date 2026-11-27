// 위키 화면 클라이언트 동작 : 카테고리 트리, 칸 너비 조절, 본문 링크 → 그래프 강조, 목차 위치 표시
// 그래프 섬과는 window 이벤트로 주고받는다 : wiki:topic (보낼 카테고리), wiki:focus (강조할 노드 id), wiki:topic-changed (섬이 Esc 로 풀었을 때)
import { navigate } from 'astro:transitions/client'

const PaneKey = 'wiki-panes'
const LDef = 260
const RDef = 300
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// 링크 → 그래프 노드 id : 위키 · 글은 주소, 아직 없는 노트는 ? + 소문자 이름
export const nodeIdOf = (el: Element): string | null => {
  if (el instanceof HTMLElement && el.dataset.target) return `?${el.dataset.target.trim().toLowerCase()}`
  if (el instanceof HTMLElement && el.dataset.node) return el.dataset.node
  const Href = el.getAttribute('href')
  if (!Href) return null
  const Path = decodeURIComponent(new URL(Href, location.href).pathname).replace(/\/$/, '')
  return /^\/(wiki|posts)\/./.test(Path) ? Path : null
}

let Cleanup: (() => void)[] = []

export function initWiki() {
  Cleanup.forEach((f) => f())
  Cleanup = []
  const Main = document.querySelector<HTMLElement>('main.section-wiki')
  if (!Main) return
  const Home = Main.dataset.mode === 'home'
  const on = <K extends keyof WindowEventMap>(t: EventTarget, type: K | string, fn: (e: any) => void) => {
    t.addEventListener(type, fn)
    Cleanup.push(() => t.removeEventListener(type, fn))
  }

  // 카테고리
  const Cats = [...Main.querySelectorAll<HTMLElement>('.wt-cat')]
  const mark = (id: string | null) => {
    for (const C of Cats) {
      const Hit = C.dataset.topic === id
      C.classList.toggle('open', Hit)
      C.classList.toggle('sel', Hit)
      C.querySelector('.wt-head')?.setAttribute('aria-expanded', String(Hit))
    }
  }
  if (Home) mark(new URLSearchParams(location.search).get('topic'))
  for (const C of Cats) {
    const Id = C.dataset.topic!
    on(C.querySelector('.wt-head')!, 'click', () => {
      if (!Home) return void navigate(`/wiki/?topic=${encodeURIComponent(Id)}`)
      const Next = C.classList.contains('sel') ? null : Id
      mark(Next)
      const U = new URL(location.href)
      if (Next) U.searchParams.set('topic', Next)
      else U.searchParams.delete('topic')
      history.replaceState(history.state, '', U)
      window.dispatchEvent(new CustomEvent('wiki:topic', { detail: Next }))
    })
  }
  on(window, 'wiki:topic-changed', () => {
    mark(null)
    const U = new URL(location.href)
    U.searchParams.delete('topic')
    history.replaceState(history.state, '', U)
  })

  // 칸 너비
  const read = () => [parseFloat(getComputedStyle(Main).getPropertyValue('--lw')) || LDef, parseFloat(getComputedStyle(Main).getPropertyValue('--rw')) || RDef]
  const set = (L: number, R: number) => {
    Main.style.setProperty('--lw', `${L}px`)
    Main.style.setProperty('--rw', `${R}px`)
  }
  const save = (L: number, R: number) => {
    try {
      localStorage.setItem(PaneKey, JSON.stringify([L, R]))
    } catch {}
  }
  for (const H of Main.querySelectorAll<HTMLElement>('.wiki-rz')) {
    const Left = H.dataset.side === 'l'
    on(H, 'pointerdown', (e: PointerEvent) => {
      H.setPointerCapture(e.pointerId)
      H.classList.add('on')
      Main.classList.add('dragging')
      const move = (ev: PointerEvent) => {
        const [L, R] = read()
        if (Left) set(Math.round(clamp(ev.clientX, 180, 420)), R)
        else set(L, Math.round(clamp(innerWidth - ev.clientX, 220, 520)))
      }
      const up = () => {
        H.classList.remove('on')
        Main.classList.remove('dragging')
        H.removeEventListener('pointermove', move)
        H.removeEventListener('pointerup', up)
        save(...(read() as [number, number]))
      }
      H.addEventListener('pointermove', move)
      H.addEventListener('pointerup', up)
    })
    on(H, 'dblclick', () => {
      const [L, R] = read()
      if (Left) set(LDef, R)
      else set(L, RDef)
      save(...(read() as [number, number]))
    })
  }

  // 본문 링크 · 역링크에 호버하면 그래프의 그 노드가 밝아진다
  const focus = (id: string | null) => window.dispatchEvent(new CustomEvent('wiki:focus', { detail: id }))
  for (const El of Main.querySelectorAll('.article-body a.wikilink, .article-body .wikilink-broken, .wiki-backlinks a')) {
    on(El, 'pointerenter', () => focus(nodeIdOf(El)))
    on(El, 'pointerleave', () => focus(null))
    on(El, 'focus', () => focus(nodeIdOf(El)))
    on(El, 'blur', () => focus(null))
  }

  // 목차 : 지금 읽는 제목 강조
  const Toc = [...Main.querySelectorAll<HTMLAnchorElement>('.wiki-toc a')]
  const Scroller = Main.querySelector('.wiki-center')
  if (Toc.length && Scroller) {
    const Heads = Toc.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter((h): h is HTMLElement => !!h)
    const update = () => {
      const Top = Scroller.getBoundingClientRect().top + 80
      let Cur = Heads[0]
      for (const H of Heads) if (H.getBoundingClientRect().top <= Top) Cur = H
      for (const A of Toc) A.classList.toggle('active', decodeURIComponent(A.hash.slice(1)) === Cur?.id)
    }
    on(Scroller, 'scroll', update)
    update()
  }
}
