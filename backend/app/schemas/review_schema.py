from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class ReviewCategory(str, Enum):
    ASSALTO = "Assalto"
    FURTO = "Furto"
    ASSEDIO = "Assédio"
    ILUMINACAO_RUIM = "Iluminação ruim"
    INFRAESTRUTURA_INADEQUADA = "Infraestrutura inadequada"
    MOVIMENTACAO_SUSPEITA = "Movimentação suspeita"
    PERSEGUICAO_STALKING = "Perseguição/stalking"
    BRIGA_AGRESSAO = "Briga/agressão"
    LOCAL_DESERTO = "Local deserto"

class ReviewCreate(BaseModel):
    category: ReviewCategory = Field(..., description="Categoria/Label correspondente à característica ruim do local")
    description: str = Field(..., min_length=1, max_length=1000, description="Comentário ou descrição a respeito da ocorrência no lugar")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Coordenada de latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Coordenada de longitude")
    timestamp: Optional[datetime] = Field(None, description="Data e hora da ocorrência (se omitida, será a data/hora atual)")

class ReviewResponse(BaseModel):
    id: str = Field(..., description="ID único da avaliação gerado pelo sistema")
    category: ReviewCategory = Field(..., description="Categoria/Label da avaliação")
    description: str = Field(..., description="Descrição/Comentário da avaliação")
    latitude: float = Field(..., description="Coordenada de latitude")
    longitude: float = Field(..., description="Coordenada de longitude")
    timestamp: datetime = Field(..., description="Data/hora em que a avaliação foi criada")

    class Config:
        from_attributes = True
