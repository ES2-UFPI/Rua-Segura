from pydantic import BaseModel, Field

class AlertPayload(BaseModel):
    id: str = Field(..., description="ID único do alerta gerado")
    level: str = Field(..., description="Nível de risco: 'AZUL' | 'AMARELO' | 'VERMELHO'")
    title: str = Field(..., description="Título dinâmico do alerta")
    message: str = Field(..., description="Mensagem de orientação ao usuário")
    score: float = Field(..., description="Score de criticidade calculado")
    count: int = Field(..., description="Quantidade de ocorrências na área")
    latitude: float = Field(..., description="Latitude do ponto central do risco")
    longitude: float = Field(..., description="Longitude do ponto central do risco")