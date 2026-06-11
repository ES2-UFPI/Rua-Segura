import pytest
from app.services.alert_service import AlertService
from app.services.risk_service import RiskService
from app.schemas.risk_schema import RiskResponse

class MockRiskResponse:
    def __init__(self, level: str, score: float, count: int):
        self.level = level
        self.score = score
        self.count = count

class MockRiskService:
    def __init__(self, simulated_response: MockRiskResponse):
        self.simulated_response = simulated_response

    def check_risk(self, latitude: float, longitude: float, radius_km: float = 0.5):
        return self.simulated_response


def test_deve_gerar_alerta_vermelho_quando_houver_quatro_ocorrencias_proximas():
    user_lat = -5.0895
    user_lng = -42.8020

    mock_response = MockRiskResponse(level="VERMELHO", score=100.0, count=4)
    risk_service_mock = MockRiskService(simulated_response=mock_response)

    service = AlertService(risk_service=risk_service_mock)
    alertas = service.generate_dynamic_alerts(user_lat, user_lng)

    assert len(alertas) == 1
    assert alertas[0].level == "VERMELHO"
    assert alertas[0].count == 4
    assert alertas[0].score == 100.0
    assert "alerta-vermelho" in alertas[0].id


def test_deve_retornar_lista_vazia_quando_nao_houver_ocorrencias_proximas():
    user_lat = -5.0895
    user_lng = -42.8020

    mock_response = MockRiskResponse(level="AZUL", score=0.0, count=0)
    risk_service_mock = MockRiskService(simulated_response=mock_response)

    service = AlertService(risk_service=risk_service_mock)
    alertas = service.generate_dynamic_alerts(user_lat, user_lng)

    assert len(alertas) == 0