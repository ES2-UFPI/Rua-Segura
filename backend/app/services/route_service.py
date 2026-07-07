from typing import Any, Dict
from app.services.open_route_service import OpenRouteServiceClient
from app.services.risk_service import RiskService

class RouteService:
    def __init__(self, routing_client: OpenRouteServiceClient, risk_service: RiskService):
        self.routing_client = routing_client
        self.risk_service = risk_service

    def calculate_safe_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float
    ) -> Dict[str, Any]:
        """
        Orquestra o cálculo de rotas usando o provedor de rotas externo e a análise de risco.
        """
        # Obter rota do provedor externo (lança RoutingProviderError se falhar)
        route_data = self.routing_client.get_route(
            origin_lat=origin_lat,
            origin_lng=origin_lng,
            dest_lat=dest_lat,
            dest_lng=dest_lng
        )

        # Extrair dados básicos da rota do GeoJSON
        feature = route_data["features"][0]
        distance = feature["properties"]["summary"]["distance"]
        duration = feature["properties"]["summary"]["duration"]
        coordinates = feature["geometry"]["coordinates"]  # Lista de [longitude, latitude]

        # Converter para [(latitude, longitude), ...] para cálculo interno de risco
        route_points = [(lat, lng) for lng, lat in coordinates]

        # Calcular risco e ocorrências próximas ao longo do trajeto
        risk_result = self.risk_service.calculate_route_risk(route_points)

        return {
            "distance_meters": distance,
            "duration_seconds": duration,
            "coordinates": coordinates,
            "points": [{"latitude": lat, "longitude": lng} for lat, lng in route_points],
            "risk": {
                "level": risk_result["level"],
                "score": risk_result["score"],
                "description": risk_result["description"],
                "nearbyOccurrencesCount": risk_result["nearbyOccurrencesCount"],
                "intersectedRiskZonesCount": risk_result["intersectedRiskZonesCount"]
            },
            "nearbyOccurrences": risk_result["nearbyOccurrences"]
        }
