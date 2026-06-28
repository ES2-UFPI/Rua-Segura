from pydantic import BaseModel, Field
from fastapi import HTTPException, status
from typing import Any, Dict, List

class CoordinateSchema(BaseModel):
    latitude: float = Field(..., description="Latitude da coordenada")
    longitude: float = Field(..., description="Longitude da coordenada")

class SafeRouteResponse(BaseModel):
    status: str = Field(..., description="Status do cálculo da rota")
    distance: float = Field(..., description="Distância da rota em metros")
    duration: float = Field(..., description="Duração estimada em segundos")
    geometry: List[CoordinateSchema] = Field(..., description="Lista de coordenadas que compõem a rota")

def validate_route_payload(payload: Dict[str, Any]) -> tuple[CoordinateSchema, CoordinateSchema]:
    """
    Valida o payload de entrada do cálculo de rota segura, gerando erros HTTP específicos
    para manter conformidade com os testes automatizados da issue #47.
    """
    # 1. Validação de presença
    if "origin" not in payload or payload["origin"] is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Origin is required"
        )
    if "destination" not in payload or payload["destination"] is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Destination is required"
        )

    origin = payload["origin"]
    destination = payload["destination"]

    # 2. Validação do tipo objeto e presença de campos específicos
    if not isinstance(origin, dict) or "latitude" not in origin or "longitude" not in origin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Origin must contain latitude and longitude"
        )
    if not isinstance(destination, dict) or "latitude" not in destination or "longitude" not in destination:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Destination must contain latitude and longitude"
        )

    # 3. Validação se são números válidos (ou strings numéricas conversíveis)
    try:
        lat_org = float(origin["latitude"])
        lng_org = float(origin["longitude"])
        lat_dst = float(destination["latitude"])
        lng_dst = float(destination["longitude"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordinates must be numbers"
        )

    # 4. Validação dos limites geográficos
    if not (-90.0 <= lat_org <= 90.0) or not (-90.0 <= lat_dst <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90"
        )
    if not (-180.0 <= lng_org <= 180.0) or not (-180.0 <= lng_dst <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180"
        )

    return (
        CoordinateSchema(latitude=lat_org, longitude=lng_org),
        CoordinateSchema(latitude=lat_dst, longitude=lng_dst)
    )
