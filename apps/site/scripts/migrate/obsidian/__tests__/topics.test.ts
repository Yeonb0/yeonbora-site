import { describe, expect, it } from 'vitest'
import { courseOf, topicOf } from '../topics'

describe('코스 폴더', () => {
  it('topic 은 하위 경로로, 가장 긴 열쇠가 이긴다', () => {
    expect(topicOf('멋쟁이사자처럼/프론트엔드/React/훅.md')).toBe('web')
    expect(topicOf('멋쟁이사자처럼/백엔드/Spring/빈.md')).toBe('spring')
    expect(topicOf('멋쟁이사자처럼/백엔드/Java.md')).toBe('java')
    expect(topicOf('멋쟁이사자처럼/백엔드/Java/클래스.md')).toBe('java')
    expect(topicOf('정보처리기사/데이터베이스 구축/SQL 응용/조인.md')).toBe('database')
    expect(topicOf('정보처리기사/정보시스템 구축 관리/시스템 보안 구축/DoS.md')).toBe('security')
    expect(topicOf('정보처리기사/정보시스템 구축 관리/IT 프로젝트 정보시스템 구축 관리/SDN.md')).toBe('se')
    expect(topicOf('정보처리기사/_MOC/SQL 응용.md')).toBe('database')
  })

  it('열쇠는 이름 경계에서만 맞춘다', () => {
    expect(topicOf('멋쟁이사자처럼/백엔드/JavaScript.md')).toBe('spring')
  })

  it('course : 코스 폴더 안 노트만', () => {
    expect(courseOf('정보처리기사/소프트웨어 설계/요구사항 확인/UML.md')).toBe('engineer-cert')
    expect(courseOf('컴퓨터 네트워크/TCP.md')).toBeUndefined()
    expect(courseOf('정보처리기사.md')).toBeUndefined()
    expect(topicOf('컴퓨터 네트워크/TCP.md')).toBe('network')
  })
})
