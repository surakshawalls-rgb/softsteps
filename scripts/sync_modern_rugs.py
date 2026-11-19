#!/usr/bin/env python3
"""Preflight and synchronize the SS_1001–SS_1035 workbook rows with Supabase."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "public" / "new carpet" / "Soft_Steps_Modern_Rugs_Standardized_Updated 222.xlsx"
BACKUP = ROOT / "supabase" / "backups" / "modern-rugs-before-sync-2026-11-19.json"
CATEGORY_ID = "de4abd8d-f52b-4ab1-af4b-81e1c69089ff"
MATERIAL_IDS = {
    "Wool": "404e7a75-16ab-45f9-9b70-f18f29d4d063",
    "Wool & Viscose": "0acd9c73-2e27-446e-a534-52cfb6845d11",
}
IMAGE_FIELDS = (
    ("Primary Image", "product", 0, True),
    ("Hover Image", "hover", 1, False),
    ("Gallery Image 1", "product", 2, False),
    ("Gallery Image 2", "product", 3, False),
    ("Gallery Image 3", "product", 4, False),
    ("Gallery Image 4", "product", 5, False),
    ("Gallery Image 5", "product", 6, False),
)


def supabase_config() -> tuple[str, str]:
    env_path = ROOT / "src" / "environments" / "environment.ts"
    source = env_path.read_text(encoding="utf-8")
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_ANON_KEY", "").strip()
    if not url:
        found = re.search(r"url:\s*'([^']+)'", source)
        url = found.group(1) if found else ""
    if not key:
        found = re.search(r"publishableKey:\s*'([^']+)'", source)
        key = found.group(1) if found else ""
    if not url or not key:
        raise RuntimeError("Supabase URL and publishable key could not be read from the app config.")
    return url.rstrip("/"), key


def text(value: Any) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def number(value: Any) -> float | None:
    if value is None or str(value).strip() == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace(",", "").strip().upper().removesuffix("MM"))
    except ValueError:
        return None


def yes_no(value: Any) -> bool | None:
    normalized = str(value or "").strip().casefold()
    if normalized == "yes":
        return True
    if normalized == "no":
        return False
    return None


def slugify(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", value.casefold())).strip("-")


def read_records() -> tuple[list[dict[str, Any]], list[str]]:
    workbook = load_workbook(WORKBOOK, read_only=True, data_only=True)
    if "Product Catalog" not in workbook.sheetnames:
        raise ValueError("Workbook must contain the 'Product Catalog' sheet.")
    sheet = workbook["Product Catalog"]
    iterator = sheet.iter_rows(values_only=True)
    headers = [text(value) or "" for value in next(iterator)]
    missing = sorted(set(
        [
            "Product Code", "Product Name", "Category", "Subcategory", "Short Description",
            "Long Description", "Design Story", "Material", "Construction", "Style",
            "Primary Color", "Shape", "Pile Height (mm)", "Currency", "New Arrival",
            "Best Seller", "Customizable", "Made To Order", "Cart Enabled", "Image Alt Text",
            "SEO Title", "SEO Description", "Keywords/Tags", "SATUS", "size(3x5)",
            "warranty and return policy", "Freight", *(field for field, *_ in IMAGE_FIELDS),
        ]
    ) - set(headers))
    if missing:
        raise ValueError("Workbook is missing headers: " + ", ".join(missing))
    col = {name: headers.index(name) for name in headers}

    records: list[dict[str, Any]] = []
    for row_number, row in enumerate(iterator, start=2):
        code = text(row[col["Product Code"]]) if col["Product Code"] < len(row) else None
        if not code:
            continue
        name = text(row[col["Product Name"]]) if col["Product Name"] < len(row) else None
        category_name = text(row[col["Category"]])
        subcategory = text(row[col["Subcategory"]])
        raw_status = text(row[col["SATUS"]])
        price = number(row[col["size(3x5)"]])
        alt_text = text(row[col["Image Alt Text"]]) or name or code
        images: list[dict[str, Any]] = []
        for field, image_type, sort_order, is_primary in IMAGE_FIELDS:
            filename = text(row[col[field]]) if col[field] < len(row) else None
            if filename:
                images.append({
                    "filename": filename,
                    "image_url": "",  # Filled after storage-object preflight.
                    "alt_text": alt_text,
                    "image_type": image_type,
                    "sort_order": sort_order,
                    "is_primary": is_primary,
                })
        slug_source = name if name and name.casefold() != "product image required" else code
        tags = [part.strip() for part in (text(row[col["Keywords/Tags"]]) or "").split(",") if part.strip()]
        records.append({
            "row_number": row_number,
            "product_code": code,
            "name": name or "Product image required",
            "slug": slugify(slug_source or code),
            "short_description": text(row[col["Short Description"]]),
            "description": text(row[col["Long Description"]]),
            "design_story": text(row[col["Design Story"]]),
            "category_name": category_name,
            "subcategory": subcategory,
            "material_name": text(row[col["Material"]]),
            "construction": text(row[col["Construction"]]),
            "style": text(row[col["Style"]]),
            "primary_color": text(row[col["Primary Color"]]),
            "shape": text(row[col["Shape"]]),
            "pile_height_mm": number(row[col["Pile Height (mm)"]]),
            "currency": text(row[col["Currency"]]) or "INR",
            "base_price": price,
            "size_3x5_price": price,
            "is_new_arrival": yes_no(row[col["New Arrival"]]),
            "is_best_seller": yes_no(row[col["Best Seller"]]),
            "is_customizable": yes_no(row[col["Customizable"]]),
            "made_to_order": yes_no(row[col["Made To Order"]]),
            "cart_enabled": yes_no(row[col["Cart Enabled"]]),
            "meta_title": text(row[col["SEO Title"]]),
            "meta_description": text(row[col["SEO Description"]]),
            "tags": tags,
            "spreadsheet_status": raw_status,
            "warranty_policy": text(row[col["warranty and return policy"]]),
            "freight_policy": text(row[col["Freight"]]),
            "images": images,
        })

    expected_codes = {f"SS_{value}" for value in range(1001, 1036)}
    actual_codes = [record["product_code"] for record in records]
    if len(actual_codes) != len(set(actual_codes)):
        raise ValueError("Workbook contains duplicate product codes.")
    missing_codes = sorted(expected_codes - set(actual_codes))
    extra_codes = sorted(set(actual_codes) - expected_codes)
    if missing_codes or extra_codes or len(records) != 35:
        raise ValueError(f"Expected 35 unique SS_1001–SS_1035 rows; missing={missing_codes}, extra={extra_codes}.")
    return records, []


def request(base_url: str, api_key: str, table: str, method: str, query: dict[str, str] | None = None,
            payload: Any = None, extra_headers: dict[str, str] | None = None) -> list[dict[str, Any]]:
    endpoint = f"{base_url}/rest/v1/{table}"
    if query:
        endpoint += "?" + urllib.parse.urlencode(query)
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        **(extra_headers or {}),
    }
    req = urllib.request.Request(endpoint, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase {method} {table} failed ({error.code}): {detail}") from error
    return json.loads(body) if body else []


def verify_object(base_url: str, anon_key: str, filename: str) -> tuple[str, int]:
    url = f"{base_url}/storage/v1/object/public/product-images/modern-rugs/{urllib.parse.quote(filename)}"
    req = urllib.request.Request(url, headers={"apikey": anon_key, "Range": "bytes=0-0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            response.read(1)
            return filename, response.status
    except urllib.error.HTTPError as error:
        error.read(128)
        return filename, error.code
    except urllib.error.URLError:
        return filename, 0


def verify_storage(records: list[dict[str, Any]], base_url: str, anon_key: str) -> tuple[list[str], list[str]]:
    names = sorted({image["filename"] for record in records for image in record["images"]})
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        results = dict(pool.map(lambda name: verify_object(base_url, anon_key, name), names))
    missing = [name for name, status in results.items() if status != 206]
    warnings = [f"Storage object missing; relation omitted: {name}" for name in missing]
    for record in records:
        for image in record["images"]:
            if results.get(image["filename"]) == 206:
                image["image_url"] = f"{base_url}/storage/v1/object/public/product-images/modern-rugs/{urllib.parse.quote(image['filename'])}"
        primary = any(image["is_primary"] and image["image_url"] for image in record["images"])
        record["status"] = "active" if primary else "draft"
        record["images"] = [image for image in record["images"] if image["image_url"]]
    active_count = sum(record["status"] == "active" for record in records)
    if active_count != 32:
        raise RuntimeError(f"Expected 32 products with verified primary images; found {active_count}.")
    return missing, warnings


def validate_database(base_url: str, anon_key: str) -> tuple[dict[str, dict[str, Any]], list[str]]:
    category = request(base_url, anon_key, "categories", "GET", {
        "select": "id,name,slug,is_active", "id": f"eq.{CATEGORY_ID}", "limit": "2",
    })
    if len(category) != 1 or category[0].get("slug") != "modern-rugs" or not category[0].get("is_active"):
        raise RuntimeError("The expected active Modern Rugs category is not present in Supabase.")

    materials = request(base_url, anon_key, "materials", "GET", {
        "select": "id,name,is_active", "id": "in.(" + ",".join(MATERIAL_IDS.values()) + ")",
    })
    materials_by_name = {item["name"]: item for item in materials}
    for name, expected_id in MATERIAL_IDS.items():
        row = materials_by_name.get(name)
        if not row or row.get("id") != expected_id or not row.get("is_active"):
            raise RuntimeError(f"Material {name!r} does not resolve to its expected active row.")

    codes = [f"SS_{value}" for value in range(1001, 1036)]
    products = request(base_url, anon_key, "products", "GET", {
        "select": "id,product_code,name,status,category_id,material_id,base_price,specifications",
        "product_code": "in.(" + ",".join(codes) + ")",
        "order": "product_code",
    })
    by_code: dict[str, dict[str, Any]] = {}
    duplicates: list[str] = []
    for product in products:
        code = product.get("product_code")
        if code in by_code:
            duplicates.append(code)
        else:
            by_code[code] = product
    if duplicates:
        raise RuntimeError("Duplicate product_code rows found: " + ", ".join(sorted(set(duplicates))))
    return by_code, [f"Supabase public SELECT succeeded for categories, materials, products; product_images backup confirms anon image reads."]


def upsert_product(base_url: str, service_key: str, record: dict[str, Any], existing: dict[str, Any] | None,
                   material_id: str | None) -> dict[str, Any]:
    specs = dict(existing.get("specifications") or {}) if existing else {}
    specs.update({
        "subcategory": record["subcategory"],
        "spreadsheet_status": record["spreadsheet_status"],
        "size": "3 x 5 ft",
        "size_3x5_price": record["size_3x5_price"],
        "warranty_policy": record["warranty_policy"],
        "freight_policy": record["freight_policy"],
        "source_category": record["category_name"],
    })
    payload: dict[str, Any] = {
        key: record[key] for key in (
            "product_code", "name", "slug", "short_description", "description", "design_story",
            "construction", "style", "primary_color", "shape", "pile_height_mm", "currency",
            "base_price", "is_new_arrival", "is_best_seller", "is_customizable", "made_to_order",
            "cart_enabled", "meta_title", "meta_description", "tags", "status",
        )
    }
    payload.update({
        "category_id": CATEGORY_ID,
        "material_id": material_id,
        "verification_status": "pending",
        "specifications": specs,
    })
    if existing:
        result = request(base_url, service_key, "products", "PATCH", {"id": f"eq.{existing['id']}", "select": "id,product_code"}, payload)
    else:
        result = request(base_url, service_key, "products", "POST", {"select": "id,product_code"}, payload)
    if not result:
        raise RuntimeError(f"Product upsert returned no row for {record['product_code']}.")
    return result[0]


def sync_images(base_url: str, service_key: str, product_id: str, images: list[dict[str, Any]]) -> None:
    existing = request(base_url, service_key, "product_images", "GET", {
        "select": "id,image_url", "product_id": f"eq.{product_id}",
    })
    existing_by_url = {row["image_url"]: row for row in existing}
    desired = {image["image_url"] for image in images}
    for image in images:
        payload = {key: image[key] for key in ("image_url", "alt_text", "image_type", "sort_order", "is_primary")}
        match = existing_by_url.get(image["image_url"])
        if match:
            request(base_url, service_key, "product_images", "PATCH", {"id": f"eq.{match['id']}"}, payload)
        else:
            request(base_url, service_key, "product_images", "POST", {}, {"product_id": product_id, **payload})
    stale_ids = [row["id"] for row in existing if row["image_url"] not in desired]
    if stale_ids:
        request(base_url, service_key, "product_images", "DELETE", {"id": "in.(" + ",".join(stale_ids) + ")"})


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Write the workbook data to Supabase.")
    args = parser.parse_args()
    try:
        base_url, anon_key = supabase_config()
        records, _ = read_records()
        live, read_checks = validate_database(base_url, anon_key)
        missing_objects, image_warnings = verify_storage(records, base_url, anon_key)
        if args.apply:
            if not BACKUP.exists():
                raise RuntimeError("Required pre-sync backup is missing; no writes performed.")
            backup = json.loads(BACKUP.read_text(encoding="utf-8"))
            if backup.get("product_count") != 32 or len(backup.get("products", [])) != 32:
                raise RuntimeError("Pre-sync backup is incomplete; no writes performed.")
            service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
            if not service_key:
                raise RuntimeError("--apply requires SUPABASE_SERVICE_ROLE_KEY; no database writes were performed.")
            for record in records:
                material = record["material_name"]
                if material not in MATERIAL_IDS:
                    raise RuntimeError(f"Unknown workbook material {material!r} for {record['product_code']}.")
                existing = live.get(record["product_code"])
                saved = upsert_product(base_url, service_key, record, existing, MATERIAL_IDS[material])
                sync_images(base_url, service_key, saved["id"], record["images"])

        result = {
            "mode": "apply" if args.apply else "dry-run",
            "workbook_rows": len(records),
            "existing_product_codes": len(live),
            "updated_products": len(live),
            "new_product_codes": sorted(set(record["product_code"] for record in records) - set(live)),
            "active_with_verified_primary": sum(record["status"] == "active" for record in records),
            "draft_without_primary": [record["product_code"] for record in records if record["status"] == "draft"],
            "storage_names_checked": sum(len(record["images"]) for record in records) + len(missing_objects),
            "missing_storage_objects": missing_objects,
            "checks": read_checks,
            "write_access_available": bool(os.environ.get("SUPABASE_SERVICE_ROLE_KEY")),
        }
        print(json.dumps(result, indent=2, ensure_ascii=False))
        if not args.apply:
            print("Dry run only. Database remains unchanged.")
        return 0
    except (OSError, KeyError, ValueError, RuntimeError, urllib.error.URLError) as error:
        print(f"Modern Rugs sync stopped: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
