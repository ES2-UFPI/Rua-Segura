from typing import List
from app.schemas.alert_schema import AlertPayload
from app.services.risk_service import RiskService  

class AlertService:
    def __init__(self, risk_service: RiskService):
        self.risk_service = risk_service

    def generate_dynamic_alerts(self, latitude: float, longitude: float) -> List[AlertPayload]:
        print(f"[AlertService] 🗺️ Delegando análise de risco para o RiskService...")
        
        risk_data = self.risk_service.check_risk(latitude, longitude, radius_km=0.5)
        
        if risk_data.count == 0:
            return []

        messages_map = {
            "VERMELHO": ("🚨 Zona Crítica", f"Atenção! {risk_data.count} incidentes de segurança detectados neste perímetro."),
            "AMARELO": ("⚠️ Zona de Atenção", f"Ocorrências moderadas ({risk_data.count}) registradas nos arredores."),
            "AZUL": ("ℹ️ Zona de Baixo Risco", "Região estável no momento.")
        }
        
        title, message = messages_map.get(risk_data.level, ("ℹ️ Zona de Baixo Risco", "Região estável."))

        lat_chave = round(latitude, 3)
        lon_chave = round(longitude, 3)
        id_regiao = f"alerta-{risk_data.level.lower()}-{lat_chave}-{lon_chave}"

        alerta = AlertPayload(
            id=id_regiao,  
            level=risk_data.level,
            title=title,
            message=message,
            score=risk_data.score,
            count=risk_data.count,
            latitude=latitude,
            longitude=longitude
        )
        
        return [alerta]