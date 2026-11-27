// 시안 작업대 : 목록 → 시각화 조절 · 본문 수정 → 승인 / 반려
import { useEffect, useMemo, useState } from 'react'
import type { DraftPost } from '../../scripts/drafts/render-post'
import type { FieldValue, Values } from '../viz/types'
import { Controls } from './Controls'
import { bodyEdit, configEdit, latestBody, latestReview, overlay, pendingSorted, reviewEdit, type Edit } from './edits'
import type { DraftsManifest } from './manifest'
import { PostView } from './PostView'
import { ReviewBar } from './ReviewBar'
import { openStore, writeErrorState, type Store, type StoredEdit } from './store'
import { VizView } from './VizView'

type Post = Omit<DraftPost, 'Images'>
type Conn = 'loading' | 'ready' | 'offline'

const describe = (e: Edit): string => {
  if (e.kind === 'config') return `${e.vizId} · ${e.key} = ${JSON.stringify(e.value)}`
  if (e.kind === 'body') return `본문 · ${e.find.slice(0, 24)} → ${e.replace.slice(0, 24)}`
  return `${e.vizId} · ${e.status === 'approved' ? '승인' : '반려'}${e.note ? ` · ${e.note}` : ''}`
}

export function App({ manifest }: { manifest: DraftsManifest }) {
  const [sel, setSel] = useState(manifest.Viz[0]?.id ?? '')
  const [tab, setTab] = useState<'viz' | 'post'>('viz')
  const [Posts, setPosts] = useState<Record<string, Post>>({})
  const [store, setStore] = useState<Store | null>(null)
  const [conn, setConn] = useState<Conn>('loading')
  const [canWrite, setCanWrite] = useState(false)
  const [Edits, setEdits] = useState<StoredEdit[]>([])
  const [drag, setDrag] = useState<Values>({})
  const [block, setBlock] = useState<number | null>(null)
  const [blockText, setBlockText] = useState('')
  const [error, setError] = useState('')

  const Viz = manifest.Viz.find((v) => v.id === sel)
  const Post = Viz ? Posts[Viz.post] : undefined

  // db 는 한 번만 연결 · 구독
  useEffect(() => {
    let Stop = () => {}
    let alive = true
    void openStore().then((s) => {
      if (!alive) return
      if (!s) return setConn('offline')
      setStore(s)
      const Timer = setTimeout(() => setConn((c) => (c === 'loading' ? 'offline' : c)), 10000)
      Stop = s.subscribe(
        (E) => {
          clearTimeout(Timer)
          setEdits(E)
          setConn('ready')
          setCanWrite(true)
        },
        () => {
          clearTimeout(Timer)
          setConn('offline')
          setCanWrite(false)
        },
      )
    })
    return () => {
      alive = false
      Stop()
    }
  }, [])

  useEffect(() => {
    if (!Viz || Posts[Viz.post]) return
    const File = manifest.Posts[Viz.post]?.file
    if (!File) return
    void fetch(File)
      .then((r) => r.json() as Promise<Post>)
      .then((P) => setPosts((o) => ({ ...o, [Viz.post]: P })))
      .catch(() => setError('글을 불러오지 못함'))
  }, [Viz?.post])

  useEffect(() => setDrag({}), [sel, Edits])

  const add = async (e: Edit) => {
    if (!store || !canWrite) return
    try {
      await store.add(e)
    } catch (err) {
      const R = writeErrorState((err as { code?: string }).code)
      if (!R.canWrite) {
        setCanWrite(false)
        setConn('offline')
      }
      setError(R.message)
      // 기록되지 않은 값은 미리보기에서도 되돌린다
      setDrag({})
    }
  }

  // 조절판은 기록된 값과 비교하고, 미리보기만 끄는 중의 값을 덮는다
  const committed = useMemo(() => (Viz ? overlay(Viz.config, Edits, Viz.id) : {}), [Viz, Edits])
  const values = useMemo(() => ({ ...committed, ...drag }), [committed, drag])
  const Mine = pendingSorted(Edits).filter((e) => e.vizId === sel)
  const Review = latestReview(Edits, sel)

  const openBlock = (i: number) => {
    if (!Post || !Viz) return
    setBlock(i)
    setBlockText(latestBody(Edits, Viz.post, Post.Blocks[i].text) ?? Post.Blocks[i].text)
  }
  const saveBlock = () => {
    if (block === null || !Post || !Viz) return
    const Orig = Post.Blocks[block].text
    const Prev = latestBody(Edits, Viz.post, Orig) ?? Orig
    if (blockText !== Prev) void add(bodyEdit(Viz.id, Viz.post, Orig, blockText))
    setBlock(null)
  }

  if (!Viz) return <main className="empty">검토할 시안 없음</main>

  return (
    <main className="bench">
      <header className="bench-head">
        <select value={sel} onChange={(e) => setSel(e.currentTarget.value)} aria-label="시안">
          {manifest.Viz.map((v) => (
            <option key={v.id} value={v.id}>
              {v.id} · {manifest.Posts[v.post]?.title ?? v.post}
            </option>
          ))}
        </select>
        <span className={`conn ${conn}`}>{conn === 'ready' ? '기록 연결됨' : conn === 'loading' ? '연결 중' : '기록할 수 없음'}</span>
        <nav className="tabs">
          <button type="button" className={tab === 'viz' ? 'on' : ''} onClick={() => setTab('viz')}>
            시각화
          </button>
          <button type="button" className={tab === 'post' ? 'on' : ''} onClick={() => setTab('post')}>
            본문
          </button>
        </nav>
      </header>

      {error && (
        <p className="error" onClick={() => setError('')}>
          {error}
        </p>
      )}

      <div className="panes" data-tab={tab}>
        <section className="pane pane-viz">
          <div className="stage">
            <VizView id={Viz.id} values={values} />
          </div>
          <Controls
            config={Viz.config}
            values={committed}
            readOnly={!canWrite}
            onPreview={(k, v: FieldValue) => setDrag((d) => ({ ...d, [k]: v }))}
            onCommit={(k, v) => void add(configEdit(Viz.id, k, v))}
          />
        </section>
        <section className="pane pane-post">
          {Post ? (
            <>
              <h1>{Post.title}</h1>
              <PostView post={Post} vizValues={(id) => (id === Viz.id ? values : undefined)} edited={(find) => latestBody(Edits, Viz.post, find)} onBlock={canWrite ? openBlock : () => {}} />
            </>
          ) : (
            <div className="viz-loading" />
          )}
        </section>
      </div>

      {block !== null && (
        <div className="sheet" role="dialog" aria-label="원문 수정">
          <textarea value={blockText} onChange={(e) => setBlockText(e.currentTarget.value)} rows={8} />
          <div className="review-buttons">
            <button type="button" onClick={() => setBlock(null)}>
              취소
            </button>
            <button type="button" onClick={saveBlock}>
              저장
            </button>
          </div>
        </div>
      )}

      <footer className="bench-foot">
        <details>
          <summary>기록 {Mine.length}건</summary>
          <ol className="edit-list">
            {Mine.map((e) => (
              <li key={(e as StoredEdit).id}>{describe(e)}</li>
            ))}
          </ol>
        </details>
        <ReviewBar canWrite={canWrite} current={Review} onReview={(s, n) => void add(reviewEdit(Viz.id, s, n))} />
      </footer>
    </main>
  )
}
