// Logica deck di slide: PNG a tutta pagina, navigazione lineare,
// passaggio automatico alla mappa dopo l'ultima slide.
//
// Tasti gestiti (compatibili con presenter Bluetooth standard):
//   Avanti:   ArrowRight, ArrowDown, PageDown, Space
//   Indietro: ArrowLeft,  ArrowUp,   PageUp
//   Home/End: prima / ultima slide
// (F per fullscreen, B per black, M per mappa sono gestiti in app.js)

(() => {
  // 26 slide caricate da web/assets/slides/01.png … 26.png.
  // L'ordine è quello dei file: 01 = prima slide, 26 = ultima.
  const SLIDE_COUNT = 27;
  const SLIDES = Array.from({ length: SLIDE_COUNT }, (_, i) => {
    const n = i + 1;
    const id = String(n).padStart(2, "0");
    return { num: n, id, title: `Slide ${n}`, img: `assets/slides/${id}.png` };
  });

  let currentIndex = 0;
  let loaded = false;

  const deckEl = document.getElementById("deck");
  const slideCurrentEl = document.getElementById("slide-current");
  const slideTotalEl = document.getElementById("slide-total");

  function buildSlides() {
    if (loaded) return;
    slideTotalEl.textContent = String(SLIDES.length);
    SLIDES.forEach((s, i) => {
      const el = document.createElement("section");
      el.className = "slide";
      el.dataset.index = String(i);

      const img = document.createElement("img");
      img.className = "slide__img";
      img.src = s.img;
      img.alt = s.title || `Slide ${s.id}`;
      // Se il PNG non c'è ancora, mostra un placeholder testuale
      img.onerror = () => {
        img.remove();
        const ph = document.createElement("div");
        ph.className = "slide__placeholder";
        ph.innerHTML = `
          <span class="slide__placeholder-id">${s.id}</span>
          <span class="slide__placeholder-title">${s.title || ""}</span>
          <span class="slide__placeholder-hint">PNG da caricare in <code>web/${s.img}</code></span>
        `;
        el.appendChild(ph);
      };
      el.appendChild(img);
      deckEl.appendChild(el);
    });
    loaded = true;
    renderActive();
  }

  function renderActive() {
    const slides = deckEl.querySelectorAll(".slide");
    slides.forEach((s, i) => {
      s.dataset.active = i === currentIndex ? "true" : "false";
    });
    slideCurrentEl.textContent = String(currentIndex + 1);
  }

  // Flusso: slide 1..26 → mappa → slide 27 (finale).
  // L'indice della penultima slide (26) è SLIDES.length - 2.
  // L'indice della slide finale (27) è SLIDES.length - 1.
  function next() {
    const last = SLIDES.length - 1;        // slide 27
    const beforeMap = SLIDES.length - 2;   // slide 26
    if (currentIndex === last) return;     // dalla 27 in avanti non si va
    if (currentIndex === beforeMap) {
      // dalla 26 → mappa
      window.App && window.App.show("map");
      return;
    }
    currentIndex++;
    renderActive();
  }
  function prev() {
    const last = SLIDES.length - 1;        // slide 27
    if (currentIndex === last) {
      // dalla 27 → mappa
      window.App && window.App.show("map");
      return;
    }
    if (currentIndex > 0) {
      currentIndex--;
      renderActive();
    }
  }
  function gotoLast() {
    currentIndex = SLIDES.length - 1;
    renderActive();
  }
  function gotoFirst() {
    currentIndex = 0;
    renderActive();
  }

  document.addEventListener("keydown", (e) => {
    if (window.App && window.App.current() !== "presentation") return;
    if (document.getElementById("modal") && !document.getElementById("modal").hidden) return;

    const fwd  = ["ArrowRight", "ArrowDown", "PageDown", " "];
    const back = ["ArrowLeft",  "ArrowUp",   "PageUp"];
    if (fwd.includes(e.key))      { e.preventDefault(); next(); }
    else if (back.includes(e.key)){ e.preventDefault(); prev(); }
    else if (e.key === "Home")    { e.preventDefault(); gotoFirst(); }
    else if (e.key === "End")     { e.preventDefault(); gotoLast(); }
  });

  function goToEnd() {
    currentIndex = SLIDES.length - 1;
    renderActive();
  }

  window.Slides = {
    init: buildSlides,
    next, prev, gotoFirst, gotoLast,
    backFromMap: () => { currentIndex = SLIDES.length - 2; renderActive(); },
    goToEnd,
  };

  // costruzione immediata
  buildSlides();
})();
