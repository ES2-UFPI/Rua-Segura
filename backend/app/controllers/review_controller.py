from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from app.schemas.review_schema import ReviewCreate, ReviewResponse, RiskResponse
from app.services.review_service import ReviewService
from app.repositories.review_repository import InMemoryReviewRepository

router = APIRouter(prefix="/api/reviews", tags=["Avaliações de Segurança"])

# Instância única em memória compartilhada pelo processo do servidor FastAPI
# Isso garante que as novas avaliações cadastradas persistam durante a execução do servidor
_in_memory_repository = InMemoryReviewRepository()
_review_service = ReviewService(_in_memory_repository)

def get_review_service() -> ReviewService:
    """Retorna a instância do serviço de avaliações."""
    return _review_service

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate):
    """
    Cadastra uma nova avaliação de segurança (ocorrência) para uma coordenada geográfica.
    """
    try:
        review = _review_service.create_review(
            category=payload.category,
            description=payload.description,
            latitude=payload.latitude,
            longitude=payload.longitude,
            timestamp=payload.timestamp
        )
        return review
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("", response_model=List[ReviewResponse])
def list_reviews():
    """
    Retorna a lista de todas as avaliações de segurança registradas.
    """
    return _review_service.get_all_reviews()

@router.get("/risk", response_model=RiskResponse)
def get_area_risk(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude do centro do mapa visível"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude do centro do mapa visível"),
):
    """
    Calcula e retorna o nível de risco de uma área (Verde, Amarelo ou Vermelho)
    baseando-se na densidade e severidade de ocorrências em um raio de 500 metros.
    """
    return _review_service.calculate_area_risk(latitude=latitude, longitude=longitude)

@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: str):
    """
    Busca os detalhes de uma avaliação de segurança por ID.
    """
    review = _review_service.get_review_by_id(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Avaliação com ID {review_id} não encontrada."
        )
    return review

