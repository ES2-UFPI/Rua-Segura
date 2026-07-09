import { Vibration, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AlertPayload } from '@/services/alertApi';
import { API_URL } from '@/config/api';

const isExpoGoRuntime = (): boolean => {
  try {
    const Constants = require('expo-constants').default;
    return Constants?.appOwnership === 'expo';
  } catch {
    return false;
  }
};

const isFirebaseMessagingAvailable = (): boolean => {
  if (Platform.OS === 'web' || isExpoGoRuntime()) {
    return false;
  }

  try {
    require('@react-native-firebase/messaging');
    require('@react-native-firebase/app');
    return true;
  } catch {
    return false;
  }
};

// Configura o handler de exibição das notificações quando o app está em primeiro plano
if (Platform.OS !== 'web' && Notifications && Notifications.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldSetBadge: true,
        shouldPlaySound: true,
        shouldVibrate: true,
      }),
    });
  } catch (err) {
    console.warn('[NotificationFacade] Não foi possível configurar o notification handler:', err);
  }
}

export const NotificationFacade = {
  /**
   * Solicita permissão para receber notificações no dispositivo.
   */
  solicitarPermissao: async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      if (!('Notification' in window)) {
        console.log('[NotificationFacade] Notificações não são suportadas neste navegador.');
        return false;
      }
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }

    try {
      if (isExpoGoRuntime()) {
        console.log('[NotificationFacade] Ambiente Expo Go detectado. Pulando integração remota de notificações.');
        return false;
      }

      if (!Notifications || !Notifications.getPermissionsAsync || !Notifications.requestPermissionsAsync) {
        console.log('[NotificationFacade] expo-notifications APIs não disponíveis.');
        return false;
      }
      const existingStatus = await Notifications.getPermissionsAsync();
      const statusStr = existingStatus?.status || 'denied';
      let finalStatus = statusStr;
      if (statusStr !== 'granted') {
        const result = await Notifications.requestPermissionsAsync();
        finalStatus = result?.status || 'denied';
      }
      const granted = finalStatus === 'granted';
      console.log(`[NotificationFacade] Permissão solicitada. Status: ${finalStatus}`);
      return granted;
    } catch (error) {
      console.error('[NotificationFacade] Erro ao solicitar permissões:', error);
      return false;
    }
  },

  /**
   * Obtém o token do Firebase Cloud Messaging (FCM) e envia para o backend.
   */
  registrarTokenNoBackend: async (): Promise<void> => {
    if (Platform.OS === 'web') {
      console.log('[NotificationFacade] Registro de token FCM ignorado no ambiente Web.');
      return;
    }

    try {
      if (!isFirebaseMessagingAvailable()) {
        console.log('[NotificationFacade] Integração Firebase indisponível neste ambiente. Pulando registro remoto.');
        return;
      }

      const messaging = require('@react-native-firebase/messaging').default;

      if (!Notifications || !Notifications.getPermissionsAsync) {
        return;
      }
      const permissions = await Notifications.getPermissionsAsync();
      if (!permissions || permissions.status !== 'granted') {
        console.log('[NotificationFacade] Permissão não concedida. Cancelando obtenção do token FCM.');
        return;
      }

      // Registra o dispositivo para receber push notifications remotos
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }

      const token = await messaging().getToken();
      console.log('[NotificationFacade] Token FCM gerado:', token);

      const response = await fetch(`${API_URL}/api/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        console.error('[NotificationFacade] Erro ao registrar token no backend:', response.status);
      } else {
        console.log('[NotificationFacade] Token FCM registrado com sucesso no backend.');
      }
    } catch (error) {
      console.warn('[NotificationFacade] Não foi possível registrar o token FCM no backend (esperado em simuladores/Expo Go):', error);
    }
  },

  /**
   * Configura listeners para escutar mensagens recebidas via FCM
   */
  configurarListenersFirebase: (
    onAlertReceived: (alerta: AlertPayload) => void
  ): (() => void) => {
    if (Platform.OS === 'web') return () => {};

    try {
      if (!isFirebaseMessagingAvailable()) {
        return () => {};
      }

      const messaging = require('@react-native-firebase/messaging').default;

      // Handler para quando o app está em primeiro plano
      const unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
        console.log('[NotificationFacade] Notificação recebida em foreground:', remoteMessage);
        if (remoteMessage.notification) {
          const alertId = remoteMessage.data?.id || `fcm-${Date.now()}`;
          const alertPayload: AlertPayload = {
            id: alertId,
            level: (remoteMessage.data?.level as any) || 'AZUL',
            title: remoteMessage.notification.title || 'Alerta de Risco',
            message: remoteMessage.notification.body || '',
          };
          onAlertReceived(alertPayload);
        }
      });

      return () => {
        unsubscribeForeground();
      };
    } catch (error) {
      console.warn('[NotificationFacade] Erro ao configurar listeners do Firebase:', error);
      return () => {};
    }
  },

  /**
   * Processa o alerta de risco executando a vibração sensorial correspondente
   * e, se houver permissão, gerando uma notificação local no sistema operacional.
   */
  processarAlertaDeRisco: async (
    novoAlerta: AlertPayload,
    setAlertsState: React.Dispatch<React.SetStateAction<AlertPayload[]>>
  ) => {
    // Adiciona o alerta no estado local para renderização na tela
    setAlertsState((prev) => {
      if (prev.some((a) => a.id === novoAlerta.id)) return prev;
      return [novoAlerta, ...prev];
    });

    // 📳 Feedback sensorial tátil
    if (Platform.OS !== 'web') {
      console.log(`[NotificationFacade] 📳 Ativando feedback tátil para nível: ${novoAlerta.level}`);
      if (novoAlerta.level === 'VERMELHO') {
        Vibration.vibrate([0, 600, 200, 600]);
      } else if (novoAlerta.level === 'AMARELO') {
        Vibration.vibrate(300);
      }
    }

    // 🔔 Notificação no nível de sistema operacional (System tray notification)
    try {
      let permissionGranted = false;
      if (Platform.OS === 'web') {
        permissionGranted = 'Notification' in window && window.Notification.permission === 'granted';
      } else {
        if (Notifications && Notifications.getPermissionsAsync) {
          const permissions = await Notifications.getPermissionsAsync();
          permissionGranted = permissions && permissions.status === 'granted';
        }
      }

      if (permissionGranted) {
        const summaryText = `Risco: ${novoAlerta.level}`;
        const title = novoAlerta.title || 'Alerta de Segurança';
        const body = `${summaryText} - ${novoAlerta.message || 'Presença de risco detectada na sua proximidade.'}`;

        if (Platform.OS === 'web') {
          new window.Notification(title, { body });
        } else {
          if (Notifications && Notifications.scheduleNotificationAsync) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { alertId: novoAlerta.id, level: novoAlerta.level },
                sound: true,
              },
              trigger: null, // Imediato
            });
          }
        }
      } else {
        console.log('[NotificationFacade] Permissão de notificação negada. Silenciando notificação de sistema.');
      }
    } catch (err) {
      console.error('[NotificationFacade] Erro ao disparar notificação local:', err);
    }
  }
};