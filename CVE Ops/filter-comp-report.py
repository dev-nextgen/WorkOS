#!/usr/bin/env python3
"""
Date: 12th, March, 2025
Author  : Aravind G
Email   : aravind@hpe.com
summery : Enterprise Excel Component Batch Filter
Description: PCEs + AIE SecOps CVE Operations Cog, reads a list of components from list.txt, filters an Excel vulnerability report,
and generates a separate report per component.
Source: Compatible with openpyxl 3.0.9
"""

import argparse
import logging
from pathlib import Path
from typing import List
import pandas as pd
from openpyxl import load_workbook

# !~~ SECOPS Components ~~!
REQUIRED_COLUMNS = [
    "Topic",
    "CVEID",
    "Repo Name",
    "Component",
    "Image Name",
    "Issue Key",
    "Issue id",
    "Custom field (Requested For)",
]

# !~~ SECOPS LOGGING | Audit & Monitoring ~~!
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# !~~ SECOPS Excel Loader ~~!
def load_excel_openpyxl(file_path: Path) -> pd.DataFrame:
    """
    Load Excel using openpyxl directly
    (compatible with openpyxl 3.0.9 environments)
    """

    logging.info(f"Loading Excel file: {file_path}")

    wb = load_workbook(file_path, data_only=True)
    ws = wb.active

    data = list(ws.values)

    headers = data[0]
    rows = data[1:]

    df = pd.DataFrame(rows, columns=headers)

    logging.info(f"Total rows loaded: {len(df)}")

    return df

# !~~ SECOPS Component List Loader ~~!
def load_component_list(list_file: Path) -> List[str]:

    logging.info(f"Loading component list from: {list_file}")

    components = []

    with open(list_file, "r") as f:
        for line in f:
            comp = line.strip()
            if comp:
                components.append(comp)

    logging.info(f"Total components loaded: {len(components)}")

    return components

# !~~ Column Resolver ~~!
def resolve_columns(df: pd.DataFrame):

    column_map = {c.lower(): c for c in df.columns}

    resolved = []

    for col in REQUIRED_COLUMNS:

        key = col.lower()

        if key not in column_map:
            raise ValueError(f"Missing required column: {col}")

        resolved.append(column_map[key])

    return resolved

# !~~ Column Filtering ~~!
def filter_component(df: pd.DataFrame, component: str) -> pd.DataFrame:

    component_col = next(c for c in df.columns if c.lower() == "component")

    filtered = df[
        df[component_col]
        .astype(str)
        .str.contains(component, case=False, na=False)
    ]

    logging.info(f"{component} → {len(filtered)} rows")

    return filtered

# !~~ Report Writer ~~!
def write_report(df: pd.DataFrame, columns: List[str], output_file: Path):
    df = df[columns]
    with pd.ExcelWriter(output_file, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Filtered_Report")
    logging.info(f"Report generated: {output_file}")

# !~~ Main Processing Pipeline ~~!
def run_pipeline(input_file: Path, component_file: Path, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    df = load_excel_openpyxl(input_file)
    columns = resolve_columns(df)
    components = load_component_list(component_file)
    for component in components:
        filtered = filter_component(df, component)
        if filtered.empty:
            logging.warning(f"No data found for component: {component}")
            continue
        safe_name = component.replace(" ", "_")
        output_file = output_dir / f"{safe_name}_report.xlsx"

        write_report(filtered, columns, output_file)


# !~~ Main ~~!
def main():
    input_data="AIECDATA.xlsx"
    output_file= "output"
    components = "component-list.txt"
    print("START :: Batch filter Excel report by components list")
    run_pipeline(
        Path(input_data),
        Path(components),
        Path(output_file)
    )
    print("END :: Batch filter Excel report by components list")

if __name__ == "__main__":
    main()
