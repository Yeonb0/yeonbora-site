// Main git 기록을 한 번만 읽어 노트별 처음 생긴 날 (YYYY-MM-DD) 을 낸다
import { execFileSync } from 'node:child_process'

export const readCreatedDates = (vaultDir: string): Map<string, string> => {
  let Out: string
  try {
    // -z : 경로를 따옴표 없이 NUL 로 나눠 준다, 커밋 시작은 \x01 로 표시한다
    Out = execFileSync('git', ['-c', 'core.quotepath=false', 'log', '--reverse', '-M', '-z', '--relative', '--name-status', '--format=%x01%as'], { cwd: vaultDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: 'pipe' })
  } catch (e) {
    const Msg = e instanceof Error ? e.message : String(e)
    throw new Error(`git 기록을 읽지 못했습니다 (${vaultDir}) : git 저장소가 아니거나 git 이 없습니다\n${Msg}`)
  }

  const Dates = new Map<string, string>()
  // 오래된 커밋부터 되감는다 : 커밋마다 날짜 뒤에 (상태, 경로 1 ~ 2개) 가 이어진다
  for (const Chunk of Out.split('\x01')) {
    if (!Chunk) continue
    const Toks = Chunk.split('\0')
    const Day = Toks[0]
    let I = 1
    while (I < Toks.length) {
      const Status = Toks[I++].replace(/^\n/, '')
      if (!Status) continue
      if (Status.startsWith('R') || Status.startsWith('C')) {
        const Old = Toks[I++]
        const New = Toks[I++]
        if (Status.startsWith('R')) {
          Dates.set(New, Dates.get(Old) ?? Day)
          Dates.delete(Old)
        } else if (!Dates.has(New)) Dates.set(New, Day)
      } else {
        const P = Toks[I++]
        if (Status === 'A') Dates.set(P, Dates.get(P) ?? Day)
        else if (Status === 'D') Dates.delete(P)
      }
    }
  }

  for (const K of [...Dates.keys()]) if (!K.endsWith('.md')) Dates.delete(K)
  return Dates
}
