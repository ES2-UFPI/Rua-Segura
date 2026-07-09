import math
import os
from typing import List, Dict, Any
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

def distance_point_to_segment_meters(lat_p: float, lon_p: float, lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    if lat_a == lat_b and lon_a == lon_b:
        return calculate_haversine_distance(lat_p, lon_p, lat_a, lon_a) * 1000.0

    mean_lat = math.radians((lat_a + lat_b + lat_p) / 3.0)
    cos_lat = math.cos(mean_lat)

    dx = (lon_b - lon_a) * cos_lat
    dy = lat_b - lat_a

    px = (lon_p - lon_a) * cos_lat
    py = lat_p - lat_a

    segment_len_sq = dx*dx + dy*dy
    if segment_len_sq == 0:
        return calculate_haversine_distance(lat_p, lon_p, lat_a, lon_a) * 1000.0

    t = (px * dx + py * dy) / segment_len_sq
    t = max(0.0, min(1.0, t))

    closest_lat = lat_a + t * dy
    closest_lon = lon_a + t * (lon_b - lon_a)

    return calculate_haversine_distance(lat_p, lon_p, closest_lat, closest_lon) * 1000.0

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

    def calculate_route_risk(self, route_points: List[tuple[float, float]], radius_meters: float = None) -> Dict[str, Any]:
        """
        Calcula o nível de risco acumulado da rota com base nas ocorrências próximas.
        """
        if radius_meters is None:
            radius_meters = float(os.getenv("RISK_OCCURRENCE_RADIUS_METERS", "100.0"))

        all_reviews = self.review_repository.find_all()
        nearby_reviews = []
        nearby_occurrences_data = []

         # Converte o raio de busca de metros para graus decimais (aprox. 111.111 metros por grau)
        deg_offset = radius_meters / 111111.0
        # Encontra a Bounding Box da rota inteira
        latitudes = [pt[0] for pt in route_points]
        longitudes = [pt[1] for pt in route_points]
        min_lat, max_lat = min(latitudes) - deg_offset, max(latitudes) + deg_offset
        min_lng, max_lng = min(longitudes) - deg_offset, max(longitudes) + deg_offset
        # Pré-filtra as ocorrências de forma rápida antes de calcular a distância ponto-a-segmento
        relevant_reviews = [
            review for review in all_reviews
            if min_lat <= review.latitude <= max_lat and min_lng <= review.longitude <= max_lng
        ]
        for review in relevant_reviews:
            min_dist = float("inf")
            if len(route_points) == 0:
                continue
            elif len(route_points) == 1:
                min_dist = calculate_haversine_distance(review.latitude, review.longitude, route_points[0][0], route_points[0][1]) * 1000.0
            else:
                for i in range(len(route_points) - 1):
                    p1 = route_points[i]
                    p2 = route_points[i+1]
                    dist = distance_point_to_segment_meters(
                        review.latitude, review.longitude,
                        p1[0], p1[1],
                        p2[0], p2[1]
                    )
                    if dist < min_dist:
                        min_dist = dist

            if min_dist <= radius_meters:
                # Injeta dinamicamente a distância para que a estratégia possa usar no cálculo
                review.distance_from_route = min_dist
                nearby_reviews.append(review)
                try:
                    occ_id = int(review.id)
                except ValueError:
                    occ_id = review.id

                nearby_occurrences_data.append({
                    "id": occ_id,
                    "type": review.category.upper(),
                    "latitude": review.latitude,
                    "longitude": review.longitude,
                    "distanceFromRouteMeters": round(min_dist, 2)
                })

        # Calcula o score e nível usando a estratégia atual
        level, score = self.strategy.calculate(nearby_reviews)

        # Mapeia os níveis internos (AZUL, AMARELO, VERMELHO) para (LOW, MEDIUM, HIGH)
        level_map = {
            "AZUL": "LOW",
            "AMARELO": "MEDIUM",
            "VERMELHO": "HIGH"
        }
        mapped_level = level_map.get(level, "LOW")

        desc_map = {
            "LOW": "Rota com baixo risco identificado.",
            "MEDIUM": "Rota com médio risco identificado.",
            "HIGH": "Rota com alto risco identificado."
        }
        description = desc_map.get(mapped_level, "Rota com baixo risco identificado.")

        return {
            "level": mapped_level,
            "score": score,
            "description": description,
            "nearbyOccurrencesCount": len(nearby_reviews),
            "intersectedRiskZonesCount": 0,
            "nearbyOccurrences": nearby_occurrences_data
        }