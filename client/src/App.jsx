import { useState } from "react";
import "./styles.css";

const PREVIEW_COLUMNS = [
  { key: "Jaar", label: "Jaar" },
  { key: "Kwartaal", label: "Kwartaal" },
  { key: "Evenement", label: "Evenement" },
  { key: "Artikelnr", label: "Artikelnr" },
  { key: "Omschrijving", label: "Omschrijving" },
  { key: "Besteld", label: "Besteld" },
  { key: "Stuksprijs", label: "Stuksprijs" },
  { key: "Groep", label: "Groep" },
  { key: "Artikelprijs", label: "Artikelprijs" },
  { key: "Vergelijk", label: "Vergelijk" },
  { key: "Prijstype", label: "Prijstype" },
  { key: "Prijs 2", label: "Prijs 2" },
  { key: "Brutobedrag", label: "Brutobedrag" },
  { key: "Brutobedrag 2", label: "Brutobedrag 2" },
  { key: "Bruto - Rel.korting", label: "Bruto - Rel.korting" },
  { key: "Relatiekorting percentage", label: "Relatiekorting" },
  { key: "Bruto-Rel. korting 2", label: "Bruto-Rel. korting 2" }
];

const MONEY_COLUMNS = new Set([
  "Stuksprijs",
  "Artikelprijs",
  "Prijs 2",
  "Brutobedrag",
  "Brutobedrag 2",
  "Bruto - Rel.korting",
  "Bruto-Rel. korting 2"
]);

const PERCENTAGE_COLUMNS = new Set(["Relatiekorting percentage"]);

export default function App() {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [excelFiles, setExcelFiles] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const [importError, setImportError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [prijsTypeByRow, setPrijsTypeByRow] = useState({});

  async function handleChooseFolder() {
    const folderPath = await window.electronAPI.selectFolder();

    if (folderPath) {
      setSelectedFolder(folderPath);
      const files = await window.electronAPI.getExcelFiles(folderPath);
      setExcelFiles(files);
      setImportSummary(null);
      setImportError("");
      setPrijsTypeByRow({});
    }
  }

  async function handleImportExcelData() {
    if (!selectedFolder) {
      return;
    }

    setIsImporting(true);
    setImportError("");

    const result = await window.electronAPI.importExcelData(selectedFolder);

    if (result.success) {
      setImportSummary(result);
      setPrijsTypeByRow({});
    } else {
      setImportSummary(null);
      setImportError(result.error || "De Excel-import is mislukt.");
    }

    setIsImporting(false);
  }
  const previewRows = importSummary?.previewRows ?? [];

  function getRowKey(row, index) {
    return `${row.Evenement ?? ""}__${row.Artikelnr ?? ""}__${index}`;
  }

  function handlePrijsTypeChange(rowKey, value) {
    setPrijsTypeByRow((current) => ({
      ...current,
      [rowKey]: value
    }));
  }

  function parseNumericValue(value) {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === "number") {
      return value;
    }

    const normalized = String(value).trim();
    if (normalized === "") {
      return 0;
    }

    const asNumber = Number(normalized.replace(",", "."));
    return Number.isFinite(asNumber) ? asNumber : 0;
  }

  function formatCurrency(value) {
    if (value === null || value === undefined) {
      return "";
    }

    const normalized = String(value).trim();
    if (normalized === "") {
      return "";
    }

    const amount = parseNumericValue(value);

    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function formatPercentage(value) {
    if (value === null || value === undefined) {
      return "";
    }

    const normalized = String(value).trim();
    if (normalized === "") {
      return "";
    }

    const percentage = parseNumericValue(value);
    return `${percentage}%`;
  }

  function valuesAreClose(left, right, tolerance = 0.005) {
    return Math.abs(left - right) < tolerance;
  }

  function getResolvedPrijsType(row, index) {
    return prijsTypeByRow[getRowKey(row, index)] ?? row.Prijstype ?? "";
  }

  function getResolvedVergelijk(row) {
    if (!row.Artikelprijs) {
      return "";
    }

    const stuksprijs = parseNumericValue(row.Stuksprijs);
    const artikelprijs = parseNumericValue(row.Artikelprijs);

    return valuesAreClose(stuksprijs, artikelprijs)
      ? "Prijs gelijk"
      : "Prijs wijkt af";
  }

  function getResolvedPrijs2(row, index) {
    const prijsType = getResolvedPrijsType(row, index);
    return prijsType === "Artikelprijs" ? row.Artikelprijs ?? "" : row.Stuksprijs ?? "";
  }

  function getResolvedBrutobedrag2(row, index) {
    const prijsType = getResolvedPrijsType(row, index);

    if (prijsType !== "Artikelprijs") {
      return row["Brutobedrag 2"] ?? row.Brutobedrag ?? "";
    }

    const artikelprijs = parseNumericValue(row.Artikelprijs);
    const besteld = parseNumericValue(row.Besteld);
    const bedrag = artikelprijs * besteld;

    return Number.isFinite(bedrag) ? String(bedrag) : "";
  }

  function getResolvedBrutoRelKorting2(row, index) {
    const prijsType = getResolvedPrijsType(row, index);

    if (prijsType !== "Artikelprijs") {
      return row["Bruto-Rel. korting 2"] ?? row["Bruto - Rel.korting"] ?? "";
    }

    const brutobedrag2 = parseNumericValue(getResolvedBrutobedrag2(row, index));
    const relatiekortingPercentage = parseNumericValue(
      row["Relatiekorting percentage"]
    );
    const bedrag =
      (brutobedrag2 * (100 - relatiekortingPercentage)) / 100;

    return Number.isFinite(bedrag) ? String(bedrag) : "";
  }

  function getDisplayValue(row, index, columnKey) {
    if (columnKey === "Prijstype") {
      return null;
    }

    if (columnKey === "Vergelijk") {
      return getResolvedVergelijk(row);
    }

    if (columnKey === "Prijs 2") {
      return formatCurrency(getResolvedPrijs2(row, index));
    }

    if (columnKey === "Brutobedrag 2") {
      return formatCurrency(getResolvedBrutobedrag2(row, index));
    }

    if (columnKey === "Bruto-Rel. korting 2") {
      return formatCurrency(getResolvedBrutoRelKorting2(row, index));
    }

    if (MONEY_COLUMNS.has(columnKey)) {
      return formatCurrency(row[columnKey]);
    }

    if (PERCENTAGE_COLUMNS.has(columnKey)) {
      return formatPercentage(row[columnKey]);
    }

    return row[columnKey] ?? "";
  }

  return (
    <main className="app">
      <section className="panel">
        <h1>Provisie berekening</h1>
        <p>Prototype fase 1</p>
        <p>Hier komt later de import van Excel-bestanden</p>
        <button className="button" type="button" onClick={handleChooseFolder}>
          Map kiezen
        </button>
        <p className="folder-path">
          {selectedFolder
            ? `Gekozen map: ${selectedFolder}`
            : "Nog geen map gekozen"}
        </p>
        {selectedFolder ? (
          <section className="results">
            <p className="results-count">
              Aantal gevonden Excel-bestanden: {excelFiles.length}
            </p>
            {excelFiles.length > 0 ? (
              <ul className="file-list">
                {excelFiles.map((fileName) => (
                  <li key={fileName}>{fileName}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                Geen Excel-bestanden gevonden in deze map.
              </p>
            )}
          </section>
        ) : null}
        <button
          className="button button-secondary"
          type="button"
          onClick={handleImportExcelData}
          disabled={!selectedFolder || excelFiles.length === 0 || isImporting}
        >
          {isImporting ? "Bezig met lezen..." : "Lees Excel-data"}
        </button>
        {importError ? <p className="error-text">{importError}</p> : null}
        {importSummary ? (
          <section className="results import-results">
            <p className="results-count">
              Aantal gevonden Excel-bestanden: {excelFiles.length}
            </p>
            <p>Succesvol verwerkte bestanden: {importSummary.processedFiles}</p>
            <p>Bestanden met fout: {importSummary.failedFiles}</p>
            <p>Totaal aantal regels in einddataset: {importSummary.totalRows}</p>
            <p>Aantal regels met lookup-match: {importSummary.lookupMatchCount}</p>
            <p>
              Aantal regels zonder lookup-match:{" "}
              {importSummary.lookupNoMatchCount}
            </p>
            <p>Aantal regels met Vergelijk = Prijs gelijk: {importSummary.vergelijkGelijkCount}</p>
            <p>
              Aantal regels met Vergelijk = Prijs wijkt af:{" "}
              {importSummary.vergelijkAfwijkendCount}
            </p>
            <p>
              Export opgeslagen: {importSummary.exportSuccess ? "Ja" : "Nee"}
            </p>
            <p>Exportbestand: {importSummary.exportPath}</p>
            {importSummary.exportError ? (
              <p className="error-text">{importSummary.exportError}</p>
            ) : null}
            {importSummary.fileErrors.length > 0 ? (
              <div className="error-list-block">
                <h2>Foutmeldingen</h2>
                <ul className="error-list">
                  {importSummary.fileErrors.map((fileError) => (
                    <li key={`${fileError.bestand}-${fileError.melding}`}>
                      <strong>{fileError.bestand}</strong>: {fileError.melding}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="preview-block">
              <h2>Preview eerste 50 regels</h2>
              {previewRows.length > 0 ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        {PREVIEW_COLUMNS.map((column) => (
                          <th key={column.key}>{column.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, index) => (
                        <tr key={`preview-${index}`}>
                          {PREVIEW_COLUMNS.map((column) => (
                            <td key={`${column.key}-${index}`}>
                              {column.key === "Prijstype" ? (
                                <select
                                  className="table-select"
                                  value={
                                    getResolvedPrijsType(row, index)
                                  }
                                  onChange={(event) =>
                                    handlePrijsTypeChange(
                                      getRowKey(row, index),
                                      event.target.value
                                    )
                                  }
                                >
                                  <option value=""> </option>
                                  <option value="Stukprijs">Stukprijs</option>
                                  <option value="Artikelprijs">Artikelprijs</option>
                                </select>
                              ) : (
                                getDisplayValue(row, index, column.key)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">
                  Er zijn geen regels beschikbaar voor preview.
                </p>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
