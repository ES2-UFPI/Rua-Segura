import { API_URL } from '../config/api';

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type SafeRouteRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | string;

export interface SafeRouteSearchPayload {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
}

export interface SafeRouteRisk {
  level: SafeRouteRiskLevel;
  score: number;
  description: string;
  nearbyOccurrencesCount: number;
  intersectedRiskZonesCount: number;
}

export interface NearbyOccurrence {
  id: string | number;
  type: string;
  latitude: number;
  longitude: number;
  distanceFromRouteMeters: number;
}

export type NavigationManeuver = 'straight' | 'left' | 'right' | 'arrive' | string;

export interface SafeRouteStep {
  instruction: string;
  streetName: string;
  nextInstruction: string;
  distance: string;
  maneuver: NavigationManeuver;
  routePointIndex?: number | null;
}

export interface SafeRouteSearchResult {
  status: string;
  distance: number;
  duration: number;
  geometry: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
  risk: SafeRouteRisk;
  route: {
    type: 'LineString' | string;
    coordinates: [number, number][];
  };
  points: RouteCoordinate[];
  steps: SafeRouteStep[];
  nearbyOccurrences: NearbyOccurrence[];
}

export class RouteServiceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RouteServiceError';
    this.status = status;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);
  return data?.detail || data?.message || `Nao foi possivel calcular a rota (${response.status}).`;
}

function assertValidCoordinate(name: string, coordinate: RouteCoordinate) {
  if (
    coordinate == null ||
    !Number.isFinite(coordinate.latitude) ||
    !Number.isFinite(coordinate.longitude)
  ) {
    throw new RouteServiceError(`${name} deve ter latitude e longitude validas.`);
  }
}

export async function calculateSafeRoute({
  origin,
  destination,
}: SafeRouteSearchPayload): Promise<SafeRouteSearchResult> {
  assertValidCoordinate('Origem', origin);
  assertValidCoordinate('Destino', destination);

  try {
    const response = await fetch(`${API_URL}/api/routes/safe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ origin, destination }),
    });

    if (!response.ok) {
      throw new RouteServiceError(await readErrorMessage(response), response.status);
    }

    return (await response.json()) as SafeRouteSearchResult;
  } catch (error) {
    if (error instanceof RouteServiceError) {
      throw error;
    }

    throw new RouteServiceError(
      'Nao foi possivel conectar ao servidor de rotas. Verifique sua conexao e tente novamente.'
    );
  }
}

export function formatRouteDistance(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters)) return '-- km';

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formatRouteDuration(durationSeconds: number): string {
  if (!Number.isFinite(durationSeconds)) return '-- min';

  const minutes = Math.max(1, Math.round(durationSeconds / 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

export function formatRiskLevel(level: SafeRouteRiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'Baixo risco';
    case 'MEDIUM':
      return 'Risco moderado';
    case 'HIGH':
      return 'Alto risco';
    default:
      return 'Risco indisponivel';
  }
}
