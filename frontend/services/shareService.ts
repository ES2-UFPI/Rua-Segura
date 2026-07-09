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
  lastUpdatedAt: string;
}

export const shareService = {
  /**
   * Simula o início do compartilhamento de rota.
   * Futuramente, esse serviço fará uma requisição HTTP real à API.
   */
  async startSharing(
    currentLocation: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<ShareSession> {
    // Simular latência de rede de 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const token = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
    return {
      id: `share_mock_${Math.floor(Math.random() * 100000)}`,
      token,
      shareUrl: `https://ruasegura.app/share/${token}`,
      status: 'active',
      startedAt: new Date().toISOString(),
    };
  },

  /**
   * Simula o encerramento do compartilhamento de rota.
   */
  async stopSharing(token: string): Promise<void> {
    // Simular latência de rede de 800ms
    await new Promise((resolve) => setTimeout(resolve, 800));
  },

  async updateLocation(token: string, location: ShareCoordinate): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/mock/sharing-sessions/${token}/location`, {
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

  /**
   * Consulta os detalhes de uma sessão de compartilhamento ativa ou encerrada.
   * Implementa fallback para dados mockados locais para testes offline do frontend.
   */
  async getSharedRoute(token: string): Promise<SharedRouteDetails> {
    try {
      const response = await fetch(`${API_URL}/api/mock/shared-routes/${token}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.status === 404) {
        throw new Error('LINK_INVALID');
      }
      if (response.status === 410) {
        throw new Error('LINK_EXPIRED');
      }
      if (!response.ok) {
        throw new Error('NETWORK_ERROR');
      }

      const data = await response.json();
      return {
        status: data.status,
        origin: data.origin,
        currentLocation: data.currentLocation,
        destination: data.destination,
        lastUpdatedAt: data.lastUpdatedAt,
      };
    } catch (error: any) {
      if (error.message === 'LINK_INVALID' || error.message === 'LINK_EXPIRED') {
        throw error;
      }
      
      console.warn('Backend offline ou não integrado. Usando mock local do frontend para o token:', token);
      
      // Tratamento específico de tokens de teste mockados
      if (token === 'invalid') {
        throw new Error('LINK_INVALID');
      }
      if (token === 'expired') {
        throw new Error('LINK_EXPIRED');
      }
      if (token === 'ended') {
        return {
          status: 'ended',
          origin: { latitude: -5.0836, longitude: -42.7934 },
          currentLocation: { latitude: -5.0820, longitude: -42.7915 },
          destination: { latitude: -5.0805, longitude: -42.7901 },
          lastUpdatedAt: new Date(Date.now() - 60000).toISOString(),
        };
      }

      // Default: token ativo simulado
      return {
        status: 'active',
        origin: { latitude: -5.0836, longitude: -42.7934 },
        currentLocation: { latitude: -5.0820, longitude: -42.7915 },
        destination: { latitude: -5.0805, longitude: -42.7901 },
        lastUpdatedAt: new Date().toISOString(),
      };
    }
  }
};

