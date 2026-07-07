import { renderHook, act } from '@testing-library/react-native';
import { useShareTrip } from '../useShareTrip';
import * as Clipboard from 'expo-clipboard';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

describe('Teste Unitário - Custom Hook: useShareTrip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
