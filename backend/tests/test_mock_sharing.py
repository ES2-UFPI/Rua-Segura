import unittest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.controllers.mock_sharing_controller import _repository, _sharing_service

class TestMockSharingEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Limpar o repositório em memória antes de cada teste
        _repository._sessions.clear()

    def test_create_session_success(self):
        payload = {
            "currentLocation": {
                "latitude": -5.0892,
                "longitude": -42.8016
            },
            "destination": {
                "latitude": -5.0911,
                "longitude": -42.8033
            }
        }
        # Testar tanto rota com /api quanto sem
        for route in ["/mock/sharing-sessions", "/api/mock/sharing-sessions"]:
            response = self.client.post(route, json=payload)
            self.assertEqual(response.status_code, 201)
            
            data = response.json()
            self.assertIn("token", data)
            self.assertIn("shareUrl", data)
            self.assertIn("expiresAt", data)
            self.assertTrue(data["shareUrl"].endswith(data["token"]))
            
            # Verificar se está no repositório
            token = data["token"]
            session = _repository.find_by_token(token)
            self.assertIsNotNone(session)
            self.assertEqual(session.status, "active")

    def test_get_active_session(self):
        # 1. Cria a sessão via serviço
        session = _sharing_service.create_session(
            current_location={"latitude": -5.0892, "longitude": -42.8016},
            destination={"latitude": -5.0911, "longitude": -42.8033}
        )
        
        # 2. Consulta via endpoint
        for route in [f"/mock/shared-routes/{session.token}", f"/api/mock/shared-routes/{session.token}"]:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data["status"], "active")
            self.assertEqual(data["currentLocation"]["latitude"], -5.0892)
            self.assertEqual(data["currentLocation"]["longitude"], -42.8016)
            self.assertEqual(data["destination"]["latitude"], -5.0911)
            self.assertEqual(data["destination"]["longitude"], -42.8033)
            self.assertIn("lastUpdatedAt", data)

    def test_create_and_get_session_with_route_coordinates(self):
        route_coordinates = [
            {"latitude": -5.0892, "longitude": -42.8016},
            {"latitude": -5.0900, "longitude": -42.8020},
            {"latitude": -5.0911, "longitude": -42.8033},
        ]
        payload = {
            "origin": route_coordinates[0],
            "currentLocation": route_coordinates[0],
            "destination": route_coordinates[-1],
            "routeCoordinates": route_coordinates,
        }

        create_response = self.client.post("/api/mock/sharing-sessions", json=payload)

        self.assertEqual(create_response.status_code, 201)

        token = create_response.json()["token"]
        get_response = self.client.get(f"/api/mock/shared-routes/{token}")

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response.json()["routeCoordinates"], route_coordinates)

    def test_get_session_not_found(self):
        response = self.client.get("/mock/shared-routes/nonexistenttoken")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Sessão de compartilhamento não encontrada.")

    def test_update_location_success(self):
        session = _sharing_service.create_session(
            current_location={"latitude": -5.0892, "longitude": -42.8016},
            destination={"latitude": -5.0911, "longitude": -42.8033}
        )
        
        update_payload = {
            "latitude": -5.0900,
            "longitude": -42.8020
        }
        
        # Atualiza a localização
        response = self.client.patch(f"/mock/sharing-sessions/{session.token}/location", json=update_payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["status"], "active")
        self.assertEqual(data["currentLocation"]["latitude"], -5.0900)
        self.assertEqual(data["currentLocation"]["longitude"], -42.8020)
        self.assertIn("lastUpdatedAt", data)
        
        # Consultar novamente para confirmar persistência
        get_response = self.client.get(f"/mock/shared-routes/{session.token}")
        get_data = get_response.json()
        self.assertEqual(get_data["currentLocation"]["latitude"], -5.0900)
        self.assertEqual(get_data["destination"]["latitude"], -5.0911) # Mantido igual

    def test_update_location_not_found(self):
        response = self.client.patch("/mock/sharing-sessions/invalidtoken/location", json={"latitude": 0.0, "longitude": 0.0})
        self.assertEqual(response.status_code, 404)

    def test_end_session_success(self):
        session = _sharing_service.create_session(
            current_location={"latitude": -5.0892, "longitude": -42.8016},
            destination={"latitude": -5.0911, "longitude": -42.8033}
        )
        
        # Encerra a sessão via POST .../end
        response = self.client.post(f"/mock/sharing-sessions/{session.token}/end")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ended")
        self.assertEqual(response.json()["message"], "Compartilhamento encerrado com sucesso.")
        
        # Consulta novamente para verificar o status ended
        get_response = self.client.get(f"/mock/shared-routes/{session.token}")
        self.assertEqual(get_response.json()["status"], "ended")

    def test_end_session_via_delete(self):
        session = _sharing_service.create_session(
            current_location={"latitude": -5.0892, "longitude": -42.8016},
            destination={"latitude": -5.0911, "longitude": -42.8033}
        )
        
        # Encerra a sessão via DELETE
        response = self.client.delete(f"/mock/sharing-sessions/{session.token}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ended")
        
        # Tenta encerrar novamente, deve retornar mensagem que já está encerrado
        response2 = self.client.delete(f"/mock/sharing-sessions/{session.token}")
        self.assertEqual(response2.json()["message"], "Compartilhamento já está encerrado.")

    def test_update_location_ended_session(self):
        session = _sharing_service.create_session(
            current_location={"latitude": -5.0892, "longitude": -42.8016},
            destination={"latitude": -5.0911, "longitude": -42.8033}
        )
        
        # Encerra a sessão
        _sharing_service.end_session(session.token)
        
        # Tenta atualizar
        response = self.client.patch(
            f"/mock/sharing-sessions/{session.token}/location",
            json={"latitude": -5.0900, "longitude": -42.8020}
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["detail"], "Compartilhamento encerrado. Não é possível atualizar a localização.")

    def test_invalid_coordinates(self):
        # 1. Criação com latitude inválida
        payload = {
            "currentLocation": {"latitude": 95.0, "longitude": -42.8016},
            "destination": {"latitude": -5.0911, "longitude": -42.8033}
        }
        response = self.client.post("/mock/sharing-sessions", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Latitude must be between -90 and 90")

        # 2. Criação com longitude inválida
        payload = {
            "currentLocation": {"latitude": -5.0892, "longitude": -190.0},
            "destination": {"latitude": -5.0911, "longitude": -42.8033}
        }
        response = self.client.post("/mock/sharing-sessions", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Longitude must be between -180 and 180")

        # 3. Atualização com latitude inválida
        session = _sharing_service.create_session(
            current_location={"latitude": -5.0892, "longitude": -42.8016},
            destination={"latitude": -5.0911, "longitude": -42.8033}
        )
        response = self.client.patch(
            f"/mock/sharing-sessions/{session.token}/location",
            json={"latitude": -95.0, "longitude": -42.8020}
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Latitude must be between -90 and 90")

    def test_expired_session(self):
        session = _sharing_service.create_session(
            current_location={"latitude": -5.0892, "longitude": -42.8016},
            destination={"latitude": -5.0911, "longitude": -42.8033}
        )
        
        # Simula expiração alterando expires_at para o passado
        session.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        _repository.save(session)
        
        # Consulta deve retornar 410 Gone
        get_response = self.client.get(f"/mock/shared-routes/{session.token}")
        self.assertEqual(get_response.status_code, 410)
        self.assertEqual(get_response.json()["detail"], "Sessão de compartilhamento expirada.")
        
        # Atualização deve retornar 410 Gone
        patch_response = self.client.patch(
            f"/mock/sharing-sessions/{session.token}/location",
            json={"latitude": -5.0900, "longitude": -42.8020}
        )
        self.assertEqual(patch_response.status_code, 410)
        self.assertEqual(patch_response.json()["detail"], "Sessão de compartilhamento expirada.")

    def test_create_session_with_origin(self):
        payload = {
            "origin": {
                "latitude": -5.0880,
                "longitude": -42.8000
            },
            "currentLocation": {
                "latitude": -5.0892,
                "longitude": -42.8016
            },
            "destination": {
                "latitude": -5.0911,
                "longitude": -42.8033
            }
        }

        response = self.client.post("/mock/sharing-sessions", json=payload)

        self.assertEqual(response.status_code, 201)

        data = response.json()
        token = data["token"]

        session = _repository.find_by_token(token)

        self.assertIsNotNone(session)
        self.assertEqual(session.origin["latitude"], -5.0880)
        self.assertEqual(session.origin["longitude"], -42.8000)

    def test_expired_session_should_update_status_to_expired(self):
        session = _sharing_service.create_session(
            current_location={"latitude": -5.0892, "longitude": -42.8016},
            destination={"latitude": -5.0911, "longitude": -42.8033}
        )

        session.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        _repository.save(session)

        response = self.client.get(f"/mock/shared-routes/{session.token}")

        self.assertEqual(response.status_code, 410)

        expired_session = _repository.find_by_token(session.token)
        self.assertEqual(expired_session.status, "expired")
