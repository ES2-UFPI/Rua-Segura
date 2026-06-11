from fastapi import APIRouter, Query
from app.schemas.risk_schema import RiskResponse
from app.services.risk_service import RiskService
from app.services.risk_strategy import HeuristicRiskStrategy
from app.controllers.review_controller import _in_memory_repository

router = APIRouter(prefix="/api/risk", tags=["Risco Urbano"])

# Injeção de dependência da Estratégia Heurística no Serviço
_risk_service = RiskService(_in_memory_repository, HeuristicRiskStrategy())

@router.get("", response_model=RiskResponse)
def check_risk(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
):
    """Verifica o nível de risco de uma coordenada"""
    return _risk_service.check_risk(latitude=latitude, longitude=longitude)