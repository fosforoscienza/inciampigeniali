// Carica le scoperte, posiziona i pin sulla mappa, gestisce il modal.
// Le coordinate dei pin sono espresse in % rispetto al contenitore della mappa
// (xPct/yPct: 0 in alto-sinistra, 100 in basso-destra).
// Conviene calibrarle a occhio una volta vista la PNG nel programma.

(() => {
  const DATA_URL = "data/discoveries.json";

  let loaded = false;
  let discoveries = [];

  const mapContainer = document.getElementById("map-container");
  const pinsLayer = document.getElementById("pins");
  const modal = document.getElementById("modal");

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
    const photo = document.getElementById("modal-photo");
    if (d.photo) {
      photo.src = d.photo;
      photo.alt = d.author || "";
      photo.style.display = "";
    } else {
      photo.removeAttribute("src");
      photo.style.display = "none";
    }
    document.getElementById("modal-title").textContent = d.title || "";
    document.getElementById("modal-meta").textContent = [d.author, d.year, d.location]
      .filter(Boolean)
      .join(" · ");
    document.getElementById("modal-summary").textContent = d.summary || "";
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) {
      closeModal();
      e.stopPropagation(); // evita che ESC chiuda anche la sezione
    }
  });

  window.Pins = {
    ensure: loadData,
    reload: () => {
      loaded = false;
      return loadData();
    },
  };
})();
