// Logica deck di slide: PNG a tutta pagina, navigazione lineare,
// passaggio automatico alla mappa dopo l'ultima slide.
//
// Tasti gestiti (compatibili con presenter Bluetooth standard):
//   Avanti:   ArrowRight, ArrowDown, PageDown, Space
//   Indietro: ArrowLeft,  ArrowUp,   PageUp
//   Black:    B / .
//   Home/End: prima / ultima slide

(() => {
  // Naming sequenziale: 01.png … 26.png in web/assets/slides/.
  // Per cambiare ordine, riordinare le righe; il file 01.png è sempre
  // la prima slide, 02.png la seconda, ecc.
  const SLIDES = [
    // ---------- INTRODUZIONE ----------
    { num: 1,  title: "Inciampi Geniali" },
    { num: 2,  title: "Cos'è un errore?" },
    { num: 3,  title: "Le conseguenze" },
    { num: 4,  title: "Lo sbaglio è il protagonista" },
    { num: 5,  title: "Scoperte serendipiche" },
    { num: 6,  title: "La scienza delle persone" },
    { num: 7,  title: "Prima, la serendipità" },

    // ---------- DOVE TUTTO NASCE ----------
    { num: 8,  title: "1300 d.C., Persia" },
    { num: 9,  title: "I tre principi di Serendippo" },
    { num: 10, title: "L'esilio" },
    { num: 11, title: "Il cammelliere" },
    { num: 12, title: "Sei dettagli del cammello" },
    { num: 13, title: "Pura deduzione" },
    { num: 14, title: "Da prigionieri a consiglieri" },

    // ---------- NASCITA DEL NOME ----------
    { num: 15, title: "Venezia, 1557" },
    { num: 16, title: "Horace Walpole, 1754" },
    { num: 17, title: "Coniato in una lettera" },
    { num: 18, title: "Anche il nome nasce da uno sbaglio" },

    // ---------- DEFINIZIONE ----------
    { num: 19, title: "Cos'è la serendipità" },
    { num: 20, title: "Non basta il caso" },
    { num: 21, title: "Pasteur" },
    { num: 22, title: "Quanti nel cestino?" },

    // ---------- TIPI DI SERENDIPITÀ ----------
    { num: 23, title: "Tre tipi" },
    { num: 24, title: "Debole" },
    { num: 25, title: "Forte" },
    { num: 26, title: "Precoce" },
  ].map((s) => ({
    ...s,
    id: String(s.num).padStart(2, "0"),
    img: `assets/slides/${String(s.num).padStart(2, "0")}.png`,
  }));

  let currentIndex = 0;
  let loaded = false;

  const deckEl = document.getElementById("deck");
  const slideCurrentEl = document.getElementById("slide-current");
  const slideTotalEl = document.getElementById("slide-total");
  const blackEl = document.getElementById("black-overlay");

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

  function next() {
    if (currentIndex < SLIDES.length - 1) {
      currentIndex++;
      renderActive();
    } else {
      // dopo l'ultima slide, entra nella mappa
      window.App && window.App.show("map");
    }
  }
  function prev() {
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
  function toggleBlack() {
    if (!blackEl) return;
    blackEl.hidden = !blackEl.hidden;
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
    else if (e.key === "B" || e.key === "b" || e.key === ".") {
      e.preventDefault();
      toggleBlack();
    }
  });

  window.Slides = {
    init: buildSlides,
    next, prev, gotoFirst, gotoLast,
    backFromMap: () => { gotoLast(); },
  };

  // costruzione immediata
  buildSlides();
})();
