#!/bin/bash
# Avvia Inciampi Geniali (versione desktop con pywebview).
#
# Per usarlo:
#   - Doppio click sul file dal Finder
#   - In alternativa, trascina questo file sul Dock per averlo a portata di mano
#
# Se non parte:
#   - Tasto destro sul file → "Apri" → conferma "Apri" (solo la prima volta:
#     macOS chiede sicurezza per gli script non firmati)
#   - Verifica che siano installati Python 3 e pywebview:
#       python3 -m pip install pywebview

# Vai nella cartella che contiene questo script
cd "$(dirname "$0")" || exit 1

# Lancia l'app
python3 app.py

# Se c'è stato un errore, tieni la finestra aperta per leggere il messaggio
if [ $? -ne 0 ]; then
  echo ""
  echo "─────────────────────────────────────────────"
  echo "L'app si è chiusa con un errore."
  echo "Premi Invio per chiudere questa finestra."
  read -r
fi
