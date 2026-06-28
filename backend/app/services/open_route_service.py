import httpx
import os
from typing import Any, Dict

ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"

class OpenRouteServiceClient:
    def __init__(self) -> None:
        self.api_key = os.getenv("ORS_API_KEY")
        self.base_url = ORS_BASE_URL

    def get_route(self, origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> Dict[str, Any]:
        """
        Busca as direções de uma rota no OpenRouteService via API HTTP.
        """
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "coordinates": [
                [origin_lng, origin_lat],
                [dest_lng, dest_lat]
            ]
        }
        response = httpx.post(self.base_url, headers=headers, json=payload)
        return response.json()
