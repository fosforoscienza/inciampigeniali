// Carica le scoperte, posiziona i pin sulla mappa,
// gestisce il modal con il disegno, e la modalità calibrazione (tasto C).

(() => {
  const DATA_URL = "data/discoveries.json";
  const PLACEHOLDER = "assets/drawings/_placeholder.svg";

  let loaded = false;
  let discoveries = [];
  let calibrating = false;

  const mapStage = document.getElementById("map-stage");
  const pinsLayer = document.getElementById("pins");
  const modal = document.getElementById("modal");
  const drawingEl = document.getElementById("modal-drawing");
  const titleEl = document.getElementById("modal-title");
  const subtitleEl = document.getElementById("modal-subtitle");
  const readout = document.getElementById("coord-readout");
  const calibratePanel = document.getElementById("calibrate-panel");

  async function loadData() {
    if (loaded) return;
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      discoveries = await res.json();
    } catch (err) {
      console.warn("discoveries.json non caricato:", err);
      discoveries = [];
    }
    loaded = true;
    renderPins();
  }

  function renderPins() {
    pinsLayer.innerHTML = "";
    discoveries.forEach((d) => {
      if (typeof d.xPct !== "number" || typeof d.yPct !== "number") return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pin";
      btn.style.left = `${d.xPct}%`;
      btn.style.top = `${d.yPct}%`;
      btn.setAttribute("aria-label", `${d.title} — ${d.author}`);
      btn.dataset.id = d.id;

      // Tooltip al passaggio del mouse (titolo della scoperta)
      const tooltip = document.createElement("span");
      tooltip.className = "pin__tooltip";
      tooltip.textContent = d.title || "";
      btn.appendChild(tooltip);

      // Etichetta con coordinate (visibile solo in modalità calibrazione)
      const label = document.createElement("span");
      label.className = "pin__label";
      label.textContent = labelFor(d);
      btn.appendChild(label);

      btn.addEventListener("click", (e) => {
        if (calibrating) { e.preventDefault(); return; }
        openModal(d);
      });
      makeDraggable(btn, d);
      pinsLayer.appendChild(btn);
    });
  }

  function labelFor(d) {
    return `${d.title}  ${d.xPct.toFixed(1)}%, ${d.yPct.toFixed(1)}%`;
  }

  function updatePinUI(btn, d) {
    btn.style.left = `${d.xPct}%`;
    btn.style.top = `${d.yPct}%`;
    const label = btn.querySelector(".pin__label");
    if (label) label.textContent = labelFor(d);
  }

  // ----- Drag & drop dei pin (solo in modalità calibrazione) -----
  function makeDraggable(btn, d) {
    let dragging = false;

    btn.addEventListener("mousedown", (e) => {
      if (!calibrating) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = true;

      const onMove = (ev) => {
        if (!dragging) return;
        const rect = mapStage.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * 100;
        const y = ((ev.clientY - rect.top) / rect.height) * 100;
        d.xPct = clamp(x, 0, 100);
        d.yPct = clamp(y, 0, 100);
        updatePinUI(btn, d);
      };
      const onUp = () => {
        dragging = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ----- Coord readout (mouse sulla mappa in modalità calibrazione) -----
  mapStage.addEventListener("mousemove", (e) => {
    if (!calibrating) return;
    const rect = mapStage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    readout.hidden = false;
    readout.textContent = `${x.toFixed(1)}%, ${y.toFixed(1)}%`;
    readout.style.left = `${e.clientX - rect.left}px`;
    readout.style.top = `${e.clientY - rect.top}px`;
  });
  mapStage.addEventListener("mouseleave", () => {
    if (!calibrating) return;
    readout.hidden = true;
  });

  // ----- Toggle calibrazione (tasto C) -----
  function setCalibrating(on) {
    calibrating = on;
    document.body.classList.toggle("calibrating", on);
    calibratePanel.hidden = !on;
    if (!on) readout.hidden = true;
  }

  document.addEventListener("keydown", (e) => {
    if (window.App && window.App.current() !== "map") return;
    if (e.key === "C" || e.key === "c") {
      e.preventDefault();
      setCalibrating(!calibrating);
      return;
    }
    // Esc in modalità calibrazione: esce solo dalla calibrazione, non torna alle slide
    if (e.key === "Escape" && calibrating) {
      e.preventDefault();
      e.stopImmediatePropagation();
      setCalibrating(false);
    }
  }, true); // capture: handlers in capture-phase girano prima di app.js

  document.getElementById("exit-calibrate").addEventListener("click", () => setCalibrating(false));

  document.getElementById("copy-coords").addEventListener("click", async () => {
    const lines = discoveries.map((d) => {
      return `  { "id": "${d.id}", "xPct": ${d.xPct.toFixed(1)}, "yPct": ${d.yPct.toFixed(1)} }`;
    }).join(",\n");
    const text = `[\n${lines}\n]`;
    try {
      await navigator.clipboard.writeText(text);
      flashLabel("Coordinate copiate negli appunti — incollale in chat.");
    } catch (err) {
      console.warn("Clipboard API fallita, ecco il testo:", text);
      flashLabel("Copia fallita: vedi la console del browser.");
    }
  });

  function flashLabel(msg) {
    const el = calibratePanel.querySelector(".calibrate-panel__label");
    if (!el) return;
    const old = el.textContent;
    el.textContent = msg;
    setTimeout(() => { el.textContent = old; }, 2200);
  }

  // ----- Modal scoperta (titolo + sottotitolo + disegno) -----
  function openModal(d) {
    const src = d.drawing || `assets/drawings/${d.id}.png`;
    drawingEl.src = src;
    drawingEl.alt = d.title || "";
    drawingEl.onerror = () => { drawingEl.src = PLACEHOLDER; };
    titleEl.textContent = d.title || "";
    subtitleEl.textContent = d.subtitle || "";
    modal.hidden = false;
  }
  function closeModal() {
    modal.hidden = true;
    drawingEl.removeAttribute("src");
  }
  modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) {
      closeModal();
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true); // capture-phase: chiude il modal prima che app.js torni alle slide

  window.Pins = { ensure: loadData };
})();
