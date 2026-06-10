import { API_URL } from '../config/api';

const BASE_URL = API_URL;

export interface ReviewCreatePayload {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface LocationReviewResponse {
  id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface RiskResponse {
  level: 'AZUL' | 'AMARELO' | 'VERMELHO';
  score: number;
  count: number;
}

export const reviewApi = {
  /**
   * Obtém todas as avaliações de segurança registradas.
   */
  async getReviews(): Promise<LocationReviewResponse[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Erro ao buscar avaliações: ${response.status}`);
      }
      return (await response.json()) as LocationReviewResponse[];
    } catch (error) {
      console.error('Erro na chamada reviewApi.getReviews:', error);
      throw error;
    }
  },

  /**
   * Cadastra uma nova avaliação de segurança.
   */
  async createReview(payload: ReviewCreatePayload): Promise<LocationReviewResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const message = errData?.detail || `Erro do servidor: ${response.status}`;
        throw new Error(message);
      }

      return (await response.json()) as LocationReviewResponse;
    } catch (error) {
      console.error('Erro na chamada reviewApi.createReview:', error);
      throw error;
    }
  },

  /**
   * Obtém o nível de risco de uma determinada área
   */
  async getAreaRisk(latitude: number, longitude: number): Promise<RiskResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/reviews/risk?latitude=${latitude}&longitude=${longitude}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar o risco da área: ${response.status}`);
      }
      
      return (await response.json()) as RiskResponse;
    } catch (error) {
      console.error('Erro na chamada reviewApi.getAreaRisk:', error);
      // Retorno de fallback para não quebrar a interface em caso de erro de rede
      return { level: 'AZUL', score: 0, count: 0 };
    }
  },
};

