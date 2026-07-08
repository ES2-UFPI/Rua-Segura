import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.services.notification_service import NotificationService
from app.controllers.notification_controller import get_notification_service

class TestNotificationService(unittest.TestCase):
    def setUp(self):
        self.service = NotificationService()

    def test_register_token_success(self):
        self.assertTrue(self.service.register_token("token-test-1"))
        self.assertTrue(self.service.register_token("token-test-2"))
        
        tokens = self.service.get_all_tokens()
        self.assertEqual(len(tokens), 2)
        self.assertIn("token-test-1", tokens)
        self.assertIn("token-test-2", tokens)

    def test_register_token_empty(self):
        self.assertFalse(self.service.register_token(""))
        self.assertFalse(self.service.register_token("   "))
        self.assertEqual(len(self.service.get_all_tokens()), 0)

    def test_send_push_notification_no_tokens(self):
        result = self.service.send_push_notification("Titulo", "Corpo")
        self.assertEqual(result["sent"], 0)
        self.assertEqual(result["status"], "no_tokens")

    def test_send_push_notification_simulated(self):
        self.service.register_token("token-test-1")
        result = self.service.send_push_notification("Risco", "Perigo na área")
        self.assertEqual(result["sent"], 1)
        # Deve simular com sucesso se o Firebase não estiver configurado
        self.assertTrue(result["simulated"])


class TestNotificationEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Limpar tokens para iniciar limpo
        service = get_notification_service()
        service.clear_tokens()

    def test_register_endpoint_success(self):
        payload = {"token": "fcm-device-token-123"}
        response = self.client.post("/api/notifications/register", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Token FCM registrado com sucesso."})

        # Verifica se o token foi parar no service
        service = get_notification_service()
        self.assertIn("fcm-device-token-123", service.get_all_tokens())

    def test_register_endpoint_invalid(self):
        payload = {"token": ""}
        response = self.client.post("/api/notifications/register", json=payload)
        # Falha na validação do controller devido à checagem de token vazio
        self.assertEqual(response.status_code, 400)

    def test_send_test_notification_endpoint(self):
        # Primeiro registra token
        self.client.post("/api/notifications/register", json={"token": "token-xyz"})

        payload = {
            "title": "Alerta de Teste",
            "body": "Corpo da notificação de teste",
            "level": "AMARELO"
        }
        response = self.client.post("/api/notifications/test", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["sent"], 1)

    def test_trigger_risk_endpoint(self):
        self.client.post("/api/notifications/register", json={"token": "token-abc"})

        response = self.client.post("/api/notifications/trigger-risk?level=VERMELHO&count=4")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["sent"], 1)
