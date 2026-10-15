# Generates flat, illustrated SAMPLE images (not real photos) into /images. Replace any with real photos of the same name.
import random
from PIL import Image, ImageDraw, ImageFilter
def L(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def new(w,h,top,bot):
    im=Image.new("RGB",(w,h)); d=ImageDraw.Draw(im)
    for y in range(h): d.line([(0,y),(w,y)],fill=L(top,bot,y/h))
    return im,d
def save(im,name):
    random.seed(3); px=im.filter(ImageFilter.GaussianBlur(.8)).load(); w,h=im.size; o=im.filter(ImageFilter.GaussianBlur(.8))
    for _ in range(w*h//7):
        x,y=random.randrange(w),random.randrange(h); r,g,b=px[x,y]; n=random.randint(-8,8); px[x,y]=(r+n,g+n,b+n)
    o.save(f"images/{name}.jpg",quality=86)
CREAM=(247,240,222);SAGE=(125,143,114);DSAGE=(86,103,73);SAND=(217,201,168);WOOD=(190,152,110);BLUE=(150,184,198);CLAY=(196,140,110);INK=(70,62,54);SUN=(250,214,140)
W,H=1200,800
# envelope on a wooden table
im,d=new(W,H,WOOD,(170,132,92))
for y in range(0,H,60): d.line([(0,y),(W,y+10)],fill=(165,128,90),width=3)
d.rounded_rectangle([300,230,900,600],14,fill=CREAM,outline=SAND,width=4)
d.polygon([(300,240),(900,240),(600,470)],fill=(238,229,206),outline=SAND)
d.ellipse([565,420,635,490],fill=CLAY); d.ellipse([240,560,380,700],fill=(250,248,240),outline=SAND,width=5); d.ellipse([260,575,360,625],fill=(150,100,70))
save(im,'envelope')
# suitcase
im,d=new(W,H,(236,228,208),(214,200,170)); d.rectangle([0,600,W,H],fill=(200,184,150))
d.rounded_rectangle([380,260,820,640],30,fill=SAGE,outline=DSAGE,width=6); d.arc([500,170,700,330],180,360,fill=INK,width=14)
for x in (470,730): d.rectangle([x,260,x+26,640],fill=DSAGE)
d.rounded_rectangle([560,430,640,470],8,fill=SAND); d.rounded_rectangle([230,500,370,640],14,fill=CLAY); d.rectangle([230,540,370,560],fill=CREAM)
save(im,'packing')
# training center entrance
im,d=new(W,H,(190,214,224),(240,232,210)); d.rectangle([0,620,W,H],fill=(170,186,150))
d.rectangle([250,300,950,620],fill=(236,224,196),outline=SAND,width=4); d.polygon([(220,300),(600,170),(980,300)],fill=CLAY)
d.rectangle([540,420,660,620],fill=DSAGE); d.pieslice([540,370,660,470],180,360,fill=DSAGE)
for x in (320,420,720,820): d.rectangle([x,380,x+60,470],fill=BLUE,outline=SAND,width=4)
for x,s in ((130,1),(1070,1)): d.rectangle([x-8,500,x+8,640],fill=(120,90,60)); d.ellipse([x-80,360,x+80,540],fill=SAGE)
save(im,'mtc-gate')
# classroom window (portrait)
im,d=new(800,1100,(224,214,190),(205,190,160)); d.rectangle([140,120,660,600],fill=BLUE,outline=WOOD,width=18)
for y in range(120,600,40): d.line([(150,y),(650,y)],fill=L(BLUE,CREAM,.2))
d.ellipse([480,200,560,280],fill=SUN); d.ellipse([200,430,480,700],fill=SAGE); d.line([(400,120),(400,600)],fill=WOOD,width=14); d.line([(140,360),(660,360)],fill=WOOD,width=14)
d.rectangle([60,760,740,820],fill=WOOD); d.rectangle([100,820,130,1100],fill=WOOD); d.rectangle([670,820,700,1100],fill=WOOD)
for i,c in enumerate((DSAGE,CLAY,SAND)): d.rectangle([230,700-i*34,470,734-i*34],fill=c)
d.rectangle([520,700,600,760],fill=CREAM,outline=INK,width=3)
save(im,'mtc-class')
# garden path with flowers
im,d=new(W,H,(206,224,214),(176,198,160)); d.polygon([(520,800),(680,800),(640,430),(560,430)],fill=SAND)
random.seed(8)
for _ in range(70):
    x=random.choice([random.randint(40,500),random.randint(700,1160)]); y=random.randint(430,780); r=6+int((y-430)/22)
    d.line([(x,y),(x,y+r*3)],fill=DSAGE,width=3); d.ellipse([x-r,y-r,x+r,y+r],fill=random.choice([CLAY,SUN,(235,190,200),CREAM]))
d.rectangle([0,380,W,440],fill=SAGE); 
for x in range(0,W,120): d.ellipse([x,330,x+150,450],fill=DSAGE)
save(im,'mtc-garden')
# dusk walk with lamp posts
im,d=new(W,H,(112,120,156),(240,180,150)); d.polygon([(0,H),(W,H),(W,560),(0,560)],fill=(82,88,110)); d.polygon([(480,H),(720,H),(620,520),(580,520)],fill=(196,170,150))
for x,s in ((140,1.2),(300,.9),(900,1),(1050,1.3)): d.rectangle([x-8,380,x+8,620],fill=(60,64,84)); d.ellipse([x-90*s,200,x+90*s,420],fill=(70,86,96))
for x,y in ((470,430),(730,430)): d.rectangle([x-4,y,x+4,y+150],fill=INK); d.ellipse([x-22,y-30,x+22,y+8],fill=(255,226,160))
save(im,'mtc-walk')
# arrival: plane over sea, palms
im,d=new(W,H,(244,214,186),(250,236,214)); d.rectangle([0,470,W,H],fill=BLUE); d.rectangle([0,640,W,H],fill=SAND)
d.ellipse([800,140,900,240],fill=SUN); d.ellipse([200,190,420,235],fill=CREAM); d.polygon([(260,215),(180,150),(210,150),(300,205)],fill=SAND)
for x,y in ((900,640),(1040,660)):
    d.line([(x,y),(x-20,y-230)],fill=(120,90,60),width=16)
    for a in range(-3,4): d.line([(x-20,y-230),(x-20+a*55,y-230+abs(a)*30)],fill=DSAGE,width=10)
for y in range(500,640,28): d.line([(100,y),(220,y)],fill=L(BLUE,CREAM,.6),width=4)
save(im,'arrival')
# market stalls
im,d=new(W,H,(250,232,196),(240,218,176))
for i,x in enumerate((90,430,770)):
    c=(CLAY,SAGE,SUN)[i]
    for k in range(6): d.polygon([(x+k*55,200),(x+k*55+55,200),(x+k*55+60,300),(x+k*55-5,300)],fill=c if k%2==0 else CREAM)
    d.rectangle([x,300,x+330,640],fill=(220,196,150)); d.rectangle([x,470,x+330,520],fill=WOOD)
    for j in range(6):
        for r in range(3): d.ellipse([x+14+j*52,420-r*8,x+54+j*52,460-r*8],fill=(CLAY,SUN,DSAGE)[(i+j+r)%3])
save(im,'market')
# village on hills (portrait)
im,d=new(800,1100,(190,214,228),(246,234,210)); d.ellipse([-200,520,900,1500],fill=(166,184,142)); d.ellipse([200,700,1100,1500],fill=SAGE)
random.seed(5)
for _ in range(16):
    x,y=random.randint(80,680),random.randint(620,1000); w=random.randint(60,95)
    d.rectangle([x,y,x+w,y+w*.8],fill=random.choice([CREAM,SAND,(236,205,170)])); d.polygon([(x-8,y),(x+w/2,y-w*.45),(x+w+8,y)],fill=CLAY)
d.ellipse([560,140,660,240],fill=SUN)
save(im,'market-hills')
# bus on a long road
im,d=new(W,H,(236,176,150),(246,222,190)); d.ellipse([-100,420,700,900],fill=(150,126,138)); d.ellipse([500,460,1400,900],fill=(120,104,128)); d.rectangle([0,560,W,H],fill=(96,88,96))
d.rectangle([0,660,W,670],fill=SAND); d.rounded_rectangle([250,340,900,620],36,fill=SAGE,outline=DSAGE,width=5)
for x in range(300,860,110): d.rounded_rectangle([x,380,x+84,460],10,fill=(206,226,232))
d.rectangle([250,490,900,520],fill=CREAM)
for x in (360,780): d.ellipse([x-48,570,x+48,666],fill=INK); d.ellipse([x-20,598,x+20,638],fill=SAND)
save(im,'bus-ride')
