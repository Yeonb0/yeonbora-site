// 기술 블로그 바탕화면 조각 : 목록 (Desktop) 과 글 화면 (ArticleDesk) 이 같이 쓴다

export const Folder = ({ glyph, on }: { glyph: string; on: boolean }) => (
  <svg className="folder-svg" viewBox="0 0 52 42" aria-hidden="true">
    <path className="f-body" d="M2 6a3 3 0 0 1 3 -3h13l4 5h25a3 3 0 0 1 3 3v26a3 3 0 0 1 -3 3H5a3 3 0 0 1 -3 -3z" data-on={on} />
    <g transform="translate(16 14) scale(0.83)">
      <path className="f-glyph" d={glyph} />
    </g>
  </svg>
)

export const Book = ({ label, small }: { label?: string; small?: boolean }) => (
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

export const initials = (s: string) =>
  s
    .split(' ')
    .map((w) => w[0])
    .join('')

export const MenuBar = ({ total }: { total: number }) => (
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
    <span className="total">{total}개의 글</span>
  </header>
)
