#!/usr/bin/env python3
"""
Production-grade SBOM Normalizer
Converts SBOM JSON files into normalized tree structure for frontend.
Supports CycloneDX and SPDX formats with fallback handling.
"""

import json
import os
import sys
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from contextlib import contextmanager

# Configuration
@dataclass
class Config:
    input_dir: str = "./frontend/data"
    output_file: str = "./frontend/data/normalized.json"
    log_level: str = "INFO"
    required_services: List[str] = None  # Optional: enforce specific services

CONFIG = Config()

# Setup logging
logging.basicConfig(
    level=getattr(logging, CONFIG.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('sbom-normalizer.log')
    ]
)
logger = logging.getLogger(__name__)

INPUT_DIR = Path(CONFIG.input_dir)
OUTPUT_FILE = Path(CONFIG.output_file)

nodes: List[Dict[str, Any]] = []
edges: List[Dict[str, Any]] = []
sbom_data: Dict[str, List[Dict[str, Any]]] = {}

def add_node(
    node_id: str,
    parent: Optional[str] = None,
    level: int = 0,
    expanded: bool = False,
    has_data: bool = False,
    name: Optional[str] = None
) -> None:
    """Safely add a node to the tree structure."""
    node = {
        "id": node_id,
        "parent": parent,
        "level": level,
        "expanded": expanded,
        "hasData": has_data,
        "name": name if name else node_id
    }
    nodes.append(node)
    logger.debug(f"Added node: {node_id} (level={level}, parent={parent})")

@contextmanager
def safe_file_operation(filepath: Path, mode: str = 'r'):
    """Context manager for safe file operations with error handling."""
    try:
        yield filepath.open(mode, encoding='utf-8')
    except FileNotFoundError:
        logger.error(f"File not found: {filepath}")
        raise
    except PermissionError:
        logger.error(f"Permission denied: {filepath}")
        raise
    except Exception as e:
        logger.error(f"Error reading {filepath}: {str(e)}")
        raise

def validate_sbom_structure(raw_sbom: Dict[str, Any]) -> bool:
    """Validate SBOM structure before processing."""
    if not isinstance(raw_sbom, dict):
        logger.warning("SBOM is not a valid JSON object")
        return False

    # Check for supported formats
    has_cyclonedx = "bomFormat" in raw_sbom or "components" in raw_sbom
    has_spdx = "spdxVersion" in raw_sbom or "packages" in raw_sbom

    if not (has_cyclonedx or has_spdx):
        logger.warning("Unsupported SBOM format")
        return False

    return True

def extract_components(raw_sbom: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract components from SBOM with format detection and fallback."""
    components = []

    if not validate_sbom_structure(raw_sbom):
        logger.warning("Invalid SBOM structure, returning empty components")
        return components

    # CycloneDX primary support
    if "components" in raw_sbom:
        logger.debug("Processing CycloneDX format")
        for comp in raw_sbom.get("components", []):
            try:
                licenses = []
                for license_info in comp.get("licenses", []):
                    if isinstance(license_info, dict) and "license" in license_info:
                        licenses.append(license_info["license"].get("id", "unknown"))
                    elif isinstance(license_info, str):
                        licenses.append(license_info)

                components.append({
                    "component": comp.get("name", "unknown"),
                    "version": comp.get("version", "unknown"),
                    "type": comp.get("type", "library"),
                    "purl": comp.get("purl", ""),
                    "licenses": licenses,
                    "vulnerabilities": comp.get("vulnerabilities", [])
                })
            except Exception as e:
                logger.warning(f"Error processing component {comp.get('name', 'unknown')}: {e}")
                continue

    # SPDX fallback
    elif "packages" in raw_sbom:
        logger.debug("Processing SPDX format")
        for pkg in raw_sbom.get("packages", []):
            try:
                components.append({
                    "component": pkg.get("name", "unknown"),
                    "version": pkg.get("versionInfo", "unknown"),
                    "type": "library",
                    "licenses": [pkg.get("licenseDeclared", "unknown")] if pkg.get("licenseDeclared") else [],
                    "vulnerabilities": [],
                    "purl": pkg.get("downloadLocation", "")
                })
            except Exception as e:
                logger.warning(f"Error processing SPDX package {pkg.get('name', 'unknown')}: {e}")
                continue

    logger.info(f"Extracted {len(components)} components")
    return components

def create_tree_structure() -> None:
    """Create the complete tree structure with error handling."""
    global nodes, edges, sbom_data

    # Ensure input directory exists
    if not INPUT_DIR.exists():
        logger.error(f"Input directory does not exist: {INPUT_DIR}")
        raise FileNotFoundError(f"Input directory missing: {INPUT_DIR}")

    if not INPUT_DIR.is_dir():
        logger.error(f"Input path is not a directory: {INPUT_DIR}")
        raise NotADirectoryError(f"{INPUT_DIR} is not a directory")

    # ROOT nodes (always created)
    add_node("PCFS", level=0, expanded=True)
    add_node("V1.9", parent="PCFS", level=1, expanded=True)

    json_files = list(INPUT_DIR.glob("*.json"))

    if not json_files:
        logger.warning(f"No JSON files found in {INPUT_DIR}")
        return

    logger.info(f"Found {len(json_files)} SBOM files")

    successful_services = 0

    for file_path in json_files:
        service_name = file_path.stem  # filename without extension

        try:
            # LEVEL 2: Service node
            add_node(service_name, parent="V1.9", level=2, hasData=True)

            # LEVEL 3: Version node
            version_node = f"{service_name}_v1.9"
            add_node(version_node, parent=service_name, level=3, expanded=False)

            # Process SBOM
            with safe_file_operation(file_path) as f:
                raw_sbom = json.load(f)

            components = extract_components(raw_sbom)
            sbom_data[service_name] = components

            logger.info(f"✅ Processed {service_name}: {len(components)} components")
            successful_services += 1

        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in {file_path}: {e}")
        except Exception as e:
            logger.error(f"❌ Failed to process {service_name}: {str(e)}")
            continue

    logger.info(f"Successfully processed {successful_services}/{len(json_files)} services")

def save_output() -> None:
    """Save normalized data with atomic write and validation."""
    output_dir = OUTPUT_FILE.parent
    output_dir.mkdir(parents=True, exist_ok=True)

    temp_output = OUTPUT_FILE.with_suffix('.tmp')

    output_data = {
        "nodes": nodes,
        "edges": edges,
        "sbom_data": sbom_data,
        "metadata": {
            "generated_at": "2026-04-20T14:07:00Z",  # Update with actual timestamp
            "total_services": len(sbom_data),
            "total_components": sum(len(components) for components in sbom_data.values()),
            "total_nodes": len(nodes)
        }
    }

    try:
        with safe_file_operation(temp_output, 'w') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        # Atomic move
        temp_output.replace(OUTPUT_FILE)
        logger.info(f"✅ Output saved: {OUTPUT_FILE} ({len(nodes)} nodes, {len(sbom_data)} services)")

    except Exception as e:
        logger.error(f"❌ Failed to save output: {e}")
        if temp_output.exists():
            temp_output.unlink()
        raise

def main() -> int:
    """Main execution with comprehensive error handling."""
    try:
        logger.info("🚀 Starting SBOM Normalizer")
        logger.info(f"Input: {INPUT_DIR}")
        logger.info(f"Output: {OUTPUT_FILE}")

        create_tree_structure()
        save_output()

        logger.info("🎉 SBOM Normalizer completed successfully")
        print("✅ normalized.json generated successfully!")
        return 0

    except KeyboardInterrupt:
        logger.info("🛑 Interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"💥 Fatal error: {str(e)}")
        print(f"❌ Failed: {str(e)}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
