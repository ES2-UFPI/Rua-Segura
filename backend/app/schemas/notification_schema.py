from pydantic import BaseModel, Field
from typing import Optional

class TokenRegistration(BaseModel):
    token: str = Field(..., description="Token do dispositivo FCM para envio de notificações")

class NotificationSendRequest(BaseModel):
    title: str = Field(..., description="Título da notificação")
    body: str = Field(..., description="Corpo/mensagem da notificação")
    level: Optional[str] = Field(..., description="Nível de risco associado")
