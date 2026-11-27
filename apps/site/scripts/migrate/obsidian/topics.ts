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

// 루트 파일은 etc, 표에 없는 폴더는 던진다
export const topicOf = (relPath: string): string => {
  const Parts = relPath.split('/')
  if (Parts.length === 1) return 'etc'
  const T = Topics[Parts[0]]
  if (!T) throw new Error(`topic 표에 없는 폴더 : ${Parts[0]} (${relPath})`)
  return T
}
