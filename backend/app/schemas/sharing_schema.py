from datetime import datetime

from pydantic import BaseModel, Field


class CoordinateSchema(BaseModel):
    latitude: float = Field(..., description="Latitude da coordenada")
    longitude: float = Field(..., description="Longitude da coordenada")


class SharingSessionCreateRequest(BaseModel):
    origin: CoordinateSchema | None = Field(
        default=None,
        description="Origem da rota"
    )
    currentLocation: CoordinateSchema = Field(..., description="Localizacao atual")
    destination: CoordinateSchema = Field(..., description="Destino do trajeto")
    routeCoordinates: list[CoordinateSchema] | None = Field(
        default=None,
        description="Pontos da rota calculada"
    )


class SharingSessionCreateResponse(BaseModel):
    token: str = Field(..., description="Token de compartilhamento gerado")
    shareUrl: str = Field(..., description="URL publica para consultar o trajeto")
    expiresAt: datetime = Field(..., description="Data/hora de expiracao do compartilhamento")


class SharedRouteResponse(BaseModel):
    status: str = Field(..., description="Status da sessao")
    origin: CoordinateSchema = Field(..., description="Origem da rota")
    currentLocation: CoordinateSchema = Field(..., description="Ultima localizacao registrada")
    destination: CoordinateSchema = Field(..., description="Coordenadas de destino")
    routeCoordinates: list[CoordinateSchema] | None = Field(
        default=None,
        description="Pontos da rota calculada"
    )
    lastUpdatedAt: datetime = Field(..., description="Data/hora da ultima atualizacao de localizacao")


class UpdateLocationRequest(BaseModel):
    latitude: float = Field(..., description="Latitude atualizada")
    longitude: float = Field(..., description="Longitude atualizada")


class UpdateLocationResponse(BaseModel):
    status: str = Field(..., description="Status da sessao")
    currentLocation: CoordinateSchema = Field(..., description="Localizacao atualizada")
    lastUpdatedAt: datetime = Field(..., description="Data/hora da atualizacao")


class EndSharingResponse(BaseModel):
    status: str = Field(..., description="Status final da sessao")
    message: str = Field(..., description="Mensagem de sucesso/informacao")
