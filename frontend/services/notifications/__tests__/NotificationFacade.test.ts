import { Vibration } from 'react-native';
import { NotificationFacade } from '../NotificationFacade';
import { AlertPayload } from '@/services/alertApi';

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Vibration = {
    vibrate: jest.fn(),
    cancel: jest.fn(),
  };
  return rn;
});

describe('Teste Unitário - NotificationFacade (Sistema Sensorial)', () => {
  let mockSetAlertsState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetAlertsState = jest.fn();
  });

  it('deve disparar pulso de vibração longo e coordenado quando o risco for VERMELHO', async () => {
    const alertaCritico: AlertPayload = {
      id: 'alert-zona-sul',
      level: 'VERMELHO',
      title: 'Zona Crítica',
      message: 'Elevada taxa de incidentes próxima.',
    };

    await NotificationFacade.processarAlertaDeRisco(alertaCritico, mockSetAlertsState);
    expect(mockSetAlertsState).toHaveBeenCalled();

    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 600, 200, 600]);
  });

  it('deve disparar apenas uma vibração curta e sutil quando o risco for AMARELO', async () => {
    const alertaAtencao: AlertPayload = {
      id: 'alert-zona-leste',
      level: 'AMARELO',
      title: 'Zona de Atenção',
      message: 'Ocorrências moderadas detectadas.',
    };

    await NotificationFacade.processarAlertaDeRisco(alertaAtencao, mockSetAlertsState);

    expect(Vibration.vibrate).toHaveBeenCalledWith(300);
  });
});