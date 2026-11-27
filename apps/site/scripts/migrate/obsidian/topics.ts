// Main 최상위 폴더 → topic (계획서 topic 표)
export const Topics: Record<string, string> = {
  Python: 'python',
  데이터베이스시스템: 'database',
  빅데이터분석기사: 'bigdata-cert',
  '도커&쿠버네티스': 'devops',
  '기타 정보들': 'etc',
  자료구조: 'data-structure',
  '알고리즘 설계와 분석': 'algorithm',
  컴퓨터시스템개론: 'system',
  '서버 구조와 기술': 'server',
  AWS: 'aws',
  '프로그래밍 언어': 'programming-language',
  멋쟁이사자처럼: 'likelion',
  머신러닝: 'ml',
  '컴퓨터 네트워크': 'network',
  정보처리기사: 'engineer-cert',
}

// 코스 폴더 : 수업 · 자격증 · 스터디처럼 여러 주제가 섞인 폴더
// 노트의 topic 은 하위 경로로 나누고, 코스는 course 로 따로 묶는다 (위키 트리 아래 코스 칸)
// sub 의 열쇠는 코스 폴더 안 경로 앞부분 (폴더 · 파일 이름 경계에서만 맞춘다), 가장 긴 것이 이긴다
export const CourseFolders: Record<string, { course: string; topic: string; sub: Record<string, string> }> = {
  멋쟁이사자처럼: {
    course: 'likelion',
    topic: 'web',
    sub: { 백엔드: 'spring', '백엔드/Java': 'java', '_MOC/벡엔드': 'spring' },
  },
  정보처리기사: {
    course: 'engineer-cert',
    topic: 'se',
    sub: {
      '데이터베이스 구축': 'database',
      '정보시스템 구축 관리/소프트웨어 개발 보안 구축': 'security',
      '정보시스템 구축 관리/시스템 보안 구축': 'security',
      '_MOC/_데이터베이스 구축': 'database',
      '_MOC/SQL 응용': 'database',
      '_MOC/SQL 활용': 'database',
      '_MOC/논리 데이터베이스 설계': 'database',
      '_MOC/물리 데이터베이스 설계': 'database',
      '_MOC/데이터 전환': 'database',
      '_MOC/시스템 보안 구축': 'security',
      '_MOC/_프로그래밍 언어 활용': 'programming-language',
    },
  },
  빅데이터분석기사: { course: 'bigdata-cert', topic: 'ml', sub: {} },
}

const under = (rest: string, key: string) => rest === key || rest.startsWith(`${key}/`) || rest === `${key}.md`

// 루트 파일은 etc, 표에 없는 폴더는 던진다
export const topicOf = (relPath: string): string => {
  const Parts = relPath.split('/')
  if (Parts.length === 1) return 'etc'
  const C = CourseFolders[Parts[0]]
  if (C) {
    const Rest = Parts.slice(1).join('/')
    const Key = Object.keys(C.sub)
      .filter((k) => under(Rest, k))
      .sort((a, b) => b.length - a.length)[0]
    return Key ? C.sub[Key] : C.topic
  }
  const T = Topics[Parts[0]]
  if (!T) throw new Error(`topic 표에 없는 폴더 : ${Parts[0]} (${relPath})`)
  return T
}

// 코스 폴더 안 노트의 코스 id (아니면 undefined)
export const courseOf = (relPath: string): string | undefined => (relPath.includes('/') ? CourseFolders[relPath.split('/')[0]]?.course : undefined)
