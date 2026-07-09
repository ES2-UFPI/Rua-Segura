from datetime import datetime


class SharingSession:
    """
    Entidade de domínio que representa uma sessão de compartilhamento de trajeto mockado.
    """

    def __init__(
        self,
        token: str,
        status: str,
        origin: dict,
        current_location: dict,
        destination: dict,
        route_coordinates: list[dict] | None,
        created_at: datetime,
        expires_at: datetime,
        last_updated_at: datetime
    ):
        self.token = token
        self.status = status
        self.origin = origin
        self.current_location = current_location
        self.destination = destination
        self.route_coordinates = route_coordinates
        self.created_at = created_at
        self.expires_at = expires_at
        self.last_updated_at = last_updated_at

    def to_dict(self) -> dict:
        return {
            "token": self.token,
            "status": self.status,
            "origin": self.origin,
            "currentLocation": self.current_location,
            "destination": self.destination,
            "routeCoordinates": self.route_coordinates,
            "createdAt": self.created_at.isoformat(),
            "expiresAt": self.expires_at.isoformat(),
            "lastUpdatedAt": self.last_updated_at.isoformat()
        }
