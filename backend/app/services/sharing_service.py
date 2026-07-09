import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple

from app.models.sharing_session import SharingSession
from app.repositories.sharing_repository import SharingRepository


class SessionNotFoundError(Exception):
    pass


class SessionExpiredError(Exception):
    pass


class SessionEndedError(Exception):
    pass


class SharingService:
    """
    Serviço que implementa as regras de negócio para a gestão de sessões de compartilhamento de trajeto.
    """

    def __init__(self, repository: SharingRepository):
        self.repository = repository

    def create_session(
        self,
        current_location: dict,
        destination: dict,
        origin: Optional[dict] = None,
        route_coordinates: Optional[list[dict]] = None
    ) -> SharingSession:
        origin = origin or current_location

        validated_origin = self._validate_location("origin", origin)
        validated_current_location = self._validate_location("currentLocation", current_location)
        validated_destination = self._validate_location("destination", destination)
        validated_route_coordinates = self._validate_route_coordinates(route_coordinates)

        token = uuid.uuid4().hex[:8]
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=60)

        session = SharingSession(
            token=token,
            status="active",
            origin=validated_origin,
            current_location=validated_current_location,
            destination=validated_destination,
            route_coordinates=validated_route_coordinates,
            created_at=now,
            expires_at=expires_at,
            last_updated_at=now
        )

        return self.repository.save(session)

    def get_session(self, token: str) -> SharingSession:
        if not token:
            raise ValueError("O token é obrigatório.")

        session = self.repository.find_by_token(token)

        if not session:
            raise SessionNotFoundError("Sessão de compartilhamento não encontrada.")

        if datetime.now(timezone.utc) > session.expires_at:
            session.status = "expired"
            self.repository.save(session)
            raise SessionExpiredError("Sessão de compartilhamento expirada.")

        return session

    def update_location(self, token: str, latitude: float, longitude: float) -> SharingSession:
        if not token:
            raise ValueError("O token é obrigatório.")

        validated_location = self._validate_location(
            "currentLocation",
            {
                "latitude": latitude,
                "longitude": longitude
            }
        )

        session = self.repository.find_by_token(token)

        if not session:
            raise SessionNotFoundError("Sessão de compartilhamento não encontrada.")

        if datetime.now(timezone.utc) > session.expires_at:
            session.status = "expired"
            self.repository.save(session)
            raise SessionExpiredError("Sessão de compartilhamento expirada.")

        if session.status == "ended":
            raise SessionEndedError("Compartilhamento encerrado. Não é possível atualizar a localização.")

        session.current_location = validated_location
        session.last_updated_at = datetime.now(timezone.utc)

        return self.repository.save(session)

    def end_session(self, token: str) -> Tuple[SharingSession, str]:
        if not token:
            raise ValueError("O token é obrigatório.")

        session = self.repository.find_by_token(token)

        if not session:
            raise SessionNotFoundError("Sessão de compartilhamento não encontrada.")

        if session.status == "ended":
            return session, "Compartilhamento já está encerrado."

        session.status = "ended"

        return self.repository.save(session), "Compartilhamento encerrado com sucesso."

    def _validate_location(self, loc_name: str, loc: dict) -> dict:
        if not isinstance(loc, dict):
            raise ValueError(f"Objeto de {loc_name} inválido.")

        latitude = loc.get("latitude")
        longitude = loc.get("longitude")

        if latitude is None or longitude is None:
            raise ValueError(f"Coordenadas de {loc_name} incompletas.")

        try:
            validated_latitude = float(latitude)
            validated_longitude = float(longitude)
        except (ValueError, TypeError):
            raise ValueError(f"Coordenadas de {loc_name} devem ser numéricas.")

        if not (-90.0 <= validated_latitude <= 90.0):
            raise ValueError("Latitude must be between -90 and 90")

        if not (-180.0 <= validated_longitude <= 180.0):
            raise ValueError("Longitude must be between -180 and 180")

        return {
            "latitude": validated_latitude,
            "longitude": validated_longitude
        }

    def _validate_route_coordinates(self, route_coordinates: Optional[list[dict]]) -> Optional[list[dict]]:
        if route_coordinates is None:
            return None

        if not isinstance(route_coordinates, list):
            raise ValueError("routeCoordinates must be a list")

        validated_coordinates = [
            self._validate_location("routeCoordinates", coordinate)
            for coordinate in route_coordinates
        ]

        if len(validated_coordinates) < 2:
            raise ValueError("routeCoordinates must contain at least two points")

        return validated_coordinates
