import json
import re
import sys
from pathlib import Path

import pandas as pd


REFERENCE_WORKBOOK = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "imports"
    / "2025 Q4 Provisie - Stand2Gether-EE.xlsx"
)
EXPORT_WORKBOOK = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "exports"
    / "provisie_dataset.xlsx"
)

BASE_COLUMNS = [
    "Jaar",
    "Kwartaal",
    "Evenement",
    "Artikelnr",
    "Omschrijving",
    "Besteld",
    "Stuksprijs",
    "Brutobedrag",
    "Bruto - Rel.korting",
    "Relatiekorting percentage",
]

OUTPUT_COLUMNS = BASE_COLUMNS + [
    "Lookup Match",
    "Groep",
    "Lookup Omschrijving",
    "Artikelprijs",
    "Vergelijk",
    "Prijstype",
    "Prijs 2",
    "Brutobedrag 2",
    "Bruto-Rel. korting 2",
]

EXPORT_COLUMNS = [
    "Jaar",
    "Kwartaal",
    "Evenement",
    "Artikelnr",
    "Omschrijving",
    "Besteld",
    "Stuksprijs",
    "Groep",
    "Artikelprijs",
    "Vergelijk",
    "Prijstype",
    "Prijs 2",
    "Brutobedrag",
    "Brutobedrag 2",
    "Bruto - Rel.korting",
    "Relatiekorting percentage",
    "Bruto-Rel. korting 2",
]


def normalize_value(value):
    if pd.isna(value):
        return ""
    return str(value)


def extract_year_and_quarter(folder_path):
    path_text = str(folder_path)
    search_areas = [folder_path.name] + list(folder_path.parts)

    patterns = [
        re.compile(r"(?P<year>20\d{2})\s+(?P<quarter>Q[1-4])", re.IGNORECASE),
        re.compile(r"(?P<quarter>Q[1-4])\s+(?P<year>20\d{2})", re.IGNORECASE),
    ]

    for area in search_areas + [path_text]:
        for pattern in patterns:
            match = pattern.search(str(area))
            if match:
                return match.group("year"), match.group("quarter").upper()

    return "", ""


def derive_event_name(file_path):
    event_name = file_path.stem.strip()

    if event_name.endswith(" - 2025"):
        event_name = event_name[: -len(" - 2025")]

    return event_name.strip()


def choose_engine(file_path):
    if file_path.suffix.lower() == ".xls":
        return "xlrd"
    return "openpyxl"


def format_file_error(file_path, error):
    engine = choose_engine(file_path)
    message = str(error).strip() or "Onbekende fout"

    if engine == "xlrd" and "xlrd" in message.lower():
        message = (
            f"{message}. Installeer of controleer het package 'xlrd' voor .xls-bestanden."
        )

    if engine == "openpyxl" and "openpyxl" in message.lower():
        message = (
            f"{message}. Installeer of controleer het package 'openpyxl' voor .xlsx-bestanden."
        )

    return f"{type(error).__name__}: {message}"


def parse_numeric_value(value):
    if pd.isna(value):
        return 0.0

    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        normalized = value.strip()
        if normalized == "":
            return 0.0

        normalized = normalized.replace(".", "").replace(",", ".")
        try:
            return float(normalized)
        except ValueError:
            return 0.0

    return 0.0


def has_numeric_value(value):
    if pd.isna(value):
        return False

    if isinstance(value, str) and value.strip() == "":
        return False

    return True


def values_are_close(left, right, tolerance=0.005):
    return abs(left - right) < tolerance


def normalize_join_key(value):
    if pd.isna(value):
        return ""

    if isinstance(value, (int, float)):
        return str(int(float(value)))

    text = str(value).strip()
    if text == "":
        return ""

    normalized = text.replace(",", ".")
    try:
        return str(int(float(normalized)))
    except ValueError:
        return text


def load_excel_rows(file_path, year_value, quarter_value):
    dataframe = pd.read_excel(
        file_path,
        sheet_name=0,
        dtype=object,
        engine=choose_engine(file_path),
    )

    selected_data = {}
    for column_name in BASE_COLUMNS[1:]:
        if column_name in dataframe.columns:
            selected_data[column_name] = dataframe[column_name]
        else:
            selected_data[column_name] = [""] * len(dataframe.index)

    selected_frame = pd.DataFrame(selected_data)
    selected_frame["Evenement"] = derive_event_name(file_path)
    selected_frame["Jaar"] = year_value
    selected_frame["Kwartaal"] = quarter_value
    selected_frame = selected_frame[BASE_COLUMNS]
    return selected_frame


def apply_power_query_filters(dataframe):
    filtered_frame = dataframe.copy()

    artikel_mask = filtered_frame["Artikelnr"].apply(parse_numeric_value) != 0
    stuksprijs_mask = filtered_frame["Stuksprijs"].apply(parse_numeric_value) != 0
    besteld_mask = filtered_frame["Besteld"].apply(parse_numeric_value) > 0

    return filtered_frame.loc[artikel_mask & stuksprijs_mask & besteld_mask].reset_index(
        drop=True
    )


def load_price_lookup():
    raw_frame = pd.read_excel(
        REFERENCE_WORKBOOK,
        sheet_name="Artikel Prijzen",
        header=None,
        dtype=object,
        engine="openpyxl",
    )

    header_row_index = raw_frame.apply(
        lambda row: "Artnr" in [str(value).strip() for value in row.tolist()], axis=1
    ).idxmax()

    header = [
        str(value).strip() if pd.notna(value) else ""
        for value in raw_frame.iloc[header_row_index].tolist()
    ]

    lookup_frame = raw_frame.iloc[header_row_index + 1 :].copy().reset_index(drop=True)
    lookup_frame.columns = header
    lookup_frame = lookup_frame[["Artnr", "Groep", "Omschrijving", "Prijs 2025"]].copy()
    lookup_frame["join_key"] = lookup_frame["Artnr"].apply(normalize_join_key)
    lookup_frame = lookup_frame.loc[lookup_frame["join_key"] != ""].drop_duplicates(
        subset=["join_key"], keep="first"
    )

    return lookup_frame.rename(
        columns={
            "Groep": "Groep",
            "Omschrijving": "Lookup Omschrijving",
            "Prijs 2025": "Artikelprijs",
        }
    )[["join_key", "Groep", "Lookup Omschrijving", "Artikelprijs"]]


def enrich_with_lookup(dataframe, lookup_frame):
    enriched_frame = dataframe.copy()
    enriched_frame["join_key"] = enriched_frame["Artikelnr"].apply(normalize_join_key)

    enriched_frame = enriched_frame.merge(lookup_frame, how="left", on="join_key")
    enriched_frame["Lookup Match"] = enriched_frame["Groep"].apply(
        lambda value: "Ja" if pd.notna(value) and str(value).strip() != "" else "Nee"
    )

    for column_name in ["Groep", "Lookup Omschrijving", "Artikelprijs"]:
        enriched_frame[column_name] = enriched_frame[column_name].fillna("")

    enriched_frame["Prijstype"] = ""
    enriched_frame["Vergelijk"] = enriched_frame.apply(calculate_vergelijk, axis=1)
    enriched_frame["Prijs 2"] = enriched_frame["Stuksprijs"]
    enriched_frame["Brutobedrag 2"] = enriched_frame["Brutobedrag"]
    enriched_frame["Bruto-Rel. korting 2"] = enriched_frame["Bruto - Rel.korting"]

    return enriched_frame[OUTPUT_COLUMNS]


def calculate_vergelijk(row):
    artikelprijs = row["Artikelprijs"]

    if not has_numeric_value(artikelprijs):
        return ""

    stuksprijs_value = parse_numeric_value(row["Stuksprijs"])
    artikelprijs_value = parse_numeric_value(artikelprijs)

    if values_are_close(stuksprijs_value, artikelprijs_value):
        return "Prijs gelijk"

    return "Prijs wijkt af"


def frame_to_preview_rows(dataframe):
    preview_frame = dataframe.head(50).copy().fillna("")
    preview_rows = []

    for _, row in preview_frame.iterrows():
        preview_rows.append(
            {column_name: normalize_value(row[column_name]) for column_name in OUTPUT_COLUMNS}
        )

    return preview_rows


def export_dataset(dataframe):
    export_frame = dataframe[EXPORT_COLUMNS].copy().rename(
        columns={"Relatiekorting percentage": "Relatiekorting"}
    )
    EXPORT_WORKBOOK.parent.mkdir(parents=True, exist_ok=True)
    export_frame.to_excel(EXPORT_WORKBOOK, index=False, engine="openpyxl")
    return str(EXPORT_WORKBOOK)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Geen map-pad ontvangen."}))
        return 1

    folder_path = Path(sys.argv[1])
    if not folder_path.exists() or not folder_path.is_dir():
        print(json.dumps({"success": False, "error": "Gekozen map bestaat niet."}))
        return 1

    excel_files = sorted(
        [
            file_path
            for file_path in folder_path.iterdir()
            if file_path.is_file() and file_path.suffix.lower() in {".xls", ".xlsx"}
        ],
        key=lambda file_path: file_path.name.lower(),
    )

    processed_frames = []
    processed_files = 0
    failed_files = 0
    file_errors = []
    year_value, quarter_value = extract_year_and_quarter(folder_path)

    for file_path in excel_files:
        try:
            processed_frames.append(load_excel_rows(file_path, year_value, quarter_value))
            processed_files += 1
        except Exception as error:
            failed_files += 1
            file_errors.append(
                {
                    "bestand": file_path.name,
                    "melding": format_file_error(file_path, error),
                }
            )

    if processed_frames:
        combined_frame = pd.concat(processed_frames, ignore_index=True)
        filtered_frame = apply_power_query_filters(combined_frame)
        lookup_frame = load_price_lookup()
        final_frame = enrich_with_lookup(filtered_frame, lookup_frame)
        total_rows = int(len(final_frame.index))
        lookup_match_count = int((final_frame["Lookup Match"] == "Ja").sum())
        lookup_no_match_count = int((final_frame["Lookup Match"] == "Nee").sum())
        vergelijk_gelijk_count = int((final_frame["Vergelijk"] == "Prijs gelijk").sum())
        vergelijk_afwijkend_count = int(
            (final_frame["Vergelijk"] == "Prijs wijkt af").sum()
        )
        preview_rows = frame_to_preview_rows(final_frame)
        try:
            export_path = export_dataset(final_frame)
            export_success = True
            export_error = ""
        except Exception as error:
            export_path = str(EXPORT_WORKBOOK)
            export_success = False
            export_error = str(error).strip() or "Onbekende fout bij export."
    else:
        total_rows = 0
        lookup_match_count = 0
        lookup_no_match_count = 0
        vergelijk_gelijk_count = 0
        vergelijk_afwijkend_count = 0
        preview_rows = []
        export_path = str(EXPORT_WORKBOOK)
        export_success = False
        export_error = ""

    result = {
        "success": True,
        "columns": OUTPUT_COLUMNS,
        "processedFiles": processed_files,
        "failedFiles": failed_files,
        "totalRows": total_rows,
        "lookupMatchCount": lookup_match_count,
        "lookupNoMatchCount": lookup_no_match_count,
        "vergelijkGelijkCount": vergelijk_gelijk_count,
        "vergelijkAfwijkendCount": vergelijk_afwijkend_count,
        "previewRows": preview_rows,
        "exportPath": export_path,
        "exportSuccess": export_success,
        "exportError": export_error,
        "fileErrors": file_errors,
    }

    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
