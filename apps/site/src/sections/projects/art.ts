// CD 인쇄면 : 프로젝트마다 실제 서비스의 메인 색 · 캐릭터 · 로고를 바탕으로 Figma AI 가 도트로 그린 그림을 CD 와 같은 64 x 64 칸으로 읽은 것 (assets/cd/<id>.png, 한 칸 = CD 한 칸)
// 돌릴 때 칸을 직접 읽으므로 그림을 칸 배열로 돌려준다
import { canvas2d } from './pixel'
import { hex } from './sky'
import type { ProjectId } from './types'

export const ArtSize = 64

const Files = import.meta.glob<{ src: string }>('./assets/cd/*.png', { eager: true, import: 'default' })

// 그림이 오기 전 : CD 가 비어 보이지 않게 대표 색 한 가지로 칠해 둔다
export const blankArt = (color: string): Uint8ClampedArray => {
  const [R, G, B] = hex(color)
  const Out = new Uint8ClampedArray(ArtSize * ArtSize * 4)
  for (let i = 0; i < Out.length; i += 4) Out.set([R * 0.45, G * 0.45, B * 0.45, 255], i)
  return Out
}

// 방에 다시 들어올 때마다 그림을 새로 읽지 않는다 (읽기만 하므로 같은 배열을 다시 쓴다)
const Cache = new Map<ProjectId, Promise<Uint8ClampedArray>>()
export const loadArt = (id: ProjectId): Promise<Uint8ClampedArray> => {
  let P = Cache.get(id)
  if (P) return P
  const Src = Files[`./assets/cd/${id}.png`]?.src
  P = new Promise((resolve, reject) => {
    if (!Src) return reject(new Error(`CD 그림 없음 : ${id}`))
    const Im = new Image()
    Im.onload = () => {
      const [Cv, X] = canvas2d(ArtSize, ArtSize)
      X.imageSmoothingEnabled = false
      X.drawImage(Im, 0, 0, ArtSize, ArtSize)
      const Data = X.getImageData(0, 0, ArtSize, ArtSize).data
      Cv.width = Cv.height = 0
      resolve(Data)
    }
    Im.onerror = () => reject(new Error(`CD 그림을 못 읽음 : ${id}`))
    Im.src = Src
  })
  // 실패하면 다음에 들어올 때 다시 시도한다
  P.catch(() => Cache.delete(id))
  Cache.set(id, P)
  return P
}
