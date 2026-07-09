import { API_URL } from '../config/api';
import { RouteCoordinate, RouteServiceError } from './routeService';

export type GeocodedLocation = RouteCoordinate & {
  label: string;
};

async function readErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);
  return data?.detail || data?.message || `Nao foi possivel buscar o endereco (${response.status}).`;
}

function isLikelyMapLink(query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  return (
    normalizedQuery.startsWith('http://') ||
    normalizedQuery.startsWith('https://') ||
    normalizedQuery.includes('google.com/maps') ||
    normalizedQuery.includes('maps.app.goo.gl') ||
    normalizedQuery.includes('goo.gl/maps')
  );
}

export async function geocodeLocation(query: string): Promise<GeocodedLocation> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 3) {
    throw new RouteServiceError('Digite um endereco com pelo menos 3 caracteres.');
  }

  if (isLikelyMapLink(normalizedQuery)) {
    throw new RouteServiceError(
      'Cole o endereco em texto, nao o link do Google Maps. Exemplo: Rua, bairro, cidade, estado.'
    );
  }

  const response = await fetch(
    `${API_URL}/api/routes/geocode?query=${encodeURIComponent(normalizedQuery)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new RouteServiceError(await readErrorMessage(response), response.status);
  }

  const data = (await response.json()) as GeocodedLocation;

  if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
    throw new RouteServiceError('Endereco encontrado sem coordenadas validas.');
  }

  return data;
}
