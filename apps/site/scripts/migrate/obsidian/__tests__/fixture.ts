// 테스트용 임시 Main 볼트
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

export function makeVault(Files: Record<string, string>): string {
  const Root = mkdtempSync(join(tmpdir(), 'vault-'))
  for (const [p, text] of Object.entries(Files)) {
    const Abs = join(Root, p)
    mkdirSync(dirname(Abs), { recursive: true })
    writeFileSync(Abs, text)
  }
  return Root
}
