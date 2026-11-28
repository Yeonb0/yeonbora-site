// 바탕화면에 놓이는 아이콘 목록 : 여기만 고치면 된다
// kind : course = 과목 글 목록 창, folder = 안에 아이콘이 더 있는 창, link = 다른 방으로 바로 이동
// blog 가 있는 아이콘은 kind 와 관계없이 기술 블로그의 그 폴더로 이동한다
// 배열 순서대로 위에서 아래로 놓이고 group 이 바뀌면 다음 열로 넘어간다 : 아이콘 색 (색상) 이 분홍 → 빨강 → 주황 → 노랑 → 초록 → 파랑 → 회색으로 이어지게 놓았다
import circuitLogo from './logos/circuit.svg?url'
import dbLogo from './logos/database.svg?url'
import treeLogo from './logos/tree.svg?url'
import graphLogo from './logos/graphql.svg?url'
import flowLogo from './logos/mermaid.svg?url'
import claudeLogo from './logos/claude.svg?url'
import consoleLogo from './logos/console.svg?url'
import cpuLogo from './logos/verilog.svg?url'
import exeLogo from './logos/exe.svg?url'
import buildLogo from './logos/cmake.svg?url'
import httpLogo from './logos/http.svg?url'
import folderLogo from './logos/folder.svg?url'
import libLogo from './logos/lib.svg?url'
import steamLogo from './logos/steam.svg?url'
import ytLogo from './logos/youtube.svg?url'
// 언어 아이콘 : Material Icon Theme (MIT) 의 실제 언어 로고
import cLogo from './langs/c.svg?url'
import cppLogo from './langs/cpp.svg?url'
import csharpLogo from './langs/csharp.svg?url'
import pythonLogo from './langs/python.svg?url'
import htmlLogo from './langs/html.svg?url'
import javascriptLogo from './langs/javascript.svg?url'
import typescriptLogo from './langs/typescript.svg?url'
import javaLogo from './langs/java.svg?url'
import asmLogo from './langs/assembly.svg?url'
import glslLogo from './langs/shader.svg?url'

export type DesktopKind = 'course' | 'folder' | 'link'

export interface DesktopItem {
  id: string
  label: string
  // 로고 이미지 주소 (logos/ 폴더의 실제 로고)
  src: string
  // 같은 색끼리 묶는 열 번호 (1 부터) : 색이 바뀌면 다음 열로 넘어간다
  group: number
  // 호버하면 뜨는 짧은 설명 : 비우면 설명을 띄우지 않는다
  desc?: string
  // 아이콘 대표 색 : 창 제목줄 점 색
  color: string
  kind: DesktopKind
  // 과목 코드 : 비어 있으면 아직 정하지 않은 항목
  courses: string[]
  // kind 가 link 일 때 이동할 경로
  href?: string
  // 누르면 열 기술 블로그 폴더 id (sections/posts/data.ts 의 Folders) : 비어 있으면 아직 맞는 폴더가 없다
  blog?: string
}

export const DesktopItems: DesktopItem[] = [
  // 이산구조 : 과목 코드 미정
  { id: 'discrete', label: 'Discrete', group: 1, src: graphLogo, color: '#ff8a3d', desc: '이산구조', kind: 'course', courses: [], blog: 'dm' },
  { id: 'algo', label: 'Algorithm', group: 1, src: flowLogo, color: '#9d4edd', desc: '알고리즘 설계와 분석 · Algoristro 로 이동', kind: 'link', courses: ['CSE3081'], href: '/algo/' },
  { id: 'graphics', label: 'Graphics', group: 2, src: ytLogo, color: '#ff3b3b', desc: '기초 컴퓨터 그래픽스', kind: 'course', courses: ['CSE4170'], blog: 'graphics' },
  // 컴퓨터 네트워크 : 과목 코드 미정
  { id: 'network', label: 'Network', group: 2, src: httpLogo, color: '#3b82f6', desc: '컴퓨터 네트워크', kind: 'course', courses: [], blog: 'network' },
  { id: 'aout', label: 'a.out', group: 3, src: exeLogo, color: '#b3aed0', desc: '컴퓨터 시스템 개론 · 시스템 프로그래밍', kind: 'course', courses: ['CSE3030', 'CSE4100'], blog: 'system' },
  // 기초 머신러닝, 실전 AI 에이전트 시스템 : 과목 코드 미정
  { id: 'ai', label: 'AI Chat', group: 3, src: claudeLogo, color: '#e0805a', desc: '기초 머신러닝 · AI 에이전트 시스템', kind: 'course', courses: [] },
  // 데이터베이스시스템 : 과목 코드 미정
  { id: 'database', label: 'Database', group: 4, src: dbLogo, color: '#4aa3df', desc: '데이터베이스시스템', kind: 'course', courses: [] },
  // 자료구조 : 과목 코드 미정
  // 디지털회로개론 : 과목 코드 미정, 번개 아이콘은 직접 그린 것
  { id: 'digital', label: 'Digital', group: 4, src: circuitLogo, color: '#ffca28', desc: '디지털회로개론', kind: 'course', courses: [] },
  { id: 'ds', label: 'Data Structures', group: 5, src: treeLogo, color: '#8bd450', desc: '자료구조', kind: 'course', courses: [], blog: 'ds' },
  { id: 'compiler', label: 'Compiler', group: 5, src: buildLogo, color: '#ff8a3d', desc: '기초 컴파일러 구성', kind: 'course', courses: ['CSE4120'] },
  // 운영체제 (Pintos) : 과목 코드 미정
  { id: 'os', label: 'OS', group: 6, src: consoleLogo, color: '#4ade80', desc: '운영체제 (Pintos)', kind: 'course', courses: [], blog: 'os' },
  { id: 'launcher', label: 'Launcher', group: 6, src: steamLogo, color: '#66c0f4', desc: '소프트웨어공학 · Steam 재구축 팀플', kind: 'course', courses: ['CSE4115'] },
  { id: 'cpu', label: 'CPU', group: 7, src: cpuLogo, color: '#1f9d6a', desc: '컴퓨터 구조', kind: 'course', courses: ['CSE4010'], blog: 'architecture' },
  // 프로그래밍 언어론 + 언어들 : 폴더 안 내용은 아래 PlCourse, Langs
  { id: 'pl', label: 'PL', group: 7, src: folderLogo, color: '#ffcb52', kind: 'folder', courses: [] },
]

// PL 폴더 안 : 과목 자체 (프로그래밍 언어론, 과목 코드 미정) + 언어들
// 언어 아이콘은 로고 느낌의 자체 그림이고, 누르면 그 언어 태그가 붙은 글 목록이 열린다
export interface LangItem {
  id: string
  label: string
  // 로고 이미지 주소
  src: string
  color: string
  // 누르면 열 기술 블로그 폴더 id : 비어 있으면 아직 맞는 폴더가 없다
  blog?: string
}

export const PlCourse: DesktopItem = {
  id: 'pl-course',
  label: 'PL Theory',
  group: 0,
  desc: '프로그래밍 언어론',
  src: libLogo,
  color: '#2fbf8f',
  kind: 'course',
  courses: [],
  blog: 'pl',
}

export const Langs: LangItem[] = [
  { id: 'c', label: 'C', src: cLogo, color: '#7aa2f7', blog: 'cpp' },
  { id: 'cpp', label: 'C++', src: cppLogo, color: '#5b8def', blog: 'cpp' },
  { id: 'csharp', label: 'C#', src: csharpLogo, color: '#a97cf5' },
  { id: 'python', label: 'Python', src: pythonLogo, color: '#f2c94c' },
  { id: 'html', label: 'HTML', src: htmlLogo, color: '#f28b50', blog: 'language' },
  { id: 'javascript', label: 'JavaScript', src: javascriptLogo, color: '#f7df1e', blog: 'language' },
  { id: 'typescript', label: 'TypeScript', src: typescriptLogo, color: '#4a9be8' },
  { id: 'java', label: 'Java', src: javaLogo, color: '#e76f51', blog: 'language' },
  { id: 'asm', label: 'x86-64 Assembly', src: asmLogo, color: '#a0a6ad' },
  { id: 'glsl', label: 'GLSL', src: glslLogo, color: '#5fe3b0' },
]

// 기술 블로그에서 그 폴더를 연 주소 : 블로그 바탕화면이 해시로 폴더를 연다 (sections/posts/desk.ts 의 toHash)
export const blogHref = (folder: string): string => `/posts/#${encodeURIComponent(folder)}`
