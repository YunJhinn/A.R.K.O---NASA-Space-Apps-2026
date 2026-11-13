"""A.R.K.O · gera o mapa base no estilo "telão de previsão do tempo" (oceano azul, estados em grafite, bordas brancas).

Uso (na raiz do repositório):
    python pipeline/mapa_base.py --regiao amazonia --saida web/src/assets/map-demo.jpg
    python pipeline/mapa_base.py --regiao sul      --saida web/src/assets/map-sul.jpg
    # região nova: limites oeste/leste, latitude central e estados em destaque
    python pipeline/mapa_base.py --oeste -80 --leste -66 --lat -10 --estados "" --saida web/src/assets/map-nova.jpg

Precisa dos dados geográficos (uma vez), baixados do npm para pipeline/geo/:
    cd pipeline/geo
    npm pack world-atlas@2.0.2 @highcharts/map-collection@2.3.3 @geo-maps/earth-rivers-10m
    (depois extraia cada .tgz numa pasta com o mesmo nome)
O script imprime os limites (oeste, leste, norte, sul) para copiar em web/src/lib/regions.ts.
"""
import json, math, os, sys
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import PathPatch
from matplotlib.path import Path
import matplotlib.patheffects as pe
from pyproj import Transformer
from scipy.ndimage import gaussian_filter, sobel, binary_dilation
from PIL import Image

G=os.path.join(os.path.dirname(os.path.abspath(__file__)),'geo'); W,H=746,508; SC=3
import argparse
ap=argparse.ArgumentParser(); ap.add_argument('--regiao',default='amazonia'); ap.add_argument('--oeste',type=float); ap.add_argument('--leste',type=float)
ap.add_argument('--lat',type=float); ap.add_argument('--estados'); ap.add_argument('--saida',default='mapa_base.jpg'); A=ap.parse_args()
REGION=A.regiao
if REGION=='sul':
    LON0,LON1=-59.6,-44.6; LAT_MID=-29.7
else:
    LON0,LON1=-74.0,-44.0; LAT_MID=-5.0
if A.oeste is not None: LON0,LON1,LAT_MID,REGION=A.oeste,A.leste,A.lat,'outra'
KX=math.cos(math.radians(LAT_MID))
span_x=(LON1-LON0)*KX; span_y=span_x*H/W; LAT1=LAT_MID+span_y/2+0.6; LAT0=LAT1-span_y
def to_xy(lon,lat): return (lon-LON0)*KX/span_x*W,(LAT1-lat)/span_y*H
PW,PH=W*SC,H*SC

def topo(path,obj):
    t=json.load(open(path)); sc,tr=t['transform']['scale'],t['transform']['translate']; arcs=[]
    for a in t['arcs']:
        x=y=0; pts=[]
        for dx,dy in a: x+=dx;y+=dy; pts.append((x*sc[0]+tr[0],y*sc[1]+tr[1]))
        arcs.append(pts)
    arc=lambda i: arcs[i] if i>=0 else arcs[~i][::-1]
    def ring(idx):
        pts=[]
        for i in idx: a=arc(i); pts.extend(a if not pts else a[1:])
        return pts
    out=[]
    for g in t['objects'][obj]['geometries']:
        polys=[g['arcs']] if g['type']=='Polygon' else g['arcs'] if g['type']=='MultiPolygon' else []
        out.append((g.get('properties',{}).get('name'),[[ring(r) for r in p] for p in polys]))
    return out
def rings_path(rings):
    v,c=[],[]
    for r in rings:
        if len(r)<3: continue
        xy=[to_xy(*q) for q in r]; v+=xy+[xy[0]]; c+=[Path.MOVETO]+[Path.LINETO]*(len(xy)-1)+[Path.CLOSEPOLY]
    return Path(v,c) if v else None

countries=[(n,rings_path([r for p in P for r in p])) for n,P in topo(f'{G}/world-atlas-2.0.2/package/countries-10m.json','countries')]
countries=[(n,p) for n,p in countries if p is not None]
d=json.load(open(f'{G}/highcharts-map-collection-2.3.3/package/countries/br/br-all.geo.json'))
hc=d['hc-transform']['default']; inv=Transformer.from_crs(hc['crs'],'EPSG:4326',always_xy=True)
def hc2ll(px,py):
    X=(px-hc['jsonmarginX'])/hc['jsonres']/hc['scale']+hc['xoffset']
    Y=(py-hc['jsonmarginY'])/hc['jsonres']/hc['scale']+hc['yoffset']
    return inv.transform(X,Y)
states=[]
for f in d['features']:
    g=f['geometry']
    if not g: continue
    polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
    rings=[[hc2ll(*q) for q in r] for p in polys for r in p]
    states.append((f['properties'].get('hc-a2'),rings_path(rings),rings))
FOCUS=set(filter(None,A.estados.split(','))) if A.estados is not None else {'RS','SC','PR'} if REGION=='sul' else {'AM','PA','AC','RO','RR','AP'}

def newfig(bg='black'):
    fig=plt.figure(figsize=(PW/100,PH/100),dpi=100); ax=fig.add_axes([0,0,1,1]); ax.set_xlim(0,W); ax.set_ylim(H,0); ax.axis('off')
    fig.patch.set_facecolor(bg); return fig,ax
def mask(paths):
    fig,ax=newfig()
    for p in paths: ax.add_patch(PathPatch(p,facecolor='white',edgecolor='white',lw=0.3))
    fig.canvas.draw(); a=np.asarray(fig.canvas.buffer_rgba())[:,:,0]>127; plt.close(fig); return a
land=mask([p for _,p in countries])
focus=mask([p for a,p,_ in states if a in FOCUS])

# terrain texture (fractal noise + hillshade)
rng=np.random.default_rng(7)
def fbm(oct=7,base=220):
    z=np.zeros((PH,PW))
    for i in range(oct):
        s=base/(2**i); a=0.55**i
        z+=a*gaussian_filter(rng.standard_normal((PH,PW)),max(s,0.6))*s**0.5
    return (z-z.mean())/z.std()
elev=fbm()
ridge=1-np.abs(gaussian_filter(rng.standard_normal((PH,PW)),9)); ridge=(ridge-ridge.mean())/ridge.std()
r2=1-np.abs(gaussian_filter(rng.standard_normal((PH,PW)),3)); r2=(r2-r2.mean())/r2.std()
elev=elev+0.6*ridge+0.35*r2
dx,dy=sobel(elev,1),sobel(elev,0); shade=(-dx*0.7-dy*0.7); shade=np.clip(shade/ (np.abs(shade).std()*3),-1,1)
fine=gaussian_filter(rng.standard_normal((PH,PW)),1.0); fine/=fine.std()

def mix(c,arr): return np.array([int(c[i:i+2],16) for i in (1,3,5)],float)
img=np.zeros((PH,PW,3))
# ocean: deep blue, brighter near coast, gradient toward east
yy,xx=np.mgrid[0:PH,0:PW]
from scipy.ndimage import distance_transform_edt
dist=distance_transform_edt(~land)/SC   # px in base units
o1,o2,o3=mix('#0A2E5C',0),mix('#1663AE',0),mix('#2E86D0',0)
t=np.clip(dist/45,0,1)[...,None]**.8
ocean=o2*(1-t)+o1*t
shelf=np.clip(1-dist/5,0,1)[...,None]**1.5; ocean=ocean*(1-shelf*.35)+o3*shelf*.35
ocean+= (gaussian_filter(rng.standard_normal((PH,PW)),6)*6)[...,None]
# land outside focus: steel blue satellite
l1,l2=mix('#2C5B82',0),mix('#4D82AC',0)
k=np.clip(0.5+elev*0.18+shade*0.25,0,1)[...,None]
landc=l1*(1-k)+l2*k + fine[...,None]*4
# focus: dark slate
f1,f2=mix('#1B2836',0),mix('#34475A',0)
kf=np.clip(0.45+elev*0.16+shade*0.28,0,1)[...,None]
focc=f1*(1-kf)+f2*kf + fine[...,None]*3.5
img=np.where(land[...,None],landc,ocean)
# soft transition for focus (slight glow edge)
fsoft=gaussian_filter(focus.astype(float),1.2)[...,None]
img=img*(1-fsoft)+focc*fsoft
# subtle vignette
vig=1-0.18*(((xx/PW-.5)**2+(yy/PH-.5)**2)*2)
img=np.clip(img*vig[...,None],0,255).astype(np.uint8)

fig,ax=newfig()
ax.imshow(img,extent=(0,W,H,0),interpolation='bilinear',zorder=0)
# rivers
r=json.load(open(f'{G}/geo-maps-earth-rivers-10m-0.6.0/package/map.geo.json'))
rv=[]
for g in r['geometries']:
    polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
    for p in polys:
        lons=[q[0] for q in p[0]]; lats=[q[1] for q in p[0]]
        if max(lons)<LON0-2 or min(lons)>LON1+2 or max(lats)<LAT0-2 or min(lats)>LAT1+2: continue
        rv.append(p[0])
rp=rings_path(rv)
ax.add_patch(PathPatch(rp,facecolor='#4FA9E8',edgecolor='#4FA9E8',lw=0.5,zorder=3,alpha=.95))
# country borders (white, thin)
for n,p in countries:
    ax.add_patch(PathPatch(p,facecolor='none',edgecolor=(1,1,1,.55),lw=0.9,zorder=4))
# state lines
for a,p,rings in states:
    ax.add_patch(PathPatch(p,facecolor='none',edgecolor=(1,1,1,.42 if a not in FOCUS else .85),lw=0.7 if a not in FOCUS else 1.1,zorder=5))
# focus outline glow
for a,p,_ in states:
    if a in FOCUS:
        ax.add_patch(PathPatch(p,facecolor='none',edgecolor=(1,1,1,.95),lw=1.4,zorder=6,
                     path_effects=[pe.Stroke(linewidth=3.2,foreground=(0,0,0,.25)),pe.Normal()]))
# coast highlight
for n,p in countries:
    if n=='Brazil': ax.add_patch(PathPatch(p,facecolor='none',edgecolor=(1,1,1,.9),lw=1.1,zorder=6))
# state labels
LBL_AMZ={'AM':(-64.6,-4.6),'PA':(-52.6,-5.2),'AC':(-70.4,-9.1),'RO':(-62.4,-11.2),'RR':(-61.3,2.0),'AP':(-51.9,1.2),'MT':(-55.5,-13.6),'TO':(-48.3,-10.5),'MA':(-45.2,-5.0)}
LBL = {'RS':(-53.3,-29.6),'SC':(-50.6,-27.2),'PR':(-51.6,-25.0),'SP':(-48.2,-23.6),'MS':(-55.2,-22.6)} if REGION=='sul' else LBL_AMZ if REGION=='amazonia' else {}
for a,(lo,la) in LBL.items():
    x,y=to_xy(lo,la)
    if not(0<x<W and 0<y<H): continue
    big=a in FOCUS
    ax.text(x,y,a,color='white' if big else (1,1,1,.7),fontsize=(58 if a in('AM','PA','RS') else 46 if REGION=='sul' else 42) if big else 30,fontweight='bold',
            ha='center',va='center',family='DejaVu Sans',zorder=8,
            path_effects=[pe.withStroke(linewidth=6,foreground=(0,0,0,.3))])
import tempfile
TMP=os.path.join(tempfile.gettempdir(),'arko_mapa_base.png')
fig.savefig(TMP,dpi=100)
im=Image.open(TMP).convert('RGB').resize((1492,1016),Image.LANCZOS)
im.save(A.saida,quality=84,optimize=True)
print('salvo:',A.saida)
print('limites para regions.ts:',json.dumps({'oeste':LON0,'leste':LON1,'norte':round(LAT1,4),'sul':round(LAT0,4)}))
