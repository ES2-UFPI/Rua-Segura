import { useState, useEffect, useCallback } from 'react';
import { occurrenceService, MockOccurrence, MockComment } from '../services/occurrenceService';

// Cache local para armazenar os votos por ocorrência (simulando persistência na sessão do usuário)
const userVotesCache: Record<number, 'confirm' | 'contest' | null> = {};

export function useOccurrenceInteraction(occurrenceId: number) {
  const [occurrence, setOccurrence] = useState<MockOccurrence | null>(null);
  const [comments, setComments] = useState<MockComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isSubmittingValidation, setIsSubmittingValidation] = useState<boolean>(false);

  // Estados de feedback visual
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voto ativo para a ocorrência selecionada
  const [userVote, setUserVote] = useState<'confirm' | 'contest' | null>(
    userVotesCache[occurrenceId] || null
  );

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const loadOccurrenceData = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const [occData, commentsData] = await Promise.all([
        occurrenceService.getOccurrence(occurrenceId),
        occurrenceService.getComments(occurrenceId),
      ]);
      setOccurrence(occData);
      setComments(commentsData);
      // Mantém em sincronia com o cache local
      setUserVote(userVotesCache[occurrenceId] || null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível carregar os dados da ocorrência.');
    } finally {
      setLoading(false);
    }
  }, [occurrenceId]);

  useEffect(() => {
    loadOccurrenceData();
  }, [loadOccurrenceData]);

  /**
   * Envia um comentário para o backend. Valida localmente se está vazio.
   */
  const submitComment = async (content: string): Promise<boolean> => {
    clearMessages();
    const trimmed = content.trim();

    if (!trimmed) {
      setErrorMessage('O comentário não pode ser vazio.');
      return false;
    }

    setIsSubmittingComment(true);
    try {
      const newComment = await occurrenceService.addComment(occurrenceId, trimmed);
      setComments((prev) => [...prev, newComment]);
      setSuccessMessage('Comentário enviado com sucesso!');
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível enviar o comentário.');
      return false;
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * Confirma ou contesta a ocorrência seguindo as regras de negócio:
   * - Apenas um voto ativo por ocorrência (confirmar ou contestar)
   * - Clicar novamente no voto ativo retira o voto.
   * - Alternar entre confirmar/contestar retira o anterior e insere o novo de forma atômica.
   */
  const submitValidation = async (type: 'confirm' | 'contest'): Promise<boolean> => {
    clearMessages();
    setIsSubmittingValidation(true);
    try {
      let updatedOccurrence: MockOccurrence;

      if (userVote === type) {
        // Clicou de novo no mesmo -> Retirar o voto
        const action = type === 'confirm' ? 'remove_confirm' : 'remove_contest';
        updatedOccurrence = await occurrenceService.addValidation(occurrenceId, action);
        setUserVote(null);
        userVotesCache[occurrenceId] = null;
        setSuccessMessage(
          type === 'confirm'
            ? 'Confirmação retirada com sucesso!'
            : 'Contestação retirada com sucesso!'
        );
      } else if (userVote === null) {
        // Votar pela primeira vez
        updatedOccurrence = await occurrenceService.addValidation(occurrenceId, type);
        setUserVote(type);
        userVotesCache[occurrenceId] = type;
        setSuccessMessage(
          type === 'confirm'
            ? 'Ocorrência confirmada com sucesso!'
            : 'Ocorrência contestada com sucesso!'
        );
      } else {
        // Mudar o voto (ex: confirm -> contest)
        const removeAction = userVote === 'confirm' ? 'remove_confirm' : 'remove_contest';
        await occurrenceService.addValidation(occurrenceId, removeAction);
        updatedOccurrence = await occurrenceService.addValidation(occurrenceId, type);
        setUserVote(type);
        userVotesCache[occurrenceId] = type;
        setSuccessMessage(
          type === 'confirm'
            ? 'Voto alterado para confirmação!'
            : 'Voto alterado para contestação!'
        );
      }

      setOccurrence(updatedOccurrence);
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível registrar sua validação.');
      return false;
    } finally {
      setIsSubmittingValidation(false);
    }
  };

  return {
    occurrence,
    comments,
    loading,
    successMessage,
    errorMessage,
    isSubmittingComment,
    isSubmittingValidation,
    submitComment,
    submitValidation,
    userVote,
    refresh: loadOccurrenceData,
  };
}
