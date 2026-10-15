# Generates the placeholder photos in /images. Replace any file with a real photo of the same name.
import math, random
from PIL import Image, ImageDraw, ImageFilter
def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def scene(name,w,h,sky,sun,hills,water=False,seed=1,sunpos=(0.7,0.45)):
    random.seed(seed); im=Image.new("RGB",(w,h)); d=ImageDraw.Draw(im)
    for y in range(h): d.line([(0,y),(w,y)],fill=lerp(sky[0],sky[1],y/h))
    sx,sy=int(w*sunpos[0]),int(h*sunpos[1]); glow=Image.new("RGB",(w,h),(0,0,0)); g=ImageDraw.Draw(glow)
    for r in range(int(h*.45),0,-6): g.ellipse([sx-r,sy-r,sx+r,sy+r],fill=lerp((0,0,0),sun,(1-r/(h*.45))**2*.8))
    im=Image.blend(im,Image.eval(Image.composite(im,im,Image.new("L",(w,h),255)),lambda v:v),0); 
    from PIL import ImageChops; im=ImageChops.add(im,glow); d=ImageDraw.Draw(im)
    d.ellipse([sx-h*.05,sy-h*.05,sx+h*.05,sy+h*.05],fill=lerp(sun,(255,250,235),.6))
    base=h*.55 if water else h*.5
    if water:
        for y in range(int(base),h):
            t=(y-base)/(h-base); d.line([(0,y),(w,y)],fill=lerp(hills[0],hills[-1],.4+t*.5))
        for i in range(60):
            y=random.randint(int(base),h-1); x=sx+random.randint(-int(w*.15),int(w*.15)); L=random.randint(20,120)
            d.line([(x-L//2,y),(x+L//2,y)],fill=lerp(sun,(255,245,225),.4),width=2)
    else:
        for i,c in enumerate(hills):
            f1,f2,ph=random.uniform(1,2.5),random.uniform(3,6),random.uniform(0,6)
            yb=base+i*h*.1; pts=[(0,h)]
            for x in range(0,w+8,8):
                pts.append((x,yb+math.sin(x/w*f1*6+ph)*h*.06+math.sin(x/w*f2*6+ph)*h*.02))
            pts.append((w,h)); d.polygon(pts,fill=c)
    im=im.filter(ImageFilter.GaussianBlur(1.2)); px=im.load()
    for _ in range(w*h//6):
        x,y=random.randrange(w),random.randrange(h); r,g_,b=px[x,y]; n=random.randint(-9,9); px[x,y]=(r+n,g_+n,b+n)
    im.save(f"images/{name}.jpg",quality=86)
S={'dawn':((246,214,180),(236,186,160)),'blue':((176,205,222),(240,226,205)),'dusk':((120,128,160),(238,178,140)),'mist':((196,212,206),(240,235,220)),'gold':((250,222,160),(232,176,120))}
G={'sage':[(150,168,140),(118,140,112),(84,108,88)],'earth':[(176,150,116),(140,118,92),(98,84,68)],'sea':[(120,150,160),(96,128,140),(70,100,116)],'dusk':[(120,110,130),(88,84,110),(60,62,88)]}
scene('hero-ocean',1800,1100,S['dawn'],(255,205,150),G['sea'],True,1,(.68,.46))
scene('chapter-before',1200,800,S['gold'],(255,220,150),G['earth'],False,2)
scene('chapter-mtc',1200,800,S['mist'],(255,240,200),G['sage'],False,3,(.3,.4))
scene('chapter-mission',1200,800,S['blue'],(255,235,190),G['sea'],True,4,(.5,.4))
scene('envelope',1200,800,S['gold'],(255,215,140),G['earth'],False,5,(.25,.35))
scene('packing',1200,800,S['dawn'],(255,200,160),G['sage'],False,6,(.8,.5))
scene('mtc-gate',1200,800,S['mist'],(255,235,190),G['sage'],False,7,(.6,.35))
scene('mtc-class',800,1100,S['blue'],(255,240,210),G['earth'],False,8,(.5,.3))
scene('mtc-walk',1200,800,S['dusk'],(255,190,150),G['dusk'],False,9,(.35,.5))
scene('mtc-garden',1200,800,S['mist'],(250,235,190),G['sage'],False,10,(.75,.4))
scene('arrival',1200,800,S['dawn'],(255,200,150),G['sea'],True,11,(.4,.45))
scene('market',1200,800,S['gold'],(255,225,160),G['earth'],False,12,(.55,.4))
scene('market-hills',800,1100,S['blue'],(255,235,190),G['sage'],False,13,(.3,.35))
scene('bus-ride',1200,800,S['dusk'],(255,195,150),G['dusk'],False,14,(.7,.5))
# author portrait placeholder
im=Image.new("RGB",(700,700),(226,220,204)); d=ImageDraw.Draw(im)
d.ellipse([230,130,470,370],fill=(176,168,148)); d.ellipse([110,400,590,900],fill=(176,168,148))
im.filter(ImageFilter.GaussianBlur(2)).save("images/author-placeholder.jpg",quality=86)
