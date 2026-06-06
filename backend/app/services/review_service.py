from datetime import datetime, timezone
import uuid
from typing import List, Optional
from app.models.location_review import LocationReview
from app.repositories.review_repository import ReviewRepository

class ReviewService:
    """
    Serviço que implementa as regras de negócio para a gestão de avaliações de segurança (LocationReview).
    """
    def __init__(self, repository: ReviewRepository):
        self.repository = repository

    def create_review(
        self,
        category: str,
        description: str,
        latitude: float,
        longitude: float,
        timestamp: Optional[datetime] = None
    ) -> LocationReview:
        # Validação de coordenadas
        if not (-90.0 <= latitude <= 90.0):
            raise ValueError("A latitude deve estar entre -90.0 e 90.0 graus.")
        if not (-180.0 <= longitude <= 180.0):
            raise ValueError("A longitude deve estar entre -180.0 e 180.0 graus.")
            
        # Validação de campos obrigatórios
        if not category or not category.strip():
            raise ValueError("A categoria da avaliação é obrigatória.")
        if not description or not description.strip():
            raise ValueError("O comentário/descrição é obrigatório.")

        # Atribuição de valores default
        review_id = str(uuid.uuid4())
        review_timestamp = timestamp or datetime.now(timezone.utc)

        # Instanciação do modelo de domínio
        review = LocationReview(
            id=review_id,
            category=category.strip(),
            description=description.strip(),
            latitude=latitude,
            longitude=longitude,
            timestamp=review_timestamp
        )

        # Persistência pelo Repositório
        return self.repository.save(review)

    def get_all_reviews(self) -> List[LocationReview]:
        return self.repository.find_all()

    def get_review_by_id(self, id: str) -> Optional[LocationReview]:
        if not id:
            raise ValueError("O ID da avaliação não foi fornecido.")
        return self.repository.find_by_id(id)
