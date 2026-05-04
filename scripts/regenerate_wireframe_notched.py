#!/usr/bin/env python3
from __future__ import annotations
import math
import statistics
from pathlib import Path
from PIL import Image, ImageDraw

OUT_DIR = Path(__file__).resolve().parent
FRAMES = 15
SIZE = 44
SS = 4
BIG = SIZE * SS
LINE_W = 6
STEP_DEG = 24
ELEV_DEG = 30
SCALE = BIG * 0.35  # ~70% footprint
NOTCH_T = 0.30

# Base cube vertices
verts = {
    "nny": (-1.0, -1.0, -1.0),
    "nnp": (-1.0, -1.0, 1.0),
    "npn": (-1.0, 1.0, -1.0),
    "npp": (-1.0, 1.0, 1.0),
    "pnn": (1.0, -1.0, -1.0),
    "pnp": (1.0, -1.0, 1.0),
    "ppn": (1.0, 1.0, -1.0),
    "ppp": (1.0, 1.0, 1.0),
}

# Build notched geometry in model space (fixed notch at +++ corner)
V = "ppp"
neighbors = ["npp", "pnp", "ppn"]

mverts = dict(verts)
for i, nb in enumerate(neighbors):
    ax, ay, az = mverts[V]
    bx, by, bz = mverts[nb]
    mverts[f"r{i}"] = (
        ax + NOTCH_T * (bx - ax),
        ay + NOTCH_T * (by - ay),
        az + NOTCH_T * (bz - az),
    )

# 15 wireframe segments:
# 9 unchanged cube edges + 3 retracted edges at +++ + 3 notch triangle edges.
wire_edges = [
    ("nny", "nnp"),
    ("nny", "npn"),
    ("nny", "pnn"),
    ("nnp", "npp"),
    ("nnp", "pnp"),
    ("npn", "npp"),
    ("npn", "ppn"),
    ("pnn", "pnp"),
    ("pnn", "ppn"),
    ("ppp", "r0"),
    ("ppp", "r1"),
    ("ppp", "r2"),
    ("r0", "r1"),
    ("r1", "r2"),
    ("r2", "r0"),
]

def rot_y(p, a):
    x, y, z = p
    c, s = math.cos(a), math.sin(a)
    return (c * x + s * z, y, -s * x + c * z)

def rot_x(p, a):
    x, y, z = p
    c, s = math.cos(a), math.sin(a)
    return (x, c * y - s * z, s * y + c * z)

def render_frame(idx: int):
    yaw = math.radians(STEP_DEG * idx)
    elev = math.radians(ELEV_DEG)

    cam = {}
    for k, p in mverts.items():
        q = rot_y(p, yaw)
        q = rot_x(q, elev)
        cam[k] = q

    img = Image.new("RGBA", (BIG, BIG), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def proj(p):
        x, y, _ = p
        return (BIG / 2 + SCALE * x, BIG / 2 - SCALE * y)

    for a, b in wire_edges:
        d.line([proj(cam[a]), proj(cam[b])], fill=(0, 0, 0, 255), width=LINE_W)

    small = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    out = OUT_DIR / f"frame-{idx:02d}.png"
    small.save(out)


def alpha_count(path: Path) -> int:
    with Image.open(path) as im:
        a = im.split()[-1]
        return sum(1 for px in a.tobytes() if px > 0)


def main():
    for i in range(FRAMES):
        render_frame(i)

    files = [OUT_DIR / f"frame-{i:02d}.png" for i in range(FRAMES)]
    assert all(p.exists() for p in files), "missing output frame(s)"

    print("frame metrics:")
    alpha_counts = []
    for p in files:
        with Image.open(p) as im:
            w, h = im.size
            sz = p.stat().st_size
        ac = alpha_count(p)
        alpha_counts.append(ac)
        print(f"{p.name}: {w}x{h}, bytes={sz}, alpha>0={ac}")
        assert (w, h) == (44, 44), f"bad size {p.name}"
        assert sz > 0, f"zero-byte file {p.name}"
        assert ac > 0, f"all-transparent frame {p.name}"

    with Image.open(files[0]) as a, Image.open(files[-1]) as b:
        ab = a.split()[-1].tobytes()
        bb = b.split()[-1].tobytes()
        diff = sum(1 for pa, pb in zip(ab, bb) if pa != pb)
    print(f"frame-00 vs frame-14 differing pixels: {diff}")
    assert diff > 0, "frame-00 and frame-14 are identical"

    med = statistics.median(alpha_counts)
    stdev = statistics.pstdev(alpha_counts)
    max_dev = max(abs(v - med) for v in alpha_counts)
    print(f"alpha median={med:.1f}, stdev={stdev:.2f}, max_dev={max_dev:.1f}")
    assert max_dev <= med * 0.20, (
        f"alpha spread too large: max_dev={max_dev:.1f} > 20% of median ({med * 0.20:.1f})"
    )


if __name__ == "__main__":
    main()
