// Logica deck di slide: PNG a tutta pagina, navigazione lineare,
// passaggio automatico alla mappa dopo l'ultima slide.
//
// Tasti gestiti (compatibili con presenter Bluetooth standard):
//   Avanti:   ArrowRight, ArrowDown, PageDown, Space
//   Indietro: ArrowLeft,  ArrowUp,   PageUp
//   Black:    B / .
//   Home/End: prima / ultima slide

(() => {
  const SLIDES = [
    // ---------- INTRODUZIONE ----------
    { id: "01-01", img: "assets/slides/01-01.png", title: "Inciampi Geniali" },
    { id: "01-02", img: "assets/slides/01-02.png", title: "Cos'è un errore?" },
    { id: "01-03", img: "assets/slides/01-03.png", title: "Le conseguenze" },
    { id: "01-04", img: "assets/slides/01-04.png", title: "Lo sbaglio è il protagonista" },
    { id: "01-05", img: "assets/slides/01-05.png", title: "Scoperte serendipiche" },
    { id: "01-06", img: "assets/slides/01-06.png", title: "La scienza delle persone" },
    { id: "01-07", img: "assets/slides/01-07.png", title: "Prima, la serendipità" },

    // ---------- DOVE TUTTO NASCE ----------
    { id: "02-01", img: "assets/slides/02-01.png", title: "1300 d.C., Persia" },
    { id: "02-02", img: "assets/slides/02-02.png", title: "I tre principi di Serendippo" },
    { id: "02-03", img: "assets/slides/02-03.png", title: "L'esilio" },
    { id: "02-04", img: "assets/slides/02-04.png", title: "Il cammelliere" },
    { id: "02-05", img: "assets/slides/02-05.png", title: "Sei dettagli del cammello" },
    { id: "02-06", img: "assets/slides/02-06.png", title: "Pura deduzione" },
    { id: "02-07", img: "assets/slides/02-07.png", title: "Da prigionieri a consiglieri" },

    // ---------- NASCITA DEL NOME ----------
    { id: "03-01", img: "assets/slides/03-01.png", title: "Venezia, 1557" },
    { id: "03-02", img: "assets/slides/03-02.png", title: "Horace Walpole, 1754" },
    { id: "03-03", img: "assets/slides/03-03.png", title: "Coniato in una lettera" },
    { id: "03-04", img: "assets/slides/03-04.png", title: "Anche il nome nasce da uno sbaglio" },

    // ---------- DEFINIZIONE ----------
    { id: "04-01", img: "assets/slides/04-01.png", title: "Cos'è la serendipità" },
    { id: "04-02", img: "assets/slides/04-02.png", title: "Non basta il caso" },
    { id: "04-03", img: "assets/slides/04-03.png", title: "Pasteur" },
    { id: "04-04", img: "assets/slides/04-04.png", title: "Quanti nel cestino?" },

    // ---------- TIPI DI SERENDIPITÀ ----------
    { id: "05-01", img: "assets/slides/05-01.png", title: "Tre tipi" },
    { id: "05-02", img: "assets/slides/05-02.png", title: "Debole" },
    { id: "05-03", img: "assets/slides/05-03.png", title: "Forte" },
    { id: "05-04", img: "assets/slides/05-04.png", title: "Precoce" },
  ];

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
