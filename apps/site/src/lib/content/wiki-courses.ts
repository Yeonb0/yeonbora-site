// 위키 코스 : 수업 · 자격증 · 스터디처럼 여러 주제에 걸쳐 배운 묶음
// 노트는 주제 카테고리 (topic) 에 놓이고, 배운 곳은 frontmatter course 로 따로 묶는다
// 트리 아래 코스 칸 · 그래프의 마름모 노드 · 첫 화면 오른쪽 배운 순서 패널이 이 표를 쓴다
// 경로 (folder · hub) 는 노트 sourcePath 기준이고, hub 는 코스 폴더 안 상대 경로다
export interface CourseUnit {
  name: string
  folder: string
  hub?: string
}

export interface CourseGroup {
  name: string
  folder: string
  hub?: string
  units: CourseUnit[]
}

export interface WikiCourse {
  id: string
  name: string
  // sourcePath 의 최상위 폴더
  folder: string
  hub?: string
  // 배운 순서
  groups: CourseGroup[]
}

const unit = (name: string, folder = name, hub?: string): CourseUnit => ({ name, folder, ...(hub ? { hub } : {}) })
// 정처기 단원 : MOC 노트가 단원 이름 그대로 _MOC 아래에 있다
const certUnit = (group: string, name: string) => unit(name, `${group}/${name}`, `_MOC/${name}.md`)

export const Courses: WikiCourse[] = [
  {
    id: 'likelion',
    name: '멋쟁이 사자처럼',
    folder: '멋쟁이사자처럼',
    groups: [
      {
        name: '프론트엔드',
        folder: '프론트엔드',
        hub: '_MOC/프론트엔드.md',
        units: [
          unit('웹', '프론트엔드/웹'),
          unit('CSS', '프론트엔드/CSS', '프론트엔드/CSS.md'),
          unit('Tailwind CSS', '프론트엔드/Tailwind CSS', '프론트엔드/Tailwind CSS.md'),
          unit('JavaScript', '프론트엔드/JS', '프론트엔드/JavaScript.md'),
          unit('React', '프론트엔드/React', '프론트엔드/React.md'),
        ],
      },
      {
        name: '백엔드',
        folder: '백엔드',
        hub: '_MOC/벡엔드.md',
        units: [unit('Java', '백엔드/Java', '백엔드/Java.md'), unit('Spring', '백엔드/Spring')],
      },
    ],
  },
  {
    id: 'engineer-cert',
    name: '정보처리기사',
    folder: '정보처리기사',
    groups: [
      {
        name: '1과목 소프트웨어 설계',
        folder: '소프트웨어 설계',
        hub: '_MOC/_소프트웨어 설계.md',
        units: ['요구사항 확인', '화면 설계', '애플리케이션 설계', '인터페이스 설계'].map((n) => certUnit('소프트웨어 설계', n)),
      },
      {
        name: '2과목 소프트웨어 개발',
        folder: '소프트웨어 개발',
        hub: '_MOC/_소프트웨어 개발.md',
        units: ['데이터 입·출력 구현', '통합 구현', '제품 소프트웨어 패키징', '애플리케이션 테스트 관리', '인터페이스 구현'].map((n) => certUnit('소프트웨어 개발', n)),
      },
      {
        name: '3과목 데이터베이스 구축',
        folder: '데이터베이스 구축',
        hub: '_MOC/_데이터베이스 구축.md',
        units: ['SQL 응용', 'SQL 활용', '논리 데이터베이스 설계', '물리 데이터베이스 설계', '데이터 전환'].map((n) => certUnit('데이터베이스 구축', n)),
      },
      { name: '4과목 프로그래밍 언어 활용', folder: '프로그래밍 언어 활용', hub: '_MOC/_프로그래밍 언어 활용.md', units: [] },
      {
        name: '5과목 정보시스템 구축 관리',
        folder: '정보시스템 구축 관리',
        hub: '_MOC/_정보시스템 구축 관리.md',
        units: ['소프트웨어 개발 방법론 활용', 'IT 프로젝트 정보시스템 구축 관리', '소프트웨어 개발 보안 구축', '시스템 보안 구축'].map((n) =>
          certUnit('정보시스템 구축 관리', n),
        ),
      },
    ],
  },
  {
    id: 'bigdata-cert',
    name: '빅데이터분석기사',
    folder: '빅데이터분석기사',
    hub: '_MOC/빅데이터분석기사.md',
    groups: [{ name: '빅데이터 분석 기획', folder: '빅데이터 분석 기획', hub: '빅데이터 분석 기획/빅데이터 분석 기획.md', units: [] }],
  },
]

// 그래프의 코스 노드 id
export const courseNodeId = (id: string) => `@${id}`

export interface CourseNote {
  // /wiki/<slug>
  id: string
  sourcePath?: string
  topic: string
  courses: string[]
}

export interface CourseOutline {
  id: string
  name: string
  node: string
  count: number
  // 그래프에서 코스 노드와 이을 노트 (코스 · 과목 MOC)
  hubs: string[]
  groups: { name: string; href?: string; count: number; units: { name: string; href?: string; count: number; topic?: string }[] }[]
}

const inFolder = (p: string | undefined, folder: string) => !!p && p.startsWith(`${folder}/`)

// 노트가 하나라도 있는 코스만, 표 순서대로
export const buildCourseOutlines = (Notes: CourseNote[]): CourseOutline[] => {
  const ByPath = new Map(Notes.filter((n) => n.sourcePath).map((n) => [n.sourcePath!, n]))
  return Courses.flatMap((C) => {
    const Mine = Notes.filter((n) => n.courses.includes(C.id))
    if (Mine.length === 0) return []
    const hubOf = (rel?: string) => (rel ? ByPath.get(`${C.folder}/${rel}`)?.id : undefined)
    const countIn = (folder: string) => Mine.filter((n) => inFolder(n.sourcePath, `${C.folder}/${folder}`)).length
    // 단원 색 : 그 단원 노트에서 가장 많은 카테고리
    const topicIn = (folder: string) => {
      const Tally = new Map<string, number>()
      for (const n of Mine) if (inFolder(n.sourcePath, `${C.folder}/${folder}`)) Tally.set(n.topic, (Tally.get(n.topic) ?? 0) + 1)
      return [...Tally].sort((a, b) => b[1] - a[1])[0]?.[0]
    }
    const Groups = C.groups.map((G) => ({
      name: G.name,
      href: hubOf(G.hub),
      count: countIn(G.folder),
      units: G.units.map((U) => ({ name: U.name, href: hubOf(U.hub), count: countIn(U.folder), topic: topicIn(U.folder) })),
    }))
    const Hubs = [hubOf(C.hub), ...Groups.map((g) => g.href)].filter((h): h is string => !!h)
    return [{ id: C.id, name: C.name, node: courseNodeId(C.id), count: Mine.length, hubs: [...new Set(Hubs)], groups: Groups }]
  })
}
