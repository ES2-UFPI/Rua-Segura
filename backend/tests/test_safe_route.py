import unittest
# pyrefly: ignore [missing-import]
import pytest

from fastapi.testclient import TestClient

from app.main import app


class TestSafeRouteEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.endpoint = "/api/routes/safe"

        from unittest.mock import patch, MagicMock
        self.patcher = patch("app.services.open_route_service.httpx.post")
        self.mock_post = self.patcher.start()

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "summary": {
                            "distance": 1000.0,
                            "duration": 300.0,
                        }
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [-42.8060, -5.0930],
                            [-42.8080, -5.0945],
                        ],
                    },
                }
            ],
        }
        self.mock_post.return_value = mock_response

    def tearDown(self):
        self.patcher.stop()

    def _valid_payload(self):
        return {
            "origin": {
                "latitude": -5.0930,
                "longitude": -42.8060
            },
            "destination": {
                "latitude": -5.0945,
                "longitude": -42.8080
            }
        }

    def _assert_bad_request(self, payload, detail):
        response = self.client.post(self.endpoint, json=payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": detail})

    def test_calculate_safe_route_success(self):
        response = self.client.post(self.endpoint, json=self._valid_payload())

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["distance"], 1000.0)
        self.assertEqual(data["duration"], 300.0)
        self.assertEqual(data["geometry"], [
            {"latitude": -5.0930, "longitude": -42.8060},
            {"latitude": -5.0945, "longitude": -42.8080}
        ])

    def test_calculate_safe_route_accepts_coordinate_boundaries(self):
        payload = {
            "origin": {
                "latitude": -90.0,
                "longitude": -180.0
            },
            "destination": {
                "latitude": 90.0,
                "longitude": 180.0
            }
        }

        # Ajusta mock para as coordenadas limites
        mock_response = self.mock_post.return_value
        mock_response.json.return_value["features"][0]["geometry"]["coordinates"] = [
            [-180.0, -90.0],
            [180.0, 90.0]
        ]

        response = self.client.post(self.endpoint, json=payload)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["distance"], 1000.0)
        self.assertEqual(data["duration"], 300.0)
        self.assertEqual(data["geometry"], [
            {"latitude": -90.0, "longitude": -180.0},
            {"latitude": 90.0, "longitude": 180.0}
        ])

    def test_calculate_safe_route_accepts_numeric_strings(self):
        payload = {
            "origin": {
                "latitude": "-5.0930",
                "longitude": "-42.8060"
            },
            "destination": {
                "latitude": "-5.0945",
                "longitude": "-42.8080"
            }
        }

        response = self.client.post(self.endpoint, json=payload)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["distance"], 1000.0)
        self.assertEqual(data["duration"], 300.0)
        self.assertEqual(data["geometry"], [
            {"latitude": -5.0930, "longitude": -42.8060},
            {"latitude": -5.0945, "longitude": -42.8080}
        ])

    def test_missing_origin(self):
        payload = {
            "destination": {
                "latitude": -5.0945,
                "longitude": -42.8080
            }
        }

        self._assert_bad_request(payload, "Origin is required")

    def test_null_origin(self):
        payload = self._valid_payload()
        payload["origin"] = None

        self._assert_bad_request(payload, "Origin is required")

    def test_missing_destination(self):
        payload = {
            "origin": {
                "latitude": -5.0930,
                "longitude": -42.8060
            }
        }

        self._assert_bad_request(payload, "Destination is required")

    def test_null_destination(self):
        payload = self._valid_payload()
        payload["destination"] = None

        self._assert_bad_request(payload, "Destination is required")

    def test_origin_must_be_object_with_latitude_and_longitude(self):
        invalid_payloads = [
            {
                "origin": "Teresina",
                "destination": self._valid_payload()["destination"]
            },
            {
                "origin": {"latitude": -5.0930},
                "destination": self._valid_payload()["destination"]
            },
            {
                "origin": {"longitude": -42.8060},
                "destination": self._valid_payload()["destination"]
            }
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                self._assert_bad_request(
                    payload,
                    "Origin must contain latitude and longitude"
                )

    def test_destination_must_be_object_with_latitude_and_longitude(self):
        invalid_payloads = [
            {
                "origin": self._valid_payload()["origin"],
                "destination": "Teresina"
            },
            {
                "origin": self._valid_payload()["origin"],
                "destination": {"latitude": -5.0945}
            },
            {
                "origin": self._valid_payload()["origin"],
                "destination": {"longitude": -42.8080}
            }
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                self._assert_bad_request(
                    payload,
                    "Destination must contain latitude and longitude"
                )

    def test_coordinates_must_be_numbers(self):
        invalid_cases = [
            ("origin", "latitude"),
            ("origin", "longitude"),
            ("destination", "latitude"),
            ("destination", "longitude")
        ]

        for point, coordinate in invalid_cases:
            payload = self._valid_payload()
            payload[point][coordinate] = "invalid"

            with self.subTest(point=point, coordinate=coordinate):
                self._assert_bad_request(payload, "Coordinates must be numbers")

    def test_invalid_coordinates(self):
        invalid_cases = [
            ("origin", "latitude", -91.0, "Latitude must be between -90 and 90"),
            ("origin", "longitude", 181.0, "Longitude must be between -180 and 180"),
            ("destination", "latitude", 95.0, "Latitude must be between -90 and 90"),
            ("destination", "longitude", -185.0, "Longitude must be between -180 and 180")
        ]

        for point, coordinate, value, detail in invalid_cases:
            payload = self._valid_payload()
            payload[point][coordinate] = value

            with self.subTest(point=point, coordinate=coordinate, value=value):
                self._assert_bad_request(payload, detail)

    def test_safe_route_endpoint_only_accepts_post(self):
        response = self.client.get(self.endpoint)

        self.assertEqual(response.status_code, 405)


def test_safe_route_integration_with_open_route_service(monkeypatch):
    client = TestClient(app)
    endpoint = "/api/routes/safe"
    
    # Configurar chave de API de teste e mock do httpx.post
    monkeypatch.setenv("ORS_API_KEY", "test-api-key")
    
    class FakeResponse:
        def __init__(self, status_code, json_data):
            self.status_code = status_code
            self._json_data = json_data
            
        def json(self):
            return self._json_data
            
    called = []
    
    def fake_post(url, headers=None, json=None, timeout=None):
        called.append((url, headers, json))
        assert "/v2/directions/" in url
        assert url.endswith("/geojson")
        assert headers is not None
        assert headers.get("Authorization") == "test-api-key"
        assert json["coordinates"] == [
            [-42.8016, -5.0892],
            [-42.8100, -5.0920],
        ]
        return FakeResponse(
            200,
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "summary": {
                                "distance": 1250.5,
                                "duration": 420.0,
                            }
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [-42.8016, -5.0892],
                                [-42.8050, -5.0901],
                                [-42.8100, -5.0920],
                            ],
                        },
                    }
                ],
            },
        )
        
    monkeypatch.setattr("app.services.open_route_service.httpx.post", fake_post)
    
    payload = {
        "origin": {
            "latitude": -5.0892,
            "longitude": -42.8016
        },
        "destination": {
            "latitude": -5.0920,
            "longitude": -42.8100
        }
    }
    
    response = client.post(endpoint, json=payload)
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "success"
    assert data["distance"] == 1250.5
    assert data["duration"] == 420.0
    
    # Validar que os pontos da rota foram convertidos e retornados no formato esperado
    assert data["geometry"] == [
        {"latitude": -5.0892, "longitude": -42.8016},
        {"latitude": -5.0901, "longitude": -42.8050},
        {"latitude": -5.0920, "longitude": -42.8100}
    ]
    
    assert len(called) == 1


def test_safe_route_consolidated_response_success(monkeypatch):
    client = TestClient(app)
    endpoint = "/api/routes/safe"
    
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
                            }
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
    
    # Adicionar uma ocorrência de teste perto de [-42.8080, -5.0870] (distância 0 metros)
    from app.controllers.review_controller import _in_memory_repository
    from app.models.location_review import LocationReview
    from datetime import datetime, timezone
    
    original_reviews = list(_in_memory_repository._reviews)
    test_review = LocationReview(
        id="999",
        category="Assalto",
        description="Assalto perto da rota",
        latitude=-5.0870,
        longitude=-42.8080,
        timestamp=datetime.now(timezone.utc)
    )
    _in_memory_repository._reviews.append(test_review)
    
    try:
        payload = {
            "origin": {
                "latitude": -5.0892,
                "longitude": -42.8101
            },
            "destination": {
                "latitude": -5.0804,
                "longitude": -42.8015
            }
        }
        
        response = client.post(endpoint, json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validar campos antigos de retrocompatibilidade
        assert data["status"] == "success"
        assert data["distance"] == 1500.0
        assert data["duration"] == 400.0
        assert len(data["geometry"]) == 3
        
        # Validar novos campos
        assert data["distanceMeters"] == 1500.0
        assert data["durationSeconds"] == 400.0
        assert data["points"] == [
            {"latitude": -5.0892, "longitude": -42.8101},
            {"latitude": -5.0870, "longitude": -42.8080},
            {"latitude": -5.0804, "longitude": -42.8015}
        ]
        assert data["route"]["type"] == "LineString"
        assert data["route"]["coordinates"] == [
            [-42.8101, -5.0892],
            [-42.8080, -5.0870],
            [-42.8015, -5.0804]
        ]
        
        # Validar o risco (LOW ou MEDIUM dependendo do score)
        # Assalto tem peso 3, que é < 5, então o nível de risco da HeuristicRiskStrategy é "AZUL" -> "LOW"
        assert data["risk"]["level"] == "LOW"
        assert data["risk"]["score"] == 3
        assert data["risk"]["nearbyOccurrencesCount"] == 1
        assert data["risk"]["intersectedRiskZonesCount"] == 0
        assert data["risk"]["description"] == "Rota com baixo risco identificado."
        
        # Validar ocorrência próxima
        assert len(data["nearbyOccurrences"]) == 1
        assert data["nearbyOccurrences"][0]["id"] == 999
        assert data["nearbyOccurrences"][0]["type"] == "ASSALTO"
        assert data["nearbyOccurrences"][0]["latitude"] == -5.0870
        assert data["nearbyOccurrences"][0]["longitude"] == -42.8080
        assert data["nearbyOccurrences"][0]["distanceFromRouteMeters"] == 0.0
        
    finally:
        _in_memory_repository._reviews = original_reviews


def test_safe_route_failure_external_service_returns_502(monkeypatch):
    client = TestClient(app)
    endpoint = "/api/routes/safe"
    
    def fake_post_error(url, headers=None, json=None, timeout=None):
        raise Exception("Connection timed out")
        
    monkeypatch.setattr("app.services.open_route_service.httpx.post", fake_post_error)
    
    payload = {
        "origin": {
            "latitude": -5.0892,
            "longitude": -42.8101
        },
        "destination": {
            "latitude": -5.0804,
            "longitude": -42.8015
        }
    }
    
    response = client.post(endpoint, json=payload)
    
    assert response.status_code == 502
    data = response.json()
    assert data == {"message": "Não foi possível calcular a rota no momento."}


def test_safe_route_high_risk_level(monkeypatch):
    client = TestClient(app)
    endpoint = "/api/routes/safe"
    
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
                                "distance": 1000.0,
                                "duration": 200.0,
                            }
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [-42.8100, -5.0890],
                                [-42.8080, -5.0870]
                            ],
                        },
                    }
                ],
            },
        )
        
    monkeypatch.setattr("app.services.open_route_service.httpx.post", fake_post)
    
    from app.controllers.review_controller import _in_memory_repository
    from app.models.location_review import LocationReview
    from datetime import datetime, timezone
    
    original_reviews = list(_in_memory_repository._reviews)
    # Adicionar 5 ocorrências de "Assalto" (cada uma peso 3, total 15, que dá VERMELHO -> HIGH)
    test_reviews = [
        LocationReview(
            id=f"99{i}",
            category="Assalto",
            description=f"Assalto {i}",
            latitude=-5.0870,
            longitude=-42.8080,
            timestamp=datetime.now(timezone.utc)
        ) for i in range(5)
    ]
    _in_memory_repository._reviews.extend(test_reviews)
    
    try:
        payload = {
            "origin": {
                "latitude": -5.0890,
                "longitude": -42.8100
            },
            "destination": {
                "latitude": -5.0870,
                "longitude": -42.8080
            }
        }
        
        response = client.post(endpoint, json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["risk"]["level"] == "HIGH"
        assert data["risk"]["score"] == 15
        assert data["risk"]["nearbyOccurrencesCount"] == 5
        assert data["risk"]["description"] == "Rota com alto risco identificado."
        assert len(data["nearbyOccurrences"]) == 5
        
    finally:
        _in_memory_repository._reviews = original_reviews
