import { shareService } from '../shareService';

const fetchMock = jest.fn();

describe('shareService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  it('deve criar uma sessao de compartilhamento com a rota calculada', async () => {
    const currentLocation = { latitude: -5.0892, longitude: -42.8016 };
    const destination = { latitude: -5.0911, longitude: -42.8033 };
    const routeCoordinates = [
      currentLocation,
      { latitude: -5.09, longitude: -42.802 },
      destination,
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          token: 'token-valido',
          shareUrl: 'https://ruasegura.app/shared/token-valido',
        }),
    });

    const session = await shareService.startSharing(
      currentLocation,
      destination,
      routeCoordinates,
    );
    const request = fetchMock.mock.calls[0];
    const body = JSON.parse(request[1].body);

    expect(request[0]).toContain('/api/mock/sharing-sessions');
    expect(request[1].method).toBe('POST');
    expect(body.currentLocation).toEqual(currentLocation);
    expect(body.destination).toEqual(destination);
    expect(body.routeCoordinates).toEqual(routeCoordinates);
    expect(session.token).toBe('token-valido');
    expect(session.shareUrl).toBe('https://ruasegura.app/share/token-valido');
  });

  it('deve consultar um token valido e retornar a localizacao mockada', async () => {
    const routeCoordinates = [
      { latitude: -5.0892, longitude: -42.8016 },
      { latitude: -5.09, longitude: -42.802 },
      { latitude: -5.0911, longitude: -42.8033 },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          status: 'active',
          origin: routeCoordinates[0],
          currentLocation: routeCoordinates[1],
          destination: routeCoordinates[2],
          routeCoordinates,
          lastUpdatedAt: '2026-07-09T03:00:00Z',
        }),
    });

    const route = await shareService.getSharedRoute('token-valido');

    expect(fetchMock.mock.calls[0][0]).toContain('/api/mock/shared-routes/token-valido');
    expect(route.status).toBe('active');
    expect(route.currentLocation).toEqual(routeCoordinates[1]);
    expect(route.routeCoordinates).toEqual(routeCoordinates);
  });

  it('deve transformar token invalido em erro compreensivel', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Sessao nao encontrada.' }),
    });

    await expect(shareService.getSharedRoute('token-invalido')).rejects.toThrow('LINK_INVALID');
  });

  it('deve retornar sessao encerrada para bloquear o acompanhamento', async () => {
    const currentLocation = { latitude: -5.09, longitude: -42.802 };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          status: 'ended',
          origin: { latitude: -5.0892, longitude: -42.8016 },
          currentLocation,
          destination: { latitude: -5.0911, longitude: -42.8033 },
          lastUpdatedAt: '2026-07-09T03:00:00Z',
        }),
    });

    const route = await shareService.getSharedRoute('token-encerrado');

    expect(route.status).toBe('ended');
    expect(route.currentLocation).toEqual(currentLocation);
  });

  it('deve encerrar uma sessao ativa pelo endpoint mockado', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ended' }),
    });

    await shareService.stopSharing('token-valido');

    expect(fetchMock.mock.calls[0][0]).toContain('/api/mock/sharing-sessions/token-valido');
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });
});
