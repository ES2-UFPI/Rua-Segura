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
        # Inicializa o repositório com dados fictícios para fins de demonstração (Teresina, PI)
        self._reviews: List[LocationReview] = [
            LocationReview(
                id="d1d23b7a-9db1-4c12-9ab4-1a3b98c36b01",
                category="Iluminação ruim",
                description="Rua extremamente escura após as 18h. Vários postes sem lâmpada.",
                latitude=-5.0895,
                longitude=-42.8020,
                timestamp=datetime(2026, 6, 5, 20, 30, tzinfo=timezone.utc)
            ),
            LocationReview(
                id="f2c34b7a-8eb1-4c12-9ab4-2b4c98c36b02",
                category="Assalto",
                description="Assalto a mão armada praticado por dupla em moto na esquina da farmácia.",
                latitude=-5.0930,
                longitude=-42.8060,
                timestamp=datetime(2026, 6, 6, 8, 15, tzinfo=timezone.utc)
            ),
            LocationReview(
                id="e3d45b7a-7fb1-4c12-9ab4-3c5d98c36b03",
                category="Local deserto",
                description="Rua sem comércio e pouca movimentação de pedestres.",
                latitude=-5.0910,
                longitude=-42.7990,
                timestamp=datetime(2026, 6, 4, 15, 45, tzinfo=timezone.utc)
            ),
            LocationReview(
                id="a4e56b7a-6ab1-4c12-9ab4-4d6e98c36b04",
                category="Furto",
                description="Furto de celular de dentro do carro estacionado na rua.",
                latitude=-5.0880,
                longitude=-42.8050,
                timestamp=datetime(2026, 6, 3, 19, 00, tzinfo=timezone.utc)
            )
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
