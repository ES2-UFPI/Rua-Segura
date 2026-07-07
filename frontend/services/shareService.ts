export interface ShareSession {
  id: string;
  token: string;
  shareUrl: string;
  status: 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
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
  }
};
