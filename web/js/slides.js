// Logica deck di slide: PNG (o SVG con Magic Move) a tutta pagina,
// navigazione a 3 sezioni.
//
// Struttura:
//   Sezione 1: slide 01..26  (indici 0..25)
//   Sezione 2: mappa         (gestita da app.js / map.js)
//   Sezione 3: slide 27      (indice 26, l'ultima)
//
// Slide SVG (con Magic Move tra slide consecutive):
//   Le slide elencate in SVG_SLIDES vengono caricate da
//   web/assets/slides-svg/NN.svg (es. 23.svg). Se il file SVG non esiste,
//   si ricade sul PNG. Gli elementi con lo stesso `id` in due SVG
//   consecutivi vengono animati (translate + scale) tra una posizione
//   e l'altra. Tutto il resto fa il normale cross-dissolve.
//
// Tasti gestiti (compatibili con presenter Bluetooth standard):
//   Avanti:   ArrowRight, ArrowDown, PageDown, Space
//   Indietro: ArrowLeft,  ArrowUp,   PageUp
//   Home/End: prima / ultima slide

(function() {
  var SLIDE_COUNT = 28;

  // Per ogni slide proviamo prima l'SVG (assets/slides-svg/NN.svg),
  // se non c'è ricadiamo sul PNG (assets/slides/NN.png). Quindi per
  // attivare il Magic Move su una nuova slide basta caricare il file
  // SVG con il nome giusto: il codice si arrangia.
  var SLIDES = [];
  for (var i = 0; i < SLIDE_COUNT; i++) {
    var n = i + 1;
    var id = n < 10 ? "0" + n : String(n);
    SLIDES.push({
      num: n,
      id: id,
      title: "Slide " + n,
      img: "assets/slides/" + id + ".png",
      svg: "assets/slides-svg/" + id + ".svg",
    });
  }

  var LAST_SECTION1 = SLIDE_COUNT - 2;  // 25 (slide 26)
  var LAST_SLIDE    = SLIDE_COUNT - 1;  // 26 (slide 27)
  var TRANSITION_MS  = 400;   // cross-dissolve standard (PNG)
  var MAGIC_MOVE_MS  = 1000;  // durata Magic Move tra slide SVG

  var currentIndex = 0;
  var loaded = false;

  var deckEl         = document.getElementById("deck");
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
        // Mostra immediatamente il PNG (no flash di nero durante la dissolvenza).
        // Se per quella slide esiste anche un SVG, in background sostituiamo
        // il contenuto e attiviamo il Magic Move.
        appendPng(el, s);
        trySwapToSvg(el, s);
        deckEl.appendChild(el);
      })(SLIDES[i], i);
    }
    loaded = true;
    renderActive();
  }

  function appendPng(el, s) {
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
  }

  // Prova a caricare l'SVG corrispondente. Se la fetch va a buon fine
  // sostituisce il PNG con il contenuto SVG (e abilita il Magic Move).
  // Se l'SVG non esiste (404, parse error, …) il PNG resta com'è.
  function trySwapToSvg(el, s) {
    fetch(s.svg).then(function(res) {
      if (!res.ok) throw new Error("svg-missing");
      return res.text();
    }).then(function(svgText) {
      // Rimuovi il contenuto PNG e inietta l'SVG
      el.innerHTML = svgText;
      var svg = el.querySelector("svg");
      if (!svg) return;

      el.dataset.kind = "svg";
      var svgId = "slide-svg-" + s.id;
      svg.id = svgId;
      svg.classList.add("slide__svg");
      svg.removeAttribute("width");
      svg.removeAttribute("height");

      // Scope dei <style> interni: prefissa ogni selettore con #slide-svg-NN
      // (evita collisioni di .st0/.st1/... fra SVG diversi)
      var styles = svg.querySelectorAll("style");
      for (var j = 0; j < styles.length; j++) {
        styles[j].textContent = scopeCssRules(styles[j].textContent, "#" + svgId);
      }

      // Risolvi gli href relativi delle <image> rispetto alla cartella SVG
      var basePath = s.svg.replace(/\/[^\/]+$/, "/");
      var imgs = svg.querySelectorAll("image");
      for (var k = 0; k < imgs.length; k++) {
        var href = imgs[k].getAttribute("xlink:href") || imgs[k].getAttribute("href");
        if (href && !/^https?:\/\//.test(href) && !/^\//.test(href) && !/^data:/.test(href)) {
          var resolved = basePath + href;
          imgs[k].setAttribute("xlink:href", resolved);
          imgs[k].setAttribute("href", resolved);
        }
      }
    }).catch(function() {
      // Niente SVG: il PNG già appeso resta come contenuto della slide
    });
  }

  function renderActive() {
    var slides = deckEl.querySelectorAll(".slide");
    var prevActive = null;
    for (var k = 0; k < slides.length; k++) {
      if (slides[k].dataset.active === "true" && k !== currentIndex) {
        prevActive = slides[k];
        break;
      }
    }

    var nextActive = slides[currentIndex];
    var isSvgToSvg = prevActive && prevActive.dataset.kind === "svg" &&
                     nextActive && nextActive.dataset.kind === "svg";
    var duration = isSvgToSvg ? MAGIC_MOVE_MS : TRANSITION_MS;

    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var wasActive = s.dataset.active === "true";
      if (i === currentIndex) {
        s.dataset.active = "true";
        s.dataset.leaving = "false";
      } else {
        s.dataset.active = "false";
        if (wasActive) {
          // Override della durata della transizione per SVG → SVG
          s.style.transition = "opacity " + (duration / 1000) + "s ease";
          s.dataset.leaving = "true";
          (function(slide, dur) {
            setTimeout(function() {
              if (slide.dataset.active === "false") {
                slide.dataset.leaving = "false";
                slide.style.transition = "";
              }
            }, dur);
          })(s, duration);
        }
      }
    }

    if (isSvgToSvg) {
      magicMove(prevActive, nextActive, duration);
    }

    slideCurrentEl.textContent = String(currentIndex + 1);
  }

  // Scope per i selettori CSS dentro <style> SVG: prepende `prefix `
  // a ogni selettore. Risolve la collisione di .st0/.st1/... fra SVG
  // di Illustrator caricati nella stessa pagina.
  function scopeCssRules(css, prefix) {
    return css.replace(/([^{}]+)\{([^{}]*)\}/g, function(m, sel, body) {
      var scoped = sel.split(",").map(function(s) {
        s = s.trim();
        if (!s || /^@/.test(s)) return s;
        return prefix + " " + s;
      }).join(", ");
      return scoped + " { " + body + " }";
    });
  }

  // Magic Move (tecnica FLIP):
  //   l'elemento condiviso nella slide di destinazione parte dalla
  //   posizione che aveva nella slide di partenza e anima fino alla
  //   sua posizione naturale. L'omologo nella slide di partenza viene
  //   nascosto, così non si vedono i doppioni durante il cross-dissolve.
  //   Risultato: gli elementi condivisi appaiono stabili (no fade),
  //   gli altri sfumano con il cross-dissolve della slide.
  function magicMove(fromSlide, toSlide, durationMs) {
    var fromSvg = fromSlide.querySelector("svg");
    var toSvg = toSlide.querySelector("svg");
    if (!fromSvg || !toSvg) return;

    var toEls = toSvg.querySelectorAll("[id]");
    for (var i = 0; i < toEls.length; i++) {
      (function(toEl) {
        var id = toEl.id;
        if (!id || /^slide-svg-/.test(id)) return;
        var fromEl;
        try {
          var sel = "#" + (window.CSS && CSS.escape ? CSS.escape(id) : id);
          fromEl = fromSvg.querySelector(sel);
        } catch (err) { return; }
        if (!fromEl) return;

        var fromRect = fromEl.getBoundingClientRect();
        var toRect = toEl.getBoundingClientRect();
        if (!toRect.width || !toRect.height) return;

        var dx = fromRect.left - toRect.left;   // delta inverso (FLIP)
        var dy = fromRect.top - toRect.top;
        var sx = toRect.width  ? fromRect.width  / toRect.width  : 1;
        var sy = toRect.height ? fromRect.height / toRect.height : 1;

        // Nascondi l'omologo nella slide di partenza (no doppione)
        var prevFromOpacity = fromEl.style.opacity;
        fromEl.style.opacity = "0";

        // Se le due posizioni coincidono (es. sfondo identico),
        // niente transform: l'elemento resta visivamente fermo.
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 &&
            Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) {
          setTimeout(function() {
            fromEl.style.opacity = prevFromOpacity || "";
          }, durationMs + 50);
          return;
        }

        // FLIP: posiziona l'elemento di destinazione sulla posizione
        // di partenza, poi anima alla posizione naturale.
        toEl.style.transformBox = "fill-box";
        toEl.style.transformOrigin = "0 0";
        toEl.style.transition = "none";
        toEl.style.transform =
          "translate(" + dx + "px, " + dy + "px) scale(" + sx + ", " + sy + ")";
        toEl.style.willChange = "transform";

        // Forza reflow, poi attiva la transizione verso identità
        toEl.getBoundingClientRect();
        requestAnimationFrame(function() {
          toEl.style.transition = "transform " + durationMs + "ms ease";
          toEl.style.transform = "";
        });

        setTimeout(function() {
          toEl.style.transition = "";
          toEl.style.transform = "";
          toEl.style.transformBox = "";
          toEl.style.transformOrigin = "";
          toEl.style.willChange = "";
          fromEl.style.opacity = prevFromOpacity || "";
        }, durationMs + 50);
      })(toEls[i]);
    }
  }

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

  function gotoFirst() { currentIndex = 0; renderActive(); }
  function gotoLast()  { currentIndex = LAST_SLIDE; renderActive(); }
  function backFromMap() { currentIndex = LAST_SECTION1; renderActive(); }
  function goToEnd()     { currentIndex = LAST_SLIDE;    renderActive(); }

  document.addEventListener("keydown", function(e) {
    if (window.App && window.App.current() !== "presentation") return;
    var modal = document.getElementById("modal");
    if (modal && !modal.hidden) return;

    var fwd  = ["ArrowRight", "ArrowDown", "PageDown", " "];
    var back = ["ArrowLeft",  "ArrowUp",   "PageUp"];
    if (fwd.indexOf(e.key) !== -1) {
      e.preventDefault();
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
