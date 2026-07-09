import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RouteSearchScreen from '../RouteSearchScreen';
import { DeviceLocationService } from '@/services/nativos/DeviceLocationService';
import { Alert } from 'react-native';

// Mock do provedor de ícones do Expo para não carregar recursos nativos
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, null, `Icon-${props.name}`),
  };
});

// Mock do serviço nativo de localização
jest.mock('@/services/nativos/DeviceLocationService', () => ({
  DeviceLocationService: {
    getCurrentLocation: jest.fn(),
  },
}));

// Mock do expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

describe('TDD - RouteSearchScreen: Usar Localização Atual', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir a opção "Usar localização atual" e preencher a origem quando clicado', async () => {
    const mockLocation = {
      coords: {
        latitude: -5.0836,
        longitude: -42.7934,
      },
    };

    (DeviceLocationService.getCurrentLocation as jest.Mock).mockResolvedValue(mockLocation);

    // No React 19 / Testing Library v14 do projeto, o método render retorna uma Promise
    const { getByText, getByLabelText } = await render(<RouteSearchScreen />);

    // 1. A opção "Usar localização atual" deve estar visível
    const optionButton = getByText('Usar localização atual');
    expect(optionButton).toBeTruthy();

    // 2. Clicar no botão para capturar localização
    fireEvent.press(optionButton);

    // 3. Aguardar o preenchimento do campo de Origem e coordenadas
    await waitFor(() => {
      const originInput = getByLabelText('Campo de origem');
      expect(originInput.props.value).toBe('Minha Localização');
    });

    expect(DeviceLocationService.getCurrentLocation).toHaveBeenCalledTimes(1);
  });

  it('deve alertar o usuário se falhar ao obter a localização', async () => {
    (DeviceLocationService.getCurrentLocation as jest.Mock).mockResolvedValue(null);
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByText } = await render(<RouteSearchScreen />);
    const optionButton = getByText('Usar localização atual');

    fireEvent.press(optionButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro de Localização',
        'Não foi possível obter a sua localização atual. Verifique se o GPS está ativado e as permissões de acesso concedidas.'
      );
    });
  });
});