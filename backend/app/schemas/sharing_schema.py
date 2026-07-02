from pydantic import BaseModel, Field
from datetime import datetime

class CoordinateSchema(BaseModel):
    latitude: float = Field(..., description="Latitude da coordenada")
    longitude: float = Field(..., description="Longitude da coordenada")

class SharingSessionCreateRequest(BaseModel):
    currentLocation: CoordinateSchema = Field(..., description="Localização atual")
    destination: CoordinateSchema = Field(..., description="Destino do trajeto")

class SharingSessionCreateResponse(BaseModel):
    token: str = Field(..., description="Token de compartilhamento gerado")
    shareUrl: str = Field(..., description="URL pública para consultar o trajeto")
    expiresAt: datetime = Field(..., description="Data/hora de expiração do compartilhamento")

class SharedRouteResponse(BaseModel):
    status: str = Field(..., description="Status da sessão ('active' ou 'ended')")
    currentLocation: CoordinateSchema = Field(..., description="Última localização registrada")
    destination: CoordinateSchema = Field(..., description="Coordenadas de destino")
    lastUpdatedAt: datetime = Field(..., description="Data/hora da última atualização de localização")

class UpdateLocationRequest(BaseModel):
    latitude: float = Field(..., description="Latitude atualizada")
    longitude: float = Field(..., description="Longitude atualizada")

class UpdateLocationResponse(BaseModel):
    status: str = Field(..., description="Status da sessão")
    currentLocation: CoordinateSchema = Field(..., description="Localização atualizada")
    lastUpdatedAt: datetime = Field(..., description="Data/hora da atualização")

class EndSharingResponse(BaseModel):
    status: str = Field(..., description="Status final da sessão (normalmente 'ended')")
    message: str = Field(..., description="Mensagem de sucesso/informação")
