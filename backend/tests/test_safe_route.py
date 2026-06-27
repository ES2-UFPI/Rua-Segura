import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestSafeRouteEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.endpoint = "/api/routes/safe"

    def test_calculate_safe_route_success(self):
        """
        Deve enviar uma requisição POST válida para o endpoint de rota segura.
        Esperar uma resposta de sucesso no futuro (status 200).
        Este teste deve falhar agora com 404 (ou similar) pois o endpoint não existe.
        """
        payload = {
            "origin": {
                "latitude": -5.0930,
                "longitude": -42.8060
            },
            "destination": {
                "latitude": -5.0945,
                "longitude": -42.8080
            }
        }
        response = self.client.post(self.endpoint, json=payload)
        # TDD RED: Deve falhar pois o endpoint não existe e retornará 404
        self.assertEqual(response.status_code, 200)

    def test_missing_origin(self):
        """
        Deve validar a obrigatoriedade da origem.
        Enviar requisição sem origem e esperar erro 400 no futuro.
        """
        payload = {
            "destination": {
                "latitude": -5.0945,
                "longitude": -42.8080
            }
        }
        response = self.client.post(self.endpoint, json=payload)
        # TDD RED: Deve falhar pois o endpoint não existe e retornará 404 (ou similar) em vez de 400
        self.assertEqual(response.status_code, 400)

    def test_missing_destination(self):
        """
        Deve validar a obrigatoriedade do destino.
        Enviar requisição sem destino e esperar erro 400 no futuro.
        """
        payload = {
            "origin": {
                "latitude": -5.0930,
                "longitude": -42.8060
            }
        }
        response = self.client.post(self.endpoint, json=payload)
        # TDD RED: Deve falhar pois o endpoint não existe e retornará 404 (ou similar) em vez de 400
        self.assertEqual(response.status_code, 400)

    def test_invalid_coordinates(self):
        """
        Deve validar coordenadas inválidas (latitude e longitude fora do intervalo).
        Latitude fora de [-90, 90] ou Longitude fora de [-180, 180] devem retornar erro 400 no futuro.
        """
        # Latitude da origem fora do intervalo (-91.0)
        payload_invalid_lat_origin = {
            "origin": {
                "latitude": -91.0,
                "longitude": -42.8060
            },
            "destination": {
                "latitude": -5.0945,
                "longitude": -42.8080
            }
        }
        response = self.client.post(self.endpoint, json=payload_invalid_lat_origin)
        self.assertEqual(response.status_code, 400)

        # Longitude da origem fora do intervalo (181.0)
        payload_invalid_lng_origin = {
            "origin": {
                "latitude": -5.0930,
                "longitude": 181.0
            },
            "destination": {
                "latitude": -5.0945,
                "longitude": -42.8080
            }
        }
        response = self.client.post(self.endpoint, json=payload_invalid_lng_origin)
        self.assertEqual(response.status_code, 400)

        # Latitude do destino fora do intervalo (95.0)
        payload_invalid_lat_dest = {
            "origin": {
                "latitude": -5.0930,
                "longitude": -42.8060
            },
            "destination": {
                "latitude": 95.0,
                "longitude": -42.8080
            }
        }
        response = self.client.post(self.endpoint, json=payload_invalid_lat_dest)
        self.assertEqual(response.status_code, 400)

        # Longitude do destino fora do intervalo (-185.0)
        payload_invalid_lng_dest = {
            "origin": {
                "latitude": -5.0930,
                "longitude": -42.8060
            },
            "destination": {
                "latitude": -5.0945,
                "longitude": -185.0
            }
        }
        response = self.client.post(self.endpoint, json=payload_invalid_lng_dest)
        self.assertEqual(response.status_code, 400)
