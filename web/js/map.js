// Carica le scoperte, posiziona i pin sulla mappa,
// gestisce il modal che mostra solo il disegno.

(() => {
  const DATA_URL = "data/discoveries.json";
  const PLACEHOLDER = "assets/drawings/_placeholder.svg";

  let loaded = false;
  let discoveries = [];

  const pinsLayer = document.getElementById("pins");
  const modal = document.getElementById("modal");
  const drawingEl = document.getElementById("modal-drawing");

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
      btn.addEventListener("click", () => openModal(d));
      pinsLayer.appendChild(btn);
    });
  }

  function openModal(d) {
    const src = d.drawing || `assets/drawings/${d.id}.png`;
    drawingEl.src = src;
    drawingEl.alt = d.title || "";
    drawingEl.onerror = () => { drawingEl.src = PLACEHOLDER; };
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
      e.stopPropagation();
    }
  });

  window.Pins = {
    ensure: loadData,
  };
})();
