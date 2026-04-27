// Logica deck di slide: navigazione, tasti, schermo nero
//
// Ogni slide è un file in web/slides/. La lista è in SLIDES.
// I tasti gestiti coprono tutti i presenter Bluetooth standard:
//   Avanti:   ArrowRight, ArrowDown, PageDown, Space
//   Indietro: ArrowLeft,  ArrowUp,   PageUp
//   Black:    B
//   Home/End: prima / ultima slide

(() => {
  const SLIDES = [
    { id: "01", title: "Introduzione",         file: "slides/01-introduzione.html" },
    { id: "02", title: "Dove tutto nasce",     file: "slides/02-dove-tutto-nasce.html" },
    { id: "03", title: "Nascita del nome",     file: "slides/03-nascita-del-nome.html" },
    { id: "04", title: "Definizione",          file: "slides/04-definizione.html" },
    { id: "05", title: "Tipi di serendipità",  file: "slides/05-tipi-serendipita.html" },
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
      el.dataset.title = s.title;
      try {
        const html = await fetch(s.file).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        });
        el.innerHTML = html;
      } catch (err) {
        el.innerHTML = `<h2>${s.title}</h2><p style="color:rgba(0,0,0,0.5);font-style:italic;">[Slide ${s.id}: contenuto non ancora caricato]</p>`;
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
    if (currentIndex < SLIDES.length - 1) {
      currentIndex++;
      renderActive();
    }
  }
  function prev() {
    if (!active) return;
    if (currentIndex > 0) {
      currentIndex--;
      renderActive();
    }
  }
  function goto(i) {
    if (!active) return;
    if (i >= 0 && i < SLIDES.length) {
      currentIndex = i;
      renderActive();
    }
  }
  function toggleBlack() {
    if (!active || !blackEl) return;
    blackEl.hidden = !blackEl.hidden;
  }

  document.addEventListener("keydown", (e) => {
    if (!active) return;

    const fwdKeys = ["ArrowRight", "ArrowDown", "PageDown", " "];
    const backKeys = ["ArrowLeft", "ArrowUp", "PageUp"];

    if (fwdKeys.includes(e.key)) {
      e.preventDefault();
      next();
    } else if (backKeys.includes(e.key)) {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      goto(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goto(SLIDES.length - 1);
    } else if (e.key === "B" || e.key === "b" || e.key === ".") {
      e.preventDefault();
      toggleBlack();
    }
  });

  window.Slides = {
    activate: () => {
      active = true;
      loadSlides();
    },
    deactivate: () => {
      active = false;
      if (blackEl) blackEl.hidden = true;
    },
    goto,
    next,
    prev,
  };
})();
