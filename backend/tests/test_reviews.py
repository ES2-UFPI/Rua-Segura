import unittest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Adiciona o diretório app ao path caso necessário, mas executando com python -m unittest funciona diretamente
from app.main import app
from app.models.location_review import LocationReview
from app.repositories.review_repository import InMemoryReviewRepository
from app.services.review_service import ReviewService
from app.schemas.review_schema import ReviewCategory

class TestReviewService(unittest.TestCase):
    def setUp(self):
        self.repository = InMemoryReviewRepository()
        self.service = ReviewService(self.repository)

    def test_create_review_success(self):
        review = self.service.create_review(
            category="Assalto",
            description="Assalto a mão armada no ponto de ônibus",
            latitude=-5.0930,
            longitude=-42.8060
        )
        self.assertIsNotNone(review.id)
        self.assertEqual(review.category, "Assalto")
        self.assertEqual(review.description, "Assalto a mão armada no ponto de ônibus")
        self.assertEqual(review.latitude, -5.0930)
        self.assertEqual(review.longitude, -42.8060)
        self.assertIsNotNone(review.timestamp)

        # Verifica persistência no repositório
        saved = self.repository.find_by_id(review.id)
        self.assertIsNotNone(saved)
        self.assertEqual(saved.description, review.description)

    def test_create_review_invalid_coordinates(self):
        with self.assertRaises(ValueError):
            self.service.create_review("Assalto", "Descrição", -91.0, -42.80)
        with self.assertRaises(ValueError):
            self.service.create_review("Assalto", "Descrição", -5.0, 181.0)

    def test_create_review_missing_fields(self):
        with self.assertRaises(ValueError):
            self.service.create_review("", "Descrição", -5.0, -42.80)
        with self.assertRaises(ValueError):
            self.service.create_review("Assalto", "  ", -5.0, -42.80)


class TestReviewEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_read_root(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "Rua Segura API rodando com sucesso!"})

    def test_list_reviews(self):
        response = self.client.get("/api/reviews")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        # Deve retornar pelo menos os dados mockados pré-carregados
        self.assertGreaterEqual(len(data), 4)

    def test_create_review_endpoint_success(self):
        payload = {
            "category": "Iluminação ruim",
            "description": "Poste de iluminação piscando há duas semanas",
            "latitude": -5.0945,
            "longitude": -42.8080
        }
        response = self.client.post("/api/reviews", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["category"], "Iluminação ruim")
        self.assertEqual(data["description"], "Poste de iluminação piscando há duas semanas")
        self.assertEqual(data["latitude"], -5.0945)
        self.assertEqual(data["longitude"], -42.8080)

    def test_create_review_endpoint_invalid(self):
        payload = {
            "category": "Categoria Inexistente", # Pydantic enum validation failure
            "description": "Comentário",
            "latitude": -5.0,
            "longitude": -42.0
        }
        response = self.client.post("/api/reviews", json=payload)
        self.assertEqual(response.status_code, 422) # Unprocessable Entity
