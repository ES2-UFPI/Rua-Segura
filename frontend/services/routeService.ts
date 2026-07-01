export interface SafeRouteSearchPayload {
  origin: string;
  destination: string;
}

export interface SafeRouteSearchResult {
  success: true;
}

const SIMULATE_ROUTE_ERROR = false;

export async function calculateSafeRoute({
  origin,
  destination,
}: SafeRouteSearchPayload): Promise<SafeRouteSearchResult> {
  if (!origin.trim() || !destination.trim()) {
    throw new Error('Origem e destino sao obrigatorios.');
  }

  // TODO: Integrar com o backend de rotas seguras quando o endpoint estiver disponivel.
  await new Promise((resolve) => setTimeout(resolve, 900));

  if (SIMULATE_ROUTE_ERROR) {
    throw new Error('Erro simulado ao calcular rota.');
  }

  return { success: true };
}
