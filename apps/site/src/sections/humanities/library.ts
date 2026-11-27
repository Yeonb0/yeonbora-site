// 인문 블로그 도서관 : 책장 칸이 모두 모인 도서관에서 고른 칸으로 다가가고, 책을 꺼내 펼쳐 글 목록을 본다
// 흐름 : 도서관 전체 → (왼쪽 목록 · 칸 클릭) 칸으로 다가감 → 책에 머물면 꺼냄 → 펼침 → 종이를 끌어 넘김 → 덮고 꽂음
import { Books, Cases, CoverAspect, Layout, PaperArea, SpineAspect, Tabs, allItems, booksOf, viewX } from './data'
import type { Book, Item, Rect, RowId, ShelfId } from './data'

export interface PostLink {
  title: string
  href: string
  date: string
}

export interface LibraryOptions {
  root: HTMLElement
  // 그림 주소 : shelf-<칸>, shelf-<칸>-v, book-<id>-spine, book-<id>-cover, open-west, open-east, spare-tile
  urls: Record<string, string>
  // 책 id → 그 책에 연결된 글 (posts frontmatter 의 book)
  posts: Record<string, PostLink[]>
}

type State = 'idle' | 'pulling' | 'pulled' | 'opening' | 'open' | 'closing' | 'returning'
interface Box {
  x: number
  y: number
  w: number
  h: number
}
interface Leaf {
  el: HTMLDivElement
  set: (angle: number, bend: number) => void
}
interface Face {
  bg: string
  size: string
  pos: string
  html?: string
}
interface OpenBook {
  Paper: (side: 'l' | 'r', html: string) => Face
  Reader: HTMLDivElement
  PgL: HTMLDivElement
  PgR: HTMLDivElement
  Gutter: number
  R: Box
  M?: Animation
  spread: number
  last: number
  busy: boolean
  key?: (dir: number) => void
}
interface Current {
  B: Book
  El: HTMLElement
  Gap: HTMLElement
  node: HTMLElement
  anim: Animation
  rect: Box
  book?: OpenBook
}
interface Focus {
  shelf: ShelfId
  vx: number
}

const HoverDelay = 450
const PerPage = 7
const Strips = 16
const Bend = 24
const Ease = 'cubic-bezier(0.4, 0, 0.2, 1)'
const CamEase = 'cubic-bezier(0.65, 0, 0.35, 1)'

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export function mountLibrary({ root, urls, posts }: LibraryOptions): () => void {
  const Off = new AbortController()
  const on = <K extends keyof WindowEventMap>(t: K, f: (e: WindowEventMap[K]) => void) => addEventListener(t, f, { signal: Off.signal })
  const Reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const T = (ms: number) => (Reduced ? Math.round(ms * 0.25) : ms)
  const $ = <E extends Element>(s: string) => root.querySelector<E>(s)!

  const TabBar = $<HTMLDivElement>('.tabs')
  const Nav = $<HTMLElement>('.side nav')
  const Room = $<HTMLDivElement>('.room')
  const Lib = $<HTMLDivElement>('.lib')
  const World = $<HTMLDivElement>('.world')
  const Scene = $<HTMLDivElement>('.scene')
  const Bg = $<HTMLImageElement>('.scene .bg')
  const Dim = $<HTMLDivElement>('.dim')
  const Stage = $<HTMLDivElement>('.stage')
  const Close = $<HTMLButtonElement>('.close')
  const ToAll = $<HTMLButtonElement>('.overview-btn')

  const shelfSrc = (id: RowId, vivid: boolean) => urls[`shelf-${id}${vivid ? '-v' : ''}`]
  const postsOf = (b: Book) => posts[b.id] ?? []
  const ItemByKey = new Map(allItems().map((i) => [i.key, i]))

  let State: State = 'idle'
  let Cur: Current | null = null
  let LeaveTimer = 0
  let HoverTimer = 0
  let Resting: HTMLElement | null = null
  let Picked: string | null = null
  let Focus: Focus | null = null

  // 방 안 좌표
  const rel = (r: DOMRect): Box => {
    const S = Room.getBoundingClientRect()
    return { x: r.left - S.left, y: r.top - S.top, w: r.width, h: r.height }
  }
  const roomSize = () => ({ W: Room.clientWidth, H: Room.clientHeight })

  // ── 왼쪽 목록 ─────────────────────────────────────────
  const count = (item: Item) => booksOf(item).reduce((s, b) => s + postsOf(b).length, 0)
  const itemBtn = (item: Item, sub: boolean) =>
    `<button type="button" class="item${sub ? ' sub' : ''}${count(item) ? '' : ' empty'}" data-key="${item.key}"><span>${esc(item.label)}</span><span class="n">${count(item)}</span></button>`

  function showTab(t: number) {
    TabBar.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-selected', String(i === t)))
    Nav.innerHTML = Tabs[t].groups
      .map(
        (g) =>
          `<section class="group">${g.head ? `<h2>${g.head}</h2>` : ''}<ul>${g.items
            .map((it) => `<li>${itemBtn(it, false)}${it.subs?.length ? `<ul class="subs">${it.subs.map((c) => `<li>${itemBtn(c, true)}</li>`).join('')}</ul>` : ''}</li>`)
            .join('')}</ul></section>`,
      )
      .join('')
    Nav.querySelectorAll<HTMLButtonElement>('.item').forEach((b) => {
      b.setAttribute('aria-current', String(b.dataset.key === Picked))
      b.addEventListener('click', () => select(b.dataset.key!))
    })
  }
  TabBar.innerHTML = ''
  Tabs.forEach((tab, t) => {
    const B = document.createElement('button')
    B.type = 'button'
    B.setAttribute('role', 'tab')
    B.textContent = tab.name
    B.addEventListener('click', () => showTab(t))
    TabBar.appendChild(B)
  })

  // ── 도서관 ────────────────────────────────────────────
  // 책장 네 개를 나란히 세우고, 칸마다 그 칸의 책장 그림을 띠로 잘라 쌓는다. 둘레는 여분 책장 타일
  const { rowTop: RowTop, rowH: RowH, capTop: CapTop, capH: CapH, caseW: CaseW, caseGap: CaseGap, tierGap: TierGap } = Layout
  const [, ViewY, ViewW, ViewH] = Layout.view
  const RowAt = new Map<ShelfId, { x: number; y: number; node: HTMLDivElement }>()
  World.innerHTML = ''
  const Spares = document.createElement('div')
  Spares.className = 'spares'
  const TileW = 2 * (CaseW + CaseGap)
  const TileH = CapH * 2 + 5 * RowH + TierGap
  Object.assign(Spares.style, {
    left: `${-4 * (CaseW + CaseGap)}px`,
    top: `${-6 * TileH}px`,
    width: `${16 * (CaseW + CaseGap)}px`,
    height: `${13 * TileH}px`,
    backgroundImage: `url(${urls['spare-tile']})`,
    backgroundSize: `${TileW}px ${TileH}px`,
  })
  World.appendChild(Spares)
  const strip = (id: RowId, x: number, y: number, h: number, top: number, live: boolean) => {
    const R = document.createElement('div')
    R.className = 'row' + (live ? '' : ' cap')
    Object.assign(R.style, { left: `${x}px`, top: `${y}px`, width: `${CaseW}px`, height: `${h}px` })
    // 처음 보는 도서관은 그림을 제대로 (v), 칸으로 들어가면 옅은 그림 (p) 으로 바뀐다
    R.innerHTML = `<img class="v" src="${shelfSrc(id, true)}" alt="" draggable="false" decoding="async" style="top:${-top}px"><img class="p" src="${shelfSrc(id, false)}" alt="" draggable="false" decoding="async" style="top:${-top}px">`
    World.appendChild(R)
    return R
  }
  let WorldW = 0
  let WorldH = 0
  Cases.forEach((rows, c) => {
    const x = c * (CaseW + CaseGap)
    strip(rows[0], x, 0, CapH, CapTop, false)
    rows.forEach((id, r) => {
      const y = CapH + r * RowH
      const live = !id.startsWith('plain')
      const R = strip(id, x, y, RowH, RowTop, live)
      if (!live) return
      const shelf = id as ShelfId
      R.addEventListener('click', () => pickShelf(shelf))
      RowAt.set(shelf, { x, y, node: R })
    })
    strip(rows[rows.length - 1], x, CapH + rows.length * RowH, CapH, CapTop, false)
    WorldW = x + CaseW
    WorldH = Math.max(WorldH, CapH * 2 + rows.length * RowH)
  })

  // 그림은 미리 받아 디코드해 둔다 : 처음 다가갈 때 옅은 그림을 그제야 풀면 카메라가 멈칫한다
  const Ready = new Map<string, Promise<void>>()
  const ready = (src: string) => {
    if (!Ready.has(src)) {
      const I = new Image()
      I.src = src
      Ready.set(src, I.decode().catch(() => {}))
    }
    return Ready.get(src)!
  }
  for (const rows of Cases) for (const id of rows) ready(shelfSrc(id, true))
  for (const rows of Cases) for (const id of rows) ready(shelfSrc(id, false))

  // 카메라 : 세계의 한 사각형을 방 안의 한 사각형에 맞추는 변환
  const camTo = ([x, y, w]: Rect, S: { x: number; y: number; w: number }) => {
    const s = S.w / w
    return `translate(${S.x - x * s}px, ${S.y - y * s}px) scale(${s})`
  }
  const fitRect = ([, , w, h]: Rect, pad = 0.06) => {
    const { W, H } = roomSize()
    const s = Math.min(W / (w * (1 + pad * 2)), H / (h * (1 + pad * 2)))
    return { x: W / 2 - (w * s) / 2, y: H / 2 - (h * s) / 2, w: w * s }
  }
  const overviewRect = (): Rect => [0, 0, WorldW, WorldH]
  // 확대한 칸 : 책장 화면 (Scene) 이 보여 주는 부분과 똑같은 자리
  const rowView = (f: Focus): Rect => {
    const R = RowAt.get(f.shelf)!
    return [R.x + f.vx, R.y + (ViewY - RowTop), ViewW, ViewH]
  }
  const camFor = (f: Focus | null) => (f ? camTo(rowView(f), rel(Scene.getBoundingClientRect())) : camTo(overviewRect(), fitRect(overviewRect())))
  const setCam = () => {
    World.style.transform = camFor(Focus)
  }

  async function fly(to: Focus | null) {
    const from = Focus
    Scene.classList.add('hidden')
    if (from) RowAt.get(from.shelf)!.node.classList.remove('focus')
    Lib.classList.toggle('overview', !to)
    // 칸 안에 있을 때만 전체 보기 버튼을 보인다
    ToAll.classList.toggle('on', !!to)
    const Frames: Keyframe[] = [{ transform: camFor(from) }]
    const Far = !!(from && to && from.shelf !== to.shelf)
    // 칸에서 칸으로 : 두 칸이 함께 보이는 곳까지 물러났다가 다가간다
    if (Far) {
      const A = rowView(from!)
      const B = rowView(to!)
      const x0 = Math.min(A[0], B[0])
      const y0 = Math.min(A[1], B[1])
      const U: Rect = [x0, y0, Math.max(A[0] + A[2], B[0] + B[2]) - x0, Math.max(A[1] + A[3], B[1] + B[3]) - y0]
      Frames.push({ transform: camTo(U, fitRect(U, 0.12)), offset: 0.45 })
    }
    Frames.push({ transform: camFor(to) })
    Focus = to
    if (to) RowAt.get(to.shelf)!.node.classList.add('focus')
    const Dur = Far ? 1100 : from && to ? 600 : 900
    const Anim = World.animate(Frames, { duration: T(Dur), easing: CamEase })
    World.style.transform = camFor(to)
    await Anim.finished.catch(() => {})
  }

  // 칸을 누르면 왼쪽 목록에서 그 칸의 갈래를 고른다 (지금 탭에 없으면 탭을 옮긴다)
  function pickShelf(shelf: ShelfId) {
    if (Focus?.shelf === shelf) return
    const T0 = Tabs.findIndex((t, i) => i === currentTab() && t.groups.some((g) => g.items.some((it) => it.shelf === shelf)))
    const Ti = T0 >= 0 ? T0 : Tabs.findIndex((t) => t.groups.some((g) => g.items.some((it) => it.shelf === shelf)))
    if (Ti < 0) return
    if (Ti !== currentTab()) showTab(Ti)
    const It = Tabs[Ti].groups.flatMap((g) => g.items).find((it) => it.shelf === shelf)!
    select(It.key)
  }
  const currentTab = () => [...TabBar.children].findIndex((b) => b.getAttribute('aria-selected') === 'true')

  async function overview() {
    if (!Focus || State !== 'idle') return
    Picked = null
    Nav.querySelectorAll('.item').forEach((b) => b.setAttribute('aria-current', 'false'))
    await fly(null)
  }
  ToAll.addEventListener('click', () => overview())
  Lib.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('.row:not(.cap)')) overview()
  })

  // ── 칸 화면 (책을 꺼낼 수 있는 확대 화면) ─────────────
  let View: Rect = Layout.view
  const pct = (v: number) => `${v * 100}%`
  const place = (N: HTMLElement, [x, y, w, h]: Rect) => {
    const [vx, vy, vw, vh] = View
    N.style.left = pct((x - vx) / vw)
    N.style.top = pct((y - vy) / vh)
    N.style.width = pct(w / vw)
    N.style.height = pct(h / vh)
  }

  function placeBooks(shelf: ShelfId, vx: number) {
    Scene.querySelectorAll('.held, .gap, .pool').forEach((n) => n.remove())
    View = [vx, ViewY, ViewW, ViewH]
    Scene.style.setProperty('--ratio', String(ViewW / ViewH))
    Bg.src = shelfSrc(shelf, false)
    place(Bg, [0, 0, 1536, 1024])
    for (const B of Books.filter((b) => b.shelf === shelf)) {
      const Gap = document.createElement('div')
      Gap.className = 'gap'
      place(Gap, B.slot)
      Scene.appendChild(Gap)
      // 책장 그림에 이미 그려 넣은 책을 같은 자리에서 잘라 쓴다 : 둘레에는 조명이 떨어진 듯한 빛 웅덩이
      const [px, py, pw, ph] = B.slot
      const Pool = document.createElement('div')
      Pool.className = 'pool'
      place(Pool, [px - pw * 2.2, py - ph * 0.35, pw * 5.4, ph * 1.55])
      Scene.appendChild(Pool)
      const El = document.createElement('button')
      El.type = 'button'
      El.className = 'held'
      El.setAttribute('aria-label', B.title)
      El.innerHTML = `<img src="${urls[`book-${B.id}-spine`]}" alt="" draggable="false">`
      place(El, B.slot)
      // 마우스가 지나가기만 할 때는 빼지 않도록 잠깐 머물러야 빼기 시작한다
      El.addEventListener('mouseenter', () => {
        clearTimeout(LeaveTimer)
        clearTimeout(HoverTimer)
        HoverTimer = window.setTimeout(() => {
          // 방금 덮어 꽂은 책은 마우스가 한 번 떠났다가 다시 올라와야 다시 꺼낸다
          if (State === 'idle' && El.matches(':hover') && Resting !== El) pull(B, El, Gap)
        }, HoverDelay)
      })
      El.addEventListener('mouseleave', () => {
        clearTimeout(HoverTimer)
        if (Resting === El) Resting = null
        LeaveTimer = window.setTimeout(() => {
          if (State === 'pulled' && Cur && !Cur.node.matches(':hover')) putBack()
        }, 1600)
      })
      El.addEventListener('click', () => {
        if (State === 'idle') pull(B, El, Gap)
      })
      Scene.appendChild(El)
    }
  }

  async function select(key: string) {
    const Item = ItemByKey.get(key)
    if (!Item) return
    Nav.querySelectorAll('.item').forEach((b) => b.setAttribute('aria-current', String((b as HTMLElement).dataset.key === key)))
    Picked = key
    clearTimeout(HoverTimer)
    // 책이 움직이는 중이면 끝날 때까지 기다렸다가 덮고 꽂은 뒤 옮긴다
    while (!['idle', 'pulled', 'open'].includes(State)) await wait(50)
    if (State === 'open') await closeBook()
    if (State === 'pulled') await putBack()
    if (Picked !== key) return
    // 갈래 (유가 · 근대 …) 는 칸 가운데, 학자 (주희 · 칸트 …) 는 그 학자의 책이 가운데
    const To: Focus = { shelf: Item.shelf, vx: viewX(Item) }
    await ready(shelfSrc(To.shelf, false))
    if (Picked !== key) return
    if (Focus?.shelf !== To.shelf || Focus.vx !== To.vx) await fly(To)
    if (Picked !== key) return
    placeBooks(To.shelf, To.vx)
    await Bg.decode().catch(() => {})
    if (Picked !== key) return
    Scene.classList.remove('hidden')
    // 휴대폰 목록 : 고른 항목이 보이도록 가로로 민다
    const A = Nav.querySelector<HTMLElement>('.item[aria-current="true"]')
    if (A && Nav.scrollWidth > Nav.clientWidth) Nav.scrollLeft = A.offsetLeft - Nav.clientWidth / 2 + A.offsetWidth / 2
  }

  // ── 꺼내기 · 꽂기 ─────────────────────────────────────
  // 책 상자의 변환 : 책등 앞면 기준 위치 (x, y, z), 크기 s, 회전 a
  const boxT = (x: number, y: number, z: number, s: number, a: number, w: number, D: number) =>
    `translate3d(${x}px, ${y}px, ${z}px) scale(${s}) translate3d(${w / 2}px, 0, ${-D / 2}px) rotateY(${a}deg) translate3d(${-w / 2}px, 0, ${D / 2}px)`

  async function pull(B: Book, El: HTMLElement, Gap: HTMLElement) {
    State = 'pulling'
    const { W, H } = roomSize()
    const R = rel(El.getBoundingClientRect())
    Dim.classList.add('on')
    // 책장의 책등과 같은 그림 · 같은 비율로 시작해 표지가 앞을 보도록 돈다
    const Hf = Math.min(H * 0.78, (W * 0.4) / CoverAspect)
    const w = Hf * SpineAspect
    const D = Hf * CoverAspect
    const Box = document.createElement('div')
    Box.className = 'box'
    Box.style.width = `${w}px`
    Box.style.height = `${Hf}px`
    Box.innerHTML = `
      <div class="face front"><img src="${urls[`book-${B.id}-spine`]}" alt="" draggable="false"></div>
      <div class="face right" style="left:${w}px;width:${D}px"><img src="${urls[`book-${B.id}-cover`]}" alt="" draggable="false"></div>`
    const s0 = R.h / Hf
    const s1 = s0 * 1.12
    const From = boxT(R.x, R.y, 0, s0, 0, w, D)
    const Mid = boxT(R.x - ((s1 - s0) * w) / 2, R.y - R.h * 0.1, 0, s1, 0, w, D)
    // 다 돈 뒤 표지 면이 화면 평면 (z = 0) 에 오게 해서, 펼칠 때 평면 표지와 정확히 겹친다
    const To = boxT(W / 2 - w / 2, H / 2 - Hf / 2, D / 2 - w / 2, 1, -90, w, D)
    Box.style.transform = From
    Stage.appendChild(Box)
    El.classList.add('away')
    Gap.classList.add('on')
    const A = Box.animate([{ transform: From }, { transform: Mid, offset: 0.3 }, { transform: To }], { duration: T(550), easing: Ease, fill: 'forwards' })
    Cur = { B, El, Gap, node: Box, anim: A, rect: { x: W / 2 - D / 2, y: H / 2 - Hf / 2, w: D, h: Hf } }
    await A.finished
    State = 'pulled'
    // 꺼내면 바로 펼쳐 안의 글 목록까지 보여 준다
    openBook()
  }

  async function putBack() {
    if (!Cur || State !== 'pulled') return
    State = 'returning'
    Dim.classList.remove('on')
    Cur.anim.reverse()
    await Cur.anim.finished
    Cur.El.classList.remove('away')
    Resting = Cur.El
    Cur.Gap.classList.remove('on')
    Cur.node.remove()
    Cur = null
    State = 'idle'
  }

  // ── 펼친 책 ───────────────────────────────────────────
  // 쪽 0 = 책 이름, 1부터 = 글 목록. 펼친 면 i 는 왼쪽 2i 쪽, 오른쪽 2i + 1 쪽
  const pageCount = (B: Book) => 1 + Math.max(1, Math.ceil(postsOf(B).length / PerPage))

  function pageHTML(B: Book, i: number): { side: 'l' | 'r'; html: string } {
    const Side = i % 2 === 0 ? 'l' : 'r'
    if (i >= pageCount(B)) return { side: Side, html: '' }
    let Body = ''
    if (i === 0) {
      const By = [B.by, B.year].filter(Boolean).map(esc).join('<br>')
      Body = `<h3>${esc(B.title)}</h3><p class="orig">${esc(B.orig)}</p>${By ? `<p class="by">${By}</p>` : ''}`
    } else {
      const Items = postsOf(B).slice((i - 1) * PerPage, i * PerPage)
      Body = `<ol>${Items.map((p) => `<li><a href="${p.href}" draggable="false"><span>${esc(p.title)}</span><time>${esc(p.date)}</time></a></li>`).join('')}</ol>`
    }
    return { side: Side, html: `<div class="copy ${Side}">${Body}</div>${i > 0 ? `<span class="folio ${Side}">${i}</span>` : ''}` }
  }

  // 휘는 한 장 : 세로 띠 여러 장을 경첩부터 이어 붙여 띠마다 조금씩 더 돌아가 종이가 휘어진다
  // pw : 실제로 움직이는 폭 (종이만), inset : 위아래로 덜어 낼 비율
  function makeLeaf({ x, y, w, h, front, back, pw = w, inset = 0 }: { x: number; y: number; w: number; h: number; front: Face; back: Face; pw?: number; inset?: number }): Leaf {
    const Sw = pw / Strips
    const Top = h * inset
    const El = document.createElement('div')
    El.className = 'leaf'
    El.style.cssText = `left:${x}px;top:${y + Top}px;width:${pw}px;height:${h - 2 * Top}px`
    const face = (f: Face, off: number) =>
      `<div class="slice" style="left:${off}px;top:${-Top}px;width:${w}px;height:${h}px;background-image:url(${f.bg});background-size:${f.size};background-position:${f.pos}">${f.html ?? ''}</div><div class="shade"></div>`
    let Parent: HTMLElement = El
    const List: HTMLDivElement[] = []
    for (let i = 0; i < Strips; i++) {
      const S = document.createElement('div')
      S.className = 'strip'
      S.style.cssText = `left:${i === 0 ? 0 : Sw}px;width:${Sw}px;transform-origin:0 50%`
      // 앞면 : 띠가 덮는 앞 종이 구간, 뒷면 : 다 넘어갔을 때 그 자리에 오는 뒤 종이 구간
      S.innerHTML = `<div class="fa">${face(front, -i * Sw)}</div><div class="fb">${face(back, -(w - (i + 1) * Sw))}</div>`
      Parent.appendChild(S)
      List.push(S)
      Parent = S
    }
    // angle : 0 (덮임) ~ 180 (넘어감), bend : 다 합친 휨 각도의 최댓값
    const set = (angle: number, bend: number) => {
      const P = angle / 180
      const Beta = Math.min((bend / (Strips - 1)) * Math.sin(Math.PI * P), (180 - angle) / (Strips - 1) + bend * 0.02)
      List.forEach((S, i) => {
        S.style.transform = `rotateY(${-(i === 0 ? angle : Beta)}deg)`
        const A = angle + i * Beta
        const [Fa, Fb] = S.children
        ;(Fa.lastChild as HTMLElement).style.opacity = String(clamp(A / 90, 0, 1) * 0.42)
        ;(Fb.lastChild as HTMLElement).style.opacity = String(clamp((180 - A) / 90, 0, 1) * 0.42)
      })
    }
    set(0, 0)
    return { el: El, set }
  }

  function tween(from: number, to: number, dur: number, onUpdate: (v: number) => void) {
    return new Promise<void>((res) => {
      const T0 = performance.now()
      const step = (now: number) => {
        const P = Math.min(1, (now - T0) / dur)
        onUpdate(from + (to - from) * ease(P))
        if (P < 1) requestAnimationFrame(step)
        else res()
      }
      requestAnimationFrame(step)
    })
  }

  // 펼치기 : 덮인 책을 경첩이 화면 가운데 오도록 옮기며 키우고, 표지를 휘며 왼쪽으로 넘긴다
  async function openBook() {
    if (!Cur) return
    State = 'opening'
    const C = Cur
    const { B, rect: R0 } = C
    const { W, H } = roomSize()
    // 펼친 책은 처음부터 최종 크기로 만든다 : 작게 만든 뒤 확대하면 글자 · 그림이 흐려진다
    const k = Math.min((H * 0.8) / R0.h, (W * 0.9) / (R0.w * 2))
    const R: Box = { x: W / 2, y: H / 2 - (R0.h * k) / 2, w: R0.w * k, h: R0.h * k }
    const Gutter = R.x
    const Left = Gutter - R.w
    const Src = urls[`open-${B.spread}`]
    const Paper = (side: 'l' | 'r', html: string): Face => ({ bg: Src, size: '200% 100%', pos: side === 'l' ? '0% 0' : '100% 0', html })

    const Reader = document.createElement('div')
    Reader.className = 'reader'
    Reader.style.setProperty('--u', `${R.h / 100}px`)
    Reader.style.perspective = `${R.h * 7}px`
    Reader.style.perspectiveOrigin = `${Gutter}px ${R.y + R.h / 2}px`
    Reader.innerHTML = `
      <div class="pg" data-side="l" style="left:${Left}px;top:${R.y}px;width:${R.w}px;height:${R.h}px;background-image:url(${Src});background-position:0% 0"><div class="body"></div><div class="cast" style="background:linear-gradient(to left, rgba(0,0,0,0.55), transparent 70%)"></div></div>
      <div class="pg" data-side="r" style="left:${Gutter}px;top:${R.y}px;width:${R.w}px;height:${R.h}px;background-image:url(${Src});background-position:100% 0"><div class="body"></div><div class="cast" style="background:linear-gradient(to right, rgba(0,0,0,0.55), transparent 70%)"></div></div>`
    Stage.appendChild(Reader)
    const [PgL, PgR] = Reader.querySelectorAll<HTMLDivElement>('.pg')
    const Book: OpenBook = { Paper, Reader, PgL, PgR, Gutter, R, spread: 0, last: 0, busy: false }
    C.book = Book
    render(B, Book, 0)

    // 표지 안쪽 = 왼쪽 0쪽 (책 이름), 아래는 오른쪽 1쪽
    const Inside = pageHTML(B, 0)
    const Cover = makeLeaf({ x: R.x, y: R.y, w: R.w, h: R.h, front: { bg: urls[`book-${B.id}-cover`], size: '100% 100%', pos: '0 0' }, back: Paper(Inside.side, Inside.html) })
    Cover.el.style.setProperty('--u', `${R.h / 100}px`)
    Reader.appendChild(Cover.el)
    PgL.classList.add('hide')
    C.node.style.visibility = 'hidden'

    const Sx = R0.x - R.x / k
    const Sy = R0.y - R.y / k
    Book.M = Reader.animate([{ transform: `translate(${Sx}px, ${Sy}px) scale(${1 / k})` }, { transform: 'translate(0px, 0px) scale(1)' }], { duration: T(350), easing: Ease, fill: 'forwards' })
    // 가운데로 오는 도중에 표지를 넘기기 시작한다
    await wait(T(200))
    const Under = PgR.querySelector<HTMLDivElement>('.cast')!
    await tween(0, 180, T(700), (a) => {
      Cover.set(a, Bend)
      Under.style.opacity = String(Math.sin((Math.PI * a) / 180) * 0.5)
    })
    Under.style.opacity = '0'
    PgL.classList.remove('hide')
    Cover.el.remove()
    Close.classList.add('on')
    bindTurn(B, Book)
    State = 'open'
  }

  function render(B: Book, Book: OpenBook, spread: number) {
    Book.spread = spread
    Book.PgL.querySelector('.body')!.innerHTML = pageHTML(B, spread * 2).html
    Book.PgR.querySelector('.body')!.innerHTML = pageHTML(B, spread * 2 + 1).html
    Book.last = Math.ceil(pageCount(B) / 2) - 1
    Book.PgR.classList.toggle('more', spread < Book.last)
    Book.PgL.classList.toggle('more', spread > 0)
  }

  // 종이 넘기기 : 오른쪽 종이를 왼쪽으로 끌면 다음 면, 왼쪽 종이를 오른쪽으로 끌면 이전 면
  // 종이 끝이 손가락 (마우스) 을 따라오고, 놓으면 절반을 넘었는지에 따라 넘어가거나 돌아온다
  function bindTurn(B: Book, Book: OpenBook) {
    const { PgL, PgR, Reader } = Book
    interface Turn {
      Leaf: Leaf
      dir: number
      Next: number
      angle: number
      cast: HTMLDivElement
    }
    let Drag: { side: 'l' | 'r'; x0: number; id: number; d: Turn | null; Dir: number } | null = null
    const local = (e: PointerEvent) => e.clientX - Room.getBoundingClientRect().left
    const angleAt = (px: number) => (Math.acos(clamp((px - Book.Gutter) / Book.R.w, -1, 1)) * 180) / Math.PI

    const start = (dir: number): Turn => {
      const { Paper, R, Gutter, spread } = Book
      const Next = dir > 0 ? spread + 1 : spread - 1
      // 넘어가는 한 장 : 앞면 = 낮은 면의 오른쪽 쪽, 뒷면 = 높은 면의 왼쪽 쪽
      const Lo = Math.min(spread, Next)
      const F = pageHTML(B, Lo * 2 + 1)
      const Bk = pageHTML(B, Lo * 2 + 2)
      const Area = PaperArea[B.spread]
      const Leaf = makeLeaf({ x: Gutter, y: R.y, w: R.w, h: R.h, pw: R.w * Area.frac, inset: Area.inset, front: Paper('r', F.html), back: Paper('l', Bk.html) })
      Leaf.el.style.setProperty('--u', `${R.h / 100}px`)
      Reader.appendChild(Leaf.el)
      // 아래에 깔리는 쪽 : 앞으로 넘기면 오른쪽은 다음 면의 오른쪽 쪽, 뒤로 넘기면 왼쪽은 이전 면의 왼쪽 쪽
      if (dir > 0) PgR.querySelector('.body')!.innerHTML = pageHTML(B, Next * 2 + 1).html
      else PgL.querySelector('.body')!.innerHTML = pageHTML(B, Next * 2).html
      const A0 = dir > 0 ? 0 : 180
      Leaf.set(A0, 60)
      return { Leaf, dir, Next, angle: A0, cast: (dir > 0 ? PgR : PgL).querySelector<HTMLDivElement>('.cast')! }
    }
    const setA = (d: Turn, a: number) => {
      d.angle = a
      d.Leaf.set(a, 60)
      d.cast.style.opacity = String(Math.sin((Math.PI * a) / 180) * 0.45)
    }
    const finish = async (d: Turn, toEnd: boolean) => {
      Book.busy = true
      const Target = d.dir > 0 === toEnd ? 180 : 0
      await tween(d.angle, Target, T(Math.max(150, (Math.abs(Target - d.angle) / 180) * 400)), (a) => setA(d, a))
      d.Leaf.el.remove()
      d.cast.style.opacity = '0'
      render(B, Book, toEnd ? d.Next : Book.spread)
      Book.busy = false
    }

    const down = (side: 'l' | 'r') => (e: PointerEvent) => {
      if (Book.busy || State !== 'open') return
      // 글자 · 링크를 끌 때 브라우저가 자체 끌기를 시작하면 포인터가 끊기므로 막는다 (클릭은 그대로 된다)
      e.preventDefault()
      const Dir = side === 'r' ? 1 : -1
      if ((Dir > 0 && Book.spread >= Book.last) || (Dir < 0 && Book.spread <= 0)) return
      Drag = { side, x0: e.clientX, id: e.pointerId, d: null, Dir }
    }
    const move = (e: PointerEvent) => {
      if (!Drag || e.pointerId !== Drag.id) return
      if (!Drag.d) {
        // 조금 움직인 뒤에야 넘기기 시작 : 그냥 누르면 글 링크가 눌린다
        if (Math.abs(e.clientX - Drag.x0) < 6) return
        Drag.d = start(Drag.Dir)
        ;(Drag.side === 'r' ? PgR : PgL).setPointerCapture(e.pointerId)
      }
      setA(Drag.d, angleAt(local(e)))
    }
    const up = (e: PointerEvent) => {
      if (!Drag || e.pointerId !== Drag.id) return
      const D = Drag
      Drag = null
      if (!D.d) return
      finish(D.d, D.Dir > 0 ? D.d.angle > 90 : D.d.angle < 90)
    }
    PgR.addEventListener('pointerdown', down('r'))
    PgL.addEventListener('pointerdown', down('l'))
    for (const P of [PgR, PgL]) {
      P.addEventListener('pointermove', move)
      P.addEventListener('pointerup', up)
      P.addEventListener('pointercancel', up)
    }
    // 키보드 : 좌우 화살표로도 넘긴다
    Book.key = (dir: number) => {
      if (Book.busy || State !== 'open') return
      if ((dir > 0 && Book.spread >= Book.last) || (dir < 0 && Book.spread <= 0)) return
      finish(start(dir), true)
    }
  }

  // 덮기 : 펼칠 때를 거꾸로 (표지가 휘며 덮임 → 제자리로 작아짐 → 책장에 꽂음)
  async function closeBook() {
    if (State !== 'open' || !Cur?.book || Cur.book.busy) return
    State = 'closing'
    const C = Cur
    const Book = C.book!
    const { Paper, Reader, PgL, PgR, R, M, spread } = Book
    Close.classList.remove('on')
    const Inside = pageHTML(C.B, spread * 2)
    const Cover = makeLeaf({ x: R.x, y: R.y, w: R.w, h: R.h, front: { bg: urls[`book-${C.B.id}-cover`], size: '100% 100%', pos: '0 0' }, back: Paper(Inside.side, Inside.html) })
    Cover.el.style.setProperty('--u', `${R.h / 100}px`)
    Cover.set(180, Bend)
    Reader.appendChild(Cover.el)
    PgL.classList.add('hide')
    const Under = PgR.querySelector<HTMLDivElement>('.cast')!
    // 덮기 + 제자리로 작아지기 + 책장에 꽂기를 겹쳐서 1초 안에 끝낸다
    const Flip = tween(180, 0, T(400), (a) => {
      Cover.set(a, Bend)
      Under.style.opacity = String(Math.sin((Math.PI * a) / 180) * 0.5)
    })
    await wait(T(200))
    M?.reverse()
    await Promise.all([Flip, M?.finished])
    C.node.style.visibility = ''
    Reader.remove()
    C.book = undefined
    State = 'pulled'
    // 덮은 뒤 꽂을 때는 뺄 때보다 빠르게
    C.anim.playbackRate = 1.4
    await putBack()
  }

  Close.addEventListener('click', closeBook)
  Dim.addEventListener('click', () => {
    if (State === 'open') closeBook()
    else if (State === 'pulled') putBack()
  })
  on('keydown', (e) => {
    if (e.key === 'Escape') {
      if (State === 'open') closeBook()
      else if (State === 'pulled') putBack()
      else if (State === 'idle') overview()
    }
    if (State === 'open' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) Cur?.book?.key?.(e.key === 'ArrowRight' ? 1 : -1)
  })
  on('resize', setCam)

  // 처음 : 도서관 전체
  showTab(0)
  Scene.classList.add('hidden')
  View = Layout.view
  Scene.style.setProperty('--ratio', String(ViewW / ViewH))
  requestAnimationFrame(setCam)
  // 카메라를 맞추고 처음 보이는 진한 그림을 다 푼 뒤에 한 번에 보인다 (그림이 늦어도 1.5초 뒤에는 보인다)
  const Shown = Promise.all(Cases.flat().map((id) => ready(shelfSrc(id, true))))
  Promise.race([Shown, wait(1500)]).then(() => {
    if (Off.signal.aborted) return
    setCam()
    Lib.classList.remove('wait')
  })

  return () => {
    Off.abort()
    clearTimeout(HoverTimer)
    clearTimeout(LeaveTimer)
    World.getAnimations().forEach((a) => a.cancel())
  }
}
