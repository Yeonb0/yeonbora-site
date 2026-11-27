// bit stuffing : flag 를 뺀 데이터에서 1 이 5개 연속이면 뒤에 0 을 끼운다

export interface Frame {
  // 지금 읽은 입력 비트 위치 (-1 은 시작 전)
  inPos: number
  out: string
  count: number
  stuffed: boolean
}

const BitsRe = /^[01]*$/

export function stuff(Bits: string): { out: string; Inserted: number[] } {
  const Frames = frames(Bits)
  const Last = Frames[Frames.length - 1]
  const Inserted = Frames.filter((f) => f.stuffed).map((f) => f.out.length - 1)
  return { out: Last.out, Inserted }
}

// 애니메이션 한 칸 = 입력 한 비트 또는 끼운 0 하나
export function frames(Bits: string): Frame[] {
  if (!BitsRe.test(Bits)) throw new Error(`0 / 1 이 아닌 문자 : ${Bits}`)
  const Out: Frame[] = [{ inPos: -1, out: '', count: 0, stuffed: false }]
  let out = ''
  let count = 0
  for (let i = 0; i < Bits.length; i++) {
    out += Bits[i]
    count = Bits[i] === '1' ? count + 1 : 0
    Out.push({ inPos: i, out, count, stuffed: false })
    if (count === 5) {
      out += '0'
      count = 0
      Out.push({ inPos: i, out, count, stuffed: true })
    }
  }
  return Out
}
