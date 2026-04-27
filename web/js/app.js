// Router + tasti globali (Esc, F, 1, 2)

(() => {
  const SCREENS = ["menu", "presentation", "map"];
  let current = "menu";

  function show(route) {
    if (!SCREENS.includes(route)) return;
    SCREENS.forEach((r) => {
      const el = document.querySelector(`[data-screen="${r}"]`);
      if (!el) return;
      el.hidden = r !== route;
    });
    current = route;

    if (route === "presentation") {
      window.Slides && window.Slides.activate();
    } else {
      window.Slides && window.Slides.deactivate();
    }
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

  // Bindings: tessere del menu + bottoni "Torna al menu"
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-route]");
    if (btn) {
      show(btn.dataset.route);
    }
  });

  // Tasti globali
  document.addEventListener("keydown", (e) => {
    // Non rubare i tasti se l'utente sta scrivendo
    const tag = (e.target && e.target.tagName) || "";
    if (["INPUT", "TEXTAREA"].includes(tag)) return;

    if (e.key === "F" || e.key === "f") {
      toggleFullscreen();
      e.preventDefault();
      return;
    }
    if (current === "menu") {
      if (e.key === "1") show("presentation");
      if (e.key === "2") show("map");
    }
    if (e.key === "Escape") {
      // dalle sezioni si torna al menu
      if (current !== "menu") show("menu");
    }
  });

  // Espone show() per debug
  window.App = { show };

  // Default: mostra menu
  show("menu");
})();
