import logging
from typing import List, Dict, Any, Optional
from firebase_admin import messaging

logger = logging.getLogger("RuaSeguraNotificationService")

class NotificationService:
    """
    Serviço responsável pelo gerenciamento de tokens de notificação e envio de push via Firebase.
    """
    def __init__(self):
        self._tokens = set()

    def register_token(self, token: str) -> bool:
        if not token or not token.strip():
            return False
        token_clean = token.strip()
        self._tokens.add(token_clean)
        logger.info(f"[NotificationService] Token registrado. Total de tokens ativos: {len(self._tokens)}")
        return True

    def get_all_tokens(self) -> List[str]:
        return list(self._tokens)

    def clear_tokens(self):
        self._tokens.clear()

    def send_push_notification(self, title: str, body: str, data: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Envia uma notificação push Firebase para todos os tokens registrados.
        Se o Firebase SDK não estiver inicializado, faz o log e simula o envio com sucesso.
        """
        tokens = self.get_all_tokens()
        if not tokens:
            logger.info("[NotificationService] Nenhum token registrado para receber notificações.")
            return {"sent": 0, "failed": 0, "status": "no_tokens", "simulated": False}

        success_count = 0
        failure_count = 0
        errors = []
        simulated = False

        for token in tokens:
            # Garante que os valores no data dict sejam strings
            data_str = {}
            if data:
                for k, v in data.items():
                    data_str[k] = str(v)

            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data_str,
                token=token
            )
            try:
                response = messaging.send(message)
                success_count += 1
                logger.info(f"[NotificationService] Notificação enviada para {token[:15]}... Resposta: {response}")
            except ValueError as ve:
                # Ocorre quando o Firebase Admin SDK não foi inicializado (falta credenciais)
                logger.warning(f"[NotificationService] Firebase Admin não inicializado ({ve}). Simulando envio.")
                success_count += 1
                simulated = True
            except Exception as e:
                failure_count += 1
                error_msg = str(e)
                errors.append(error_msg)
                logger.error(f"[NotificationService] Falha ao enviar notificação para {token[:15]}...: {error_msg}")

        return {
            "sent": success_count,
            "failed": failure_count,
            "errors": errors,
            "status": "completed" if failure_count == 0 else "partial_failure",
            "simulated": simulated
        }
