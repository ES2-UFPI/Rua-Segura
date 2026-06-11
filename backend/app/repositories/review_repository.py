from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Optional
from app.models.location_review import LocationReview

class ReviewRepository(ABC):
    """
    Interface abstrata para persistência de avaliações de segurança (LocationReview).
    Aplica o padrão Repository para isolar o acesso a dados.
    """
    @abstractmethod
    def save(self, review: LocationReview) -> LocationReview:
        pass

    @abstractmethod
    def find_all(self) -> List[LocationReview]:
        pass

    @abstractmethod
    def find_by_id(self, id: str) -> Optional[LocationReview]:
        pass


class InMemoryReviewRepository(ReviewRepository):
    """
    Implementação em memória do repositório de avaliações.
    Útil para testes e demonstrações rápidas sem persistência física em banco de dados.
    """
    def __init__(self):
        self._reviews: List[LocationReview] = [
            # ZONA VERMELHA (Cluster UFPI - Concentrado em um raio de 500m)
            LocationReview(id="1", 
                           category="Assalto", 
                           description="Roubo de moto", 
                           latitude=-5.0550, 
                           longitude=-42.7900, 
                           timestamp=datetime(2026, 6, 6, 8, 15, tzinfo=timezone.utc)),
            LocationReview(id="2", 
                           category="Assalto", 
                           description="Armado na parada", 
                           latitude=-5.0552, 
                           longitude=-42.7905, 
                           timestamp=datetime(2026, 6, 6, 9, 00, tzinfo=timezone.utc)),
            LocationReview(id="3", 
                           category="Briga/agressão", 
                           description="Confusão", 
                           latitude=-5.0545, 
                           longitude=-42.7890, 
                           timestamp=datetime(2026, 6, 6, 10, 00, tzinfo=timezone.utc)),
            LocationReview(id="4", 
                           category="Furto", 
                           description="Bike levada", 
                           latitude=-5.0560, 
                           longitude=-42.7910, 
                           timestamp=datetime(2026, 6, 6, 11, 00, tzinfo=timezone.utc)),
            LocationReview(id="1a", 
                           category="Assalto", 
                           description="Tentativa perto do CCE", 
                           latitude=-5.0551, 
                           longitude=-42.7902, 
                           timestamp=datetime(2026, 6, 6, 14, 20, tzinfo=timezone.utc)),
            LocationReview(id="2a", 
                           category="Perseguição/stalking", 
                           description="Perseguição passarela", 
                           latitude=-5.0548, 
                           longitude=-42.7895, 
                           timestamp=datetime(2026, 6, 6, 18, 10, tzinfo=timezone.utc)),
            
            # ZONA AMARELA (Ocorrências medianas espalhadas)
            LocationReview(id="5", 
                           category="Furto", 
                           description="Bolsa levada no Centro", 
                           latitude=-5.0921, 
                           longitude=-42.8122, 
                           timestamp=datetime(2026, 6, 5, 20, 30, tzinfo=timezone.utc)),
            LocationReview(id="6", 
                           category="Movimentação suspeita", 
                           description="Pessoas rondando lojas", 
                           latitude=-5.0918, 
                           longitude=-42.8118, 
                           timestamp=datetime(2026, 6, 5, 21, 00, tzinfo=timezone.utc)),
            LocationReview(id="5a", 
                           category="Furto", 
                           description="Celular furtado na calçada", 
                           latitude=-5.0925, 
                           longitude=-42.8120, 
                           timestamp=datetime(2026, 6, 5, 22, 00, tzinfo=timezone.utc)),
            
            # ZONA AZUL (Apenas uma ocorrência leve)
            LocationReview(id="7", 
                           category="Iluminação ruim", 
                           description="Poste apagado perto da UBS", 
                           latitude=-5.0350, 
                           longitude=-42.8100, 
                           timestamp=datetime(2026, 6, 4, 15, 45, tzinfo=timezone.utc)),
        ]

    def save(self, review: LocationReview) -> LocationReview:
        # Verifica se já existe por ID para atualização, senão adiciona
        for idx, existing in enumerate(self._reviews):
            if existing.id == review.id:
                self._reviews[idx] = review
                return review
        self._reviews.append(review)
        return review

    def find_all(self) -> List[LocationReview]:
        return list(self._reviews)

    def find_by_id(self, id: str) -> Optional[LocationReview]:
        for review in self._reviews:
            if review.id == id:
                return review
        return None
