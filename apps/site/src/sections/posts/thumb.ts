// 목록 카드 썸네일 : 글 본문의 첫 이미지 (마크다운 ![](경로) 또는 Obsidian ![[그림.png]])

const ImageExt = /\.(png|jpe?g|gif|webp|svg|avif)$/i
const ImageRe = /!\[\[([^\[\]\n|#]+)(?:[|#][^\]\n]*)?\]\]|!\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))[^)]*\)/g

export interface ImageRef {
  url: string
  // true 면 ![[이름]] : 볼트 안 파일 이름으로 찾아야 한다
  embed: boolean
}

export const firstImage = (body: string): ImageRef | null => {
  const Text = body.replace(/```[\s\S]*?```/g, ' ').replace(/%%[\s\S]*?%%/g, ' ')
  for (const M of Text.matchAll(ImageRe)) {
    if (M[1] !== undefined) {
      const Name = M[1].trim()
      if (ImageExt.test(Name)) return { url: Name, embed: true }
      continue
    }
    return { url: (M[2] ?? M[3]).trim(), embed: false }
  }
  return null
}

// 글 파일 (프로젝트 기준 경로) 에서 본 상대 경로를 '/src/...' 꼴로 : import.meta.glob 의 키와 같다
export const resolveImage = (filePath: string, url: string): string => {
  const Parts = filePath.split(/[\\/]/).slice(0, -1)
  for (const S of decodeURI(url).split('/')) {
    if (S === '..') Parts.pop()
    else if (S && S !== '.') Parts.push(S)
  }
  return '/' + Parts.join('/')
}
