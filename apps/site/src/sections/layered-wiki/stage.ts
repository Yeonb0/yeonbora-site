// Layered Wiki 무대 동작 : 탭 · 단축키 · 호버 막대 · 시연 API 연결 확인 · 슬라이드 · 설명 목차
// 설계 : docs/superpowers/specs/2026-11-27-layered-wiki-project-page-design.md 5.2 ~ 5.7, 9.3 (첫 화면이 우선)

export type Tab = 'home' | 'demo' | 'slides' | 'wiki'

// 9.3 : 1 시연, 2 발표, 3 설명, 0 첫 화면
export const TabKeys: Record<string, Tab> = { '0': 'home', '1': 'demo', '2': 'slides', '3': 'wiki' }
const HealthEveryMs = 5000
const HealthTimeoutMs = 2000
// 공개 시연 서버 (Cloud Run) 는 최소 인스턴스 0 : 첫 요청은 컨테이너를 깨우느라 수십 초 걸린다 (설계 9.4)
const FirstHealthTimeoutMs = 60000
const DownFlashMs = 3000

export type ApiState = 'unknown' | 'waking' | 'up' | 'down'

// 시연 카드 · 막대 점에 쓰는 상태 문구 : 모델 고지 (가이드 26쪽 AI 사용 고지, 설계 9.3)
export const describeApi = (
  State: ApiState,
  Health: Record<string, unknown> | null,
): { dot: 'ok' | 'wait' | 'down'; line: string } => {
  if (State === 'waking') return { dot: 'wait', line: '서버를 깨우는 중입니다 (최대 1분)' }
  if (State === 'unknown') return { dot: 'wait', line: '서버 상태를 확인하는 중' }
  if (State === 'down') return { dot: 'down', line: '시연 서버에 연결하지 못했습니다' }
  const Model = typeof Health?.model_id === 'string' ? Health.model_id : ''
  const Base = typeof Health?.base_model_id === 'string' ? Health.base_model_id : ''
  // 옛 서버는 model_id 가 없다 : 깨지지 않고 그렇다고 적는다
  if (!Model) return { dot: 'ok', line: '연결됨, 모델 정보 없음' }
  return { dot: 'ok', line: Base ? `미리 돌린 볼트 : 로컬 ${Base}, 라이브 : ${Model}` : `라이브 : ${Model}` }
}

// 숨은 탭에서는 상태 확인을 멈춘다 : 열어 둔 채 다른 탭에 있을 때 Cloud Run 을 계속 깨워 두지 않게
export const shouldPoll = (Visibility: DocumentVisibilityState): boolean => Visibility === 'visible'

// 입력창에 포커스가 있으면 단축키를 모두 무시한다 : 회의록을 붙여 넣다가 탭이 바뀌지 않게
export const isTyping = (T: EventTarget | null): boolean => {
  if (!T || !(T as Element).closest) return false
  const El = T as HTMLElement
  return El.isContentEditable || !!El.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
}

// 해시 : #home · #slides-3 · #demo · #wiki-07
export const parseHash = (Hash: string): { tab: Tab; n?: string } | null => {
  const M = /^#(home|slides|demo|wiki)(?:-(\d+))?$/.exec(Hash)
  if (!M) return null
  return { tab: M[1] as Tab, n: M[2] }
}

// 처음 자리 : 해시가 없거나 모르면 첫 화면, 없는 장 · 주차면 그 탭의 처음 (WeekIds[0])
export const resolveStart = (
  Hash: string,
  SlideCount: number,
  WeekIds: string[],
): { tab: Tab; slide: number; week: string | null } => {
  const P = parseHash(Hash)
  if (!P) return { tab: 'home', slide: 0, week: null }
  if (P.tab === 'slides') {
    const N = P.n ? Number(P.n) : 1
    return { tab: 'slides', slide: N >= 1 && N <= SlideCount ? N - 1 : 0, week: null }
  }
  if (P.tab === 'wiki') {
    const W = P.n && WeekIds.includes(P.n) ? P.n : (WeekIds[0] ?? null)
    return { tab: 'wiki', slide: 0, week: W }
  }
  return { tab: P.tab, slide: 0, week: null }
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
  const Cards = [...Root.querySelectorAll<HTMLButtonElement>('.lw-card')]
  const Frame = Root.querySelector<HTMLIFrameElement>('.lw-demo-frame')
  const Edge = Root.querySelector<HTMLElement>('.lw-edge')
  const Bar = Root.querySelector<HTMLElement>('.lw-bar')
  const TocLinks = [...Root.querySelectorAll<HTMLAnchorElement>('.lw-toc a[data-week]')]
  const WeeksEl = [...Root.querySelectorAll<HTMLElement>('.lw-week')]
  const ApiBase = Root.dataset.apiBase ?? ''
  const CardStatus = Root.querySelector<HTMLElement>('[data-card-status]')
  const OfflineStatus = Root.querySelector<HTMLElement>('[data-offline-status]')

  let Tab: Tab = 'home'
  let Slide = 0
  let Week = WeeksEl.find((w) => w.hasAttribute('data-current'))?.dataset.week ?? ''

  // ---------- 해시 : 지금 탭 · 장 · 주차를 남겨 새로고침해도 그 자리로 ----------
  const writeHash = () => {
    // 첫 화면은 해시 없이 둔다 (#home 으로 들어와도 같은 자리)
    if (Tab === 'home') {
      if (location.hash) history.replaceState(null, '', location.pathname + location.search)
      return
    }
    const H = Tab === 'slides' ? `#slides-${Slide + 1}` : Tab === 'wiki' ? `#wiki-${Week}` : '#demo'
    if (location.hash !== H) history.replaceState(null, '', H)
  }

  const showTab = (Next: Tab) => {
    Tab = Next
    Root.dataset.tab = Next
    for (const B of Tabs) B.setAttribute('aria-selected', String(B.dataset.tab === Next))
    // 첫 화면에서는 막대를 띄우지 않는다 : 고를 것이 이미 화면에 있음 (9.3)
    if (Next === 'home') setBar(false)
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

  // ---------- 단축키 : 0 1 2 3 탭, ← → PageUp PageDown 슬라이드 (발표 탭에서만), F 전체 화면 ----------
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

  // iframe 안에 포커스가 있어도 0 1 2 3 F 가 먹게 : 같은 출처라 부모가 iframe 창에 직접 붙인다 (demo_ui 는 고치지 않는다)
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
    on(Edge, 'mouseenter', () => {
      if (Tab !== 'home') setBar(true)
    })
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
  for (const B of [...Tabs, ...Cards]) on(B, 'click', () => showTab(B.dataset.tab as Tab))
  const BackHome = Root.querySelector<HTMLButtonElement>('[data-back-home]')
  if (BackHome) on(BackHome, 'click', () => showTab('home'))

  // ---------- 시연 API 연결 확인 : 끊기는 순간 막대를 잠깐 올려 알린다 ----------
  let Health: Record<string, unknown> | null = null
  const paintApi = () => {
    const { line } = describeApi((Root.dataset.api ?? 'unknown') as ApiState, Health)
    if (CardStatus) CardStatus.textContent = line
    if (OfflineStatus) OfflineStatus.textContent = line
  }
  const setApi = (Next: ApiState) => {
    const Prev = Root.dataset.api
    Root.dataset.api = Next
    paintApi()
    if (Prev === Next) return
    if (Next === 'up' && Frame && !Frame.src) {
      Frame.src = Frame.dataset.src ?? ''
      Root.dataset.demo = 'loaded'
    }
    if (Next === 'down' && Prev === 'up' && Tab !== 'home') {
      setBar(true)
      clearTimeout(FlashTimer)
      FlashTimer = window.setTimeout(() => {
        FlashTimer = 0
        if (!Bar?.matches(':hover, :focus-within')) setBar(false)
      }, DownFlashMs)
    }
  }
  let First = true
  let Checking = false
  const check = async () => {
    // 앞 확인이 끝나지 않았으면 겹쳐 보내지 않는다 (첫 확인은 최대 60초)
    if (Checking) return
    Checking = true
    const Waking = First
    First = false
    if (Waking) setApi('waking')
    const Ctl = new AbortController()
    const Timer = setTimeout(() => Ctl.abort(), Waking ? FirstHealthTimeoutMs : HealthTimeoutMs)
    try {
      const R = await fetch(`${ApiBase}/health`, { cache: 'no-store', signal: Ctl.signal })
      if (R.ok) Health = (await R.json()) as Record<string, unknown>
      setApi(R.ok ? 'up' : 'down')
    } catch {
      setApi('down')
    } finally {
      clearTimeout(Timer)
      Checking = false
    }
  }
  let Poll = 0
  const startPoll = () => {
    if (Poll) return
    void check()
    Poll = window.setInterval(check, HealthEveryMs)
  }
  const stopPoll = () => {
    clearInterval(Poll)
    Poll = 0
  }
  // visibilitychange 는 WindowEventMap 에 없어 on() 대신 직접 붙이고 뗀다
  const onVisibility = () => (shouldPoll(document.visibilityState) ? startPoll() : stopPoll())
  document.addEventListener('visibilitychange', onVisibility)
  Off.push(() => document.removeEventListener('visibilitychange', onVisibility))
  if (shouldPoll(document.visibilityState)) startPoll()
  else paintApi()
  Off.push(stopPoll, () => clearTimeout(FlashTimer))

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

  // ---------- 처음 자리 : 해시가 없으면 첫 화면, 있으면 그곳으로 ----------
  // 설명 탭의 처음은 본문이 있는 첫 주차 (지금 data-current) 라 맨 앞에 둔다
  const WeekIds = [Week, ...WeeksEl.map((w) => w.dataset.week ?? '').filter((w) => w && w !== Week)]
  const Start = resolveStart(location.hash, Slides.length, WeekIds)
  if (Start.tab === 'slides') showSlide(Start.slide)
  if (Start.week) showWeek(Start.week)
  showTab(Start.tab)

  return () => Off.forEach((f) => f())
}
