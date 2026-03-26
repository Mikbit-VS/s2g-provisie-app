# Provisie berekening

## Projectdoel
Deze app vervangt stap voor stap een bestaand Power Query + Excel-proces voor provisieberekeningen.

## Belangrijke context
De app wordt lokaal gebruikt in VS Code / Codex en draait als desktop-app met Electron.
Hosting is voorlopig niet nodig.

## Technische richting
- Electron voor de desktop-shell
- React voor de interface
- Python voor het inlezen en verwerken van Excel-bestanden

## Bron van waarheid voor de eerste dataset
De eerste dataset moet aansluiten op de bestaande Power Query-output.

## Huidige Power Query-logica
De bestaande Power Query doet in hoofdlijnen dit:
- combineert alle Excel-bestanden in een map
- behoudt alleen relevante kolommen
- gebruikt de bestandsnaam als `Evenement`
- filtert daarna op:
  - `Artikelnr <> 0`
  - `Stuksprijs <> 0`
  - `Besteld > 0`

## Eerste dataset voor de app
De eerste bruikbare dataset in de app moet voorlopig alleen deze kolommen bevatten:
- `Evenement`
- `Artikelnr`
- `Omschrijving`
- `Besteld`
- `Stuksprijs`
- `Brutobedrag`
- `Bruto - Rel.korting`
- `Relatiekorting percentage`

## Werkwijze
- werk stap voor stap
- houd prototypes klein en controleerbaar
- maak liever kleine, werkende tussenstappen dan grote sprongen
- wijzig alleen wat voor de gevraagde stap nodig is
- leg kort uit welke bestanden zijn aangepast
- leg kort uit hoe de gebruiker de stap test

## Belangrijke instructie voor Codex
Voeg geen extra interpretatieve logica toe tenzij daar expliciet om gevraagd wordt.

Dus voorlopig:
- geen extra businesslogica
- geen provisieberekening
- geen database-logica tenzij expliciet gevraagd
- geen contextlogica voor kopregels tenzij expliciet gevraagd
- geen extra classificaties of slimme afleidingen tenzij expliciet gevraagd

## Voorkeur bij twijfel
Als er twijfel is tussen:
- werken vanuit ruwe brondata
of
- werken volgens de bestaande Power Query-output

kies dan voorlopig voor:
**werken volgens de bestaande Power Query-output**

## UI-voorkeur
Voor prototypes geldt:
- functioneel en controleerbaar is belangrijker dan mooi
- eenvoudige tabellen en samenvattingen zijn prima
- geen onnodige styling of complexiteit toevoegen