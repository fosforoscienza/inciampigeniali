#!/usr/bin/env python3
"""Scarica i ritratti delle scoperte e li converte in stile schizzo.

Uso (dalla radice del progetto):
    python tools/portraits.py

Ingresso:  tools/discoveries-seed.json   (id, autore, URL Wikimedia, ecc.)
Uscita:    web/assets/photos/<id>.png    (immagine in stile disegno)

Lo stile va calibrato in `sketchify()` quando avremo le immagini di riferimento.
"""

from __future__ import annotations

import io
import json
import os
import sys
from pathlib import Path

import requests
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "tools" / "discoveries-seed.json"
OUT_DIR = ROOT / "web" / "assets" / "photos"

# Wikimedia richiede un User-Agent con contatto
HEADERS = {"User-Agent": "InciampiGeniali/1.0 (https://github.com/fosforoscienza/inciampigeniali)"}


def fetch_image(url: str) -> Image.Image:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return Image.open(io.BytesIO(resp.content)).convert("RGB")


def sketchify(img: Image.Image, *, blur_radius: int = 21) -> Image.Image:
    """Converte una foto in stile pencil-sketch.

    Tecnica classica color-dodge:
      sketch = grigio * 256 / (256 - blur(invert(grigio)))
    Lo stile finale verrà calibrato sui riferimenti dell'utente
    (linee a inchiostro su sfondo carta, in linea con il planisfero).
    """
    grey = img.convert("L")
    inverted = ImageOps.invert(grey)
    blurred = inverted.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    def dodge(g, b):
        # color-dodge: g * 255 / (255 - b)
        return min(255, int(g * 255 / max(1, 255 - b)))

    grey_pixels = grey.load()
    blur_pixels = blurred.load()
    out = Image.new("L", grey.size)
    out_pixels = out.load()
    w, h = grey.size
    for y in range(h):
        for x in range(w):
            out_pixels[x, y] = dodge(grey_pixels[x, y], blur_pixels[x, y])

    # tinta seppia/carta + inchiostro rosso scuro per restare in palette
    paper = Image.new("RGB", out.size, (246, 241, 231))
    ink = Image.new("RGB", out.size, (125, 29, 18))
    coloured = Image.composite(paper, ink, out)
    return coloured


def process(entry: dict) -> bool:
    pid = entry["id"]
    url = entry.get("wikimedia_image") or ""
    out_path = OUT_DIR / f"{pid}.png"
    if not url:
        print(f"  [skip] {pid}: nessun URL")
        return False
    if out_path.exists():
        print(f"  [skip] {pid}: già presente ({out_path.name})")
        return True
    try:
        print(f"  [get ] {pid}  <-  {url}")
        img = fetch_image(url)
    except Exception as e:
        print(f"  [err ] {pid}: download fallito ({e})")
        return False
    try:
        sketched = sketchify(img)
        sketched.save(out_path, format="PNG")
        print(f"  [ok  ] {pid}  ->  {out_path}")
        return True
    except Exception as e:
        print(f"  [err ] {pid}: conversione fallita ({e})")
        return False


def main() -> int:
    if not SEED.is_file():
        print(f"Seed non trovato: {SEED}", file=sys.stderr)
        return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with SEED.open(encoding="utf-8") as f:
        seed = json.load(f)
    ok = 0
    for entry in seed:
        if process(entry):
            ok += 1
    print(f"\nFatto: {ok}/{len(seed)} ritratti elaborati. Output in {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
