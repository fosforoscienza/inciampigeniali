// Router minimale + tasti globali.
// Schermate: "presentation" e "map". L'app parte sulle slide,
// la mappa è la sezione finale, raggiunta dopo l'ultima slide.

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
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // Bottoni con data-route="..."
  document.addEventListener("click", (e) => {
    const route = e.target.closest("[data-route]");
    if (route) show(route.dataset.route);
  });

  // Tasti globali (F per fullscreen sempre, frecce gestite altrove)
  document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (["INPUT", "TEXTAREA"].includes(tag)) return;

    if (e.key === "F" || e.key === "f") {
      toggleFullscreen();
      e.preventDefault();
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
