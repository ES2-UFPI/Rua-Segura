import { renderHook, act } from '@testing-library/react-native';
import { useShareTrip } from '../useShareTrip';
import * as Clipboard from 'expo-clipboard';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

const fetchMock = jest.fn();

describe('Teste Unitario - Custom Hook: useShareTrip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    global.fetch = fetchMock;
    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (options?.method === 'POST' && url.includes('/api/mock/sharing-sessions')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              token: 'token-valido',
              shareUrl: 'https://ruasegura.app/shared/token-valido',
            }),
        });
      }

      if (options?.method === 'DELETE' && url.includes('/api/mock/sharing-sessions/token-valido')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ended' }),
        });
      }

      if (options?.method === 'PATCH' && url.includes('/api/mock/sharing-sessions/token-valido/location')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'active' }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Link invalido.' }),
      });
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('deve inicializar com valores default corretos', async () => {
    const { result } = await renderHook(() => useShareTrip());

    expect(result.current.activeSession).toBeNull();
    expect(result.current.isStarting).toBe(false);
    expect(result.current.isStopping).toBe(false);
    expect(result.current.isCopying).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.successMessage).toBeNull();
  });

  it('deve iniciar o compartilhamento com sucesso e gerar link', async () => {
    const { result } = await renderHook(() => useShareTrip());

    const origin = { latitude: -5.0892, longitude: -42.8101 };
    const destination = { latitude: -5.0804, longitude: -42.8015 };

    await act(async () => {
      await result.current.startSharing(origin, destination);
    });

    expect(result.current.isStarting).toBe(false);
    expect(result.current.activeSession).not.toBeNull();
    expect(result.current.activeSession?.status).toBe('active');
    expect(result.current.activeSession?.shareUrl).toContain('https://ruasegura.app/share/');
    expect(result.current.successMessage).toBe('Compartilhamento iniciado.');
  });

  it('deve enviar os pontos da rota ao iniciar compartilhamento', async () => {
    const { result } = await renderHook(() => useShareTrip());

    const origin = { latitude: -5.0892, longitude: -42.8101 };
    const destination = { latitude: -5.0804, longitude: -42.8015 };
    const routeCoordinates = [
      origin,
      { latitude: -5.085, longitude: -42.805 },
      destination,
    ];

    await act(async () => {
      await result.current.startSharing(origin, destination, routeCoordinates);
    });

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(requestBody.origin).toEqual(origin);
    expect(requestBody.currentLocation).toEqual(origin);
    expect(requestBody.destination).toEqual(destination);
    expect(requestBody.routeCoordinates).toEqual(routeCoordinates);
  });

  it('deve copiar o link do trajeto ativo com sucesso', async () => {
    const { result } = await renderHook(() => useShareTrip());

    const origin = { latitude: -5.0892, longitude: -42.8101 };
    const destination = { latitude: -5.0804, longitude: -42.8015 };

    await act(async () => {
      await result.current.startSharing(origin, destination);
    });

    const shareUrl = result.current.activeSession?.shareUrl || '';
    expect(shareUrl).not.toBe('');

    await act(async () => {
      await result.current.copyShareLink();
    });

    expect(result.current.isCopying).toBe(false);
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(shareUrl);
    expect(result.current.successMessage).toBe('Link copiado com sucesso.');
  });

  it('deve encerrar o compartilhamento ativo com sucesso', async () => {
    const { result } = await renderHook(() => useShareTrip());

    const origin = { latitude: -5.0892, longitude: -42.8101 };
    const destination = { latitude: -5.0804, longitude: -42.8015 };

    await act(async () => {
      await result.current.startSharing(origin, destination);
    });

    expect(result.current.activeSession).not.toBeNull();

    await act(async () => {
      await result.current.stopSharing();
    });

    expect(result.current.isStopping).toBe(false);
    expect(result.current.activeSession).toBeNull();
    expect(result.current.successMessage).toBe('Compartilhamento encerrado.');
  });
});
