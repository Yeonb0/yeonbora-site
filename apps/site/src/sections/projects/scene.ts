// 방 그림 (room.webp, 1536 x 864) 위의 자리와 배치 계산. 좌표는 모두 그림 칸 기준
export const Iw = 1536
export const Ih = 864

// 그림 속 TV 화면 (보라색 화면 자리)
export const Tvr = { x: 546, y: 137, w: 449, h: 307 }
// 창 영역 (유리 네 칸을 감싸는 상자) 과 유리 칸 [x0, y0, x1, y1]
export const Win = { x: 47, y: 31, w: 247, h: 360 }
export const Panes: [number, number, number, number][] = [
  [47, 31, 90, 199],
  [110, 31, 293, 199],
  [47, 213, 90, 390],
  [110, 213, 293, 390],
]
// 창 안으로 들어온 화분 잎 두 장 : 그림의 달빛 테두리를 따라 딴 윤곽 (창 영역 안 좌표). 잎은 다시 그리지 않고 그대로 둔다
export const LeafPolys: [number, number][][] = [
  [[0, 347], [36, 350], [43, 352], [47, 357], [51, 363], [54, 369], [54, 379], [52, 384], [50, 387], [53, 388], [76, 388], [81, 391], [81, 400], [0, 400]],
  [[79, 400], [79, 366], [82, 362], [87, 360], [101, 360], [108, 363], [114, 368], [120, 374], [124, 380], [126, 386], [128, 392], [129, 400]],
]
// 바닥에 떨어진 창빛 자리
export const Patch = { x: 160, y: 635, w: 400, h: 105 }
// 고양이 꼬리 · 여자애 패드
export const Tail = { x: 1478, y: 620, w: 58, h: 34 }
export const Pad = { x: 1092, y: 586, w: 96, h: 72 }

export const inPoly = (P: [number, number][], X: number, Y: number) => {
  let In = false
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i]
    const [xj, yj] = P[j]
    if (yi > Y !== yj > Y && X < ((xj - xi) * (Y - yi)) / (yj - yi) + xi) In = !In
  }
  return In
}

// 다시 그릴 창 칸인지 : 유리 칸 안이고 잎이 아닌 곳 (x, y 는 그림 좌표)
export const isSky = (X: number, Y: number) =>
  Panes.some(([a, c, d, e]) => X >= a && X <= d && Y >= c && Y <= e) && !LeafPolys.some((P) => inPoly(P, X + 0.5, Y + 0.5))

// TV 화면 모서리 : 그림의 도트 크기 (4 칸) 에 맞춘 계단으로 깎은 clip-path
export const tvClip = (Step = 4, Rx = 40, Ry = 36) => {
  const { w: W, h: H } = Tvr
  const Xat = (y: number) => Math.round((Rx - Rx * Math.sqrt(Math.max(0, 1 - ((Ry - y) / Ry) ** 2))) / Step) * Step
  // 왼쪽 위 : (0, Ry) 에서 위로 한 칸 → 오른쪽으로 계단을 밟아 (Rx, 0) 까지
  const TL: [number, number][] = [[0, Ry]]
  for (let y = Ry; y > 0; y -= Step) {
    const Ny = Math.max(0, y - Step)
    TL.push([TL[TL.length - 1][0], Ny], [Xat(Ny), Ny])
  }
  const Pts = [
    ...TL,
    ...TL.slice()
      .reverse()
      .map(([x, y]) => [W - x, y]),
    ...TL.map(([x, y]) => [W - x, H - y]),
    ...TL.slice()
      .reverse()
      .map(([x, y]) => [x, H - y]),
  ]
  return `polygon(${Pts.map(([x, y]) => `${((x / W) * 100).toFixed(3)}% ${((y / H) * 100).toFixed(3)}%`).join(', ')})`
}

export interface Base {
  k: number
  ox: number
  oy: number
}

// 그림이 화면을 덮도록 놓는다 : 휴대폰처럼 좁으면 TV 가 가운데 오도록 옮긴다
export const baseLayout = (W: number, H: number): Base => {
  const K = Math.max(W / Iw, H / Ih)
  const Tc = (Tvr.x + Tvr.w / 2) * K
  return { k: K, ox: Math.min(0, Math.max(W - Iw * K, W / 2 - Tc)), oy: (H - Ih * K) / 2 }
}

// 확대 : TV 화면이 창의 60% 정도만 차지해서 TV 몸체와 주변 방이 살짝 보이게. 그림 밖이 드러나지 않게 붙든다
export const zoomLayout = (W: number, H: number, B: Base, zoomed: boolean) => {
  if (!zoomed) return { s: 1, tx: B.ox, ty: B.oy }
  const Sw = Tvr.w * B.k
  const Sh = Tvr.h * B.k
  const S = Math.max(1, Math.min((W * 0.62) / Sw, (H * 0.64) / Sh))
  const Tx = W / 2 - (Tvr.x + Tvr.w / 2) * B.k * S
  const Ty = H / 2 - (Tvr.y + Tvr.h / 2) * B.k * S
  return {
    s: S,
    tx: Math.min(0, Math.max(W - Iw * B.k * S, Tx)),
    ty: Math.min(0, Math.max(H - Ih * B.k * S, Ty)),
  }
}
