import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.controllers.mock_occurrence_controller import _repository

class TestMockOccurrenceEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Resetar o repositório antes de cada teste
        _repository.clear()

    def test_get_occurrence_success(self):
        for route in ["/mock/occurrences/1", "/api/mock/occurrences/1"]:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["id"], 1)
            self.assertEqual(data["category"], "Assalto")
            self.assertEqual(data["description"], "Relato de movimentação suspeita na região.")
            self.assertEqual(data["locationDescription"], "Próximo à praça central")
            self.assertEqual(data["confirmationsCount"], 3)
            self.assertEqual(data["contestationsCount"], 1)
            self.assertEqual(data["communityStatus"], "confirmed")
            self.assertIn("createdAt", data)

    def test_get_occurrence_not_found(self):
        response = self.client.get("/mock/occurrences/999")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Ocorrência não encontrada.")

    def test_get_comments_success(self):
        for route in ["/mock/occurrences/1/comments", "/api/mock/occurrences/1/comments"]:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["id"], 1)
            self.assertEqual(data[0]["authorName"], "Usuário anônimo")
            self.assertEqual(data[0]["content"], "Passei por lá agora e ainda está perigoso.")
            self.assertIn("createdAt", data[0])

    def test_get_comments_not_found(self):
        response = self.client.get("/mock/occurrences/999/comments")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Ocorrência não encontrada.")

    def test_add_comment_success(self):
        payload = {"content": "A iluminação continua ruim nesse trecho."}
        
        # Testar com a rota normal
        response = self.client.post("/mock/occurrences/1/comments", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["id"], 2)
        self.assertEqual(data["authorName"], "Usuário anônimo")
        self.assertEqual(data["content"], "A iluminação continua ruim nesse trecho.")
        self.assertIn("createdAt", data)

        # Verificar se o comentário foi persistido e listado
        list_response = self.client.get("/mock/occurrences/1/comments")
        list_data = list_response.json()
        self.assertEqual(len(list_data), 2)
        self.assertEqual(list_data[1]["content"], "A iluminação continua ruim nesse trecho.")

    def test_add_comment_not_found(self):
        payload = {"content": "teste"}
        response = self.client.post("/mock/occurrences/999/comments", json=payload)
        self.assertEqual(response.status_code, 404)

    def test_add_comment_invalid_payload(self):
        # Conteúdo vazio
        payload = {"content": ""}
        response = self.client.post("/mock/occurrences/1/comments", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_add_validation_confirm(self):
        payload = {"type": "confirm"}
        for route in ["/mock/occurrences/1/validations", "/api/mock/occurrences/1/validations"]:
            # Reseta antes de testar cada rota para garantir consistência
            _repository.clear()
            response = self.client.post(route, json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["confirmationsCount"], 4)
            self.assertEqual(data["contestationsCount"], 1)
            self.assertEqual(data["communityStatus"], "confirmed")

    def test_add_validation_contest_flow(self):
        # 1. Primeira contestação: 3 confirmações, 2 contestações -> status: confirmed
        response = self.client.post("/mock/occurrences/1/validations", json={"type": "contest"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["confirmationsCount"], 3)
        self.assertEqual(response.json()["contestationsCount"], 2)
        self.assertEqual(response.json()["communityStatus"], "confirmed")

        # 2. Segunda contestação: 3 confirmações, 3 contestações -> status: pending
        response = self.client.post("/mock/occurrences/1/validations", json={"type": "contest"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["confirmationsCount"], 3)
        self.assertEqual(response.json()["contestationsCount"], 3)
        self.assertEqual(response.json()["communityStatus"], "pending")

        # 3. Terceira contestação: 3 confirmações, 4 contestações -> status: contested
        response = self.client.post("/mock/occurrences/1/validations", json={"type": "contest"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["confirmationsCount"], 3)
        self.assertEqual(response.json()["contestationsCount"], 4)
        self.assertEqual(response.json()["communityStatus"], "contested")

    def test_add_validation_not_found(self):
        response = self.client.post("/mock/occurrences/999/validations", json={"type": "confirm"})
        self.assertEqual(response.status_code, 404)

    def test_add_validation_invalid_type(self):
        response = self.client.post("/mock/occurrences/1/validations", json={"type": "invalid"})
        self.assertEqual(response.status_code, 422)
