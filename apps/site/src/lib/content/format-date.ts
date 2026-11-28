// 원래 작성일 : 한국 시간 기준 YYYY-MM-DD
// 포매터는 하나만 만든다 : 호출마다 Intl.DateTimeFormat 을 만들면 off-heap 메모리가 쌓인다 (글 화면 430개 × 글 430편에서 빌드가 6 GB 를 넘겨 죽었다)
const KoreaDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' })

export const formatDate = (d: Date): string => KoreaDay.format(d)
