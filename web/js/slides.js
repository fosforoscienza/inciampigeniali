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
  var SLIDE_COUNT = 27;
  var SVG_SLIDES = [22, 23, 24, 25];  // numeri (1-based) delle slide SVG

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
      isSvg: SVG_SLIDES.indexOf(n) !== -1,
    });
  }

  var LAST_SECTION1 = SLIDE_COUNT - 2;  // 25 (slide 26)
  var LAST_SLIDE    = SLIDE_COUNT - 1;  // 26 (slide 27)
  var TRANSITION_MS = 400;

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
        if (s.isSvg) el.dataset.kind = "svg";

        if (s.isSvg) {
          loadSvgInto(el, s);
        } else {
          appendPng(el, s);
        }
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

  function loadSvgInto(el, s) {
    fetch(s.svg).then(function(res) {
      if (!res.ok) throw new Error("svg-missing");
      return res.text();
    }).then(function(svgText) {
      el.innerHTML = svgText;
      var svg = el.querySelector("svg");
      if (svg) {
        svg.classList.add("slide__svg");
        // Forza il riempimento dello slot
        svg.removeAttribute("width");
        svg.removeAttribute("height");

        // Risolvi gli href relativi delle <image> rispetto alla cartella SVG
        // (l'SVG è caricato inline, quindi i path relativi punterebbero a index.html)
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
      }
    }).catch(function() {
      // Fallback: PNG
      el.dataset.kind = "";
      appendPng(el, s);
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

    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var wasActive = s.dataset.active === "true";
      if (i === currentIndex) {
        s.dataset.active = "true";
        s.dataset.leaving = "false";
      } else {
        s.dataset.active = "false";
        if (wasActive) {
          s.dataset.leaving = "true";
          (function(slide) {
            setTimeout(function() {
              if (slide.dataset.active === "false") {
                slide.dataset.leaving = "false";
              }
            }, TRANSITION_MS);
          })(s);
        }
      }
    }

    // Magic Move tra due slide SVG consecutive
    var nextActive = slides[currentIndex];
    if (prevActive && prevActive.dataset.kind === "svg" &&
        nextActive && nextActive.dataset.kind === "svg") {
      magicMove(prevActive, nextActive, TRANSITION_MS);
    }

    slideCurrentEl.textContent = String(currentIndex + 1);
  }

  // Anima gli elementi con lo stesso id da `fromSlide` a `toSlide`.
  // L'elemento di destinazione viene nascosto durante l'animazione,
  // l'elemento di partenza viene traslato/scalato fino alla posizione finale.
  function magicMove(fromSlide, toSlide, durationMs) {
    var fromSvg = fromSlide.querySelector("svg");
    var toSvg = toSlide.querySelector("svg");
    if (!fromSvg || !toSvg) return;

    var fromEls = fromSvg.querySelectorAll("[id]");
    for (var i = 0; i < fromEls.length; i++) {
      (function(fromEl) {
        var id = fromEl.id;
        if (!id) return;
        var toEl;
        try { toEl = toSvg.querySelector("#" + (window.CSS && CSS.escape ? CSS.escape(id) : id)); }
        catch (err) { return; }
        if (!toEl) return;

        var fromRect = fromEl.getBoundingClientRect();
        var toRect = toEl.getBoundingClientRect();
        if (!fromRect.width || !fromRect.height) return;

        var dx = toRect.left - fromRect.left;
        var dy = toRect.top - fromRect.top;
        var sx = toRect.width / fromRect.width;
        var sy = toRect.height / fromRect.height;

        // Salta se non si muove
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 &&
            Math.abs(sx - 1) < 0.005 && Math.abs(sy - 1) < 0.005) return;

        // Nascondi il duplicato nella slide di destinazione
        var prevToOpacity = toEl.style.opacity;
        toEl.style.opacity = "0";

        // Anima la copia nella slide di partenza
        fromEl.style.transformBox = "fill-box";
        fromEl.style.transformOrigin = "0 0";
        fromEl.style.transition = "transform " + durationMs + "ms ease";
        fromEl.style.willChange = "transform";
        // Doppio rAF per assicurarsi che il frame iniziale sia applicato
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            fromEl.style.transform =
              "translate(" + dx + "px, " + dy + "px) scale(" + sx + ", " + sy + ")";
          });
        });

        setTimeout(function() {
          toEl.style.opacity = prevToOpacity || "";
          fromEl.style.transform = "";
          fromEl.style.transition = "";
          fromEl.style.transformBox = "";
          fromEl.style.transformOrigin = "";
          fromEl.style.willChange = "";
        }, durationMs + 30);
      })(fromEls[i]);
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
