import { API_URL } from '@/config/api';

export type AlertLevel = 'AZUL' | 'AMARELO' | 'VERMELHO';

export interface AlertPayload {
  id: string;
  level: AlertLevel;
  title?: string;
  message?: string;
  score?: number;
  count?: number;
  latitude?: number;
  longitude?: number;
  regionKey?: string;
  createdAt?: string;
}

export interface AlertCreatePayload {
  level: AlertLevel;
  title?: string;
  message?: string;
  score?: number;
  count?: number;
  latitude?: number;
  longitude?: number;
  regionKey?: string;
}

interface GetAlertsParams {
  latitude?: number;
  longitude?: number;
}

const buildQueryString = (params?: GetAlertsParams): string => {
  const searchParams = new URLSearchParams();

  if (params?.latitude !== undefined) {
    searchParams.set('latitude', String(params.latitude));
  }

  if (params?.longitude !== undefined) {
    searchParams.set('longitude', String(params.longitude));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const alertApi = {
  async getAlerts(params?: GetAlertsParams): Promise<AlertPayload[]> {
    const response = await fetch(`${API_URL}/api/alerts${buildQueryString(params)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar alertas: ${response.status}`);
    }

    return (await response.json()) as AlertPayload[];
  },

  async createAlert(payload: AlertCreatePayload): Promise<AlertPayload> {
    const response = await fetch(`${API_URL}/api/alerts`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message =
        typeof errorBody?.detail === 'string'
          ? errorBody.detail
          : `Erro ao criar alerta: ${response.status}`;
      throw new Error(message);
    }

    return (await response.json()) as AlertPayload;
  },
};
