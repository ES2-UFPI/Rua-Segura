import math
from typing import List
from app.repositories.review_repository import ReviewRepository
from app.schemas.risk_schema import RiskResponse
from app.services.risk_strategy import RiskCalculationStrategy

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class RiskService:
    def __init__(self, review_repository: ReviewRepository, strategy: RiskCalculationStrategy):
        self.review_repository = review_repository
        self.strategy = strategy

    def check_risk(self, latitude: float, longitude: float, radius_km: float = 0.5) -> RiskResponse:
        all_reviews = self.review_repository.find_all()
        nearby_reviews = []
        
        for review in all_reviews:
            dist = calculate_haversine_distance(latitude, longitude, review.latitude, review.longitude)
            if dist <= radius_km:
                nearby_reviews.append(review)

        # Delega o cálculo matemático para a Strategy
        level, score = self.strategy.calculate(nearby_reviews)
        
        return RiskResponse(level=level, score=score, count=len(nearby_reviews))