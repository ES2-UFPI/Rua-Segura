from fastapi import APIRouter, HTTPException, status
from typing import Any, Dict

router = APIRouter(prefix="/api/routes", tags=["Rotas Seguras"])

@router.post("/safe", status_code=status.HTTP_200_OK)
def calculate_safe_route(payload: Dict[str, Any]):
    # 1. Validar presença de origem e destino
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

    # 2. Validar se são dicionários e contêm latitude e longitude
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

    # 3. Validar tipos e limites das coordenadas
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

    # Mínimo para passar no teste da etapa GREEN
    return {"status": "success"}
