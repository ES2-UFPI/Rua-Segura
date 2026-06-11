from pydantic import BaseModel, Field

class RiskResponse(BaseModel):
    level: str = Field(..., description="Nível calculado: AZUL, AMARELO ou VERMELHO")
    score: int = Field(..., description="Pontuação de risco acumulada")
    count: int = Field(..., description="Quantidade de ocorrências no raio buscado")