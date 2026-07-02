from abc import ABC, abstractmethod
from typing import Dict, Optional
from app.models.sharing_session import SharingSession

class SharingRepository(ABC):
    """
    Interface abstrata para persistência de sessões de compartilhamento (SharingSession).
    """
    @abstractmethod
    def save(self, session: SharingSession) -> SharingSession:
        pass

    @abstractmethod
    def find_by_token(self, token: str) -> Optional[SharingSession]:
        pass

class InMemorySharingRepository(SharingRepository):
    """
    Implementação em memória do repositório de compartilhamento de trajetos.
    """
    def __init__(self):
        self._sessions: Dict[str, SharingSession] = {}

    def save(self, session: SharingSession) -> SharingSession:
        self._sessions[session.token] = session
        return session

    def find_by_token(self, token: str) -> Optional[SharingSession]:
        return self._sessions.get(token)
