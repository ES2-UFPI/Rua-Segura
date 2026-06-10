// frontend/hooks/__tests__/useLocation.test.ts

import { renderHook, act } from '@testing-library/react-native';
import { useLocation } from '../useLocation';
import { DeviceLocationService } from '@/services/nativos/DeviceLocationService';

jest.mock('@/services/nativos/DeviceLocationService', () => ({
  DeviceLocationService: {
    getCurrentLocation: jest.fn(),
  },
}));

describe('Teste Unitário - Custom Hook: useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve capturar as coordenadas com sucesso quando o GPS responder', async () => {
    const mockCoords = {
      coords: {
        latitude: -5.092,
        longitude: -42.803,
      },
    };

    (DeviceLocationService.getCurrentLocation as jest.Mock)
      .mockResolvedValue(mockCoords);

    const { result } = await renderHook(() => useLocation());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.latitude).toBe(-5.092);
    expect(result.current.longitude).toBe(-42.803);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve retornar uma mensagem de erro quando o GPS falhar ou for negado', async () => {
    (DeviceLocationService.getCurrentLocation as jest.Mock)
      .mockResolvedValue(null);

    const { result } = await renderHook(() => useLocation());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      'Não foi possível obter a localização automática.'
    );
  });
});