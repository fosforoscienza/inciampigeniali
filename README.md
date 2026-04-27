# Inciampi Geniali

App locale in Python che presenta la serendipità in due sezioni:
1. una **presentazione** a slide navigabile con tastiera o presenter Bluetooth;
2. un **planisfero** disegnato a mano con pin animati sulle località delle scoperte serendipiche.

## Architettura

- **Python + pywebview**: `app.py` apre una finestra nativa che mostra la UI.
- **UI**: HTML/CSS/JS in `web/` (così lo stile "disegnato a mano" è facile da curare).
- **Dati**: `web/data/discoveries.json` contiene tutte le scoperte (titolo, autore, foto, riassunto, posizione).
- **Slide**: una per file in `web/slides/`, facili da modificare.

```
.
├── app.py                        # launcher Python (apre la finestra)
├── requirements.txt              # pywebview, requests, Pillow
├── vercel.json                   # config per deploy online (opzionale)
├── web/                          # tutto ciò che si vede in finestra
│   ├── index.html
│   ├── css/style.css
│   ├── js/{app,slides,map}.js
│   ├── slides/0X-*.html          # 5 slide (placeholder, da riempire)
│   ├── data/discoveries.json
│   └── assets/
│       ├── map/planisfero.png
│       └── photos/               # ritratti convertiti in stile disegno
├── docs/                         # testi sorgenti + immagini di riferimento
└── tools/
    ├── discoveries-seed.json     # input dello script ritratti
    └── portraits.py              # scarica le foto e le converte in schizzo
```

## Avvio in locale

Servono Python 3.10+ e pip.

```bash
# 1. crea un ambiente virtuale (consigliato)
python3 -m venv .venv
source .venv/bin/activate           # macOS / Linux
# .venv\Scripts\activate            # Windows PowerShell

# 2. installa le dipendenze
pip install -r requirements.txt

# 3. lancia l'app
python app.py
```

Si apre una finestra. Comandi:
- **1** o click sulla tessera "Presentazione": entra nella presentazione
- **2** o click sulla tessera "Planisfero": apre la mappa
- **F**: fullscreen on/off (in tutta l'app)
- **Esc**: torna al menu (e chiude la modal della scoperta)

### Comandi nella presentazione (compatibili con presenter Bluetooth)
- **→ / ↓ / PageDown / Spazio**: slide successiva
- **← / ↑ / PageUp**: slide precedente
- **Home / End**: prima / ultima slide
- **B** o **.**: schermo nero (toggle)

## Convertire le foto in stile schizzo

Una volta sola, dopo aver caricato i ritratti su Wikimedia Commons o altrove:

```bash
python tools/portraits.py
```

Lo script legge `tools/discoveries-seed.json`, scarica le immagini indicate, le converte in stile pencil-sketch e le salva in `web/assets/photos/<id>.png`. Lo stile va affinato sulle immagini di riferimento (vedi sotto).

## Deploy online opzionale (Vercel)

L'app gira benissimo offline. Se vuoi anche una versione web pubblica della parte UI:
1. Importa il repo da [vercel.com/new](https://vercel.com/new).
2. Vercel legge `vercel.json` (già presente) e serve la cartella `web/` come sito statico.
3. Build Command: lascia vuoto. Output: gestito dal `vercel.json`.

> Nota: Vercel ospita solo la parte web. Il file `app.py` non viene usato online — è solo per la versione desktop.

## Come caricare materiali nel repo

Tutto lo sviluppo è sul branch **`claude/serendipity-project-setup-Ug4v5`** (non `main`).

### Testi (slide, copioni, riassunti)
Il modo più semplice: incollarli direttamente in chat. Vengono salvati nei file giusti.

### Immagini (planisfero, foto di riferimento, ritratti)
1. Apri il repo su GitHub.
2. Cambia branch a `claude/serendipity-project-setup-Ug4v5` (selettore in alto).
3. **Add file → Upload files**, trascina i file.
4. Nel campo del nome scrivi davanti il path completo, ad esempio:
   - planisfero: `web/assets/map/planisfero.png`
   - riferimento di stile per i ritratti: `docs/riferimenti-stile/<nome>.jpg`
   - riferimento di un layout slide: `docs/riferimenti-layout-slide/<nome>.jpg`
5. Sotto, **Commit changes** → seleziona **"Commit directly to the `claude/serendipity-project-setup-Ug4v5` branch"** → clicca verde.
6. Avvisa qui in chat dicendo "ho caricato X".
