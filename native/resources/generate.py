# Generates store-app icons and launch screens from the original app artwork (requires Pillow).
# Run from anywhere: python3 native/resources/generate.py
from pathlib import Path
from PIL import Image

native = Path(__file__).resolve().parent.parent
art = Image.open(native.parent / 'icons' / 'vible-walking-book.png').convert('RGB')
paper = (0xf4, 0xf1, 0xe9)

def icon(size):
    return art.resize((size, size), Image.LANCZOS)

def splash(width, height, mark):
    canvas = Image.new('RGB', (width, height), paper)
    canvas.paste(icon(mark), ((width - mark) // 2, (height - mark) // 2))
    return canvas

def save(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)

save(icon(1024), native / 'resources' / 'icon.png')

ios = native / 'ios' / 'App' / 'App' / 'Assets.xcassets'
if ios.exists():
    save(icon(1024), ios / 'AppIcon.appiconset' / 'AppIcon-512@2x.png')
    for name in ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']:
        save(splash(2732, 2732, 560), ios / 'Splash.imageset' / name)

android = native / 'android' / 'app' / 'src' / 'main' / 'res'
if android.exists():
    for density, scale in {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}.items():
        folder = android / f'mipmap-{density}'
        save(icon(round(48 * scale)), folder / 'ic_launcher.png')
        save(icon(round(48 * scale)), folder / 'ic_launcher_round.png')
        # Adaptive icon foreground: artwork inside the 66% safe zone of a 108dp canvas.
        size = round(108 * scale)
        layer = Image.new('RGB', (size, size), (0x28, 0x3c, 0x34))
        inner = round(size * 0.66)
        layer.paste(icon(inner), ((size - inner) // 2, (size - inner) // 2))
        save(layer, folder / 'ic_launcher_foreground.png')
    for folder in android.glob('drawable*'):
        target = folder / 'splash.png'
        if target.exists():
            width, height = Image.open(target).size
            save(splash(width, height, min(width, height) // 3), target)

desktop = native / 'desktop' / 'src-tauri' / 'icons'
if desktop.exists():
    for size in [32, 128, 256, 512]:
        save(icon(size), desktop / f'{size}x{size}.png')
    save(icon(256), desktop / '128x128@2x.png')
    save(icon(1024), desktop / 'icon.png')
print('Icons and launch screens generated.')
