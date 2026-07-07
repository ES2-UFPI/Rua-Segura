from fastapi import APIRouter, HTTPException, status
from typing import Any, Dict

from app.schemas.sharing_schema import (
    SharingSessionCreateResponse,
    SharedRouteResponse,
    UpdateLocationResponse,
    EndSharingResponse
)
from app.repositories.sharing_repository import InMemorySharingRepository
from app.services.sharing_service import (
    SharingService,
    SessionNotFoundError,
    SessionExpiredError,
    SessionEndedError
)


router = APIRouter(tags=["Compartilhamento Mockado"])

_repository = InMemorySharingRepository()
_sharing_service = SharingService(_repository)


@router.post(
    "/mock/sharing-sessions",
    response_model=SharingSessionCreateResponse,
    status_code=status.HTTP_201_CREATED
)
@router.post(
    "/api/mock/sharing-sessions",
    response_model=SharingSessionCreateResponse,
    status_code=status.HTTP_201_CREATED
)
def create_sharing_session(payload: Dict[str, Any]):
    """
    Inicia uma nova sessão de compartilhamento de trajeto.
    """

    if "currentLocation" not in payload or payload["currentLocation"] is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="currentLocation is required"
        )

    if "destination" not in payload or payload["destination"] is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="destination is required"
        )

    current_location = payload["currentLocation"]
    destination = payload["destination"]
    origin = payload.get("origin", current_location)

    if not isinstance(current_location, dict) or "latitude" not in current_location or "longitude" not in current_location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="currentLocation must contain latitude and longitude"
        )

    if not isinstance(destination, dict) or "latitude" not in destination or "longitude" not in destination:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="destination must contain latitude and longitude"
        )

    try:
        session = _sharing_service.create_session(
            current_location=current_location,
            destination=destination,
            origin=origin
        )

        return {
            "token": session.token,
            "shareUrl": f"https://ruasegura.app/shared/{session.token}",
            "expiresAt": session.expires_at
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/mock/shared-routes/{token}", response_model=SharedRouteResponse)
@router.get("/api/mock/shared-routes/{token}", response_model=SharedRouteResponse)
def get_shared_route(token: str):
    """
    Busca os detalhes de uma sessão de compartilhamento ativa ou encerrada pelo token.
    """

    try:
        session = _sharing_service.get_session(token)

        return {
            "status": session.status,
            "origin": session.origin,
            "currentLocation": session.current_location,
            "destination": session.destination,
            "lastUpdatedAt": session.last_updated_at
        }

    except SessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    except SessionExpiredError as e:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=str(e)
        )


@router.patch(
    "/mock/sharing-sessions/{token}/location",
    response_model=UpdateLocationResponse
)
@router.patch(
    "/api/mock/sharing-sessions/{token}/location",
    response_model=UpdateLocationResponse
)
def update_location(token: str, payload: Dict[str, Any]):
    """
    Atualiza a localização atual da sessão pelo token.
    """

    if "latitude" not in payload or "longitude" not in payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="latitude and longitude are required"
        )

    try:
        latitude = payload["latitude"]
        longitude = payload["longitude"]

        session = _sharing_service.update_location(token, latitude, longitude)

        return {
            "status": session.status,
            "currentLocation": session.current_location,
            "lastUpdatedAt": session.last_updated_at
        }

    except SessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    except SessionExpiredError as e:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=str(e)
        )

    except SessionEndedError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/mock/sharing-sessions/{token}/end",
    response_model=EndSharingResponse
)
@router.post(
    "/api/mock/sharing-sessions/{token}/end",
    response_model=EndSharingResponse
)
@router.delete(
    "/mock/sharing-sessions/{token}",
    response_model=EndSharingResponse
)
@router.delete(
    "/api/mock/sharing-sessions/{token}",
    response_model=EndSharingResponse
)
def end_sharing_session(token: str):
    """
    Encerra a sessão de compartilhamento pelo token.
    """

    try:
        session, message = _sharing_service.end_session(token)

        return {
            "status": session.status,
            "message": message
        }

    except SessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )