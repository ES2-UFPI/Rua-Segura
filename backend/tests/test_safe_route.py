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

