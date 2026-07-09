from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.mock_occurrence_schema import (
    MockOccurrenceResponse,
    MockCommentResponse,
    MockCommentCreateRequest,
    MockValidationCreateRequest
)
from app.repositories.mock_occurrence_repository import InMemoryOccurrenceRepository

router = APIRouter(tags=["Ocorrências Mockadas"])

_repository = InMemoryOccurrenceRepository()

@router.get("/mock/occurrences/{id}", response_model=MockOccurrenceResponse)
@router.get("/api/mock/occurrences/{id}", response_model=MockOccurrenceResponse)
def get_occurrence(id: str):
    """
    Retorna os detalhes de uma ocorrência mockada pelo ID.
    """
    occurrence = _repository.get_occurrence(id)
    if not occurrence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ocorrência não encontrada."
        )
    return occurrence

@router.get("/mock/occurrences/{id}/comments", response_model=List[MockCommentResponse])
@router.get("/api/mock/occurrences/{id}/comments", response_model=List[MockCommentResponse])
def get_comments(id: str):
    """
    Lista os comentários de uma ocorrência mockada.
    """
    comments = _repository.get_comments(id)
    if comments is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ocorrência não encontrada."
        )
    return comments

@router.post("/mock/occurrences/{id}/comments", response_model=MockCommentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/api/mock/occurrences/{id}/comments", response_model=MockCommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(id: str, payload: MockCommentCreateRequest):
    """
    Envia um novo comentário para a ocorrência mockada.
    """
    comment = _repository.add_comment(id, payload.content)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ocorrência não encontrada."
        )
    return comment

@router.post("/mock/occurrences/{id}/validations", response_model=MockOccurrenceResponse)
@router.post("/api/mock/occurrences/{id}/validations", response_model=MockOccurrenceResponse)
def add_validation(id: str, payload: MockValidationCreateRequest):
    """
    Registra confirmação ou contestação da ocorrência mockada.
    """
    try:
        occurrence = _repository.add_validation(id, payload.type)
        if not occurrence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ocorrência não encontrada."
            )
        return occurrence
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
