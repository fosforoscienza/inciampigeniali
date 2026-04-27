#!/usr/bin/env python3
"""Inciampi Geniali — desktop launcher.

Apre una finestra nativa che mostra la UI in `web/`.
"""

from __future__ import annotations

import os
import sys

import webview

ROOT = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(ROOT, "web")
ENTRY = os.path.join(WEB_DIR, "index.html")


def main() -> int:
    if not os.path.isfile(ENTRY):
        print(f"Errore: {ENTRY} non trovato.", file=sys.stderr)
        return 1

    webview.create_window(
        title="Inciampi Geniali",
        url=ENTRY,
        width=1280,
        height=800,
        min_size=(960, 600),
        resizable=True,
        confirm_close=False,
    )
    # http_server=True serve i file in locale via http://, evitando
    # le restrizioni che alcuni browser embedded applicano a file://
    webview.start(http_server=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
