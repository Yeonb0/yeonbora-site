// demo_ui (하니스 저장소) 를 빌드해 사이트의 시연 탭 자리에 복사한다
// 사용 : pnpm demo:sync <하니스 저장소 경로>
// 설계 : docs/superpowers/specs/2026-11-27-layered-wiki-project-page-design.md 5.4
//   - 하니스의 vite 설정 · 소스는 바꾸지 않는다 (--base 는 CLI 로)
//   - 나눔스퀘어네오 OTF 는 복사하지 않는다 (OFL 재배포 결정, 2026-10-23)
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const Base = '/projects/layered-wiki/demo/'
const ApiBase = 'http://localhost:8090'
// 사이트가 쓰는 네이버 글꼴 CSS : iframe 은 사이트 문서와 따로라 다시 건다
const FontCss = 'https://hangeul.pstatic.net/hangeul_static/css/nanum-square-neo.css'
// 복사하지 않는 폴더 (빌드 결과 기준)
const Skip = new Set(['fonts'])

const SiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const Target = join(SiteRoot, 'apps/site/public/projects/layered-wiki/demo')

const fail = (msg) => {
  console.error(`[demo:sync] ${msg}`)
  process.exit(1)
}

const Harness = process.argv[2]
if (!Harness) fail('하니스 저장소 경로가 필요하다 : pnpm demo:sync ~/layered-wiki')
const HarnessDir = resolve(Harness)
const DemoDir = join(HarnessDir, 'demo_ui')
if (!existsSync(join(DemoDir, 'package.json'))) fail(`demo_ui 를 찾지 못했다 : ${DemoDir}`)

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts })
const git = (...args) => execFileSync('git', ['-C', HarnessDir, ...args], { encoding: 'utf8' }).trim()

// 어느 demo_ui 를 올렸는지 남긴다 : 커밋하지 않은 변경이 있으면 표시한다
const Commit = git('rev-parse', 'HEAD')
const Dirty = git('status', '--porcelain', '--', 'demo_ui') !== ''

const Out = mkdtempSync(join(tmpdir(), 'demo-ui-'))
try {
  console.log(`[demo:sync] npm ci : ${DemoDir}`)
  run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: DemoDir })
  console.log(`[demo:sync] vite build --base ${Base}`)
  run('npx', ['vite', 'build', '--base', Base, '--outDir', Out, '--emptyOutDir'], {
    cwd: DemoDir,
    env: { ...process.env, VITE_API_BASE: ApiBase },
  })

  // 네이버 글꼴 CSS 를 demo_ui 스타일 뒤에 건다 : 같은 이름 (NanumSquareNeo) 을 CDN 글꼴로 잡게
  const IndexPath = join(Out, 'index.html')
  const Html = readFileSync(IndexPath, 'utf8')
  if (!Html.includes('</head>')) fail('빌드한 index.html 에 </head> 가 없다')
  writeFileSync(IndexPath, Html.replace('</head>', `  <link rel="stylesheet" href="${FontCss}" />\n  </head>`))

  rmSync(Target, { recursive: true, force: true })
  mkdirSync(Target, { recursive: true })
  for (const Name of readdirSync(Out)) {
    if (Skip.has(Name)) {
      console.log(`[demo:sync] 건너뜀 : ${Name}/`)
      continue
    }
    cpSync(join(Out, Name), join(Target, Name), { recursive: true })
  }
  writeFileSync(join(Target, 'VERSION'), `${Commit}${Dirty ? ' (demo_ui 에 커밋하지 않은 변경 있음)' : ''}\n`)
  console.log(`[demo:sync] 완료 : ${Target} ← ${Commit.slice(0, 7)}${Dirty ? ' + 변경' : ''}`)
} finally {
  rmSync(Out, { recursive: true, force: true })
}
