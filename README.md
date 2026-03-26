# Provisie-berekening

Minimale Electron + React basis voor een desktopapp om provisieberekeningen te verwerken.

## Mappen

- `electron/`: Electron main process en preloadlaag voor het desktopvenster.
- `client/`: React-frontend die in het Electron-venster wordt geladen.
- `client/public/`: publieke statische bestanden voor de client.
- `client/src/`: broncode van de client.
- `client/src/components/`: herbruikbare UI-componenten.
- `client/src/pages/`: pagina's of schermen van de client.
- `client/src/services/`: services voor data, API-koppelingen of businesslogica in de client.
- `python/`: Python-code voor verwerking, imports en berekeningen.
- `python/importers/`: importmodules voor bronbestanden.
- `python/utils/`: gedeelde hulpfuncties voor Python-code.
- `python/output/`: gegenereerde uitvoer vanuit Python-processen.
- `data/`: projectdata en tijdelijke bestanden.
- `data/imports/`: aangeleverde importbestanden.
- `data/temp/`: tijdelijke tussenbestanden.
- `data/exports/`: geexporteerde resultaten.
- `docs/`: documentatie van het project.

## Basisbestanden

- `.gitignore`: standaard uitsluitingen voor Node.js, Python en tijdelijke output.
- `package.json`: scripts en dependencies voor Electron, Vite en React.
- `requirements.txt`: placeholder voor Python-afhankelijkheden.

## Lokaal starten

1. `npm install`
2. `npm run dev`
