// Router minimale + tasti globali.
// Schermate: "presentation", "map", "globe".
// Flusso: slide 1..(N-1) → map → globe → slide finale (N)
//
// Tasti globali:
//   F  → fullscreen (pywebview se disponibile, altrimenti API browser)
//   B  → overlay nero (utile per "spegnere" lo schermo durante una pausa)
//   M  → salta direttamente alla mappa
//   G  → salta direttamente al globo

(function() {
  var SCREENS = ["presentation", "map", "globe"];
  var current = "presentation";

  function show(route) {
    if (SCREENS.indexOf(route) === -1) return;
    for (var i = 0; i < SCREENS.length; i++) {
      var el = document.querySelector('[data-screen="' + SCREENS[i] + '"]');
      if (!el) continue;
      el.hidden = SCREENS[i] !== route;
    }
    current = route;
    if (route === "map")   { window.Pins  && window.Pins.ensure(); }
    if (route === "globe") { window.Globe && window.Globe.ensure(); }
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

  function toggleChrome() {
    var chrome = document.getElementById("deck-chrome");
    if (!chrome) return;
    chrome.hidden = !chrome.hidden;
  }

  var toggleBtn = document.getElementById("deck-chrome-toggle");
  if (toggleBtn) toggleBtn.addEventListener("click", toggleChrome);

  document.addEventListener("click", function(e) {
    var route = e.target.closest("[data-route]");
    if (route) show(route.dataset.route);
  });

  // "Fine" sulla mappa → salta direttamente alla slide finale
  var mapFineBtn = document.getElementById("map-btn-fine");
  if (mapFineBtn) {
    mapFineBtn.addEventListener("click", function() {
      window.Slides && window.Slides.goToEnd();
      show("presentation");
    });
  }

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
    if (e.key === "G" || e.key === "g") {
      e.preventDefault();
      if (current !== "globe") show("globe");
      return;
    }

    var back = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "Escape"];
    var fwd  = ["ArrowRight", "ArrowDown", "PageDown", " "];

    // Sulla mappa: back → slide penultima, forward → globo
    if (current === "map") {
      if (back.indexOf(e.key) !== -1) {
        e.preventDefault();
        window.Slides && window.Slides.backFromMap();
        show("presentation");
      } else if (fwd.indexOf(e.key) !== -1) {
        e.preventDefault();
        show("globe");
      }
      return;
    }

    // Sul globo: back → mappa, forward → slide finale
    if (current === "globe") {
      if (back.indexOf(e.key) !== -1) {
        e.preventDefault();
        show("map");
      } else if (fwd.indexOf(e.key) !== -1) {
        e.preventDefault();
        window.Slides && window.Slides.goToEnd();
        show("presentation");
      }
      return;
    }
  });

  window.App = {
    show: show,
    current: function() { return current; },
  };
})();
