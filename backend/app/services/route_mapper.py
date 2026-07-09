from typing import Any, Dict

class RouteResponseMapper:
    @staticmethod
    def map_to_response(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mapeia a estrutura de dados interna consolidada pelo RouteService
        para o formato de resposta final esperado pelo frontend (SafeRouteResponse).
        """
        return {
            # Campos antigos (retrocompatibilidade)
            "status": "success",
            "distance": data["distance_meters"],
            "duration": data["duration_seconds"],
            "geometry": data["points"],

            # Novos campos exigidos pela issue #90
            "distanceMeters": data["distance_meters"],
            "durationSeconds": data["duration_seconds"],
            "risk": {
                "level": data["risk"]["level"],
                "score": data["risk"]["score"],
                "description": data["risk"]["description"],
                "nearbyOccurrencesCount": data["risk"]["nearbyOccurrencesCount"],
                "intersectedRiskZonesCount": data["risk"]["intersectedRiskZonesCount"]
            },
            "route": {
                "type": "LineString",
                "coordinates": data["coordinates"]
            },
            "points": data["points"],
            "steps": data.get("steps", []),
            "nearbyOccurrences": data["nearbyOccurrences"]
        }
