// Router minimale + tasti globali.
// Schermate: "presentation" e "map". L'app parte sulle slide,
// la mappa è la sezione finale, raggiunta dopo l'ultima slide.
//
// Tasti globali:
//   F  → fullscreen (pywebview se disponibile, altrimenti API browser)
//   B  → overlay nero (utile per "spegnere" lo schermo durante una pausa)
//   M  → salta direttamente alla mappa

(() => {
  const SCREENS = ["presentation", "map"];
  let current = "presentation";

  function show(route) {
    if (!SCREENS.includes(route)) return;
    SCREENS.forEach((r) => {
      const el = document.querySelector(`[data-screen="${r}"]`);
      if (!el) return;
      el.hidden = r !== route;
    });
    current = route;
    if (route === "map") {
      window.Pins && window.Pins.ensure();
    }
  }

  function toggleFullscreen() {
    // In pywebview usa l'API nativa esposta da Python (toggle_fullscreen):
    // requestFullscreen del browser non è affidabile dentro la WebView.
    if (window.pywebview && window.pywebview.api && window.pywebview.api.toggle_fullscreen) {
      window.pywebview.api.toggle_fullscreen();
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function toggleBlack() {
    const el = document.getElementById("black-overlay");
    if (!el) return;
    el.hidden = !el.hidden;
  }

  // Bottoni con data-route="..."
  document.addEventListener("click", (e) => {
    const route = e.target.closest("[data-route]");
    if (route) show(route.dataset.route);
  });

  // Tasti globali (F, B, M sempre attivi; frecce gestite altrove)
  document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (["INPUT", "TEXTAREA"].includes(tag)) return;

    if (e.key === "F" || e.key === "f") {
      e.preventDefault();
      toggleFullscreen();
      return;
    }
    if (e.key === "B" || e.key === "b" || e.key === ".") {
      e.preventDefault();
      toggleBlack();
      return;
    }
    if (e.key === "M" || e.key === "m") {
      e.preventDefault();
      if (current !== "map") show("map");
      return;
    }
    // Sulla mappa: frecce indietro tornano all'ultima slide.
    // (Il modal e la modalità calibrazione gestiscono Esc per conto loro
    //  con stopImmediatePropagation, quindi non tornano alle slide.)
    if (current === "map") {
      const back = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "Escape"];
      if (back.includes(e.key)) {
        e.preventDefault();
        window.Slides && window.Slides.backFromMap();
        show("presentation");
      }
    }
  });

  window.App = {
    show,
    current: () => current,
  };
})();
