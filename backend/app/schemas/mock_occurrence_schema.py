from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal, Union

class MockOccurrenceResponse(BaseModel):
    id: Union[int, str] = Field(..., description="ID da ocorrência")
    category: str = Field(..., description="Categoria da ocorrência")
    description: str = Field(..., description="Descrição detalhada da ocorrência")
    locationDescription: str = Field(..., description="Descrição da localização da ocorrência")
    createdAt: datetime = Field(..., description="Data/hora de criação da ocorrência")
    confirmationsCount: int = Field(..., description="Quantidade de confirmações recebidas")
    contestationsCount: int = Field(..., description="Quantidade de contestações recebidas")
    communityStatus: str = Field(..., description="Status coletivo simples da ocorrência (confirmed, contested, pending)")

class MockCommentResponse(BaseModel):
    id: int = Field(..., description="ID do comentário")
    authorName: str = Field(..., description="Nome do autor do comentário")
    content: str = Field(..., description="Conteúdo textual do comentário")
    createdAt: datetime = Field(..., description="Data/hora de criação do comentário")

class MockCommentCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Conteúdo textual do comentário")

class MockValidationCreateRequest(BaseModel):
    type: Literal["confirm", "contest", "remove_confirm", "remove_contest"] = Field(..., description="Tipo de validação: 'confirm', 'contest', 'remove_confirm' ou 'remove_contest'")
