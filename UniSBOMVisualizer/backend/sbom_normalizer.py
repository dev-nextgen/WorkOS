import json
import os

INPUT_DIR = "./frontend/data/sbom.json"
OUTPUT_FILE = "./frontend/data/normalized.json"

nodes = []
edges = []
sbom_data = {}

def add_node(id, parent=None, level=0, expanded=False, hasData=False, name=None):
    nodes.append({
        "id": id,
        "parent": parent,
        "level": level,
        "expanded": expanded,
        "hasData": hasData,
        "name": name if name else id
    })

# ROOT
add_node("PCFS", level=0, expanded=True)

# VERSION
add_node("V1.9", parent="PCFS", level=1, expanded=True)

def extract_components(raw_sbom):
    components = []

    # CycloneDX
    if "components" in raw_sbom:
        for comp in raw_sbom.get("components", []):
            components.append({
                "component": comp.get("name"),
                "version": comp.get("version"),
                "type": comp.get("type"),
                "purl": comp.get("purl"),
                "licenses": [
                    l.get("license", {}).get("id")
                    for l in comp.get("licenses", [])
                    if l.get("license")
                ],
                "vulnerabilities": comp.get("vulnerabilities", [])
            })

    # SPDX fallback
    elif "packages" in raw_sbom:
        for pkg in raw_sbom.get("packages", []):
            components.append({
                "component": pkg.get("name"),
                "version": pkg.get("versionInfo"),
                "type": "library",
                "licenses": [pkg.get("licenseDeclared")],
                "vulnerabilities": []
            })

    return components


# PROCESS SBOM FILES
for file in os.listdir(INPUT_DIR):
    if not file.endswith(".json"):
        continue

    service = file.replace(".json", "")

    # LEVEL 2
    add_node(service, parent="V1.9", level=2, hasData=True)

    # LEVEL 3 VERSION NODE
    version_node = f"{service}_v1.9"
    add_node(version_node, parent=service, level=3, expanded=False)

    # LOAD SBOM
    with open(os.path.join(INPUT_DIR, file)) as f:
        raw_sbom = json.load(f)

    sbom_data[service] = extract_components(raw_sbom)


# OUTPUT
output = {
    "nodes": nodes,
    "edges": edges,
    "sbom_data": sbom_data
}

with open(OUTPUT_FILE, "w") as f:
    json.dump(output, f, indent=2)

print("✅ normalized.json generated")
