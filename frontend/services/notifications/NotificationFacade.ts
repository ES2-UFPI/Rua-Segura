import { Platform, Alert } from 'react-native';
import { AlertPayload } from '@/services/alertApi';

export class NotificationFacade {

  public static async processarAlertaDeRisco(
    alerta: AlertPayload,
    setAlertsState: React.Dispatch<React.SetStateAction<AlertPayload[]>>
  ): Promise<void> {
    try {
      console.log(`[NotificationFacade] Log acionado para o nível: ${alerta.level}`);

      setAlertsState([alerta]);

    } catch (error) {
      console.error('[NotificationFacade] Erro ao orquestrar notificações:', error);
    }
  }
}