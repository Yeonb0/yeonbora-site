// 묶음이 쓰는 그림만 볼트 images/ 에서 사이트 _assets/obsidian/ 으로 복사한다
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { maskCode } from '../../../src/lib/content/wikilink'
import type { VaultNote } from './vault'

const EmbedRe = /!\[\[([^\]|]+?\.(?:png|jpe?g|gif|webp|svg|avif))[ \t]*(?:\\?\|[^\]]*)?\]\]/gi

const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

// assetsDir 아래 모든 파일 : 파일명 → 경로들 (같은 이름이 어느 폴더에 있어도 충돌이다)
const indexAssets = (dir: string): Map<string, string[]> => {
  const Out = new Map<string, string[]>()
  const visit = (d: string) => {
    for (const E of readdirSync(d, { withFileTypes: true })) {
      const P = join(d, E.name)
      if (E.isDirectory()) visit(P)
      else Out.set(E.name, [...(Out.get(E.name) ?? []), P])
    }
  }
  if (existsSync(dir)) visit(dir)
  return Out
}

export const copyImages = (
  Notes: VaultNote[],
  vaultImagesDir: string,
  assetsDir: string,
  dryRun = false,
): { Copied: string[]; Same: string[]; Missing: { note: string; name: string }[]; Clash: string[] } => {
  const Refs = new Map<string, Set<string>>()
  for (const N of Notes) {
    for (const M of maskCode(N.body).matchAll(EmbedRe)) {
      const Name = basename(M[1].trim())
      Refs.set(Name, (Refs.get(Name) ?? new Set()).add(N.relPath))
    }
  }
  const Existing = indexAssets(assetsDir)
  const Dest = join(assetsDir, 'obsidian')
  const Copied: string[] = []
  const Same: string[] = []
  const Clash: string[] = []
  const Missing: { note: string; name: string }[] = []
  for (const Name of [...Refs.keys()].sort()) {
    const Src = join(vaultImagesDir, Name)
    if (!existsSync(Src)) {
      for (const Note of [...(Refs.get(Name) ?? [])].sort()) Missing.push({ note: Note, name: Name })
      continue
    }
    const Found = Existing.get(Name)
    if (Found) {
      const H = sha(Src)
      if (Found.every((p) => sha(p) === H)) Same.push(Name)
      else Clash.push(Name)
      continue
    }
    if (!dryRun) {
      mkdirSync(Dest, { recursive: true })
      copyFileSync(Src, join(Dest, Name))
    }
    Copied.push(Name)
  }
  Missing.sort((a, b) => a.note.localeCompare(b.note) || a.name.localeCompare(b.name))
  return { Copied, Same, Missing, Clash }
}
