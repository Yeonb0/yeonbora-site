// 기술 블로그 바탕화면 섬 : 왼쪽 카테고리 폴더 · 가운데 글 목록 창 · 오른쪽 책 (시리즈) 아이콘
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Glyphs, RecentFolder, TierColors } from './data'
import { bookTitle, folderName, folderView, parseHash, recent, toHash, visibleFolders, type BookIcon, type DeskPost, type Row } from './desk'
import './desktop.css'

interface Props {
  posts: DeskPost[]
}

// 창을 닫았다가 새 폴더에서 다시 여는 간격 (ms)
const SwitchDelay = 150

const Folder = ({ glyph, on }: { glyph: string; on: boolean }) => (
  <svg className="folder-svg" viewBox="0 0 52 42" aria-hidden="true">
    <path className="f-body" d="M2 6a3 3 0 0 1 3 -3h13l4 5h25a3 3 0 0 1 3 3v26a3 3 0 0 1 -3 3H5a3 3 0 0 1 -3 -3z" data-on={on} />
    <g transform="translate(16 14) scale(0.83)">
      <path className="f-glyph" d={glyph} />
    </g>
  </svg>
)

const Book = ({ label, small }: { label?: string; small?: boolean }) => (
  <svg className={small ? 'book-svg small' : 'book-svg'} viewBox="0 0 40 46" aria-hidden="true">
    <path className="b-cover" d="M6 2h30v36H6a4 4 0 0 1 -4 -4V6a4 4 0 0 1 4 -4z" />
    <path className="b-line" d="M9 2v34" />
    <path className="b-pages" d="M2 39a3 3 0 0 1 3 -3h31v6H5a3 3 0 0 1 -3 -3z" />
    {label && (
      <text x="23" y="22" textAnchor="middle">
        {label}
      </text>
    )}
  </svg>
)

const initials = (s: string) =>
  s
    .split(' ')
    .map((w) => w[0])
    .join('')

const dot = (d: string) => d.replaceAll('-', '. ') + '.'

function BookButton({ b, on, glyph, onPick }: { b: BookIcon; on: boolean; glyph: string; onPick: () => void }) {
  const Tc = b.tier ? TierColors[b.tier] : null
  const Style = Tc ? ({ '--tier': Tc[0], '--tier-bg': on ? Tc[2] : Tc[1] } as React.CSSProperties) : undefined
  return (
    <button type="button" className={`ico book-ico kind-${b.kind}`} data-on={on} aria-pressed={on} onClick={onPick} style={Style}>
      {b.kind === 'book' && <Book label={initials(b.title)} />}
      {b.kind === 'all' && <Folder glyph={glyph} on={on} />}
      {b.kind === 'tier' && <Folder glyph={Glyphs.gem} on={on} />}
      {b.kind === 'loose' && (
        <svg className="loose-svg" viewBox="0 0 40 46" aria-hidden="true">
          <path d="M8 4h18l8 8v30H8z" />
          <path d="M26 4v8h8" />
        </svg>
      )}
      <span className="ico-label">{b.title}</span>
    </button>
  )
}

function PostRow({ r, dense }: { r: Extract<Row, { kind: 'post' }>; dense: boolean }) {
  const Tc = r.tier ? TierColors[r.tier] : null
  const Badge = (
    <span className="num" data-loose={r.loose} style={Tc ? ({ '--num-line': Tc[0], '--num-bg': Tc[1], '--num-fg': Tc[0] } as React.CSSProperties) : undefined}>
      {r.num}
    </span>
  )
  const Glyph = r.tier ? Glyphs.gem : (Glyphs as Record<string, string>)[r.folder] ?? Glyphs.etc
  if (dense)
    return (
      <a className="row line" href={`/posts/${r.id}`}>
        {Badge}
        <span className="line-text">
          <span className="line-title">{r.title}</span>
          <span className="line-sub">{r.where ? `${r.where}  ·  ${r.summary}` : r.summary}</span>
        </span>
        <span className="tags">
          {r.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </span>
      </a>
    )
  return (
    <a className="row card" href={`/posts/${r.id}`}>
      <span className="card-text">
        {r.where && <span className="where">{r.where}</span>}
        <span className="card-title">{r.title}</span>
        {r.summary && <span className="card-sum">{r.summary}</span>}
        <span className="card-meta">
          <time dateTime={r.date}>{dot(r.date)}</time>
          {r.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </span>
      </span>
      <span className="thumb">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={Glyph} />
        </svg>
        {Badge}
      </span>
    </a>
  )
}

export default function Desktop({ posts }: Props) {
  const Folders = useMemo(() => [RecentFolder, ...visibleFolders(posts)], [posts])
  const [Folder_, setFolder] = useState<string>(() => parseHash(typeof location === 'undefined' ? '' : location.hash).folder)
  const [Book_, setBook] = useState<string | null>(() => parseHash(typeof location === 'undefined' ? '' : location.hash).book)
  const [Open, setOpen] = useState(true)
  const [Dense, setDense] = useState(false)
  const [Origin, setOrigin] = useState('50% 50%')
  const WinRef = useRef<HTMLDivElement>(null)
  const IconRefs = useRef(new Map<string, HTMLButtonElement>())
  const Timer = useRef<number>(0)

  const View = useMemo(() => (Folder_ === RecentFolder.id ? null : folderView(posts, Folder_, Book_)), [posts, Folder_, Book_])
  const Rows: Row[] = View ? View.rows : recent(posts)
  const Count = View ? View.count : Rows.length
  const Shown = View?.book ?? null

  // 열린 폴더 · 책을 주소 해시에 남긴다 (공유용, 기록은 쌓지 않는다)
  useEffect(() => {
    const H = toHash(Folder_, Shown)
    if (location.hash !== H) history.replaceState(history.state, '', H)
  }, [Folder_, Shown])

  // 창이 커지기 시작할 점 : 지금 폴더 아이콘의 가운데
  useLayoutEffect(() => {
    const W = WinRef.current?.getBoundingClientRect()
    const I = IconRefs.current.get(Folder_)?.getBoundingClientRect()
    if (W && I) setOrigin(`${I.left + I.width / 2 - W.left}px ${I.top + I.height / 2 - W.top}px`)
  }, [Folder_, Open])

  useEffect(() => () => clearTimeout(Timer.current), [])

  const openFolder = (id: string) => {
    if (id === Folder_) {
      setBook(null)
      return
    }
    clearTimeout(Timer.current)
    setOpen(false)
    Timer.current = window.setTimeout(() => {
      setFolder(id)
      setBook(null)
      setOpen(true)
    }, SwitchDelay)
  }

  const CanBack = !!Shown && !!View?.books.length && View.books[0].kind === 'all'
  const Scope = bookTitle(Shown) ?? (Folder_ === RecentFolder.id ? RecentFolder.name : '전체 글')

  return (
    <div className="tech-desk">
      <header className="menubar">
        <span className="brand">
          <span className="brand-dot" aria-hidden="true" />
          Bora.log
        </span>
        <label className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4 -4" />
          </svg>
          <input type="search" aria-label="글 검색" placeholder="글 제목, 태그로 검색" />
        </label>
        <span className="total">{posts.length}개의 글</span>
      </header>

      <nav className="folders" aria-label="카테고리">
        {Folders.map((f) => (
          <button
            key={f.id}
            type="button"
            className="ico"
            data-on={f.id === Folder_}
            aria-pressed={f.id === Folder_}
            ref={(el) => {
              if (el) IconRefs.current.set(f.id, el)
            }}
            onClick={() => openFolder(f.id)}
          >
            <Folder glyph={f.glyph} on={f.id === Folder_} />
            <span className="ico-label">{f.name}</span>
          </button>
        ))}
      </nav>

      <section className="win" ref={WinRef} data-open={Open} style={{ transformOrigin: Origin }} aria-label={folderName(Folder_)}>
        <div className="titlebar">
          <button type="button" className="tb" aria-label="뒤로" disabled={!CanBack} onClick={() => setBook(null)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6l6 6" />
            </svg>
          </button>
          <span className="path">
            <span>~</span>
            <span>/</span>
            <button type="button" className="crumb" data-dim={!!Shown} onClick={() => setBook(null)}>
              {folderName(Folder_)}
            </button>
            {Shown && (
              <>
                <span>/</span>
                <span className="crumb-book">{bookTitle(Shown)}</span>
              </>
            )}
          </span>
        </div>
        <div className="list">
          <div className="list-head">
            <h1>
              {Scope} <span className="count">{Count}</span>
            </h1>
            <span className="views">
              <button type="button" className="tb" aria-label="카드로 보기" aria-pressed={!Dense} onClick={() => setDense(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 5h10M4 9h7M4 13h10M4 17h7M16 5h4v4h-4zM16 13h4v4h-4z" />
                </svg>
              </button>
              <button type="button" className="tb" aria-label="한 줄로 보기" aria-pressed={Dense} onClick={() => setDense(true)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </span>
          </div>
          {Rows.length === 0 && <p className="empty">아직 옮긴 글이 없습니다</p>}
          {Rows.map((r, i) =>
            r.kind === 'head' ? (
              <h2 className="group" key={`h-${r.title}-${i}`}>
                {r.book ? <Book small /> : null}
                <span>{r.title}</span>
                <span className="n">{r.n}편</span>
              </h2>
            ) : (
              <PostRow key={r.id} r={r} dense={Dense} />
            ),
          )}
        </div>
      </section>

      <nav className="books" aria-label="책" key={Folder_}>
        {View?.books.map((b) => (
          <BookButton key={b.title} b={b} on={b.key === Shown} glyph={Folders.find((f) => f.id === Folder_)?.glyph ?? Glyphs.etc} onPick={() => setBook(b.key)} />
        ))}
      </nav>
    </div>
  )
}
