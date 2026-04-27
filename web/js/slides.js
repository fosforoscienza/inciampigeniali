// Logica deck di slide: navigazione, tasti, schermo nero.
//
// Ogni slide è un file in web/slides/ + una variante di layout
// (titolo, immagine-testo, immagine-citazione, solo-immagine).
//
// Tasti gestiti (compatibili con presenter Bluetooth standard):
//   Avanti:   ArrowRight, ArrowDown, PageDown, Space
//   Indietro: ArrowLeft,  ArrowUp,   PageUp
//   Black:    B / .
//   Home/End: prima / ultima slide

(() => {
  const SLIDES = [
    // ---------- INTRODUZIONE (variante: titolo) ----------
    { id: "01-01", file: "slides/01-01-titolo.html",          variant: "titolo" },
    { id: "01-02", file: "slides/01-02-cos-e-errore.html",    variant: "titolo" },
    { id: "01-03", file: "slides/01-03-conseguenze.html",     variant: "titolo" },
    { id: "01-04", file: "slides/01-04-protagonista.html",    variant: "titolo" },
    { id: "01-05", file: "slides/01-05-scoperte-serendipiche.html", variant: "titolo" },
    { id: "01-06", file: "slides/01-06-scienza-persone.html", variant: "titolo" },
    { id: "01-07", file: "slides/01-07-prima-di.html",        variant: "titolo" },

    // ---------- DOVE TUTTO NASCE ----------
    { id: "02-01", file: "slides/02-01-1300-persia.html",       variant: "immagine-testo" },
    { id: "02-02", file: "slides/02-02-tre-principi.html",      variant: "solo-immagine" },
    { id: "02-03", file: "slides/02-03-esilio.html",            variant: "immagine-testo" },
    { id: "02-04", file: "slides/02-04-cammelliere.html",       variant: "immagine-testo" },
    { id: "02-05", file: "slides/02-05-sei-dettagli.html",      variant: "immagine-testo" },
    { id: "02-06", file: "slides/02-06-deduzione.html",         variant: "immagine-testo" },
    { id: "02-07", file: "slides/02-07-consiglieri.html",       variant: "immagine-testo" },

    // ---------- NASCITA DEL NOME ----------
    { id: "03-01", file: "slides/03-01-venezia.html",           variant: "immagine-testo" },
    { id: "03-02", file: "slides/03-02-walpole.html",           variant: "immagine-testo" },
    { id: "03-03", file: "slides/03-03-coniato.html",           variant: "immagine-testo" },
    { id: "03-04", file: "slides/03-04-sbaglio.html",           variant: "titolo" },

    // ---------- DEFINIZIONE ----------
    { id: "04-01", file: "slides/04-01-serendipita.html",       variant: "immagine-testo" },
    { id: "04-02", file: "slides/04-02-mente-pronta.html",      variant: "immagine-testo" },
    { id: "04-03", file: "slides/04-03-pasteur.html",           variant: "immagine-citazione" },
    { id: "04-04", file: "slides/04-04-cestino.html",           variant: "immagine-testo" },

    // ---------- TIPI DI SERENDIPITÀ ----------
    { id: "05-01", file: "slides/05-01-tre-tipi.html",          variant: "titolo" },
    { id: "05-02", file: "slides/05-02-debole.html",            variant: "immagine-testo" },
    { id: "05-03", file: "slides/05-03-forte.html",             variant: "immagine-testo" },
    { id: "05-04", file: "slides/05-04-precoce.html",           variant: "immagine-testo" },
  ];

  let currentIndex = 0;
  let active = false;
  let loaded = false;

  const deckEl = document.getElementById("deck");
  const slideCurrentEl = document.getElementById("slide-current");
  const slideTotalEl = document.getElementById("slide-total");
  const blackEl = document.getElementById("black-overlay");

  async function loadSlides() {
    if (loaded) return;
    slideTotalEl.textContent = String(SLIDES.length);
    for (let i = 0; i < SLIDES.length; i++) {
      const s = SLIDES[i];
      const el = document.createElement("section");
      el.className = "slide";
      el.dataset.index = String(i);
      el.dataset.variant = s.variant;
      try {
        const html = await fetch(s.file).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        });
        el.innerHTML = html;
      } catch (err) {
        el.innerHTML = `<div class="slide-content"><h2 class="slide-title">Slide ${s.id}</h2><p class="slide-subtitle" style="color:rgba(0,0,0,0.5)">[contenuto non caricato]</p></div>`;
      }
      deckEl.appendChild(el);
    }
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

  function next() {
    if (!active) return;
    if (currentIndex < SLIDES.length - 1) { currentIndex++; renderActive(); }
  }
  function prev() {
    if (!active) return;
    if (currentIndex > 0) { currentIndex--; renderActive(); }
  }
  function goto(i) {
    if (!active) return;
    if (i >= 0 && i < SLIDES.length) { currentIndex = i; renderActive(); }
  }
  function toggleBlack() {
    if (!active || !blackEl) return;
    blackEl.hidden = !blackEl.hidden;
  }

  document.addEventListener("keydown", (e) => {
    if (!active) return;
    const fwd  = ["ArrowRight", "ArrowDown", "PageDown", " "];
    const back = ["ArrowLeft",  "ArrowUp",   "PageUp"];
    if (fwd.includes(e.key))      { e.preventDefault(); next(); }
    else if (back.includes(e.key)){ e.preventDefault(); prev(); }
    else if (e.key === "Home")    { e.preventDefault(); goto(0); }
    else if (e.key === "End")     { e.preventDefault(); goto(SLIDES.length - 1); }
    else if (e.key === "B" || e.key === "b" || e.key === ".") {
      e.preventDefault();
      toggleBlack();
    }
  });

  window.Slides = {
    activate: () => { active = true; loadSlides(); },
    deactivate: () => { active = false; if (blackEl) blackEl.hidden = true; },
    goto, next, prev,
  };
})();
