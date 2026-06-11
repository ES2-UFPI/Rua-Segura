from fastapi import APIRouter, Query
from typing import List
from app.schemas.alert_schema import AlertPayload
from app.services.alert_service import AlertService
from app.services.risk_service import RiskService
from app.services.risk_strategy import HeuristicRiskStrategy  # 🌟 O nome real da sua estratégia!
from app.controllers.review_controller import _in_memory_repository

router = APIRouter(prefix="/api/alerts", tags=["Alertas Críticos"])

_strategy = HeuristicRiskStrategy()
_risk_service = RiskService(_in_memory_repository, _strategy)
_alert_service = AlertService(risk_service=_risk_service)

@router.get("", response_model=List[AlertPayload])
def get_alerts_by_location(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude atual do usuário"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude atual do usuário"),
):
    return _alert_service.generate_dynamic_alerts(latitude=latitude, longitude=longitude)