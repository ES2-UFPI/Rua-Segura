import { Vibration, Platform } from 'react-native';
import { AlertPayload } from '@/services/alertApi';

export const NotificationFacade = {

  processarAlertaDeRisco: async (
    novoAlerta: AlertPayload,
    setAlertsState: React.Dispatch<React.SetStateAction<AlertPayload[]>>
  ) => {
    setAlertsState((prev) => {
      if (prev.some((a) => a.id === novoAlerta.id)) return prev;
      return [novoAlerta, ...prev];
    });

    if (Platform.OS !== 'web') {
      console.log(`[NotificationFacade] 📳 Ativando feedback tátil para nível: ${novoAlerta.level}`);
      
      if (novoAlerta.level === 'VERMELHO') {
  
        Vibration.vibrate([0, 600, 200, 600]);
      } else if (novoAlerta.level === 'AMARELO') {
   
        Vibration.vibrate(300);
      }
    }
  }
};