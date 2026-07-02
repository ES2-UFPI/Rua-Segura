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

    def create_session(self, current_location: dict, destination: dict) -> SharingSession:
        # Validação de latitude/longitude de origem e destino
        for loc_name, loc in [("currentLocation", current_location), ("destination", destination)]:
            if not isinstance(loc, dict):
                raise ValueError(f"Objeto de {loc_name} inválido.")
            lat = loc.get("latitude")
            lng = loc.get("longitude")
            if lat is None or lng is None:
                raise ValueError(f"Coordenadas de {loc_name} incompletas.")
            try:
                f_lat = float(lat)
                f_lng = float(lng)
            except (ValueError, TypeError):
                raise ValueError(f"Coordenadas de {loc_name} devem ser numéricas.")
            if not (-90.0 <= f_lat <= 90.0):
                raise ValueError("Latitude must be between -90 and 90")
            if not (-180.0 <= f_lng <= 180.0):
                raise ValueError("Longitude must be between -180 and 180")

        token = uuid.uuid4().hex[:8]
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=60)

        session = SharingSession(
            token=token,
            status="active",
            current_location={
                "latitude": float(current_location["latitude"]),
                "longitude": float(current_location["longitude"])
            },
            destination={
                "latitude": float(destination["latitude"]),
                "longitude": float(destination["longitude"])
            },
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
        
        # Verifica se expirou
        if datetime.now(timezone.utc) > session.expires_at:
            raise SessionExpiredError("Sessão de compartilhamento expirada.")
            
        return session

    def update_location(self, token: str, latitude: float, longitude: float) -> SharingSession:
        if not token:
            raise ValueError("O token é obrigatório.")
        
        # Validação geográfica
        try:
            f_lat = float(latitude)
            f_lng = float(longitude)
        except (ValueError, TypeError):
            raise ValueError("As coordenadas devem ser numéricas.")
            
        if not (-90.0 <= f_lat <= 90.0):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180.0 <= f_lng <= 180.0):
            raise ValueError("Longitude must be between -180 and 180")

        session = self.repository.find_by_token(token)
        if not session:
            raise SessionNotFoundError("Sessão de compartilhamento não encontrada.")

        # Verifica se expirou
        if datetime.now(timezone.utc) > session.expires_at:
            raise SessionExpiredError("Sessão de compartilhamento expirada.")

        # Verifica se já encerrou
        if session.status == "ended":
            raise SessionEndedError("Compartilhamento encerrado. Não é possível atualizar a localização.")

        session.current_location = {"latitude": f_lat, "longitude": f_lng}
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
