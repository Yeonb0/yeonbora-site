---
title: ACK
aliases:
  - Acknowledgement
  - ACK(Acknowledgement)
  - 긍정 응답
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Data Link Layer/ACK.md
created: 2026-08-01
---

- Acknowledgement frame -> 성공적으로 받았다는 표시
	- ==ex)== "확인했습니다!"
- [[Sequence Number]] 부착해 전송
	- next expected frame 번호 사용
- ACK 미도착 -> [[Timeout]] -> 같은 frame 재전송
- 반대 개념 -> [[NAK]]
