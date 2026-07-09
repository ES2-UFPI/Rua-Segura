import { API_URL } from '../config/api';

const BASE_URL = API_URL;

export interface MockOccurrence {
  id: string;
  category: string;
  description: string;
  locationDescription: string;
  createdAt: string;
  confirmationsCount: number;
  contestationsCount: number;
  communityStatus: 'confirmed' | 'contested' | 'pending';
}

export interface MockComment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export const occurrenceService = {
  /**
   * Obtém os detalhes de uma ocorrência mockada específica.
   */
  async getOccurrence(id: string): Promise<MockOccurrence> {
    try {
      const res = await fetch(`${BASE_URL}/api/mock/occurrences/${id}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`Erro ao obter detalhes da ocorrência: ${res.status}`);
      }
      const data = await res.json() as MockOccurrence;
      return { ...data, id: String(data.id) };
    } catch (error) {
      console.error('Erro na chamada occurrenceService.getOccurrence:', error);
      throw error;
    }
  },

  /**
   * Lista os comentários de uma ocorrência mockada.
   */
  async getComments(id: string): Promise<MockComment[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/mock/occurrences/${id}/comments`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`Erro ao buscar comentários: ${res.status}`);
      }
      return await res.json() as MockComment[];
    } catch (error) {
      console.error('Erro na chamada occurrenceService.getComments:', error);
      throw error;
    }
  },

  /**
   * Envia um comentário para a ocorrência mockada.
   * Valida se não está vazio através do minLength=1 do Pydantic (erro 422).
   */
  async addComment(id: string, content: string): Promise<MockComment> {
    try {
      const res = await fetch(`${BASE_URL}/api/mock/occurrences/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const message = errData?.detail || `Erro ao enviar comentário: ${res.status}`;
        throw new Error(message);
      }

      return await res.json() as MockComment;
    } catch (error) {
      console.error('Erro na chamada occurrenceService.addComment:', error);
      throw error;
    }
  },

  /**
   * Registra a confirmação ou contestação da ocorrência.
   */
  async addValidation(id: string, type: 'confirm' | 'contest' | 'remove_confirm' | 'remove_contest'): Promise<MockOccurrence> {
    try {
      const res = await fetch(`${BASE_URL}/api/mock/occurrences/${id}/validations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const message = errData?.detail || `Erro ao registrar validação: ${res.status}`;
        throw new Error(message);
      }

      const data = await res.json() as MockOccurrence;
      return { ...data, id: String(data.id) };
    } catch (error) {
      console.error('Erro na chamada occurrenceService.addValidation:', error);
      throw error;
    }
  },
};
