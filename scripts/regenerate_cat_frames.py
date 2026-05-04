#!/usr/bin/env python3
from __future__ import annotations

import math
from pathlib import Path
from PIL import Image, ImageFilter

SOURCE = Path('/Users/ys/Code/tokcat/scripts/cat-source.png')
OUT_DIR = Path('/Users/ys/Code/tokcat/src-tauri/icons/anim-cat')

FRAME_COUNT = 15
FRAME_SIZE = 44
SUPERSAMPLE = 4
HIGH_SIZE = FRAME_SIZE * SUPERSAMPLE  # 176
TARGET_W = 38
TARGET_H = 36
TARGET_W_HI = TARGET_W * SUPERSAMPLE
TARGET_H_HI = TARGET_H * SUPERSAMPLE
BOTTOM_Y = 42
BOTTOM_Y_HI = BOTTOM_Y * SUPERSAMPLE
THRESHOLD = 128
MIN_SCALE = 0.06


def extract_silhouette(src: Image.Image) -> Image.Image:
    gray = src.convert('L')
    # Dark-on-light segmentation.
    mask = gray.point(lambda p: 255 if p < THRESHOLD else 0, mode='L')

    # Mild denoise: open then close in 3x3 neighborhood.
    mask = mask.filter(ImageFilter.MinFilter(3))
    mask = mask.filter(ImageFilter.MaxFilter(3))
    mask = mask.filter(ImageFilter.MaxFilter(3))
    mask = mask.filter(ImageFilter.MinFilter(3))

    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError('No silhouette pixels found after thresholding.')
    return mask.crop(bbox)


def fit_silhouette(mask_cropped: Image.Image) -> Image.Image:
    w, h = mask_cropped.size
    if w <= 0 or h <= 0:
        raise RuntimeError('Invalid silhouette crop size.')

    scale = min(TARGET_W_HI / w, TARGET_H_HI / h)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    return mask_cropped.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)


def render_frame(base_fit: Image.Image, frame_index: int) -> Image.Image:
    degrees = frame_index * 24.0
    theta_rad = math.radians(degrees)
    scale = max(MIN_SCALE, abs(math.cos(theta_rad)))
    theta_mod = degrees % 360.0
    mirror = 90.0 <= theta_mod < 270.0

    src = base_fit.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if mirror else base_fit
    src_w, src_h = src.size
    out_w = max(1, int(round(src_w * scale)))
    squashed = src.resize((out_w, src_h), resample=Image.Resampling.LANCZOS)

    alpha_hi = Image.new('L', (HIGH_SIZE, HIGH_SIZE), 0)
    x = (HIGH_SIZE - out_w) // 2
    y = BOTTOM_Y_HI - src_h + 1
    alpha_hi.paste(squashed, (x, y), squashed)

    rgba_hi = Image.new('RGBA', (HIGH_SIZE, HIGH_SIZE), (0, 0, 0, 0))
    rgba_hi.putalpha(alpha_hi)
    frame = rgba_hi.resize((FRAME_SIZE, FRAME_SIZE), resample=Image.Resampling.LANCZOS)
    return frame


def alpha_count(im: Image.Image) -> int:
    a_bytes = im.getchannel('A').tobytes()
    return sum(1 for v in a_bytes if v > 0)


def alpha_bbox_metrics(im: Image.Image) -> tuple[int, int]:
    bbox = im.getchannel('A').getbbox()
    if not bbox:
        return (0, -1)
    left, _top, right, bottom_exclusive = bbox
    width = right - left
    bottom_y = bottom_exclusive - 1
    return (width, bottom_y)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    src = Image.open(SOURCE)
    silhouette = extract_silhouette(src)
    base_fit = fit_silhouette(silhouette)

    counts: list[int] = []
    metrics: list[tuple[int, int]] = []
    for i in range(FRAME_COUNT):
        frame = render_frame(base_fit, i)
        out_path = OUT_DIR / f'frame-{i:02d}.png'
        frame.save(out_path, format='PNG')
        counts.append(alpha_count(frame))
        metrics.append(alpha_bbox_metrics(frame))

    print(f'Generated {FRAME_COUNT} frames in {OUT_DIR}')
    print('Alpha pixel counts:')
    for i, c in enumerate(counts):
        print(f'  frame-{i:02d}.png: {c}')

    avg = sum(counts) / len(counts)
    lo = min(counts)
    hi = max(counts)
    var_pct = ((hi - lo) / avg * 100.0) if avg else 0.0
    print(f'Min={lo}, Max={hi}, Avg={avg:.2f}, Span={var_pct:.2f}%')
    print('Per-frame (width, bottom_y):')
    for i, (w, by) in enumerate(metrics):
        print(f'  frame-{i:02d}.png: ({w}, {by})')


if __name__ == '__main__':
    main()
