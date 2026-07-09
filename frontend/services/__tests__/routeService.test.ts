import {
  calculateSafeRoute,
  formatRiskLevel,
  formatRouteDistance,
  formatRouteDuration,
} from '../routeService';

jest.mock('../../config/api', () => ({
  API_URL: 'http://api.test',
}));

function mockJsonResponse(status: number, body: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);
}

describe('routeService', () => {
  beforeEach(() => {
    (globalThis as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve enviar origem e destino para o endpoint de rota segura', async () => {
    const apiResponse = {
      status: 'success',
      distance: 1250.5,
      duration: 420,
      geometry: [
        { latitude: -5.0892, longitude: -42.8016 },
        { latitude: -5.092, longitude: -42.81 },
      ],
      distanceMeters: 1250.5,
      durationSeconds: 420,
      risk: {
        level: 'LOW',
        score: 3,
        description: 'Rota com baixo risco identificado.',
        nearbyOccurrencesCount: 1,
        intersectedRiskZonesCount: 0,
      },
      route: {
        type: 'LineString',
        coordinates: [
          [-42.8016, -5.0892],
          [-42.81, -5.092],
        ],
      },
      points: [
        { latitude: -5.0892, longitude: -42.8016 },
        { latitude: -5.092, longitude: -42.81 },
      ],
      nearbyOccurrences: [],
    };

    ((globalThis as any).fetch as jest.Mock).mockImplementationOnce(() => mockJsonResponse(200, apiResponse));

    const payload = {
      origin: { latitude: -5.0892, longitude: -42.8016 },
      destination: { latitude: -5.092, longitude: -42.81 },
    };

    const result = await calculateSafeRoute(payload);

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      'http://api.test/api/routes/safe',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    expect(result.points).toHaveLength(2);
    expect(result.distanceMeters).toBe(1250.5);
    expect(result.risk.level).toBe('LOW');
  });

  it('deve tratar erro retornado pelo backend', async () => {
    ((globalThis as any).fetch as jest.Mock).mockImplementationOnce(() =>
      mockJsonResponse(400, { detail: 'Origin must contain latitude and longitude' })
    );

    await expect(
      calculateSafeRoute({
        origin: { latitude: Number.NaN, longitude: -42.8016 },
        destination: { latitude: -5.092, longitude: -42.81 },
      })
    ).rejects.toThrow('Origem deve ter latitude e longitude validas.');

    await expect(
      calculateSafeRoute({
        origin: { latitude: -5.0892, longitude: -42.8016 },
        destination: { latitude: -5.092, longitude: -42.81 },
      })
    ).rejects.toThrow('Origin must contain latitude and longitude');
  });

  it('deve tratar falha de rede com mensagem compreensivel', async () => {
    ((globalThis as any).fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(
      calculateSafeRoute({
        origin: { latitude: -5.0892, longitude: -42.8016 },
        destination: { latitude: -5.092, longitude: -42.81 },
      })
    ).rejects.toThrow('Nao foi possivel conectar ao servidor de rotas.');
  });

  it('deve formatar informacoes basicas da rota', () => {
    expect(formatRouteDistance(1250)).toBe('1,3 km');
    expect(formatRouteDuration(420)).toBe('7 min');
    expect(formatRiskLevel('HIGH')).toBe('Alto risco');
  });
});
