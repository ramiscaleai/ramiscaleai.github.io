from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist' / 'assets' / 'og-card.png'
W, H = 1200, 630

img = Image.new('RGB', (W, H))
pix = img.load()
for y in range(H):
    for x in range(W):
        glow = max(0, 1 - (((x - 230) / 680) ** 2 + ((y - 320) / 580) ** 2) ** .5)
        pix[x, y] = (int(28 + 60 * glow), int(21 + 36 * glow), int(48 + 97 * glow))

layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
for r, alpha in [(320, 65), (245, 90), (165, 120)]:
    d.ellipse((155-r, 315-r, 155+r, 315+r), outline=(200, 164, 255, alpha), width=2)
for x in range(65, 430, 29):
    for y in range(70, 595, 29):
        d.ellipse((x, y, x+2, y+2), fill=(203, 178, 255, 55))
img = Image.alpha_composite(img.convert('RGBA'), layer)
d = ImageDraw.Draw(img)

font_path = '/home/rami/.local/share/fonts/loopworks-hebrew/Rubik[wght].ttf'
name_font = ImageFont.truetype(font_path, 39)
head_font = ImageFont.truetype(font_path, 75)
small_font = ImageFont.truetype(font_path, 27)
latin_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)

d.rounded_rectangle((1058, 61, 1136, 139), radius=22, fill=(112, 69, 211))
d.line([(1080, 87), (1110, 87), (1110, 115)], fill='white', width=8, joint='curve')
d.ellipse((1077, 111, 1086, 120), fill=(217, 199, 255))
d.line([(1082, 116), (1095, 103)], fill=(217, 199, 255), width=4)
d.ellipse((1091, 99, 1099, 107), fill='white')

d.text((1030, 73), 'רמי חירסונסקי', font=name_font, fill=(249, 247, 255), anchor='ra', direction='rtl')
d.text((1116, 209), 'פתרונות AI ואוטומציה לעסקים', font=small_font, fill=(198, 171, 255), anchor='ra', direction='rtl')
d.text((1116, 273), 'רעיונות טובים.', font=head_font, fill=(255, 255, 255), anchor='ra', direction='rtl')
d.text((1116, 371), 'מערכות שעובדות.', font=head_font, fill=(205, 177, 255), anchor='ra', direction='rtl')
d.rounded_rectangle((794, 516, 1136, 562), radius=23, fill=(112, 69, 211))
d.text((1107, 527), 'בוטים · תוכן · אוטומציה', font=small_font, fill='white', anchor='ra', direction='rtl')
d.text((67, 553), 'AI  /  AUTOMATION', font=latin_font, fill=(206, 184, 244))

OUT.parent.mkdir(parents=True, exist_ok=True)
img.convert('RGB').save(OUT, quality=90, optimize=True)
print(OUT)
