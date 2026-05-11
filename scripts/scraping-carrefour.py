#!/usr/bin/env python3
"""
Script para scraping de precios de Carrefour
Actualiza tabla ingredient_prices en Supabase

Uso: python scraping-carrefour.py
"""

import os
import json
import re
from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus
import requests
from bs4 import BeautifulSoup

# ============================================
# CONFIGURACIÓN
# ============================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tceusgxbfpekjcthrrqu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
CARREFOUR_USE_MOCK = os.getenv("CARREFOUR_USE_MOCK") == "1"
REQUEST_TIMEOUT = int(os.getenv("CARREFOUR_TIMEOUT", "20"))
USER_AGENT = os.getenv(
    "CARREFOUR_USER_AGENT",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
)

# URLs de categorías de Carrefour (ejemplos)
CARREFOUR_CATEGORIES = {
    "Carnes y Aves": [
        "https://www.carrefour.es/compra-online/carnes-y-aves",
    ],
    "Pescados": [
        "https://www.carrefour.es/compra-online/pescados-y-mariscos",
    ],
    "Huevos y Lácteos": [
        "https://www.carrefour.es/compra-online/lacteos-huevos",
    ],
    "Arroz y Pasta": [
        "https://www.carrefour.es/compra-online/arroz-pasta",
    ],
    "Frutas y Verduras": [
        "https://www.carrefour.es/compra-online/frutas-y-verduras",
    ],
    "Aceites y Vinagres": [
        "https://www.carrefour.es/compra-online/aceites-vinagres",
    ],
    "Conservas y Legumbres": [
        "https://www.carrefour.es/compra-online/conservas-legumbres",
    ],
    "Panadería": [
        "https://www.carrefour.es/compra-online/panaderia",
    ],
}

# Ingredientes a buscar (nombre → términos de búsqueda)
INGREDIENTS_SEARCH = {
    "pollo": "pollo entero fresco",
    "ternera": "ternera filete",
    "cerdo": "cerdo lomo",
    "merluza": "merluza filetes",
    "salmón": "salmón fresco",
    "atún": "atún claro",
    "huevos": "huevos L",
    "arroz": "arroz blanco",
    "pasta": "espaguetis",
    "patatas": "patatas kg",
    "cebolla": "cebolla kg",
    "ajo": "ajos",
    "tomate": "tomates ensalada",
    "pimiento": "pimientos",
    "lechuga": "lechuga",
    "zanahoria": "zanahorias kg",
    "aceite de oliva": "aceite oliva virgen extra 1L",
    "leche": "leche entera 1L",
    "yogur": "yogur natural",
    "queso": "queso curado",
    "pan": "pan de molde",
    "fruta": "manzanas kg",
    "legumbres": "lentejas bote",
    "caldo": "caldo pollo brick",
}


# ============================================
# FUNCIONES DE SCRAPING
# ============================================

def search_carrefour(query: str) -> Optional[dict]:
    """
    Busca producto en Carrefour y devuelve precio
    Carrefour no expone API pública estable; se parsea la página de búsqueda.
    Usa CARREFOUR_USE_MOCK=1 solo para desarrollo offline.
    """
    print(f"  Buscando: {query}")

    if CARREFOUR_USE_MOCK:
        return {
            "price": 2.99,
            "unit_price": 2.99,
            "url": f"https://www.carrefour.es/search?q={quote_plus(query)}",
        }

    search_url = f"https://www.carrefour.es/search?q={quote_plus(query)}"

    response = requests.get(
        search_url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "es-ES,es;q=0.9",
        },
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    product = parse_json_ld_product(soup) or parse_product_card(soup)
    if not product:
        return None

    return {
        "price": product["price"],
        "unit_price": product.get("unit_price") or product["price"],
        "url": product.get("url") or search_url,
    }


def parse_json_ld_product(soup: BeautifulSoup) -> Optional[dict]:
    """Extrae el primer producto con precio desde JSON-LD si Carrefour lo expone."""
    for script in soup.find_all("script", {"type": "application/ld+json"}):
        try:
            payload = json.loads(script.string or "{}")
        except json.JSONDecodeError:
            continue

        candidates = payload if isinstance(payload, list) else [payload]
        for item in candidates:
            product = find_product_payload(item)
            if product:
                return product

    return None


def find_product_payload(payload) -> Optional[dict]:
    if isinstance(payload, list):
        for item in payload:
            result = find_product_payload(item)
            if result:
                return result
        return None

    if not isinstance(payload, dict):
        return None

    if payload.get("@type") == "Product" and payload.get("offers"):
        offer = payload["offers"][0] if isinstance(payload["offers"], list) else payload["offers"]
        price = parse_price(offer.get("price"))
        if price is not None:
            return {
                "price": price,
                "unit_price": price,
                "url": payload.get("url") or offer.get("url"),
            }

    for value in payload.values():
        result = find_product_payload(value)
        if result:
            return result

    return None


def parse_product_card(soup: BeautifulSoup) -> Optional[dict]:
    """Fallback por selectores habituales y búsqueda textual de importes."""
    card = soup.select_one('[data-testid*="product"], .product-card, .ebx-result')
    scope = card or soup
    text = scope.get_text(" ", strip=True)
    price = parse_price(text)

    if price is None:
        return None

    link = scope.select_one("a[href]") if hasattr(scope, "select_one") else None
    href = link["href"] if link else None
    if href and href.startswith("/"):
        href = f"https://www.carrefour.es{href}"

    return {
        "price": price,
        "unit_price": price,
        "url": href,
    }


def parse_price(value) -> Optional[float]:
    if value is None:
        return None

    match = re.search(r"(\d+(?:[,.]\d{1,2})?)\s*€?", str(value))
    if not match:
        return None

    return float(match.group(1).replace(",", "."))


def scrape_ingredient(name: str, search_term: str) -> Optional[dict]:
    """Scrapea precio de un ingrediente"""
    result = search_carrefour(search_term)
    if result:
        return {
            "name": name,
            "price": result["price"],
            "unit_price": result["unit_price"],
            "url": result["url"],
        }
    return None


# ============================================
# INTEGRACIÓN CON SUPABASE
# ============================================

def get_ingredients_db():
    """Obtiene ingredientes de la DB"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/ingredients",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Prefer": "return=representation"
        }
    )
    response.raise_for_status()
    return response.json()


def insert_price(ingredient_id: str, price: float, unit_price: float, url: str):
    """Inserta precio en ingredient_prices"""
    data = {
        "ingredient_id": ingredient_id,
        "price": price,
        "unit_price": unit_price,
        "scraped_at": datetime.now().isoformat(),
        "url": url,
    }

    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/ingredient_prices",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        json=data
    )
    response.raise_for_status()
    return response.json()


# ============================================
# MAIN
# ============================================

def main():
    print("=" * 50)
    print("SCRAPING DE PRECIOS - CARREFOUR")
    print("=" * 50)

    if not SUPABASE_KEY:
        print("ERROR: Faltan variables de entorno")
        print("  export SUPABASE_URL=...")
        print("  export SUPABASE_SERVICE_ROLE_KEY=...")
        return 1

    # Obtener ingredientes de DB
    print("\n[1/3] Obteniendo ingredientes de la DB...")
    ingredients = get_ingredients_db()
    print(f"  {len(ingredients)} ingredientes encontrados")

    # Scrapear precios
    print("\n[2/3] Scrapeando precios...")
    updated = 0
    errors = 0

    for ingredient in ingredients:
        name = ingredient["name"]
        search_term = INGREDIENTS_SEARCH.get(name, name)

        try:
            result = scrape_ingredient(name, search_term)
            if result:
                insert_price(
                    ingredient["id"],
                    result["price"],
                    result["unit_price"],
                    result["url"]
                )
                print(f"  ✅ {name}: {result['price']}€")
                updated += 1
            else:
                print(f"  ⚠️ {name}: no encontrado")
                errors += 1
        except Exception as e:
            print(f"  ❌ {name}: {e}")
            errors += 1

    # Resumen
    print("\n[3/3] Resumen")
    print(f"  Actualizados: {updated}")
    print(f"  Errores: {errors}")
    print(f"\n✅ Scraping completado: {datetime.now().isoformat()}")

    return 0


if __name__ == "__main__":
    exit(main())
