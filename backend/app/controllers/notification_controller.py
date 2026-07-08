from fastapi import APIRouter, HTTPException, status
from app.schemas.notification_schema import TokenRegistration, NotificationSendRequest
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["Notificações Firebase"])

# Instância única compartilhada em memória
_notification_service = NotificationService()

def get_notification_service() -> NotificationService:
    return _notification_service

@router.post("/register", status_code=status.HTTP_200_OK)
def register_token(payload: TokenRegistration):
    """
    Registra o token FCM do dispositivo para envio posterior de push notifications.
    """
    success = _notification_service.register_token(payload.token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token FCM fornecido é inválido ou vazio."
        )
    return {"message": "Token FCM registrado com sucesso."}

@router.post("/test", status_code=status.HTTP_200_OK)
def send_test_notification(payload: NotificationSendRequest):
    """
    Dispara uma notificação push de teste para todos os tokens registrados.
    """
    result = _notification_service.send_push_notification(
        title=payload.title,
        body=payload.body,
        data={"level": payload.level or "AZUL"}
    )
    return result

@router.post("/trigger-risk", status_code=status.HTTP_200_OK)
def trigger_risk_notification(level: str = "VERMELHO", count: int = 3):
    """
    Simula uma detecção automática de risco e envia notificação de alerta.
    """
    level_upper = level.upper()
    messages_map = {
        "VERMELHO": ("🚨 Zona Crítica", f"Atenção! {count} incidentes de segurança detectados neste perímetro."),
        "AMARELO": ("⚠️ Zona de Atenção", f"Ocorrências moderadas ({count}) registradas nos arredores."),
        "AZUL": ("ℹ️ Zona de Baixo Risco", "Região estável no momento.")
    }
    
    title, body = messages_map.get(level_upper, ("ℹ️ Zona de Baixo Risco", "Região estável no momento."))
    
    result = _notification_service.send_push_notification(
        title=title,
        body=body,
        data={
            "level": level_upper,
            "count": str(count),
            "type": "risk_alert"
        }
    )
    return result
