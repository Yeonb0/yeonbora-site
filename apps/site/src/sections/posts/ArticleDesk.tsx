// 기술 블로그 글 화면 : 목록과 같은 세 칸 (폴더 · 창 · 검색과 책) 안에서 글을 읽는다. 책 아래에 이전 / 다음 글
// 정적으로만 그린다 (client 지시어 없음) : 폴더 · 책은 목록 주소 해시로 가는 링크
import type { ReactNode } from "react";
import { RecentFolder } from "./data";
import {
  cleanTitle,
  folderName,
  folderOf,
  toHash,
  visibleFolders,
  type DeskPost,
} from "./desk";
import { Book, BrandHead, Folder, SearchHead, initials } from "./parts";
import "./desktop.css";

interface Props {
  // 바탕화면에 놓인 글 전체 : 폴더 목록 · 글 수
  posts: DeskPost[];
  title: string;
  topic?: string;
  series?: string;
  // 같은 책 (없으면 같은 폴더) 안의 앞 · 뒤 글
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
  children?: ReactNode;
}

function Neighbor({
  dir,
  link,
}: {
  dir: "prev" | "next";
  link?: { href: string; title: string };
}) {
  const Label = dir === "prev" ? "이전 글" : "다음 글";
  const Arrow = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === "prev" ? "M15 6l-6 6l6 6" : "M9 6l6 6l-6 6"} />
    </svg>
  );
  if (!link)
    return (
      <span className="nb" data-dir={dir} data-empty="true">
        <span className="nb-label">
          {Arrow}
          {Label}
        </span>
        <span className="nb-title">없음</span>
      </span>
    );
  return (
    <a className="nb" data-dir={dir} href={link.href} rel={dir}>
      <span className="nb-label">
        {Arrow}
        {Label}
      </span>
      <span className="nb-title">{cleanTitle(link.title)}</span>
    </a>
  );
}

export default function ArticleDesk({
  posts,
  title,
  topic,
  series,
  prev,
  next,
  children,
}: Props) {
  const Folders = [RecentFolder, ...visibleFolders(posts)];
  const Here = folderOf(topic);
  const ListHref = `/posts/${toHash(Here, series ?? null)}`;
  return (
    <div className="tech-desk reading">
      <aside className="pane side left">
        <BrandHead />
        <nav className="folders" aria-label="카테고리">
          {Folders.map((f) => (
            <a
              key={f.id}
              className="ico"
              href={`/posts/${toHash(f.id, null)}`}
              data-on={f.id === Here}
              aria-current={f.id === Here ? "true" : undefined}
            >
              <Folder glyph={f.glyph} on={f.id === Here} />
              <span className="ico-label">{f.name}</span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="pane center">
        <section className="win" aria-label={cleanTitle(title)}>
          <div className="titlebar">
            <a className="tb" href={ListHref} aria-label="목록으로">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6l6 6" />
              </svg>
            </a>
            <span className="path">
              <span>~</span>
              <span>/</span>
              <a
                className="crumb"
                data-dim="true"
                href={`/posts/${toHash(Here, null)}`}
              >
                {folderName(Here)}
              </a>
              {series && (
                <>
                  <span>/</span>
                  <a className="crumb-book" href={ListHref}>
                    {series}
                  </a>
                </>
              )}
            </span>
          </div>
          <div className="list reader">{children}</div>
        </section>
      </div>

      <aside className="pane side right">
        <SearchHead />
        <nav className="books" aria-label="책">
          {series && (
            <a
              className="ico book-ico kind-book"
              href={ListHref}
              data-on="true"
            >
              <Book label={initials(series)} />
              <span className="ico-label">{series}</span>
            </a>
          )}
        </nav>
        <nav className="neighbors" aria-label="이전 / 다음 글">
          <Neighbor dir="prev" link={prev} />
          <Neighbor dir="next" link={next} />
        </nav>
      </aside>
    </div>
  );
}
