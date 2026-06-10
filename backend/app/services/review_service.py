import math
from datetime import datetime, timezone
import uuid
from typing import List, Optional
from app.models.location_review import LocationReview
from app.repositories.review_repository import ReviewRepository
from app.schemas.review_schema import RiskResponse, SEVERITY_WEIGHTS

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula a distância em quilômetros entre duas coordenadas globais usando a fórmula de Haversine.
    """
    R = 6371.0  # Raio médio da Terra em km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

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

    def calculate_area_risk(self, latitude: float, longitude: float, radius_km: float = 0.5) -> RiskResponse:
            """
            Lógica central de negócio: 
            1. Filtra avaliações num raio de X km.
            2. Aplica estratégia de peso baseado na severidade.
            3. Compara com os limiares e define o nível.
            """
            all_reviews = self.repository.find_all()
            score = 0
            count = 0

            for review in all_reviews:
                dist = calculate_haversine_distance(latitude, longitude, review.latitude, review.longitude)
                
                if dist <= radius_km:
                    count += 1
                    # Encontra o peso da categoria usando o Padrão Strategy
                    weight = 1 # Valor default
                    for cat_enum, w in SEVERITY_WEIGHTS.items():
                        if cat_enum.value == review.category:
                            weight = w
                            break
                    score += weight

            # Aplicação dos limiares de classificação definidos no plano
            ###################### Mudar Limiares teste ########################
            if score < 5:
                level = "AZUL"
            elif 5 <= score < 15:
                level = "AMARELO"
            else:
                level = "VERMELHO"

            return RiskResponse(level=level, score=score, count=count)