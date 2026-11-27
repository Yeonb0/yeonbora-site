// 승인 / 반려 + 메모
import { useState } from 'react'

interface Props {
  canWrite: boolean
  onReview: (status: 'approved' | 'rejected', note: string) => void
  current?: { status: 'approved' | 'rejected'; note: string }
}

export function ReviewBar({ canWrite, onReview, current }: Props) {
  const [note, setNote] = useState('')
  const send = (s: 'approved' | 'rejected') => {
    onReview(s, note.trim())
    setNote('')
  }
  return (
    <div className="review-bar">
      {!canWrite && <p className="notice">기록할 수 없음</p>}
      {current && (
        <p className={`review-now ${current.status}`}>
          {current.status === 'approved' ? '승인' : '반려'}
          {current.note ? ` · ${current.note}` : ''}
        </p>
      )}
      <textarea rows={1} placeholder="메모" value={note} disabled={!canWrite} onChange={(e) => setNote(e.currentTarget.value)} />
      <div className="review-buttons">
        <button type="button" data-act="rejected" disabled={!canWrite} onClick={() => send('rejected')}>
          반려
        </button>
        <button type="button" data-act="approved" disabled={!canWrite} onClick={() => send('approved')}>
          승인
        </button>
      </div>
    </div>
  )
}
