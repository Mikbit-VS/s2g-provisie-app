# Provisie-berekening

Desktopprototype voor het inlezen, verrijken, controleren en exporteren van provisiedata.

## Mappen

- `electron/`: Electron main process en preloadlaag voor het desktopvenster.
- `client/`: React-frontend die in het Electron-venster wordt geladen.
- `client/public/`: publieke statische bestanden voor de client.
- `client/src/`: broncode van de client.
- `client/src/components/`: herbruikbare UI-componenten.
- `client/src/pages/`: pagina's of schermen van de client.
- `client/src/services/`: services voor data, API-koppelingen of businesslogica in de client.
- `python/`: Python-code voor import, verrijking, berekeningen en export.
- `python/importers/`: importmodules voor bronbestanden.
- `python/utils/`: gedeelde hulpfuncties voor Python-code.
- `python/output/`: gegenereerde uitvoer vanuit Python-processen.
- `data/`: projectdata en tijdelijke bestanden.
- `data/imports/`: aangeleverde importbestanden.
- `data/temp/`: tijdelijke tussenbestanden.
- `data/exports/`: gegenereerde exportbestanden zoals `provisie_dataset.xlsx`.
- `docs/`: documentatie van het project.

## Basisbestanden

- `.gitignore`: standaard uitsluitingen voor Node.js, Python en tijdelijke output.
- `package.json`: scripts en dependencies voor Electron, Vite en React.
- `requirements.txt`: Python-afhankelijkheden voor Excel-import en verwerking.

## Huidige Prototypefuncties

- map kiezen en Excel-bestanden tonen
- meerdere `.xls` en `.xlsx` bestanden inlezen
- dataset filteren volgens de bestaande Power Query-basis
- lookup-verrijking vanuit `Artikel Prijzen`
- handmatige keuze van `Prijstype` in de preview
- afgeleide controlekolommen zoals `Vergelijk`, `Prijs 2`, `Brutobedrag 2` en `Bruto-Rel. korting 2`
- export van de verrijkte dataset naar `data/exports/provisie_dataset.xlsx`

## Lokaal starten

1. `npm install`
2. `npm run dev`
