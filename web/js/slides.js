// Logica deck di slide: PNG a tutta pagina, navigazione a 3 sezioni.
//
// Struttura:
//   Sezione 1: slide 01..26  (indici 0..24)
//   Sezione 2: mappa         (gestita da app.js / map.js)
//   Sezione 3: slide 27      (indice 25, l'ultima)
//
// Tasti gestiti (compatibili con presenter Bluetooth standard):
//   Avanti:   ArrowRight, ArrowDown, PageDown, Space
//   Indietro: ArrowLeft,  ArrowUp,   PageUp
//   Home/End: prima / ultima slide
// (F per fullscreen, B per black, M per mappa sono gestiti in app.js)

(function() {
  var SLIDE_COUNT = 27;
  var SLIDES = [];
  for (var i = 0; i < SLIDE_COUNT; i++) {
    var n = i + 1;
    var id = n < 10 ? "0" + n : String(n);
    SLIDES.push({ num: n, id: id, title: "Slide " + n, img: "assets/slides/" + id + ".png" });
  }

  // Indice dell'ultima slide della sezione 1 (slide 26 = indice 25)
  var LAST_SECTION1 = SLIDE_COUNT - 2;  // 25
  // Indice della slide finale, sezione 3 (slide 27 = indice 26)
  var LAST_SLIDE    = SLIDE_COUNT - 1;  // 26

  var currentIndex = 0;
  var loaded = false;

  var deckEl        = document.getElementById("deck");
  var slideCurrentEl = document.getElementById("slide-current");
  var slideTotalEl   = document.getElementById("slide-total");

  function buildSlides() {
    if (loaded) return;
    slideTotalEl.textContent = String(SLIDES.length);
    for (var i = 0; i < SLIDES.length; i++) {
      (function(s, idx) {
        var el = document.createElement("section");
        el.className = "slide";
        el.dataset.index = String(idx);

        var img = document.createElement("img");
        img.className = "slide__img";
        img.src = s.img;
        img.alt = s.title;
        img.onerror = function() {
          img.parentNode && img.parentNode.removeChild(img);
          var ph = document.createElement("div");
          ph.className = "slide__placeholder";
          ph.innerHTML =
            '<span class="slide__placeholder-id">' + s.id + '</span>' +
            '<span class="slide__placeholder-title">' + s.title + '</span>' +
            '<span class="slide__placeholder-hint">PNG da caricare in <code>web/' + s.img + '</code></span>';
          el.appendChild(ph);
        };
        el.appendChild(img);
        deckEl.appendChild(el);
      })(SLIDES[i], i);
    }
    loaded = true;
    renderActive();
  }

  function renderActive() {
    var slides = deckEl.querySelectorAll(".slide");
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var wasActive = s.dataset.active === "true";
      if (i === currentIndex) {
        s.dataset.active = "true";
        s.dataset.leaving = "false";
      } else {
        s.dataset.active = "false";
        if (wasActive) {
          // Slide appena lasciata: in dissolvenza sopra la nuova
          s.dataset.leaving = "true";
          (function(slide) {
            setTimeout(function() {
              if (slide.dataset.active === "false") {
                slide.dataset.leaving = "false";
              }
            }, 400);
          })(s);
        }
      }
    }
    slideCurrentEl.textContent = String(currentIndex + 1);
  }

  // Avanti:
  //   - slide 1..25  → slide successiva
  //   - slide 26 (LAST_SECTION1) → mappa
  //   - slide 27 (LAST_SLIDE)    → niente (fine)
  function next() {
    if (currentIndex === LAST_SECTION1) {
      window.App && window.App.show("map");
      return;
    }
    if (currentIndex < LAST_SLIDE) {
      currentIndex++;
      renderActive();
    }
  }

  // Indietro:
  //   - slide 27 (LAST_SLIDE) → mappa
  //   - slide 1..26           → slide precedente
  function prev() {
    if (currentIndex === LAST_SLIDE) {
      window.App && window.App.show("map");
      return;
    }
    if (currentIndex > 0) {
      currentIndex--;
      renderActive();
    }
  }

  function gotoFirst() {
    currentIndex = 0;
    renderActive();
  }

  function gotoLast() {
    currentIndex = LAST_SLIDE;
    renderActive();
  }

  // Chiamato da app.js quando si torna dalla mappa alle slide normali (← sulla mappa)
  function backFromMap() {
    currentIndex = LAST_SECTION1;  // slide 26
    renderActive();
  }

  // Chiamato da app.js quando si va avanti dalla mappa (→ sulla mappa, pulsante Fine)
  function goToEnd() {
    currentIndex = LAST_SLIDE;     // slide 27
    renderActive();
  }

  document.addEventListener("keydown", function(e) {
    if (window.App && window.App.current() !== "presentation") return;
    var modal = document.getElementById("modal");
    if (modal && !modal.hidden) return;

    var fwd  = ["ArrowRight", "ArrowDown", "PageDown", " "];
    var back = ["ArrowLeft",  "ArrowUp",   "PageUp"];
    if (fwd.indexOf(e.key) !== -1) {
      e.preventDefault();
      // stopImmediatePropagation evita che app.js processi lo stesso evento
      // (es. quando next() cambia schermata a "map", app.js non deve reagire)
      e.stopImmediatePropagation();
      next();
    } else if (back.indexOf(e.key) !== -1) {
      e.preventDefault();
      e.stopImmediatePropagation();
      prev();
    } else if (e.key === "Home") { e.preventDefault(); gotoFirst(); }
    else if (e.key === "End")  { e.preventDefault(); gotoLast(); }
  });

  window.Slides = {
    init: buildSlides,
    next: next,
    prev: prev,
    gotoFirst: gotoFirst,
    gotoLast: gotoLast,
    backFromMap: backFromMap,
    goToEnd: goToEnd,
  };

  buildSlides();
})();
