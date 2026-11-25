# 종교학 방 뱃지 평면 도형 생성기 : python3 badges.py → ../badges.ts
# 필요 : shapely, matplotlib, Noto Serif CJK (儒), FreeSerif Bold (ॐ)
# 뱃지 평면 도형 : 100 x 100 좌표 (y 아래로). 층 : plate (바탕 금속), enamel (색), lines (솟은 금속)
import json, math
from shapely.geometry import Polygon, Point, LineString, box, MultiPolygon
from shapely.ops import unary_union
from shapely import affinity

R = 4  # 둥글기 해상도
def disc(r, cx=50, cy=50): return Point(cx, cy).buffer(r, quad_segs=24)
def ring(r1, r0, cx=50, cy=50): return disc(r1, cx, cy).difference(disc(r0, cx, cy))
def rrect(x0, y0, x1, y1, r): return box(x0 + r, y0 + r, x1 - r, y1 - r).buffer(r, quad_segs=8)
def ngon(n, r, rot, cx=50, cy=50):
  return Polygon([(cx + math.cos(rot + i * 2 * math.pi / n) * r, cy + math.sin(rot + i * 2 * math.pi / n) * r) for i in range(n)])
def star5(cx, cy, r):
  return Polygon([(cx + math.cos(-math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * 0.42),
                   cy + math.sin(-math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * 0.42)) for i in range(10)])

B = []

# 기독교 : 십자 판 (금) + 파란 에나멜 + 볼록한 안쪽 십자
cross = Polygon([(30,4),(70,4),(70,20),(90,20),(90,58),(70,58),(70,96),(30,96),(30,58),(10,58),(10,20),(30,20)]).buffer(1.5, join_style=1).buffer(-1.5, join_style=1)
inner = unary_union([rrect(45, 14, 55, 86, 4.8), rrect(21, 34, 79, 44, 4.8)])
B.append(dict(id='christianity', name='기독교', metal='gold', layers=[
  ('plate', cross, 'gold'),
  ('enamel', cross.buffer(-2.0, join_style=2).difference(inner.buffer(0.4)), '#1d3c8f'),
  ('lines', unary_union([cross.difference(cross.buffer(-2.0, join_style=2)), inner]), 'gold'),
]))

# 불교 : 卍 (왼쪽으로 도는 정방향, 위 팔이 왼쪽으로 꺾인다). 통짜 솔결 금
w = 6.5
arms = [LineString([(50,50),(50,16),(22,16)]), LineString([(50,50),(16,50),(16,78)]),
        LineString([(50,50),(50,84),(78,84)]), LineString([(50,50),(84,50),(84,22)])]
manji = unary_union([a.buffer(w, cap_style=3, join_style=2) for a in arms])
B.append(dict(id='buddhism', name='불교', metal='gold', layers=[('plate', manji, 'brushed')]))

# 모양 뱃지 공통 : 바탕 판 모양 + 얇은 금 테 (2.2) + 안쪽 에나멜 + 금 상징
RIM = 2.2
def shaped(id, name, plate, enamels, lines):
  inner = plate.buffer(-RIM, join_style=1)
  rim = plate.difference(inner)
  return dict(id=id, name=name, metal='gold', layers=
    [('plate', plate, 'gold')] + [('enamel', g.intersection(inner), c) for g, c in enamels] + [('lines', unary_union([rim] + lines), 'gold')])
def rounded(p, r): return p.buffer(-r, join_style=1).buffer(r, join_style=1)

# 유교 : 둥근 모서리 사각 (도장 느낌) + 안쪽 가는 금 테 + 금 儒
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
def glyph(ch, font, size, cx, cy):
  tp = TextPath((0, 0), ch, size=size, prop=FontProperties(fname=font))
  g = Polygon()
  for ring_ in tp.to_polygons():
    if len(ring_) < 3: continue
    g = g.symmetric_difference(Polygon(ring_).buffer(0))
  g = affinity.scale(g, 1, -1, origin=(0, 0))
  x0, y0, x1, y1 = g.bounds
  return affinity.translate(g, cx - (x0 + x1) / 2, cy - (y0 + y1) / 2)
sq = rrect(7, 7, 93, 93, 11)
ru = glyph('儒', '/usr/share/fonts/opentype/noto/NotoSerifCJK-Black.ttc', 56, 50, 50)
seal = rrect(14, 14, 86, 86, 6)
sealLine = seal.difference(seal.buffer(-1.3))
ru_badge = shaped('confucianism', '유교', sq, [(sq.difference(unary_union([ru, sealLine]).buffer(0.4)), '#161314')], [ru, sealLine])

# 도교 : 팔각 (팔괘) + 가운데 태극 + 둘레에 금 괘 8개 (복희 팔괘, 위가 남쪽 · 왼쪽이 동쪽)
octa = rounded(ngon(8, 48, math.pi / 8), 3)
TR = 21
half = box(50, 0, 100, 100).intersection(disc(TR))
black = unary_union([half, disc(TR / 2, 50, 50 + TR / 2)]).difference(disc(TR / 2, 50, 50 - TR / 2))
black = black.difference(disc(TR * 0.13, 50, 50 + TR / 2)).union(disc(TR * 0.13, 50, 50 - TR / 2))
white = disc(TR).difference(black)
taiLines = unary_union([black.boundary.buffer(0.6).intersection(disc(TR - 0.5)), ring(TR + 1.2, TR - 0.4)])
# 괘 : 안쪽 (태극 쪽) 이 맨 아래 효. 1 = 양효 (이어진 선), 0 = 음효 (끊긴 선)
Trig = {'top': (1, 1, 1), 'topleft': (1, 1, 0), 'left': (1, 0, 1), 'bottomleft': (1, 0, 0),
        'bottom': (0, 0, 0), 'bottomright': (0, 0, 1), 'right': (0, 1, 0), 'topright': (0, 1, 1)}
Ang = {'top': -90, 'topright': -45, 'right': 0, 'bottomright': 45, 'bottom': 90, 'bottomleft': 135, 'left': 180, 'topleft': -135}
bars = []
for k, lines_ in Trig.items():
  for j, yang in enumerate(lines_):
    r = 27.5 + j * 4.6
    L = 7.8 + j * 1.2
    segs = [(-L, L)] if yang else [(-L, -1.6), (1.6, L)]
    for a0, a1 in segs:
      bar = box(a0, -1.15, a1, 1.15)
      bar = affinity.translate(bar, 0, -r)
      bar = affinity.rotate(bar, Ang[k] + 90, origin=(0, 0))
      bars.append(affinity.translate(bar, 50, 50))
trig = unary_union(bars)
taoism = shaped('taoism', '도교', octa,
  [(octa.difference(unary_union([disc(TR + 1.2), trig]).buffer(0.3)), '#1f3b3a'), (white.difference(taiLines), '#f3f1ec'), (black.difference(taiLines), '#151515')],
  [taiLines, trig])

# 원불교 : 둥근 판 + 남색 + 금 일원상 (원 두 개가 겹친 모양)
roundPlate = disc(46)
circ = ring(25, 19.5)
won = shaped('won-buddhism', '원불교', roundPlate, [(roundPlate.difference(circ.buffer(0.3)), '#1b2a5e')], [circ])

# 힌두교 : 둥근 마름모 + 사프란 주황 + 금 ॐ
dia = rounded(Polygon([(50, 2), (98, 50), (50, 98), (2, 50)]), 7)
om = glyph('ॐ', '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf', 60, 50, 51)
hindu = shaped('hinduism', '힌두교', dia, [(dia.difference(om.buffer(0.4)), '#e0661f')], [om])

# 이슬람 : 뾰족 아치 (미흐라브) + 초록 + 금 초승달과 별
def pointed_arch(x0, x1, ybase, ybottom, R):
  cxL = x0 + R
  cxR = x1 - R
  mid = (x0 + x1) / 2
  apex = math.sqrt(R * R - (cxL - mid) ** 2)
  pts = []
  aL = math.atan2(apex, mid - cxL)
  for i in range(31):
    t = math.pi - (math.pi - aL) * i / 30
    pts.append((cxL + R * math.cos(t), ybase - R * math.sin(t)))
  aR = math.atan2(apex, mid - cxR)
  for i in range(31):
    t = aR - aR * i / 30
    pts.append((cxR + R * math.cos(t), ybase - R * math.sin(t)))
  pts += [(x1, ybottom), (x0, ybottom)]
  return Polygon(pts)
arch = rounded(pointed_arch(12, 88, 50, 96, 56), 2.5)
cres = disc(21, 45, 62).difference(disc(17, 53, 57))
st = star5(66, 47, 8.5)
islam = shaped('islam', '이슬람', arch, [(arch.difference(unary_union([cres, st]).buffer(0.4)), '#0e6b43')], [cres, st])

# 유대교 : 다윗의 별 모양 그대로. 가운데 육각은 흰색, 꼭짓점은 파랑, 두 삼각형 테는 금
t1 = ngon(3, 49, -math.pi / 2); t2 = ngon(3, 49, math.pi / 2)
hexa = rounded(unary_union([t1, t2]), 1.5)
hexIn = t1.intersection(t2)
starLines = unary_union([t1.exterior.buffer(0.7), t2.exterior.buffer(0.7)]).intersection(hexa)
judaism = shaped('judaism', '유대교', hexa, [(hexIn.difference(starLines), '#eef1f6'), (hexa.difference(hexIn).difference(starLines), '#2450c4')], [starLines])

B += [taoism, won, hindu, islam, judaism]
B.append(ru_badge)
Order = ['confucianism', 'buddhism', 'taoism', 'won-buddhism', 'christianity', 'hinduism', 'islam', 'judaism']
B.sort(key=lambda b: Order.index(b['id']))
# 내보낸다 : [[x,y,...] 외곽, [구멍...]] 목록
def polys(g):
  g = g.buffer(0)
  if g.is_empty: return []
  gs = list(g.geoms) if hasattr(g, 'geoms') else [g]
  out = []
  for p in gs:
    if p.area < 0.3: continue
    p = p.simplify(0.08)
    ring_ = lambda r: [round(v, 2) for xy in list(r.coords)[:-1] for v in xy]
    out.append([ring_(p.exterior)] + [ring_(h) for h in p.interiors])
  return out
data = [dict(id=b['id'], name=b['name'], layers=[dict(kind=k, mat=m, polys=polys(g)) for k, g, m in b['layers']]) for b in B]
s = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
import os
here = os.path.dirname(os.path.abspath(__file__))
head = '''// 뱃지 평면 도형 : tools/badges.py 가 만든다 (손으로 고치지 않는다)
// 좌표 100 x 100, y 는 아래로. 층 : plate (바탕 금속) · enamel (색 면, mat 은 색) · lines (솟은 금선)
import type { BadgeShape } from './types'

export const Badges: BadgeShape[] = '''
open(os.path.join(here, '..', 'badges.ts'), 'w').write(head + s + '\n')
print(len(s))
