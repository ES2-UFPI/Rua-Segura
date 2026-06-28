from fastapi import APIRouter, status
from typing import Any, Dict
from app.schemas.route_schema import validate_route_payload, SafeRouteResponse
from app.services.open_route_service import OpenRouteServiceClient

router = APIRouter(prefix="/api/routes", tags=["Rotas Seguras"])

@router.post("/safe", response_model=SafeRouteResponse, status_code=status.HTTP_200_OK)
def calculate_safe_route(payload: Dict[str, Any]):
    """
    Recebe origem e destino e inicia o cálculo de uma rota segura.
    """
    # Valida o payload de entrada e extrai os schemas das coordenadas
    origin, destination = validate_route_payload(payload)

    # Invoca o client do OpenRouteService para obter a rota
    client = OpenRouteServiceClient()
    data = client.get_route(
        origin_lat=origin.latitude,
        origin_lng=origin.longitude,
        dest_lat=destination.latitude,
        dest_lng=destination.longitude
    )

    # Extrai os dados da resposta GeoJSON
    feature = data["features"][0]
    distance = feature["properties"]["summary"]["distance"]
    duration = feature["properties"]["summary"]["duration"]
    coordinates = feature["geometry"]["coordinates"]

    # Converte as coordenadas [longitude, latitude] para o formato do projeto
    geometry = [{"latitude": lat, "longitude": lng} for lng, lat in coordinates]

    return {
        "status": "success",
        "distance": distance,
        "duration": duration,
        "geometry": geometry
    }


