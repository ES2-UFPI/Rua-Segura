from typing import Any, Dict
from app.services.open_route_service import OpenRouteServiceClient
from app.services.risk_service import RiskService

def _format_step_distance(distance_meters: float) -> str:
    if distance_meters < 1000:
        return f"{round(distance_meters)} m"

    return f"{distance_meters / 1000:.1f}".replace(".", ",") + " km"

def _map_step_maneuver(step_type: Any) -> str:
    try:
        normalized_type = int(step_type)
    except (TypeError, ValueError):
        return "straight"

    if normalized_type in {0, 2, 4, 12}:
        return "left"
    if normalized_type in {1, 3, 5, 7, 8, 13}:
        return "right"
    if normalized_type == 10:
        return "arrive"

    return "straight"

def _extract_navigation_steps(feature: Dict[str, Any]) -> list[Dict[str, str]]:
    segments = feature.get("properties", {}).get("segments", [])
    raw_steps: list[Dict[str, Any]] = []

    if isinstance(segments, list):
        for segment in segments:
            steps = segment.get("steps", []) if isinstance(segment, dict) else []
            if isinstance(steps, list):
                raw_steps.extend(step for step in steps if isinstance(step, dict))

    navigation_steps: list[Dict[str, str]] = []

    for index, step in enumerate(raw_steps):
        instruction = str(step.get("instruction") or "").strip()

        if not instruction:
            continue

        next_instruction = ""
        for next_step in raw_steps[index + 1:]:
            next_instruction = str(next_step.get("instruction") or "").strip()
            if next_instruction:
                break

        try:
            step_distance = float(step.get("distance") or 0)
        except (TypeError, ValueError):
            step_distance = 0

        # Extrai o índice do ponto de fim da polilinha da chave way_points do ORS
        way_points = step.get("way_points")
        route_point_index = None
        if isinstance(way_points, list) and len(way_points) > 1:
            try:
                route_point_index = int(way_points[1])
            except (TypeError, ValueError):
                route_point_index = None

        navigation_steps.append({
            "instruction": instruction,
            "streetName": str(step.get("name") or "").strip(),
            "nextInstruction": next_instruction,
            "distance": _format_step_distance(step_distance),
            "maneuver": _map_step_maneuver(step.get("type")),
            "routePointIndex": route_point_index,
        })

    return navigation_steps

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
        steps = _extract_navigation_steps(feature)

        # Converter para [(latitude, longitude), ...] para cálculo interno de risco
        route_points = [(lat, lng) for lng, lat in coordinates]

        # Calcular risco e ocorrências próximas ao longo do trajeto
        risk_result = self.risk_service.calculate_route_risk(route_points)

        return {
            "distance_meters": distance,
            "duration_seconds": duration,
            "coordinates": coordinates,
            "points": [{"latitude": lat, "longitude": lng} for lat, lng in route_points],
            "steps": steps,
            "risk": {
                "level": risk_result["level"],
                "score": risk_result["score"],
                "description": risk_result["description"],
                "nearbyOccurrencesCount": risk_result["nearbyOccurrencesCount"],
                "intersectedRiskZonesCount": risk_result["intersectedRiskZonesCount"]
            },
            "nearbyOccurrences": risk_result["nearbyOccurrences"]
        }
