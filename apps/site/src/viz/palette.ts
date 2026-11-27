// 글 옮기기 프로젝트 전역 색 (2026-11-27 결정) : 보라 팔레트 + 포인트 노랑 · 남색
// 시각화 · 재생 버튼 · 시안 작업대가 모두 이 파일에서 색을 가져온다. 규칙은 docs/content-rules.md "색"

// 무광 보라 21색 : 사용자가 준 팔레트 이미지의 이름과 코드 그대로
export const Purple = {
  softWisteria: '#A688B7',
  mutedLavenderMist: '#A08DB3',
  matteLilacRose: '#A97CA9',
  vintageViolet: '#9B84A9',
  softHeather: '#9A7FAE',
  duskyPeriwinkle: '#8D79A6',
  duskyLilac: '#8D76AA',
  dustyLavender: '#8E6CA8',
  duskyOrchid: '#8B6897',
  matteAmethyst: '#7C5A99',
  subduedIris: '#73588C',
  mutedDeepLavender: '#6E5A87',
  matteVioletOrchid: '#7A4E92',
  mutedRoyal: '#674882',
  antiqueMatte: '#9C7B9C',
  fadedAmaranth: '#82648A',
  matteByzantium: '#7A517D',
  matteMulberry: '#7E547C',
  mutedPlum: '#6F4C77',
  smokyGrape: '#6A4F72',
  matteEggplant: '#5C3D66',
} as const

// 연보라 5 x 5 : 코드가 없는 이미지라 칸의 픽셀 값 (행 순서대로, 왼쪽이 밝음)
export const PurpleTint = [
  '#D8D3DA', '#CDC5D4', '#C0B3C7', '#AD9DB7', '#9F8CA8',
  '#CEC1D3', '#BDADC8', '#AA94B9', '#9A81AB', '#8B709D',
  '#E7D9F2', '#D7C3E6', '#C5AEDA', '#B296C9', '#A080BD',
  '#C7C3D4', '#B6ADCC', '#A096B9', '#8E83AB', '#766995',
  '#CFC2D4', '#BDA8C5', '#AC92B7', '#91729E', '#825E8C',
] as const

// 포인트 노랑 (밝음 → 진함)
export const Yellow = ['#FFFFCC', '#FFF099', '#FFE880', '#FFD94D', '#FFCA1A'] as const

// 포인트 남색 (진함 → 밝음) : 마지막 칸은 코드가 가려져 있어 픽셀 값
export const Navy = ['#06162B', '#0F2E57', '#2F6E9B', '#A8D4EA', '#F3FBFE'] as const

// 쓰임새 : 컴포넌트는 되도록 이 이름으로 쓴다
export const Role = {
  bg: '#1A1A1A',
  fg: '#E0E0E0',
  dim: '#8A8A8A',
  line: '#3A3A3A',
  // 주 색 (선 · 채움 · 강조 테두리)
  primary: Purple.softWisteria,
  primaryDeep: Purple.mutedRoyal,
  primarySoft: PurpleTint[11],
  // 포인트 노랑 : 가장 중요한 한 곳 (예 : 끼운 비트), 위 글자는 onPoint
  point: Yellow[3],
  onPoint: '#1A1A1A',
  // 포인트 남색 : 두 번째 강조 (채움 · 테두리), 어두운 바탕 위 글자는 navyText
  navyPoint: Navy[2],
  navyText: Navy[3],
} as const

export const AllSwatches: string[] = [...Object.values(Purple), ...PurpleTint, ...Yellow, ...Navy]

// WCAG 대비 비율
const lum = (hex: string) => {
  const C = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * C[0] + 0.7152 * C[1] + 0.0722 * C[2]
}
export const contrast = (a: string, b: string) => {
  const [L1, L2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (L1 + 0.05) / (L2 + 0.05)
}
