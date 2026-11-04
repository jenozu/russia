from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "assets" / "images"
OUT.mkdir(parents=True, exist_ok=True)

PINK = "#FFD8E8"
CYAN = "#9BE9FB"
BLACK = "#000000"
WHITE = "#FFFFFF"
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
]
FONT_PATH = next((p for p in FONT_CANDIDATES if Path(p).exists()), None)

def draw_mark(size: int, background: str = PINK) -> Image.Image:
    img = Image.new("RGBA", (size, size), background)
    draw = ImageDraw.Draw(img)
    margin = max(16, size // 9)
    border = max(8, size // 30)
    shadow = max(8, size // 18)
    box = (margin, margin, size - margin, size - margin)
    shadow_box = (margin + shadow, margin + shadow, size - margin + shadow, size - margin + shadow)
    draw.rounded_rectangle(shadow_box, radius=size // 8, fill=BLACK)
    draw.rounded_rectangle(box, radius=size // 8, fill=CYAN, outline=BLACK, width=border)
    font_size = int(size * 0.56)
    font = ImageFont.truetype(FONT_PATH, font_size) if FONT_PATH else None
    glyph = "Я"
    bounds = draw.textbbox((0, 0), glyph, font=font)
    x = (size - (bounds[2] - bounds[0])) / 2 - bounds[0]
    y = (size - (bounds[3] - bounds[1])) / 2 - bounds[1] - size * 0.02
    draw.text((x, y), glyph, font=font, fill=BLACK)
    return img

for filename, size, background in [
    ("icon.png", 1024, PINK),
    ("favicon.png", 256, PINK),
    ("android-icon-foreground.png", 1024, PINK),
    ("android-icon-monochrome.png", 1024, WHITE),
]:
    draw_mark(size, background).save(OUT / filename)

draw_mark(1024, WHITE).save(OUT / "splash-icon.png")
