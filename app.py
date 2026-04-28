#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Inciampi Geniali — desktop launcher.

Apre una finestra nativa che mostra la UI in `web/`.
"""

import os
import sys

import webview

ROOT = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(ROOT, "web")
ENTRY = os.path.join(WEB_DIR, "index.html")


class Api(object):
    """API esposta al JavaScript via pywebview (window.pywebview.api)."""

    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def toggle_fullscreen(self):
        if self._window is not None:
            self._window.toggle_fullscreen()


def main():
    if not os.path.isfile(ENTRY):
        sys.stderr.write("Errore: {} non trovato.\n".format(ENTRY))
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
    webview.start(http_server=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
