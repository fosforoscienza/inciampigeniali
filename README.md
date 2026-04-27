# Inciampi Geniali

Sito statico sulla serendipità: introduzione + planisfero disegnato a mano con pin animati sulle località delle principali scoperte serendipiche.

## Avvio in locale

Il progetto è HTML/CSS/JS puro. Per evitare blocchi del browser sul caricamento di file locali (`fetch` di SVG e JSON), serve un piccolo server statico.

### Opzione 1 — Python (già installato su Mac/Linux)
```bash
cd inciampigeniali
python3 -m http.server 8000
```
Apri http://localhost:8000

### Opzione 2 — Node
```bash
npx serve
```

## Struttura
```
.
├── index.html              # Pagina con le due sezioni
├── css/style.css           # Stili
├── js/app.js               # Logica: carica mappa, renderizza pin, gestisce modal
├── data/discoveries.json   # Elenco scoperte (titolo, autore, foto, riassunto, posizione)
├── assets/
│   ├── map/planisfero.svg  # SVG del planisfero (da Canva)
│   └── photos/             # Ritratti degli autori delle scoperte
└── README.md
```

## Come aggiungere una scoperta
Modifica `data/discoveries.json`. Ogni voce:
```json
{
  "id": "fleming-penicillina",
  "title": "La penicillina",
  "author": "Alexander Fleming",
  "year": 1928,
  "location": "Londra, Regno Unito",
  "photo": "assets/photos/fleming.jpg",
  "summary": "Riassunto ≤ 500 caratteri.",
  "xPct": 47.5,
  "yPct": 32.0
}
```

`xPct` e `yPct` sono la posizione del pin in percentuale rispetto al contenitore della mappa (0,0 = angolo in alto a sinistra, 100,100 = in basso a destra). Si calibrano a occhio una volta caricato il planisfero.
