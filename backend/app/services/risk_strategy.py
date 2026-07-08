import math
from datetime import datetime, timezone
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
    """Implementação da estratégia heurística baseada em pesos estáticos com decaimento espacial/temporal"""
    def calculate(self, data: List[LocationReview]) -> Tuple[str, int]:
        score = 0.0
        radius_meters = 100.0 # Raio de busca padrão de 100 metros
        
        for review in data:
            # 1. Busca o peso base pela gravidade da ocorrência
            weight = 1
            for cat_enum, w in SEVERITY_WEIGHTS.items():
                if cat_enum.value == review.category:
                    weight = w
                    break
            
            # 2. FATOR DE DECAIMENTO POR DISTÂNCIA
            distance = getattr(review, "distance_from_route", 0.0)
            distance_decay = 1.0 - (distance / radius_meters)
            distance_decay = max(0.0, min(1.0, distance_decay)) # Limita entre 0.0 e 1.0

            # 3. FATOR DE DECAIMENTO TEMPORAL (MEIA-VIDA)
            review_time = review.timestamp.astimezone(timezone.utc) if review.timestamp.tzinfo else review.timestamp.replace(tzinfo=timezone.utc)
            time_diff = datetime.now(timezone.utc) - review_time
            days_passed = max(0.0, time_diff.total_seconds() / 86400.0)

            # Meia-vida de 30 dias (o peso cai pela metade após 30 dias de registro)
            lambda_decay = 0.0231  # math.log(2) / 30
            time_decay = math.exp(-lambda_decay * days_passed)

            # 4. APLICAÇÃO DOS DECAIMENTOS NO PESO EFETIVO
            effective_weight = weight * distance_decay * time_decay
            score += effective_weight

        # Arredonda a pontuação acumulada final para o inteiro mais próximo
        final_score = int(round(score))

        # Aplicação dos limiares de classificação
        if final_score < 5:
            level = "AZUL"
        elif 5 <= final_score < 15:
            level = "AMARELO"
        else:
            level = "VERMELHO"

        return level, final_score

class TimeBasedRiskStrategy(RiskCalculationStrategy):
    """Futura implementação da estratégia baseada em horário do dia"""
    def calculate(self, data: List[LocationReview], time: str = None) -> Tuple[str, int]:
        # TODO
        pass