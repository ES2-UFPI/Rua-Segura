import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.mock_occurrence_repository import InMemoryOccurrenceRepository

class TestMockOccurrenceEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Importamos a instância única do repositório em memória para resetar/limpar
        from app.controllers.mock_occurrence_controller import _repository
        _repository.clear()

    def test_get_occurrence_numeric_id_success(self):
        # 1 é a ocorrência inicial mockada semeada
        for route in ["/mock/occurrences/1", "/api/mock/occurrences/1"]:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["id"], 1)
            self.assertEqual(data["category"], "Assalto")

    def test_get_occurrence_alphanumeric_id_success(self):
        # "2a" está no InMemoryReviewRepository, então get_occurrence deve conseguir buscá-la e criá-la
        for route in ["/mock/occurrences/2a", "/api/mock/occurrences/2a"]:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["id"], "2a")
            self.assertEqual(data["category"], "Perseguição/stalking")

    def test_get_occurrence_not_found(self):
        response = self.client.get("/api/mock/occurrences/nonexistentid")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Ocorrência não encontrada.")

    def test_get_comments_alphanumeric_id(self):
        # Ocorrência "2a" existe em reviews. Inicialmente sem comentários.
        response = self.client.get("/api/mock/occurrences/2a/comments")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data, [])

    def test_add_comment_and_get_comments_alphanumeric_id(self):
        payload = {"content": "Muito perigoso esse trecho."}
        response = self.client.post("/api/mock/occurrences/2a/comments", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["content"], "Muito perigoso esse trecho.")
        self.assertEqual(data["authorName"], "Usuário anônimo")

        # Verifica se agora aparece na lista de comentários
        comments_response = self.client.get("/api/mock/occurrences/2a/comments")
        self.assertEqual(comments_response.status_code, 200)
        comments_data = comments_response.json()
        self.assertEqual(len(comments_data), 1)
        self.assertEqual(comments_data[0]["content"], "Muito perigoso esse trecho.")

    def test_add_validation_alphanumeric_id(self):
        # 1. Confirma
        payload = {"type": "confirm"}
        response = self.client.post("/api/mock/occurrences/2a/validations", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["confirmationsCount"], 1)
        self.assertEqual(data["communityStatus"], "confirmed")

        # 2. Contesta
        payload = {"type": "contest"}
        response = self.client.post("/api/mock/occurrences/2a/validations", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["contestationsCount"], 1)
        self.assertEqual(data["communityStatus"], "pending") # 1 confirm e 1 contest se anulam
