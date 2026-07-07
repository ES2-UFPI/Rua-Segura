from fastapi import APIRouter, status, HTTPException
from fastapi.responses import JSONResponse
from typing import Any, Dict
from app.schemas.route_schema import validate_route_payload, SafeRouteResponse
from app.services.open_route_service import OpenRouteServiceClient, RoutingProviderError
from app.services.route_service import RouteService
from app.services.route_mapper import RouteResponseMapper
from app.controllers.risk_controller import _risk_service

router = APIRouter(prefix="/api/routes", tags=["Rotas Seguras"])

# Instanciamos o client e o RouteService reutilizando o RiskService existente
_routing_client = OpenRouteServiceClient()
_route_service = RouteService(_routing_client, _risk_service)

@router.post("/safe", response_model=SafeRouteResponse, status_code=status.HTTP_200_OK)
def calculate_safe_route(payload: Dict[str, Any]):
    """
    Recebe origem e destino e inicia o cálculo de uma rota segura.
    """
    # Valida o payload de entrada e extrai os schemas das coordenadas (retorna HTTPException 400 se inválido)
    origin, destination = validate_route_payload(payload)

    try:
        # Orquestra a busca da rota e a análise de risco
        consolidated_data = _route_service.calculate_safe_route(
            origin_lat=origin.latitude,
            origin_lng=origin.longitude,
            dest_lat=destination.latitude,
            dest_lng=destination.longitude
        )
    except RoutingProviderError as e:
        # Trata falhas na API externa ou na geometria retornada
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={"message": "Não foi possível calcular a rota no momento."}
        )
    except Exception as e:
        # Trata erros internos inesperados sem expor stack traces ou detalhes
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Erro interno inesperado."}
        )

    # Mapeia os dados consolidados para o formato esperado pelo frontend
    mapped_response = RouteResponseMapper.map_to_response(consolidated_data)
    return mapped_response



