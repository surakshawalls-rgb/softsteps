#!/usr/bin/env python3
"""Validate and safely import the Modern Rugs Excel catalog into Supabase."""

from __future__ import annotations

import argparse
import json
import os
import posixpath
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from typing import Any
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "public" / "Soft_Steps_Modern_Rugs_Product_Catalog_SS1001_SS1035.xlsx"
IMAGE_DIR = ROOT / "public" / "Modern_rugs"
NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
EXPECTED_HEADERS = {
    "Product Code",
    "Product Name",
    "Category",
    "Subcategory",
    "Short Description",
    "Long Description",
    "Design Story",
    "Material",
    "Construction",
    "Style",
    "Primary Color",
    "Shape",
    "Pile Height (mm)",
    "Currency",
    "Base Price",
    "Compare At Price",
    "New Arrival",
    "Best Seller",
    "Customizable",
    "Made To Order",
    "Cart Enabled",
    "Primary Image",
    "Hover Image",
    "Gallery Image 1",
    "Gallery Image 2",
    "Gallery Image 3",
    "Gallery Image 4",
    "Gallery Image 5",
    "Image Alt Text",
    "SEO Title",
    "SEO Description",
    "Keywords/Tags",
}


def text_value(value: Any) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def read_workbook(path: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(path) as workbook:
        root = ElementTree.fromstring(workbook.read("xl/workbook.xml"))
        relationships = ElementTree.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
        targets = {node.attrib["Id"]: node.attrib["Target"] for node in relationships}

        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in workbook.namelist():
            shared = ElementTree.fromstring(workbook.read("xl/sharedStrings.xml"))
            shared_strings = [
                "".join(part.text or "" for part in item.findall(".//main:t", NS))
                for item in shared.findall("main:si", NS)
            ]

        sheet = next(
            (
                item
                for item in root.findall("main:sheets/main:sheet", NS)
                if item.attrib["name"] == "Modern Rugs"
            ),
            None,
        )
        if sheet is None:
            raise ValueError("Workbook is missing the 'Modern Rugs' sheet.")

        target = targets[sheet.attrib[f"{{{NS['rel']}}}id"]]
        sheet_path = posixpath.normpath(
            target.lstrip("/") if target.startswith("/") else posixpath.join("xl", target)
        )
        worksheet = ElementTree.fromstring(workbook.read(sheet_path))

        rows: list[list[str]] = []
        for row in worksheet.findall(".//main:sheetData/main:row", NS):
            cells: list[tuple[str, str]] = []
            for cell in row.findall("main:c", NS):
                reference = cell.attrib["r"]
                column = re.sub(r"\d", "", reference)
                value_node = cell.find("main:v", NS)
                if cell.attrib.get("t") == "inlineStr":
                    value = "".join(part.text or "" for part in cell.findall(".//main:t", NS))
                elif value_node is None:
                    value = ""
                elif cell.attrib.get("t") == "s":
                    value = shared_strings[int(value_node.text or "0")]
                else:
                    value = value_node.text or ""
                cells.append((column, value))

            if cells:
                indexed = dict(cells)
                max_column = max(indexed, key=lambda key: _column_number(key))
                rows.append(
                    [
                        indexed.get(_column_name(index), "")
                        for index in range(1, _column_number(max_column) + 1)
                    ]
                )

        if not rows:
            raise ValueError("The 'Modern Rugs' sheet has no data.")

        headers = [header.strip() for header in rows[0]]
        if "SATUS" in headers and "Status" not in headers:
            headers[headers.index("SATUS")] = "Status"
        missing = sorted(EXPECTED_HEADERS - set(headers))
        if missing:
            raise ValueError(f"Workbook is missing expected headers: {', '.join(missing)}")

        return [
            {headers[index]: value.strip() for index, value in enumerate(row) if index < len(headers)}
            for row in rows[1:]
            if any(value.strip() for value in row)
        ]


def _column_number(name: str) -> int:
    result = 0
    for character in name:
        result = result * 26 + ord(character.upper()) - ord("A") + 1
    return result


def _column_name(number: int) -> str:
    result = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        result = chr(ord("A") + remainder) + result
    return result


def slugify(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", value.casefold())).strip("-")


def flag(value: str | None) -> bool | None:
    normalized = (value or "").casefold()
    if normalized == "yes":
        return True
    if normalized == "no":
        return False
    return None


def number(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value.replace(",", "").strip())
    except ValueError:
        return None


def approved(review_status: str | None) -> bool:
    normalized = (review_status or "").casefold()
    return "verified" in normalized and ("active" in normalized or "approved" in normalized)


def build_records(rows: list[dict[str, str]]) -> tuple[list[dict[str, Any]], list[str]]:
    disk_files = {path.name.casefold(): path.name for path in IMAGE_DIR.iterdir() if path.is_file()}
    issues: list[str] = []
    records: list[dict[str, Any]] = []
    seen_codes: set[str] = set()
    seen_slugs: set[str] = set()

    for row_number, row in enumerate(rows, start=2):
        code = text_value(row.get("Product Code"))
        name = text_value(row.get("Product Name"))
        category = text_value(row.get("Category"))
        subcategory = text_value(row.get("Subcategory"))
        review_status = text_value(row.get("Status"))
        if not code:
            issues.append(f"Row {row_number}: missing product code.")
            continue
        if code in seen_codes:
            issues.append(f"Row {row_number}: duplicate product code {code}.")
        seen_codes.add(code)

        slug = slugify(name) if name else None
        if slug and slug in seen_slugs:
            issues.append(f"Row {row_number}: duplicate product slug {slug}.")
        if slug:
            seen_slugs.add(slug)

        supplied_images: list[tuple[str, str]] = []
        for field, role in (
            ("Primary Image", "primary"),
            ("Hover Image", "hover"),
            ("Gallery Image 1", "gallery"),
            ("Gallery Image 2", "gallery"),
            ("Gallery Image 3", "gallery"),
            ("Gallery Image 4", "gallery"),
            ("Gallery Image 5", "gallery"),
        ):
            requested = text_value(row.get(field))
            if requested:
                actual_name = disk_files.get(requested.casefold())
                if not actual_name:
                    issues.append(f"Row {row_number} ({code}): image not found: {requested}.")
                    continue
                supplied_images.append((actual_name, role))

        primary = next((filename for filename, role in supplied_images if role == "primary"), None)
        grouped_images: list[str] = []
        if primary:
            stem = Path(primary).stem
            match = re.fullmatch(r"(.+)_([0-9]+)", stem)
            if match:
                prefix = match.group(1)
                pattern = re.compile(rf"^{re.escape(prefix)}_([0-9]+)\.[^.]+$", re.IGNORECASE)
                grouped_images = sorted(
                    (
                        filename
                        for filename in disk_files.values()
                        if pattern.fullmatch(filename)
                    ),
                    key=lambda filename: int(pattern.fullmatch(filename).group(1)),  # type: ignore[union-attr]
                )
            else:
                issues.append(f"Row {row_number} ({code}): unrecognized primary-image filename {primary}.")

        ordered_names: list[str] = []
        image_roles: dict[str, str] = {}
        for filename, role in supplied_images:
            key = filename.casefold()
            if key not in {item.casefold() for item in ordered_names}:
                ordered_names.append(filename)
                image_roles[key] = role
        for filename in grouped_images:
            key = filename.casefold()
            if key not in {item.casefold() for item in ordered_names}:
                ordered_names.append(filename)
                image_roles[key] = "gallery"

        primary_exists = bool(primary and primary.casefold() in disk_files)
        if name and not primary_exists:
            issues.append(f"Row {row_number} ({code}): no valid primary image.")

        is_approved = bool(name and category and subcategory and primary_exists and approved(review_status))
        price = number(text_value(row.get("Base Price")))
        currency = text_value(row.get("Currency"))
        cart_flag = flag(text_value(row.get("Cart Enabled"))) is True
        # This workbook has no configured purchasable size/variant policy.
        purchase_eligible = False

        image_alt = text_value(row.get("Image Alt Text")) or name or "Soft Steps rug"
        images = [
            {
                "image_url": f"/Modern_rugs/{filename}",
                "alt_text": image_alt,
                "sort_order": index + 1,
                "is_primary": filename.casefold() == (primary or "").casefold(),
                "image_role": image_roles.get(filename.casefold(), "gallery"),
            }
            for index, filename in enumerate(ordered_names)
        ]
        records.append(
            {
                "product_code": code,
                "name": name,
                "slug": slug,
                "catalog_category": category,
                "subcategory": subcategory,
                "short_description": text_value(row.get("Short Description")),
                "description": text_value(row.get("Long Description")),
                "design_story": text_value(row.get("Design Story")),
                "material_name": text_value(row.get("Material")),
                "construction": text_value(row.get("Construction")),
                "style": text_value(row.get("Style")),
                "primary_color": text_value(row.get("Primary Color")),
                "shape": text_value(row.get("Shape")),
                "pile_height": text_value(row.get("Pile Height (mm)")),
                "currency": currency,
                "base_price": price,
                "compare_at_price": number(text_value(row.get("Compare At Price"))),
                "is_new_arrival": flag(text_value(row.get("New Arrival"))),
                "best_seller": flag(text_value(row.get("Best Seller"))),
                "customizable": flag(text_value(row.get("Customizable"))),
                "made_to_order": flag(text_value(row.get("Made To Order"))),
                "cart_enabled": cart_flag,
                "purchase_eligible": purchase_eligible,
                "review_status": review_status,
                "published": is_approved,
                "status": "active" if is_approved else "draft",
                "seo_title": text_value(row.get("SEO Title")),
                "seo_description": text_value(row.get("SEO Description")),
                "keywords": [
                    item.strip()
                    for item in (text_value(row.get("Keywords/Tags")) or "").split(",")
                    if item.strip()
                ],
                "images": images,
            }
        )

    return records, issues


def supabase_request(
    base_url: str,
    api_key: str,
    table: str,
    method: str,
    query: dict[str, str] | None = None,
    payload: dict[str, Any] | list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    query_string = urllib.parse.urlencode(query or {})
    url = f"{base_url.rstrip('/')}/rest/v1/{table}"
    if query_string:
        url = f"{url}?{query_string}"
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            content = response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase {method} {table} failed ({error.code}): {detail}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Supabase request failed: {error.reason}") from error
    return json.loads(content) if content else []


def safe_upsert(
    base_url: str,
    api_key: str,
    table: str,
    key: str,
    value: str,
    payload: dict[str, Any],
    insert_defaults: dict[str, Any] | None = None,
) -> dict[str, Any]:
    existing = supabase_request(
        base_url, api_key, table, "GET", {"select": "*", key: f"eq.{value}", "limit": "1"}
    )
    if existing:
        row_id = existing[0].get("id")
        if not row_id:
            raise RuntimeError(f"Existing {table} row for {value} has no id.")
        return supabase_request(
            base_url, api_key, table, "PATCH", {"id": f"eq.{row_id}", "select": "*"}, payload
        )[0]
    return supabase_request(
        base_url,
        api_key,
        table,
        "POST",
        {"select": "*"},
        {**(insert_defaults or {}), **payload},
    )[0]


def import_records(records: list[dict[str, Any]]) -> int:
    base_url = os.environ.get("SUPABASE_URL", "").strip()
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not base_url or not service_key:
        raise RuntimeError("--apply requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")

    categories: dict[str, dict[str, Any]] = {}
    materials: dict[str, dict[str, Any]] = {}
    for item in records:
        subcategory = item.get("subcategory")
        if subcategory and subcategory not in categories:
            categories[subcategory] = safe_upsert(
                base_url,
                service_key,
                "categories",
                "slug",
                slugify(subcategory),
                {
                    "name": subcategory,
                    "slug": slugify(subcategory),
                    **(
                        {"image_url": item["images"][0]["image_url"]}
                        if item["images"]
                        else {}
                    ),
                    **(
                        {"is_active": True}
                        if any(
                            record["subcategory"] == subcategory and record["published"]
                            for record in records
                        )
                        else {}
                    ),
                },
                {"is_active": False, "sort_order": 0},
            )
        material_name = item.get("material_name")
        if material_name and material_name.casefold() != "to be confirmed" and material_name not in materials:
            materials[material_name] = safe_upsert(
                base_url,
                service_key,
                "materials",
                "slug",
                slugify(material_name),
                {
                    "name": material_name,
                    "slug": slugify(material_name),
                    **(
                        {"is_active": True}
                        if any(
                            record["material_name"] == material_name and record["published"]
                            for record in records
                        )
                        else {}
                    ),
                },
                {"is_active": False},
            )

    for item in records:
        if not item.get("name") or not item.get("slug"):
            continue
        subcategory = item.get("subcategory")
        category = categories.get(subcategory) if subcategory else None
        material_name = item.get("material_name")
        material = materials.get(material_name) if material_name else None
        payload: dict[str, Any] = {
            "product_code": item["product_code"],
            "name": item["name"],
            "slug": item["slug"],
            "catalog_category": item.get("catalog_category"),
            "subcategory": subcategory,
            "short_description": item.get("short_description"),
            "description": item.get("description"),
            "design_story": item.get("design_story"),
            "material_id": material.get("id") if material else None,
            "construction": item.get("construction"),
            "style": item.get("style"),
            "primary_color": item.get("primary_color"),
            "shape": item.get("shape"),
            "pile_height": item.get("pile_height"),
            "currency": item.get("currency"),
            "base_price": item.get("base_price"),
            "compare_at_price": item.get("compare_at_price"),
            "is_new_arrival": item.get("is_new_arrival"),
            "best_seller": item.get("best_seller"),
            "customizable": item.get("customizable"),
            "made_to_order": item.get("made_to_order"),
            "cart_enabled": item.get("cart_enabled"),
            "purchase_eligible": item.get("purchase_eligible"),
            "review_status": item.get("review_status"),
            "seo_title": item.get("seo_title"),
            "seo_description": item.get("seo_description"),
            "keywords": item.get("keywords"),
        }
        if category:
            payload["category_id"] = category.get("id")
        # Omit all blank workbook values so a refresh cannot erase reviewed fields.
        payload = {key: value for key, value in payload.items() if value is not None and value != []}
        product = safe_upsert(
            base_url,
            service_key,
            "products",
            "product_code",
            item["product_code"],
            {
            **payload,
            **({"status": "active", "published": True} if item["published"] else {}),
            },
            {"status": "draft", "published": False},
        )
        product_id = product.get("id")
        if not product_id:
            raise RuntimeError(f"Upserted product {item['product_code']} has no id.")

        for image in item["images"]:
            existing_image = supabase_request(
                base_url,
                service_key,
                "product_images",
                "GET",
                {
                    "select": "id",
                    "product_id": f"eq.{product_id}",
                    "image_url": f"eq.{image['image_url']}",
                    "limit": "1",
                },
            )
            image_payload = {"product_id": product_id, **image}
            if existing_image:
                supabase_request(
                    base_url,
                    service_key,
                    "PATCH",
                    {"id": f"eq.{existing_image[0]['id']}"},
                    image_payload,
                )
            else:
                supabase_request(
                    base_url, service_key, "POST", {"select": "id"}, image_payload
                )
    return sum(bool(item.get("name")) for item in records)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Upsert validated records into Supabase using the service-role key.",
    )
    parser.add_argument(
        "--report",
        type=Path,
        help="Write the validation report as JSON to this path.",
    )
    args = parser.parse_args()

    try:
        rows = read_workbook(WORKBOOK)
        records, issues = build_records(rows)
    except (OSError, KeyError, ValueError, zipfile.BadZipFile) as error:
        print(f"Catalog validation failed: {error}", file=sys.stderr)
        return 1

    report = {
        "workbook": str(WORKBOOK.relative_to(ROOT)),
        "rows": len(records),
        "named_products": sum(bool(item["name"]) for item in records),
        "publication_eligible": sum(bool(item["published"]) for item in records),
        "pending_review": sum(
            bool(item["name"]) and not item["published"] for item in records
        ),
        "pending_product_data": sum(not item["name"] for item in records),
        "image_count": sum(len(item["images"]) for item in records),
        "products": [
            {
                "product_code": item["product_code"],
                "name": item["name"],
                "status": item["status"],
                "review_status": item["review_status"],
                "images": [image["image_url"] for image in item["images"]],
                "purchase_eligible": item["purchase_eligible"],
            }
            for item in records
        ],
        "issues": issues,
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if args.report:
        args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if issues:
        print(f"Validation found {len(issues)} issue(s); no database changes made.", file=sys.stderr)
        return 1

    if args.apply:
        try:
            count = import_records(records)
        except (RuntimeError, IndexError, KeyError) as error:
            print(f"Import failed: {error}", file=sys.stderr)
            return 1
        print(f"Upserted {count} named catalog records. Unapproved products remain drafts.")
    else:
        print("Dry run only; no database changes made. Use --apply after running the SQL migration.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
