from fastapi import APIRouter, status
from typing import Any, Dict
from app.schemas.route_schema import validate_route_payload, SafeRouteResponse

router = APIRouter(prefix="/api/routes", tags=["Rotas Seguras"])

@router.post("/safe", response_model=SafeRouteResponse, status_code=status.HTTP_200_OK)
def calculate_safe_route(payload: Dict[str, Any]):
    """
    Recebe origem e destino e inicia o cálculo de uma rota segura.
    """
    # Valida o payload de entrada e extrai os schemas das coordenadas
    origin, destination = validate_route_payload(payload)

    # Nota: Lógica futura de roteamento/serviço será injetada aqui.
    
    return {"status": "success"}

