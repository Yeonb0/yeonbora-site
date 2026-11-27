# 인문 블로그 도서관의 책장 칸 그림을 만든다
# 칸마다 같은 책장 · 같은 크기 책 29권에 그림 한 장을 책등으로 나눠 그리고, 글이 있는 책에는 제목 · 저자를 찍는다
# 결과 : ../assets/shelf-<칸>.jpg (옅은 그림, 칸 안), shelf-<칸>-v.jpg (진한 그림, 처음 화면), book-<id>-spine.jpg · book-<id>-cover.jpg
# 쓰는 법 : python shelves.py && VIVID=1 python shelves.py   (그림 원본은 paintings/, plain*.jpg 는 plain.py 로 만든다)
# 글꼴 : FONT_TITLE (국립박물관문화재단클래식 B), FONT_LATIN (Crimson Text SemiBold), FONT_ORIG (Noto Serif CJK Bold) 환경 변수로 경로를 준다
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, json, os, glob
HERE=os.path.dirname(os.path.abspath(__file__))
ASSETS=os.path.join(HERE,'..','assets')
painting=lambda n: glob.glob(os.path.join(HERE,'paintings',n+'.*'))[0]
MODE='pale'
import os; VIVID=os.environ.get('VIVID')=='1'
SER=os.environ.get('FONT_ORIG','/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc')
K=2
shelf=np.asarray(Image.open(painting('shelf')).convert('RGB').resize((1536*K,1024*K),Image.LANCZOS)).astype(float)
FLOOR=603*K; TOP=326*K; XL,XR=44*K,1492*K
N=29; GAP=3*K; BW=((XR-XL)-(N-1)*GAP)//N; BH=int((FLOOR-TOP)*0.9)
X0=XL+((XR-XL)-(N*BW+(N-1)*GAP))//2
def desat(a,k=0.78):
  g=a.mean(2,keepdims=True); return g+(a-g)*k
def build(scene, art, featured, band):
  rng=np.random.default_rng(len(scene)*7)
  im=Image.open(painting(art)).convert('RGB')
  tw=N*(BW+GAP)-GAP; sh=im.width*BH/tw; cy=im.height*band
  y0=max(0,min(im.height-sh,cy-sh/2))
  art_=desat(np.asarray(im.crop((0,int(y0),im.width,int(y0+sh))).resize((tw,BH),Image.LANCZOS)).astype(float))
  out=desat(shelf.copy(),0.85); y=FLOOR-BH
  xs=np.linspace(-1,1,BW); cyl=0.62+0.38*np.cos(xs*np.pi/2)**0.8
  ys=np.linspace(0,1,BH); top=0.72+0.28*np.clip(ys/0.1,0,1)
  slots={}; fidx={i:b for i,b in featured}
  if MODE.startswith('pale'):
    # 그림 전체를 옅게 : 대비를 줄이고 밝은 종이색 쪽으로 섞는다
    PM=0 if VIVID else (0.6 if scene=='christian' else 0.4)
    m_=art_.reshape(-1,3).mean(0); art_=m_+(art_-m_)*0.75
    art_=art_*(1-PM)+(np.array([246,240,228])*0.88+m_*0.12)*PM
  px=art_.reshape(-1,3)[::97]; C=px[np.random.default_rng(1).choice(len(px),10,replace=False)]
  for _ in range(12):
    lab=((px[:,None]-C[None])**2).sum(2).argmin(1); C=np.array([px[lab==k].mean(0) if (lab==k).any() else C[k] for k in range(len(C))])
  PAL=C
  for i in range(N):
    x=X0+i*(BW+GAP)
    seg=art_[:,i*(BW+GAP):i*(BW+GAP)+BW].copy()
    seg*=cyl[None,:,None]*top[:,None,None]
    m=seg[int(BH*0.25):int(BH*0.7)].reshape(-1,3).mean(0); g=m.mean(); acc=np.clip((g+(m-g)*1.4)*0.42,0,255)
    lit=((1.05 if i in fidx else 0.84*rng.uniform(0.95,1.0)) if VIVID else (1.08 if i in fidx else 0.6*rng.uniform(0.95,1.0))) if MODE.startswith('pale') else (1.42 if i in fidx else 0.52*rng.uniform(0.95,1.0))
    seg*=lit
    b0=int(BH*0.76)
    seg[b0:]=acc*cyl[None,:,None]*1.15*(1.2 if i in fidx else 0.7)+rng.normal(0,3,(BH-b0,BW))[...,None]
    seg[b0:b0+K]=np.array([201,164,92])*cyl[:,None]*(1 if i in fidx else 0.7)
    seg[-4*K:]*=0.6
    seg[:8*K]*=0.35
    for yy in (int(BH*0.07),):
      seg[yy:yy+2*K]=seg[yy:yy+2*K]*0.4+np.array([190,155,90])*0.6*cyl[None,:,None]
    seg+=rng.normal(0,5,seg.shape[:2])[...,None]
    out[y:FLOOR,x:x+BW]=seg; out[y:FLOOR,x+BW:x+BW+GAP]*=0.2
  out[FLOOR-2*K:FLOOR+5*K,X0:X0+tw]*=0.55
  img=Image.fromarray(np.clip(out,0,255).astype('uint8')); d=ImageDraw.Draw(img)
  MB=os.environ.get('FONT_TITLE','/tmp/mcf/mcf-B.woff')
  LAT=os.environ.get('FONT_LATIN','/usr/share/fonts/truetype/google-fonts/ofl/crimsontext/CrimsonText-SemiBold.ttf')
  CREAM=(242,232,208)
  def spaced(dr,xy,t,f,fill,track):
    x0,y0=xy
    for ch in t:
      dr.text((x0,y0),ch,font=f,fill=fill); x0+=dr.textlength(ch,font=f)+track
  def spaced_w(dr,t,f,track): return sum(dr.textlength(ch,font=f) for ch in t)+track*(len(t)-1)
  def rl(c):
    c=np.asarray(c)/255; c=np.where(c<=0.03928,c/12.92,((c+0.055)/1.055)**2.4); return (c*[0.2126,0.7152,0.0722]).sum(-1)
  bgL=rl(np.clip(art_[int(BH*0.15):int(BH*0.7)]*1.08,0,255).reshape(-1,3)[::13])
  import colorsys
  best=None
  for p_ in PAL:
    h,_,_=colorsys.rgb_to_hls(*(p_/255))
    for sat in (0.45,0.6,0.75):
      for l in np.linspace(0.06,0.94,23):
        cand=np.array(colorsys.hls_to_rgb(h,l,sat))*255
        Lc=rl(cand); cr=(np.maximum(Lc,bgL)+0.05)/(np.minimum(Lc,bgL)+0.05)
        sc=min(np.percentile(cr,15),3.6)+sat*0.25*(1-abs(l-0.5)*1.2)
        if best is None or sc>best[0]: best=(sc,cand)
  # 책등 제목은 모든 서재에서 검은색으로 통일
  SCOL=(18,15,13)
  for i,b in featured:
    x=X0+i*(BW+GAP); a=np.asarray(img).astype(float)
    seg=a[y:FLOOR,x:x+BW]
    b0,b1=int(BH*0.76),BH
    m=seg[b0+4*K:b0+20*K].reshape(-1,3).mean(0); acc=m/1.15/1.15
    # 제목 자리 : 가장자리가 흐린 그늘을 깔아 그림이 비치면서도 글씨가 읽히게
    yy=np.linspace(0,1,BH)[:,None]; xx=np.linspace(-1,1,BW)[None,:]
    shade=np.clip(1-np.abs(yy-0.41)/0.3,0,1)**0.6*np.clip(1-np.abs(xx)**4,0,1)
    b0_=int(BH*0.76)
    if MODE=='tone':
      # 그림 색 : 글 있는 책은 그림을 밝고 옅은 톤으로 (대비 줄이고 밝은 쪽으로)
      p=seg[:b0_]; g=p.mean(2,keepdims=True); p=g+(p-g)*0.9
      m_=p.reshape(-1,3).mean(0); p=m_+(p-m_)*0.45
      p=p*0.45+(np.array([248,242,230])*0.85+m_*0.15)*0.55
      seg[:b0_]=p*cyl[None,:,None]**0.5
    if MODE=='colorblur':
      bl=np.asarray(Image.fromarray(np.clip(seg,0,255).astype('uint8')).filter(ImageFilter.GaussianBlur(BW*0.12))).astype(float)
      w=np.clip(shade*1.2,0,1)[...,None]*0.7; seg=seg*(1-w)+bl*w
    def rl(c):
      c=np.asarray(c)/255; c=np.where(c<=0.03928,c/12.92,((c+0.055)/1.055)**2.4); return (c*[0.2126,0.7152,0.0722]).sum(-1)
    reg=seg[int(BH*0.15):int(BH*0.7),int(BW*0.2):int(BW*0.8)].reshape(-1,3)
    Lb=np.median(rl(reg)); dark=Lb>0.12
    best=None
    for p_ in PAL:
      g=p_.mean(); sat=g+(p_-g)*1.8
      for t in np.linspace(0,1,21):
        cand=np.clip(sat*(1-t) if dark else sat+(255-sat)*t,0,255)
        Lc=rl(cand); cr=(max(Lc,Lb)+0.05)/(min(Lc,Lb)+0.05)
        if cr>=4.5:
          sc=np.ptp(cand)/255-t*0.3
          if best is None or sc>best[0]: best=(sc,cand)
          break
    TCOL=tuple(int(v) for v in (best[1] if best else ((20,14,10) if dark else (245,236,214))))
    HALO=(250,244,230) if dark else (12,8,6)
    a[y:FLOOR,x:x+BW]=seg; img=Image.fromarray(np.clip(a,0,255).astype('uint8')); d=ImageDraw.Draw(img)
    # 제목 : 마루부리, 세로로 한 글자씩
    title=b['title']
    size=int(BW*(0.33 if MODE=='colorbig' else 0.35 if MODE=='pale' else 0.27)); f=ImageFont.truetype(MB,size); step=size*1.08
    th=sum(step*0.55 if ch==' ' else step for ch in title)
    yc=y+int(BH*0.08)+(int(BH*0.76)-int(BH*0.08)-th)/2
    for ch in title:
      if ch==' ': yc+=step*0.55; continue
      bb=d.textbbox((0,0),ch,font=f); cx_=x+BW/2-(bb[2]-bb[0])/2-bb[0]; cy_=yc+step/2-(bb[3]-bb[1])/2-bb[1]
      if MODE not in ('tone','pale'):
        hm=Image.new('L',img.size,0); ImageDraw.Draw(hm).text((cx_,cy_),ch,font=f,fill=255,stroke_width=K*2,stroke_fill=255)
        hm=np.asarray(hm.filter(ImageFilter.GaussianBlur(K*3))).astype(float)[...,None]/255*(0.3 if MODE.startswith('pale') else 0.55)
        aa=np.asarray(img).astype(float); aa=aa*(1-hm)+np.array(HALO)*hm
        img=Image.fromarray(np.clip(aa,0,255).astype('uint8')); d=ImageDraw.Draw(img)
      C_=SCOL if MODE=='pale' else TCOL; d.text((cx_,cy_),ch,font=f,fill=C_); yc+=step
    # 저자 : 영어, 단어마다 한 줄, 폭에 맞춘 크기와 자간
    # 저자 : 영어 대문자. 성 (마지막 단어) 은 크게, 이름은 작게 위에
    words=b['by'].upper().split(); last=words[-1]; first=' '.join(words[:-1])
    def fit(t,maxs):
      fs=maxs
      while fs>8 and spaced_w(d,t,ImageFont.truetype(LAT,fs),fs*0.1)>BW*0.7: fs-=1
      return fs
    bh=b1-b0
    fl=fit(last,int(BW*0.17)); ff=fit(first,int(fl*0.55)) if first else 0
    ff=min(ff,int(fl*0.72)) if first else 0
    tot=fl+(ff*1.3 if first else 0); ytop=y+b0+(bh-tot)/2
    if first:
      f1=ImageFont.truetype(LAT,ff); w1=spaced_w(d,first,f1,ff*0.1)
      spaced(d,(x+(BW-w1)/2,ytop-ff*0.2),first,f1,(214,196,160),ff*0.1); ytop+=ff*1.3
    f2=ImageFont.truetype(LAT,fl); w2=spaced_w(d,last,f2,fl*0.1)
    spaced(d,(x+(BW-w2)/2,ytop-fl*0.2),last,f2,CREAM,fl*0.1)
    if not VIVID: img.crop((x,y,x+BW,FLOOR)).save(os.path.join(ASSETS,f'book-{b["id"]}-spine.jpg'),quality=94)
    # 표지 : 같은 그림에서 그 책 자리를 중심으로, 위에 제목 (마루부리), 아래 저자 띠
    cw=int(BH*0.68)
    # 그림은 책등과 같은 띠에서 자르고 (예전 표지 그대로), 크기만 키워 글씨를 고해상도로 찍는다
    cx=min(max(i*(BW+GAP)+BW//2-cw//2,0),tw-cw)
    H2,W2=2000,int(2000*0.68)
    cv=np.asarray(Image.fromarray(np.clip(art_[:,cx:cx+cw],0,255).astype('uint8')).resize((W2,H2),Image.BICUBIC)).astype(float)
    yy=np.linspace(0,1,H2)[:,None,None]; cv*=1-0.45*np.clip(1-np.abs(yy-0.3)/0.28,0,1)
    cb0=int(H2*0.78); cv[cb0:]=acc*1.1; cv[cb0:cb0+4]=[201,164,92]
    cov=Image.fromarray(np.clip(cv,0,255).astype('uint8')); cd=ImageDraw.Draw(cov)
    tf=ImageFont.truetype(MB,int(W2*0.13))
    while cd.textlength(b['title'],font=tf)>W2*0.8: tf=ImageFont.truetype(MB,tf.size-2)
    bb=cd.textbbox((0,0),b['title'],font=tf); tx=(W2-(bb[2]-bb[0]))/2-bb[0]; ty=H2*0.24-bb[1]
    cd.text((tx+4,ty+4),b['title'],font=tf,fill=(20,14,8)); cd.text((tx,ty),b['title'],font=tf,fill=CREAM)
    if b.get('orig'):
      of=ImageFont.truetype(SER,int(W2*0.04),index=1); ow=cd.textlength(b['orig'],font=of)
      cd.text(((W2-ow)/2,ty+(bb[3]-bb[1])+H2*0.04),b['orig'],font=of,fill=(226,206,160))
    af=ImageFont.truetype(LAT,int(W2*0.075)); au=b['by'].upper(); aw=spaced_w(cd,au,af,af.size*0.12)
    if aw>W2*0.86: af=ImageFont.truetype(LAT,int(af.size*W2*0.86/aw)); aw=spaced_w(cd,au,af,af.size*0.12)
    spaced(cd,((W2-aw)/2,cb0+(H2-cb0)/2-af.size*0.62),au,af,CREAM,af.size*0.12)
    if not VIVID: cov.save(os.path.join(ASSETS,f'book-{b["id"]}-cover.jpg'),quality=85,optimize=True)
    slots[b['id']]=[round(x/K,1),round(y/K,1),round(BW/K,1),round(BH/K,1)]
  (img.resize((img.width//2,img.height//2),Image.LANCZOS).save(os.path.join(ASSETS,f'shelf-{scene}-v.jpg'),quality=82,optimize=True,progressive=True) if VIVID else img.save(os.path.join(ASSETS,f'shelf-{scene}.jpg'),quality=82,optimize=True,progressive=True))
  return slots, (cw/BH if featured else None)
c=N//2
B=lambda i,t,**k:(i,{'id':i if isinstance(i,str) else None,'title':t,**k})
Spec={
 'ancient':('ancient',[(c-4,{'id':'republic','title':'국가','by':'Plato','orig':'Πολιτεία'})],0.42),
 'medieval':('medieval',[(c+5,{'id':'confessions','title':'고백록','by':'Augustine','orig':'Confessiones'})],0.55),
 'modern':('modern',[(c-1,{'id':'cpr','title':'순수이성비판','by':'Immanuel Kant','orig':'Kritik der reinen Vernunft'}),(c,{'id':'cprac','title':'실천이성비판','by':'Immanuel Kant','orig':'Kritik der praktischen Vernunft'}),(c+1,{'id':'cj','title':'판단력비판','by':'Immanuel Kant','orig':'Kritik der Urteilskraft'})],0.62),
 'contemporary':('contemporary',[(c-7,{'id':'seinzeit','title':'존재와 시간','by':'Martin Heidegger','orig':'Sein und Zeit'})],0.5),
 'confucian':('confucian',[(c+2,{'id':'yulei','title':'주자어류','by':'Zhu Xi','orig':'朱子語類'})],0.58),
 'buddhist':('buddhist',[(c+6,{'id':'jingang','title':'금강경','by':'Kumarajiva','orig':'金剛般若波羅蜜經'})],0.48),
 'taoist':('taoist',[(c-3,{'id':'daodejing','title':'도덕경','by':'Laozi','orig':'道德經'})],0.45),
 'won':('won',[(c+4,{'id':'jeongjeon','title':'정전','by':'Sotaesan','orig':'正典'})],0.5),
 'christian':('christian',[(c-1,{'id':'bible','title':'성서','by':'Biblia','orig':''})],0.5),
 'islam':('islam',[(c+3,{'id':'quran','title':'꾸란','by':'Quran','orig':''})],0.55),
 'judaism':('judaism',[(c-5,{'id':'talmud','title':'탈무드','by':'Talmud','orig':''})],0.45),
 'hindu':('hindu',[(c+1,{'id':'gita','title':'바가바드 기타','by':'Vyasa','orig':''})],0.58),
 'baijia':('baijia',[],0.6),
 'plain1':('plain1',[],0.5),
 'plain2':('plain2',[],0.5),
 'plain3':('plain3',[],0.5),
 'zh':('zh',[],0.52),
 'ja':('ja',[],0.56),
 'de':('de',[],0.5),
 'fr':('fr',[],0.52),
}
res={}
for s,(a,f,b) in Spec.items():
  sl,asp=build(s,a,f,b); res[s]=sl
  if asp: CA=asp
res['_spineAspect']=round(BW/BH,4); res['_coverAspect']=round(CA,4)
json.dump(res,open(os.path.join(HERE,'slots.json'),'w'),ensure_ascii=False); print(json.dumps(res,ensure_ascii=False))
