from abc import ABC, abstractmethod
from typing import List, Tuple
from app.models.location_review import LocationReview
from app.schemas.review_schema import ReviewCategory

SEVERITY_WEIGHTS = {
    ReviewCategory.ASSALTO: 3,
    ReviewCategory.BRIGA_AGRESSAO: 3,
    ReviewCategory.PERSEGUICAO_STALKING: 3,
    ReviewCategory.FURTO: 2,
    ReviewCategory.ASSEDIO: 2,
    ReviewCategory.MOVIMENTACAO_SUSPEITA: 2,
    ReviewCategory.ILUMINACAO_RUIM: 1,
    ReviewCategory.INFRAESTRUTURA_INADEQUADA: 1,
    ReviewCategory.LOCAL_DESERTO: 1,
}

class RiskCalculationStrategy(ABC):
    """Interface base para as estratégias de cálculo de risco"""
    @abstractmethod
    def calculate(self, data: List[LocationReview]) -> Tuple[str, int]:
        pass

class HeuristicRiskStrategy(RiskCalculationStrategy):
    """Implementação da estratégia heurística baseada em pesos estáticos"""
    def calculate(self, data: List[LocationReview]) -> Tuple[str, int]:
        score = 0
        for review in data:
            weight = 1
            for cat_enum, w in SEVERITY_WEIGHTS.items():
                if cat_enum.value == review.category:
                    weight = w
                    break
            score += weight

        # Aplicação dos limiares de classificação definidos no plano
        # TODO: Mudar limiares teste depois
        if score < 5:
            level = "AZUL"
        elif 5 <= score < 15:
            level = "AMARELO"
        else:
            level = "VERMELHO"

        return level, score

class TimeBasedRiskStrategy(RiskCalculationStrategy):
    """Futura implementação da estratégia baseada em horário do dia"""
    def calculate(self, data: List[LocationReview], time: str = None) -> Tuple[str, int]:
        # TODO
        pass