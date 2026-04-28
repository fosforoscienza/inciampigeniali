#!/usr/bin/env python3
# -*- coding: utf-8 -*-
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


class Api:
    """API esposta al JavaScript via pywebview (window.pywebview.api)."""

    def __init__(self) -> None:
        self._window = None

    def set_window(self, window) -> None:
        self._window = window

    def toggle_fullscreen(self) -> None:
        if self._window is not None:
            self._window.toggle_fullscreen()


def main() -> int:
    if not os.path.isfile(ENTRY):
        print(f"Errore: {ENTRY} non trovato.", file=sys.stderr)
        return 1

    api = Api()
    window = webview.create_window(
        title="Inciampi Geniali",
        url=ENTRY,
        width=1280,
        height=800,
        min_size=(960, 600),
        resizable=True,
        confirm_close=False,
        js_api=api,
    )
    api.set_window(window)
    # http_server=True serve i file in locale via http://, evitando
    # le restrizioni che alcuni browser embedded applicano a file://
    webview.start(http_server=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
