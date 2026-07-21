from pathlib import Path
from PIL import Image, ImageFilter

SOURCE = Path("icon.png")
OUTPUT = Path("public/assets/navigation")
OUTPUT.mkdir(parents=True, exist_ok=True)

# The source is a four-column contact sheet. These boxes stop above the labels.
BOXES = {
    "today": (22, 300, 350, 610),
    "services": (370, 300, 710, 610),
    "cases": (730, 270, 1090, 620),
    "review": (1145, 275, 1465, 615),
}


def extract_icon(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    crop = source.crop(box).convert("RGB")
    pixels = crop.load()
    width, height = crop.size
    alpha = Image.new("L", crop.size)
    alpha_pixels = alpha.load()
    background = crop.filter(ImageFilter.GaussianBlur(28))
    background_pixels = background.load()

    # Remove the large smooth gray field with a local low-frequency estimate.
    # The remaining high-frequency light/blue strokes are the painted icon.
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            br, bg, bb = background_pixels[x, y]
            detail = abs(r - br) * 0.35 + abs(g - bg) * 0.4 + abs(b - bb) * 0.25
            blue_signal = max(0.0, b - r - 3) * 0.45 + max(0.0, g - r - 2) * 0.2
            signal = detail + blue_signal
            alpha_pixels[x, y] = max(0, min(255, round((signal - 3.5) * 7.2)))

    alpha = alpha.point(lambda value: 0 if value < 82 else min(255, round((value - 82) * 2.15)))
    alpha_pixels = alpha.load()
    for y in range(height):
        for x in range(width):
            if x < 12 or x >= width - 12 or y < 18 or y >= height - 22:
                alpha_pixels[x, y] = 0
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.45))
    rgba = crop.convert("RGBA")
    rgba.putalpha(alpha)
    bounds = alpha.getbbox()
    if bounds:
        rgba = rgba.crop(bounds)

    canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    rgba.thumbnail((224, 224), Image.Resampling.LANCZOS)
    canvas.alpha_composite(rgba, ((256 - rgba.width) // 2, (256 - rgba.height) // 2))
    return canvas


source = Image.open(SOURCE)
for name, box in BOXES.items():
    extract_icon(source, box).save(OUTPUT / f"{name}.png", optimize=True)
