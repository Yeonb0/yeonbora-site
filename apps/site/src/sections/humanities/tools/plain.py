# 무늬 없는 책장 칸 그림 (paintings/plain1 ~ 3.jpg) 을 만든다 : 빈 칸 · 둘레 여분 책장용
# 책 한 권 = 세로 띠 하나가 되도록 shelves.py 의 책 폭에 맞춰 가죽 색 띠를 늘어놓는다
# 여분 책장 타일 (../assets/spare-tile.webp) 은 이 그림으로 만든 shelf-plain*-v.jpg 를 쌓아 만든다 : python plain.py tile
import os
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')

# shelves.py 와 같은 책 배치 (K = 2 기준 책 폭 · 간격)
K = 2
XL, XR = 44 * K, 1492 * K
N = 29
GAP = 3 * K
BW = ((XR - XL) - (N - 1) * GAP) // N
TW = N * (BW + GAP) - GAP

Pal = np.array([(92, 34, 30), (58, 72, 52), (40, 52, 78), (96, 70, 42), (120, 96, 58), (70, 40, 58), (48, 48, 46), (110, 84, 70), (36, 60, 64)], float)


def art(v):
  rng = np.random.default_rng(10 + v)
  sw = 1536 * (BW + GAP) / TW
  a = np.zeros((1024, 1536, 3))
  for i in range(N + 2):
    a[:, int(i * sw):int((i + 1) * sw)] = Pal[rng.integers(len(Pal))] * rng.uniform(0.8, 1.15)
  a = a + rng.normal(0, 6, (1024, 1536, 1))
  a = a * np.linspace(1.05, 0.92, 1024)[:, None, None]
  return Image.fromarray(np.clip(a, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6))


# 책장 두 개 (5칸씩) 를 나란히 둔 타일 : 책장 사이 · 위아래 틈은 투명
def tile():
  import random
  random.seed(3)
  Src = [Image.open(os.path.join(ASSETS, f'shelf-plain{v}-v.jpg')).convert('RGBA').resize((1536, 1024)) for v in (1, 2, 3)]
  CW, CaseGap, TierGap, Cap, RowTop, RowH = 1536, 220, 140, 69, 280, 323
  CH = Cap * 2 + 5 * RowH
  T = Image.new('RGBA', (2 * (CW + CaseGap), CH + TierGap), (0, 0, 0, 0))
  for c in range(2):
    x = c * (CW + CaseGap)
    T.paste(Src[c].crop((0, 603, CW, 603 + Cap)), (x, 0))
    for r in range(5):
      Row = random.choice(Src).crop((0, RowTop, CW, RowTop + RowH))
      if random.random() < 0.5:
        Row = ImageOps.mirror(Row)
      T.paste(Row, (x, Cap + r * RowH))
    T.paste(Src[c].crop((0, 603, CW, 603 + Cap)), (x, Cap + 5 * RowH))
  T.save(os.path.join(ASSETS, 'spare-tile.webp'), quality=82)


if __name__ == '__main__':
  if sys.argv[1:] == ['tile']:
    tile()
  else:
    for v in (1, 2, 3):
      art(v).convert('RGB').save(os.path.join(HERE, 'paintings', f'plain{v}.jpg'), quality=88)
