// Layered Wiki 무대 동작 : 탭 · 단축키 · 호버 막대 · 시연 API 연결 확인 · 슬라이드 · 설명 목차
// 설계 : docs/superpowers/specs/2026-11-27-layered-wiki-project-page-design.md 5.2 ~ 5.7

export type Tab = 'slides' | 'demo' | 'wiki'

const TabKeys: Record<string, Tab> = { '1': 'slides', '2': 'demo', '3': 'wiki' }
const HealthEveryMs = 5000
const HealthTimeoutMs = 2000
const DownFlashMs = 3000

// 입력창에 포커스가 있으면 단축키를 모두 무시한다 : 회의록을 붙여 넣다가 탭이 바뀌지 않게
export const isTyping = (T: EventTarget | null): boolean => {
  if (!T || !(T as Element).closest) return false
  const El = T as HTMLElement
  return El.isContentEditable || !!El.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
}

// 해시 : #slides-3 · #demo · #wiki-07
export const parseHash = (Hash: string): { tab: Tab; n?: string } | null => {
  const M = /^#(slides|demo|wiki)(?:-(\d+))?$/.exec(Hash)
  if (!M) return null
  return { tab: M[1] as Tab, n: M[2] }
}

export function mountStage(Root: HTMLElement): () => void {
  const Off: Array<() => void> = []
  const on = <K extends keyof WindowEventMap>(T: Window | Document | HTMLElement, Type: K, Fn: (e: WindowEventMap[K]) => void) => {
    T.addEventListener(Type, Fn as EventListener)
    Off.push(() => T.removeEventListener(Type, Fn as EventListener))
  }

  const Slides = [...Root.querySelectorAll<HTMLElement>('.lw-slide')]
  const SlideNow = Root.querySelector<HTMLElement>('[data-slide-now]')
  const Tabs = [...Root.querySelectorAll<HTMLButtonElement>('.lw-tab')]
  const Frame = Root.querySelector<HTMLIFrameElement>('.lw-demo-frame')
  const Edge = Root.querySelector<HTMLElement>('.lw-edge')
  const Bar = Root.querySelector<HTMLElement>('.lw-bar')
  const TocLinks = [...Root.querySelectorAll<HTMLAnchorElement>('.lw-toc a[data-week]')]
  const WeeksEl = [...Root.querySelectorAll<HTMLElement>('.lw-week')]
  const ApiBase = Root.dataset.apiBase ?? ''

  let Tab: Tab = 'slides'
  let Slide = 0
  let Week = WeeksEl.find((w) => w.hasAttribute('data-current'))?.dataset.week ?? ''

  // ---------- 해시 : 지금 탭 · 장 · 주차를 남겨 새로고침해도 그 자리로 ----------
  const writeHash = () => {
    const H = Tab === 'slides' ? `#slides-${Slide + 1}` : Tab === 'wiki' ? `#wiki-${Week}` : '#demo'
    if (location.hash !== H) history.replaceState(null, '', H)
  }

  const showTab = (Next: Tab) => {
    Tab = Next
    Root.dataset.tab = Next
    for (const B of Tabs) B.setAttribute('aria-selected', String(B.dataset.tab === Next))
    // 시연 탭으로 오면 iframe 에 포커스를 넘겨 바로 조작할 수 있게
    if (Next === 'demo' && Root.dataset.demo === 'loaded') Frame?.focus()
    writeHash()
  }

  const showSlide = (i: number) => {
    Slide = Math.max(0, Math.min(Slides.length - 1, i))
    Slides.forEach((S, k) => S.toggleAttribute('data-current', k === Slide))
    if (SlideNow) SlideNow.textContent = String(Slide + 1)
    writeHash()
  }

  const showWeek = (W: string) => {
    if (!WeeksEl.some((w) => w.dataset.week === W)) return
    Week = W
    for (const El of WeeksEl) El.toggleAttribute('data-current', El.dataset.week === W)
    for (const A of TocLinks) A.setAttribute('aria-current', String(A.dataset.week === W))
    writeHash()
  }

  // ---------- 단축키 : 1 2 3 탭, ← → PageUp PageDown 슬라이드 (발표 탭에서만), F 전체 화면 ----------
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return
    const T = TabKeys[e.key]
    if (T) {
      e.preventDefault()
      showTab(T)
      return
    }
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault()
      if (document.fullscreenElement) void document.exitFullscreen()
      else void document.documentElement.requestFullscreen().catch(() => {})
      return
    }
    if (Tab !== 'slides') return
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault()
      showSlide(Slide + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault()
      showSlide(Slide - 1)
    }
  }
  on(window, 'keydown', onKey)

  // iframe 안에 포커스가 있어도 1 2 3 F 가 먹게 : 같은 출처라 부모가 iframe 창에 직접 붙인다 (demo_ui 는 고치지 않는다)
  const hookFrame = () => {
    try {
      const W = Frame?.contentWindow
      if (!W) return
      const Fn = (e: KeyboardEvent) => {
        if (TabKeys[e.key] || e.key === 'f' || e.key === 'F') onKey(e)
      }
      W.addEventListener('keydown', Fn)
      Off.push(() => W.removeEventListener('keydown', Fn))
    } catch {
      // 다른 출처면 붙일 수 없다 : 그때는 바깥을 한 번 눌러 포커스를 되찾는다
    }
  }
  if (Frame) on(Frame, 'load', hookFrame)

  // ---------- 호버 막대 : 아래 끝 좁은 띠에 닿으면 올라오고, 막대를 벗어나면 내려간다 ----------
  let FlashTimer = 0
  const setBar = (Open: boolean) => (Root.dataset.bar = Open ? 'open' : 'closed')
  // 막대가 올라오는 동안 커서가 띠를 바로 벗어나면 막대에 들어간 적이 없어 mouseleave 가 오지 않는다 : 잠깐 뒤 다시 본다
  const closeSoon = () =>
    window.setTimeout(() => {
      if (!FlashTimer && !Bar?.matches(':hover, :focus-within') && !Edge?.matches(':hover')) setBar(false)
    }, 120)
  if (Edge) {
    on(Edge, 'mouseenter', () => setBar(true))
    on(Edge, 'mouseleave', closeSoon)
  }
  if (Bar) {
    on(Bar, 'mouseleave', closeSoon)
    // 키보드로 막대에 들어오면 열어 둔다
    on(Bar, 'focusin', () => setBar(true))
    on(Bar, 'focusout', (e) => {
      if (!Bar.contains(e.relatedTarget as Node)) setBar(false)
    })
  }
  for (const B of Tabs) on(B, 'click', () => showTab(B.dataset.tab as Tab))

  // ---------- 시연 API 연결 확인 : 끊기는 순간 막대를 잠깐 올려 알린다 ----------
  const setApi = (Up: boolean) => {
    const Prev = Root.dataset.api
    const Next = Up ? 'up' : 'down'
    if (Prev === Next) return
    Root.dataset.api = Next
    if (Up && Frame && !Frame.src) {
      Frame.src = Frame.dataset.src ?? ''
      Root.dataset.demo = 'loaded'
    }
    if (!Up && Prev === 'up') {
      setBar(true)
      clearTimeout(FlashTimer)
      FlashTimer = window.setTimeout(() => {
        FlashTimer = 0
        if (!Bar?.matches(':hover, :focus-within')) setBar(false)
      }, DownFlashMs)
    }
  }
  const check = async () => {
    const Ctl = new AbortController()
    const Timer = setTimeout(() => Ctl.abort(), HealthTimeoutMs)
    try {
      const R = await fetch(`${ApiBase}/health`, { cache: 'no-store', signal: Ctl.signal })
      setApi(R.ok)
    } catch {
      setApi(false)
    } finally {
      clearTimeout(Timer)
    }
  }
  void check()
  const Poll = window.setInterval(check, HealthEveryMs)
  Off.push(() => clearInterval(Poll), () => clearTimeout(FlashTimer))

  // ---------- 설명 : 목차, 한 판만 넓히기 ----------
  for (const A of TocLinks) {
    on(A, 'click', (e) => {
      e.preventDefault()
      showWeek(A.dataset.week ?? '')
    })
  }
  for (const Head of Root.querySelectorAll<HTMLButtonElement>('.lw-pane-head:not(:disabled)')) {
    on(Head, 'click', () => {
      const WeekEl = Head.closest<HTMLElement>('.lw-week')
      if (!WeekEl) return
      const Ed = Head.dataset.edition ?? ''
      const Wide = WeekEl.dataset.wide === Ed ? '' : Ed
      if (Wide) WeekEl.dataset.wide = Wide
      else delete WeekEl.dataset.wide
      for (const H of WeekEl.querySelectorAll('.lw-pane-head')) {
        H.setAttribute('aria-pressed', String(H === Head && !!Wide))
        const Hint = H.querySelector('small')
        if (Hint) Hint.textContent = Wide ? '눌러서 두 판 함께 보기' : '눌러서 이 판만 보기'
      }
    })
  }

  // ---------- 처음 자리 : 해시가 있으면 그곳으로 ----------
  const Start = parseHash(location.hash)
  if (Start?.tab === 'slides' && Start.n) showSlide(Number(Start.n) - 1)
  if (Start?.tab === 'wiki' && Start.n) showWeek(Start.n)
  showTab(Start?.tab ?? 'slides')

  return () => Off.forEach((f) => f())
}
