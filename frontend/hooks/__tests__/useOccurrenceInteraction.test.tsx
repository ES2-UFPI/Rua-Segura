import { renderHook, act } from '@testing-library/react-native';
import { useOccurrenceInteraction } from '../useOccurrenceInteraction';
import { occurrenceService } from '@/services/occurrenceService';

const mockOccurrence = {
  id: '1',
  category: 'Assalto',
  description: 'Relato de movimentação suspeita na região.',
  locationDescription: 'Próximo à praça central',
  createdAt: '2026-05-27T18:00:00.000Z',
  confirmationsCount: 3,
  contestationsCount: 1,
  communityStatus: 'confirmed' as const,
};

const mockComments = [
  {
    id: 1,
    authorName: 'Usuário anônimo',
    content: 'Passei por lá agora e ainda está perigoso.',
    createdAt: '2026-05-27T18:30:00.000Z',
  },
];

const mockCheckStringId = (id: any) => {
  if (typeof id !== 'string') {
    throw new TypeError(`Expected occurrence ID to be a string, but received ${typeof id} (${id})`);
  }
};

jest.mock('@/services/occurrenceService', () => ({
  occurrenceService: {
    getOccurrence: jest.fn().mockImplementation(async (id) => {
      mockCheckStringId(id);
      return { ...mockOccurrence, id };
    }),
    getComments: jest.fn().mockImplementation(async (id) => {
      mockCheckStringId(id);
      return mockComments;
    }),
    addComment: jest.fn().mockImplementation(async (id, content) => {
      mockCheckStringId(id);
      return {
        id: 2,
        authorName: 'Usuário anônimo',
        content,
        createdAt: new Date().toISOString(),
      };
    }),
    addValidation: jest.fn().mockImplementation(async (id, type) => {
      mockCheckStringId(id);
      return {
        ...mockOccurrence,
        id,
        confirmationsCount: type === 'confirm' ? mockOccurrence.confirmationsCount + 1 : mockOccurrence.confirmationsCount,
        contestationsCount: type === 'contest' ? mockOccurrence.contestationsCount + 1 : mockOccurrence.contestationsCount,
      };
    }),
  },
}));

describe('useOccurrenceInteraction Hook - Testes TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar os detalhes da ocorrência e listagem de comentários ao iniciar', async () => {
    const { result } = await renderHook(() => useOccurrenceInteraction('1'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(occurrenceService.getOccurrence).toHaveBeenCalledWith('1');
    expect(occurrenceService.getComments).toHaveBeenCalledWith('1');
    expect(result.current.loading).toBe(false);
    expect(result.current.occurrence).toEqual(mockOccurrence);
    expect(result.current.comments).toEqual(mockComments);
    expect(result.current.errorMessage).toBeNull();
  });

  it('deve exibir mensagem de erro ao buscar ocorrência inexistente', async () => {
    (occurrenceService.getOccurrence as jest.Mock).mockImplementationOnce(async (id) => {
      mockCheckStringId(id);
      throw new Error('Erro ao obter detalhes da ocorrência: 404');
    });

    const { result } = await renderHook(() => useOccurrenceInteraction('999'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.occurrence).toBeNull();
    expect(result.current.errorMessage).toBe('Erro ao obter detalhes da ocorrência: 404');
  });

  it('deve enviar um comentário válido com sucesso e atualizar a lista', async () => {
    const { result } = await renderHook(() => useOccurrenceInteraction('1'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    let commentResult: boolean = false;
    await act(async () => {
      commentResult = await result.current.submitComment('Novo comentário de teste');
    });

    expect(commentResult).toBe(true);
    expect(occurrenceService.addComment).toHaveBeenCalledWith('1', 'Novo comentário de teste');
    expect(result.current.comments).toContainEqual(expect.objectContaining({ content: 'Novo comentário de teste' }));
    expect(result.current.successMessage).toBe('Comentário enviado com sucesso!');
    expect(result.current.errorMessage).toBeNull();
  });

  it('deve barrar comentário vazio localmente sem chamar o endpoint e exibir mensagem de erro', async () => {
    const { result } = await renderHook(() => useOccurrenceInteraction('1'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    let commentResult: boolean = true;
    await act(async () => {
      commentResult = await result.current.submitComment('   ');
    });

    expect(commentResult).toBe(false);
    expect(occurrenceService.addComment).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe('O comentário não pode ser vazio.');
  });

  it('deve confirmar a ocorrência com sucesso, atualizar os contadores e status', async () => {
    const { result } = await renderHook(() => useOccurrenceInteraction('2'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    let validationResult: boolean = false;
    await act(async () => {
      validationResult = await result.current.submitValidation('confirm');
    });

    expect(validationResult).toBe(true);
    expect(occurrenceService.addValidation).toHaveBeenCalledWith('2', 'confirm');
    expect(result.current.userVote).toBe('confirm');
    expect(result.current.occurrence?.confirmationsCount).toBe(4);
    expect(result.current.occurrence?.communityStatus).toBe('confirmed');
    expect(result.current.successMessage).toBe('Ocorrência confirmada com sucesso!');
  });

  it('deve contestar a ocorrência com sucesso, atualizar os contadores e status', async () => {
    const { result } = await renderHook(() => useOccurrenceInteraction('3'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    let validationResult: boolean = false;
    await act(async () => {
      validationResult = await result.current.submitValidation('contest');
    });

    expect(validationResult).toBe(true);
    expect(occurrenceService.addValidation).toHaveBeenCalledWith('3', 'contest');
    expect(result.current.userVote).toBe('contest');
    expect(result.current.occurrence?.contestationsCount).toBe(2);
    expect(result.current.successMessage).toBe('Ocorrência contestada com sucesso!');
  });

  // Novos cenários de falhas baseados na análise do backend

  it('deve buscar detalhes com ID alfanumérico com sucesso', async () => {
    const { result } = await renderHook(() => useOccurrenceInteraction('1a'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(occurrenceService.getOccurrence).toHaveBeenCalledWith('1a');
    expect(result.current.loading).toBe(false);
    expect(result.current.occurrence).toEqual({ ...mockOccurrence, id: '1a' });
    expect(result.current.errorMessage).toBeNull();
  });

  it('deve limpar dados da ocorrência anterior se o novo carregamento falhar (vazamento de estado)', async () => {
    const { result, rerender } = await renderHook(({ id }: { id: string }) => useOccurrenceInteraction(id), {
      initialProps: { id: '1' },
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.occurrence).toEqual(mockOccurrence);

    // Próxima busca simula erro de não encontrado
    (occurrenceService.getOccurrence as jest.Mock).mockRejectedValueOnce(new Error('Erro ao obter detalhes da ocorrência: 404'));

    await act(async () => {
      rerender({ id: '999' });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // O estado da ocorrência anterior DEVE ser limpo
    expect(result.current.occurrence).toBeNull();
    expect(result.current.comments).toEqual([]);
    expect(result.current.errorMessage).toBe('Erro ao obter detalhes da ocorrência: 404');
  });

  it('deve tratar e formatar adequadamente erros de validação em lista do FastAPI/Pydantic', async () => {
    const pydanticErrors = [
      { loc: ['body', 'content'], msg: 'ensure this value has at least 1 characters', type: 'value_error.any_str.min_length' }
    ];
    (occurrenceService.addComment as jest.Mock).mockRejectedValueOnce(new Error(pydanticErrors as any));

    const { result } = await renderHook(() => useOccurrenceInteraction('1'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    let commentResult = true;
    await act(async () => {
      commentResult = await result.current.submitComment('a');
    });

    expect(commentResult).toBe(false);
    expect(result.current.errorMessage).not.toContain('[object Object]');
    expect(result.current.errorMessage).toBe('ensure this value has at least 1 characters');
  });

  it('deve reverter ou atualizar o estado para consistência se a segunda etapa da validação falhar (falta de atomicidade)', async () => {
    const initialOccurrence = { ...mockOccurrence, id: '4', confirmationsCount: 3, communityStatus: 'confirmed' as const };
    const afterRemoveOccurrence = { ...mockOccurrence, id: '4', confirmationsCount: 2, communityStatus: 'pending' as const };

    (occurrenceService.getOccurrence as jest.Mock).mockResolvedValueOnce(initialOccurrence);
    (occurrenceService.getComments as jest.Mock).mockResolvedValueOnce(mockComments);

    const { result } = await renderHook(() => useOccurrenceInteraction('4'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Registra voto inicial
    await act(async () => {
      await result.current.submitValidation('confirm');
    });
    expect(result.current.userVote).toBe('confirm');

    // Segunda validação (mudar voto para contest):
    // 1. remove_confirm funciona
    (occurrenceService.addValidation as jest.Mock).mockResolvedValueOnce(afterRemoveOccurrence);
    // 2. contest falha
    (occurrenceService.addValidation as jest.Mock).mockRejectedValueOnce(new Error('Network failure on second step'));

    let validationResult = true;
    await act(async () => {
      validationResult = await result.current.submitValidation('contest');
    });

    expect(validationResult).toBe(false);
    // Como a remoção deu certo mas a inserção falhou, o voto ativo no backend agora é nulo,
    // o estado local do voto e da ocorrência deve refletir isso para não dessincronizar.
    expect(result.current.userVote).toBeNull();
    expect(result.current.occurrence?.confirmationsCount).toBe(2);
    expect(result.current.errorMessage).toBe('Network failure on second step');
  });
});
