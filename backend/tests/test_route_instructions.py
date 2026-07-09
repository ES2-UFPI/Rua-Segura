import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
endpoint = "/api/routes/safe"

def test_route_instructions_success(monkeypatch):
    """Garante que as instruções de navegação e o routePointIndex sejam processados e mapeados corretamente"""
    # Define a chave de teste necessária para contornar a validação do ORS
    monkeypatch.setenv("ORS_API_KEY", "test-api-key")
    
    class FakeResponse:
        def __init__(self, status_code, json_data):
            self.status_code = status_code
            self._json_data = json_data
            
        def json(self):
            return self._json_data
            
    def fake_post(url, headers=None, json=None, timeout=None):
        return FakeResponse(
            200,
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "summary": {
                                "distance": 1500.0,
                                "duration": 400.0,
                            },
                            "segments": [
                                {
                                    "distance": 1500.0,
                                    "duration": 400.0,
                                    "steps": [
                                        {
                                            "distance": 120.0,
                                            "duration": 30.0,
                                            "type": 0,  # Esquerda
                                            "instruction": "Vire à esquerda na Av. Raul Lopes",
                                            "name": "Av. Raul Lopes",
                                            "way_points": [0, 12]
                                        },
                                        {
                                            "distance": 450.0,
                                            "duration": 90.0,
                                            "type": 1,  # Direita
                                            "instruction": "Vire à direita na Rua Universitária",
                                            "name": "Rua Universitária",
                                            "way_points": [12, 25]
                                        },
                                        {
                                            "distance": 930.0,
                                            "duration": 280.0,
                                            "type": 10, # Destino/Chegada
                                            "instruction": "Chegue ao seu destino",
                                            "name": "",
                                            "way_points": [25, 40]
                                        }
                                    ]
                                }
                            ]
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [-42.8101, -5.0892],
                                [-42.8080, -5.0870],
                                [-42.8015, -5.0804]
                            ],
                        },
                    }
                ],
            },
        )
        
    monkeypatch.setattr("app.services.open_route_service.httpx.post", fake_post)
    
    payload = {
        "origin": {"latitude": -5.0892, "longitude": -42.8101},
        "destination": {"latitude": -5.0804, "longitude": -42.8015}
    }
    
    response = client.post(endpoint, json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # 1. Valida a estrutura geral da resposta (Requisito 6)
    assert "points" in data
    assert "route" in data
    assert "distanceMeters" in data
    assert "durationSeconds" in data
    assert "risk" in data
    assert "nearbyOccurrences" in data
    assert "steps" in data
    
    # 2. Valida quantidade de passos ordenados (Requisito 1)
    assert len(data["steps"]) == 3
    
    # 3. Valida a primeira instrução (Distâncias formatadas, manobras simplificadas, index)
    step_1 = data["steps"][0]
    assert step_1["instruction"] == "Vire à esquerda na Av. Raul Lopes"
    assert step_1["streetName"] == "Av. Raul Lopes"
    assert step_1["distance"] == "120 m"
    assert step_1["maneuver"] == "left"
    assert step_1["nextInstruction"] == "Vire à direita na Rua Universitária"
    assert step_1["routePointIndex"] == 12
    
    # 4. Valida a segunda instrução
    step_2 = data["steps"][1]
    assert step_2["instruction"] == "Vire à direita na Rua Universitária"
    assert step_2["streetName"] == "Rua Universitária"
    assert step_2["distance"] == "450 m"
    assert step_2["maneuver"] == "right"
    assert step_2["nextInstruction"] == "Chegue ao seu destino"
    assert step_2["routePointIndex"] == 25

    # 5. Valida a terceira instrução (manobra arrive e resiliência a nomes vazios de rua - Requisito 4)
    step_3 = data["steps"][2]
    assert step_3["instruction"] == "Chegue ao seu destino"
    assert step_3["streetName"] == ""  # Retorno seguro de rua sem nome cadastrado
    assert step_3["distance"] == "930 m"
    assert step_3["maneuver"] == "arrive"
    assert step_3["nextInstruction"] == ""
    assert step_3["routePointIndex"] == 40


def test_route_instructions_empty_steps(monkeypatch):
    """Garante que caso o ORS não retorne steps, a API retorne uma lista vazia em vez de nulo (Requisito 5)"""
    # Define a chave de teste necessária para contornar a validação do ORS
    monkeypatch.setenv("ORS_API_KEY", "test-api-key")
    
    class FakeResponse:
        def __init__(self, status_code, json_data):
            self.status_code = status_code
            self._json_data = json_data
            
        def json(self):
            return self._json_data
            
    def fake_post(url, headers=None, json=None, timeout=None):
        return FakeResponse(
            200,
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "summary": {
                                "distance": 1500.0,
                                "duration": 400.0,
                            },
                            "segments": [] # Sem segmentos/steps
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [-42.8101, -5.0892],
                                [-42.8080, -5.0870]
                            ],
                        },
                    }
                ],
            },
        )
        
    monkeypatch.setattr("app.services.open_route_service.httpx.post", fake_post)
    
    payload = {
        "origin": {"latitude": -5.0892, "longitude": -42.8101},
        "destination": {"latitude": -5.0804, "longitude": -42.8015}
    }
    
    response = client.post(endpoint, json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # 1. Verifica se steps é retornado como lista vazia [] e não null/omitido (Requisito 5)
    assert "steps" in data
    assert data["steps"] == []