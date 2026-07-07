import httpx
import os
from typing import Any, Dict

ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"

class RoutingProviderError(Exception):
    """Exceção para erros originados no provedor externo de rotas."""
    pass

class OpenRouteServiceClient:
    def __init__(self) -> None:
        self.base_url = ORS_BASE_URL

    def get_route(self, origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> Dict[str, Any]:
        """
        Busca as direções de uma rota no OpenRouteService via API HTTP.
        """
        api_key = os.getenv("ORS_API_KEY")
        headers = {
            "Authorization": api_key or "",
            "Content-Type": "application/json"
        }
        payload = {
            "coordinates": [
                [origin_lng, origin_lat],
                [dest_lng, dest_lat]
            ]
        }
        try:
            response = httpx.post(self.base_url, headers=headers, json=payload, timeout=10.0)
            if hasattr(response, "raise_for_status"):
                response.raise_for_status()
            elif not (200 <= response.status_code < 300):
                raise RoutingProviderError("Não foi possível calcular a rota no momento.")
            data = response.json()
        except Exception as e:
            if isinstance(e, RoutingProviderError):
                raise e
            raise RoutingProviderError("Não foi possível calcular a rota no momento.") from e

        # Validação da estrutura de geometria do GeoJSON retornado
        try:
            features = data.get("features")
            if not features or not isinstance(features, list) or len(features) == 0:
                raise RoutingProviderError("Não foi possível calcular a rota no momento.")
            geometry = features[0].get("geometry")
            if not geometry or geometry.get("type") != "LineString" or "coordinates" not in geometry:
                raise RoutingProviderError("Não foi possível calcular a rota no momento.")
        except (AttributeError, KeyError, TypeError) as e:
            raise RoutingProviderError("Não foi possível calcular a rota no momento.") from e

        return data
