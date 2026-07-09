from typing import Any, Dict, Optional
from urllib.parse import urlencode

import httpx


NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"


class GeocodingProviderError(Exception):
    """Erro ao consultar o provedor de geocodificacao."""


class GeocodingService:
    def __init__(self) -> None:
        self.base_url = NOMINATIM_BASE_URL

    def geocode(self, query: str) -> Optional[Dict[str, Any]]:
        normalized_query = query.strip()

        if not normalized_query:
            return None

        params = {
            "q": normalized_query,
            "format": "jsonv2",
            "limit": 1,
            "addressdetails": 1,
            "countrycodes": "br",
        }

        url = f"{self.base_url}?{urlencode(params)}"

        try:
            response = httpx.get(
                url,
                headers={
                    "Accept": "application/json",
                    "User-Agent": "Rua-Segura/1.0",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            results = response.json()
        except Exception as error:
            raise GeocodingProviderError("Nao foi possivel buscar o endereco.") from error

        if not isinstance(results, list) or not results:
            return None

        first_result = results[0]

        try:
            return {
                "label": first_result.get("display_name", normalized_query),
                "latitude": float(first_result["lat"]),
                "longitude": float(first_result["lon"]),
            }
        except (KeyError, TypeError, ValueError) as error:
            raise GeocodingProviderError("Endereco retornado em formato invalido.") from error