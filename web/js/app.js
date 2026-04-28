// Router minimale + tasti globali.
// Schermate: "presentation" e "map". L'app parte sulle slide,
// la mappa è la sezione centrale, raggiunta dopo la slide 26.
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
      const el = document.querySelector('[data-screen="' + r + '"]');
      if (!el) return;
      el.hidden = r !== route;
    });
    current = route;
    if (route === "map") {
      window.Pins && window.Pins.ensure();
    }
  }

  function toggleFullscreen() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.toggle_fullscreen) {
      window.pywebview.api.toggle_fullscreen();
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  }

  function toggleBlack() {
    var el = document.getElementById("black-overlay");
    if (!el) return;
    el.hidden = !el.hidden;
  }

  // Toggle barra comandi (tasto C nella presentazione, pulsante "Comandi")
  function toggleChrome() {
    var chrome = document.getElementById("deck-chrome");
    if (!chrome) return;
    chrome.hidden = !chrome.hidden;
  }

  var toggleBtn = document.getElementById("deck-chrome-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleChrome);
  }

  // Bottoni con data-route="..."
  document.addEventListener("click", function(e) {
    var route = e.target.closest("[data-route]");
    if (route) show(route.dataset.route);
  });

  // Pulsante "Fine" sulla mappa → slide 27
  var finBtn = document.getElementById("map-btn-fine");
  if (finBtn) {
    finBtn.addEventListener("click", function() {
      window.Slides && window.Slides.goToEnd();
      show("presentation");
    });
  }

  // Tasti globali
  document.addEventListener("keydown", function(e) {
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;

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

    // Sulla mappa: back → slide 26, forward → slide 27
    if (current === "map") {
      var back = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "Escape"];
      var fwd  = ["ArrowRight", "ArrowDown", "PageDown", " "];
      if (back.indexOf(e.key) !== -1) {
        e.preventDefault();
        window.Slides && window.Slides.backFromMap();
        show("presentation");
      } else if (fwd.indexOf(e.key) !== -1) {
        e.preventDefault();
        window.Slides && window.Slides.goToEnd();
        show("presentation");
      }
    }
  });

  window.App = {
    show: show,
    current: function() { return current; },
  };
})();
