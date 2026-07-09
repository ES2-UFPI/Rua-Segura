import { API_URL } from '../config/api';

export interface ShareCoordinate {
  latitude: number;
  longitude: number;
}

export interface ShareSession {
  id: string;
  token: string;
  shareUrl: string;
  status: 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
}

export interface SharedRouteDetails {
  status: 'active' | 'ended' | 'expired';
  origin: ShareCoordinate;
  currentLocation: ShareCoordinate;
  destination: ShareCoordinate;
  routeCoordinates?: ShareCoordinate[];
  lastUpdatedAt: string;
}

class ShareServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShareServiceError';
  }
}

function buildShareUrl(token: string, backendShareUrl?: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/share/${token}`;
  }

  return backendShareUrl?.replace('/shared/', '/share/') ?? `https://ruasegura.app/share/${token}`;
}

async function readError(response: Response, fallback: string): Promise<ShareServiceError> {
  const data = await response.json().catch(() => null);
  return new ShareServiceError(data?.detail || data?.message || fallback);
}

async function requestWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export const shareService = {
  async startSharing(
    currentLocation: ShareCoordinate,
    destination: ShareCoordinate,
    routeCoordinates?: ShareCoordinate[],
  ): Promise<ShareSession> {
    const response = await requestWithTimeout(`${API_URL}/api/mock/sharing-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        origin: routeCoordinates?.[0] ?? currentLocation,
        currentLocation,
        destination,
        routeCoordinates,
      }),
    });

    if (!response.ok) {
      throw await readError(response, 'Nao foi possivel iniciar o compartilhamento.');
    }

    const data = await response.json();
    const now = new Date().toISOString();

    return {
      id: data.token,
      token: data.token,
      shareUrl: buildShareUrl(data.token, data.shareUrl),
      status: 'active',
      startedAt: now,
    };
  },

  async stopSharing(token: string): Promise<void> {
    const response = await requestWithTimeout(`${API_URL}/api/mock/sharing-sessions/${token}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok && response.status !== 404) {
      throw await readError(response, 'Nao foi possivel encerrar o compartilhamento.');
    }
  },

  async updateLocation(token: string, location: ShareCoordinate): Promise<void> {
    try {
      const response = await requestWithTimeout(`${API_URL}/api/mock/sharing-sessions/${token}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(location),
      });

      if (!response.ok) {
        throw new Error('SHARING_LOCATION_UPDATE_FAILED');
      }
    } catch {
      // Mantém o fluxo resiliente enquanto a integração completa ainda não está pronta.
      return;
    }
  },

  async getSharedRoute(token: string): Promise<SharedRouteDetails> {
    const response = await requestWithTimeout(`${API_URL}/api/mock/shared-routes/${token}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      throw new ShareServiceError('LINK_INVALID');
    }

    if (response.status === 410) {
      throw new ShareServiceError('LINK_EXPIRED');
    }

    if (!response.ok) {
      throw await readError(response, 'Nao foi possivel carregar o compartilhamento.');
    }

    const data = await response.json();

    return {
      status: data.status,
      origin: data.origin,
      currentLocation: data.currentLocation,
      destination: data.destination,
      routeCoordinates: data.routeCoordinates,
      lastUpdatedAt: data.lastUpdatedAt,
    };
  },
};
