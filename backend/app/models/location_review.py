from datetime import datetime

class LocationReview:
    """
    Entidade de domínio que representa uma Avaliação de Segurança (Ocorrência) 
    de uma determinada localização.
    """
    def __init__(
        self,
        id: str,
        category: str,
        description: str,
        latitude: float,
        longitude: float,
        timestamp: datetime
    ):
        self.id = id
        self.category = category
        self.description = description
        self.latitude = latitude
        self.longitude = longitude
        self.timestamp = timestamp

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "category": self.category,
            "description": self.description,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timestamp": self.timestamp
        }
