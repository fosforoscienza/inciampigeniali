// Inciampi Geniali — entry point
// Carica il planisfero SVG, posiziona i pin e gestisce il modal di dettaglio.

const MAP_SVG_URL = "assets/map/planisfero.svg";
const DATA_URL = "data/discoveries.json";

// --- Init -------------------------------------------------------------------
init().catch((err) => {
  console.error("Errore inizializzazione:", err);
});

async function init() {
  const [svgText, discoveries] = await Promise.all([
    fetchText(MAP_SVG_URL).catch(() => null),
    fetchJSON(DATA_URL).catch(() => []),
  ]);

  const container = document.getElementById("map-container");

  if (svgText) {
    container.innerHTML = svgText;
  } else {
    container.innerHTML = `
      <div class="map-placeholder" style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(0,0,0,0.4);font-style:italic;">
        Planisfero SVG non ancora caricato (assets/map/planisfero.svg)
      </div>`;
  }

  renderPins(container, discoveries);
  bindModal();
}

// --- Pin rendering ----------------------------------------------------------
// Le coordinate vengono fornite come percentuale (0-100) sulla larghezza/altezza
// del contenitore della mappa: { xPct, yPct }. Così non dipendiamo dalla
// proiezione esatta dell'SVG e possiamo posizionare i pin a occhio.
function renderPins(container, discoveries) {
  discoveries.forEach((d) => {
    if (typeof d.xPct !== "number" || typeof d.yPct !== "number") return;

    const btn = document.createElement("button");
    btn.className = "pin";
    btn.style.left = `${d.xPct}%`;
    btn.style.top = `${d.yPct}%`;
    btn.setAttribute("aria-label", `${d.title} — ${d.author}`);
    btn.dataset.id = d.id;
    btn.addEventListener("click", () => openModal(d));
    container.appendChild(btn);
  });
}

// --- Modal ------------------------------------------------------------------
function bindModal() {
  const modal = document.getElementById("discovery-modal");
  modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => closeModal());
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function openModal(d) {
  const modal = document.getElementById("discovery-modal");
  document.getElementById("modal-photo").src = d.photo || "";
  document.getElementById("modal-photo").alt = d.author || "";
  document.getElementById("modal-title").textContent = d.title || "";
  document.getElementById("modal-meta").textContent = [d.author, d.year, d.location]
    .filter(Boolean)
    .join(" · ");
  document.getElementById("modal-summary").textContent = d.summary || "";
  modal.hidden = false;
}

function closeModal() {
  document.getElementById("discovery-modal").hidden = true;
}

// --- Helpers ----------------------------------------------------------------
async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.text();
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.json();
}
