import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { main, type CommandEnv } from '../command'
import { makeVault } from './fixture'

const note = (body = '본문\n') => `---\ncreated: 2026-01-02\n---\n${body}`

const setup = (Files: Record<string, string>) => {
  const Vault = makeVault(Files)
  const Content = mkdtempSync(join(tmpdir(), 'content-'))
  const Reports = join(mkdtempSync(join(tmpdir(), 'rep-')), 'reports')
  const Out: string[] = []
  const Err: string[] = []
  const Env: CommandEnv = { cwd: Vault, contentDir: Content, reportsDir: Reports, backlogPath: join(Content, 'none.json'), log: (m) => Out.push(m), err: (m) => Err.push(m) }
  return { Vault, Content, Reports, Out, Err, Env }
}

describe('main flags', () => {
  it('rejects an unknown flag and writes nothing', () => {
    const S = setup({ 'Python/A.md': note() })
    expect(main(['run', S.Vault, 'Python', '--dryrun'], S.Env)).toBe(1)
    expect(S.Err.join('\n')).toContain('--dryrun')
    expect(existsSync(join(S.Content, 'wiki'))).toBe(false)
    expect(existsSync(S.Reports)).toBe(false)
  })

  it('accepts --dry-run : writes the dry-run report and no notes', () => {
    const S = setup({ 'Python/A.md': note() })
    expect(main(['run', S.Vault, 'Python', '--dry-run'], S.Env)).toBe(0)
    expect(readdirSync(S.Reports)).toEqual(['migrate-obsidian-python.dry-run.md'])
    expect(existsSync(join(S.Content, 'wiki'))).toBe(false)
    expect(S.Out.join('\n')).toContain('dry-run.md')
  })
})

describe('main vault path', () => {
  it('resolves a relative vault path against env.cwd, and accepts a trailing slash on the folder', () => {
    const S = setup({ 'Python/A.md': note() })
    const Rel = relative(join(S.Vault, '..'), S.Vault)
    S.Env.cwd = join(S.Vault, '..')
    expect(main(['run', Rel, 'Python/'], S.Env)).toBe(0)
    expect(existsSync(join(S.Content, 'wiki/computer/Python/A.md'))).toBe(true)
  })

  it('a missing folder is a Korean error, exit 1', () => {
    const S = setup({})
    expect(main(['run', '없는/폴더', 'Python'], S.Env)).toBe(1)
    expect(S.Err.join('\n')).toContain('찾을 수 없습니다')
  })

  it('a folder that does not look like Main is refused', () => {
    const S = setup({ 'something/else.md': 'x' })
    expect(main(['run', S.Vault, 'Python'], S.Env)).toBe(1)
    expect(S.Err.join('\n')).toContain('Main 볼트가 아닌 것 같습니다')
    expect(existsSync(S.Reports)).toBe(false)
  })

  it('lists valid folder names for a wrong folder argument', () => {
    const S = setup({ 'Python/A.md': note() })
    expect(main(['run', S.Vault, 'Pyton'], S.Env)).toBe(1)
    expect(S.Err.join('\n')).toContain('Python')
  })
})

describe('main exit code', () => {
  it('0 when clean, 2 with conflicts or broken links (report still written)', () => {
    const S = setup({ 'Python/A.md': note('본문\n') })
    expect(main(['run', S.Vault, 'Python'], S.Env)).toBe(0)
    const Broken = setup({ 'Python/A.md': note('[[없는 노트]]\n') })
    expect(main(['run', Broken.Vault, 'Python'], Broken.Env)).toBe(2)
    expect(Broken.Out.join('\n')).toContain('확인 필요')
    expect(existsSync(join(Broken.Reports, 'migrate-obsidian-python.md'))).toBe(true)
    // 충돌 : 같은 이름 파일이 다른 본문으로 이미 있다
    const C = setup({ 'Python/A.md': note('새\n') })
    mkdirSync(join(C.Content, 'wiki/computer/Python'), { recursive: true })
    writeFileSync(join(C.Content, 'wiki/computer/Python/A.md'), '---\ntitle: A\n---\n다름\n')
    expect(main(['run', C.Vault, 'Python'], C.Env)).toBe(2)
  })
})

describe('cli.ts wiring', () => {
  it('an unknown flag exits 1 through the real entry point', () => {
    const Site = fileURLToPath(new URL('../../../..', import.meta.url))
    const R = spawnSync('pnpm', ['exec', 'tsx', 'scripts/migrate/obsidian/cli.ts', 'run', '/nonexistent', 'Python', '--dryrun'], { cwd: Site, encoding: 'utf8' })
    expect(R.status).toBe(1)
    expect(R.stderr).toContain('알 수 없는 옵션')
  })
})
