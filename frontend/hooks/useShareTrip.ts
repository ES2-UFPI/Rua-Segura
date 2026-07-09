import { useState, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { shareService, ShareCoordinate, ShareSession } from '../services/shareService';

type UseShareTripResult = {
  activeSession: ShareSession | null;
  isStarting: boolean;
  isStopping: boolean;
  isCopying: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  startSharing: (
    currentLocation: ShareCoordinate,
    destination: ShareCoordinate,
  ) => Promise<void>;
  stopSharing: () => Promise<void>;
  copyShareLink: () => Promise<void>;
  updateSharingLocation: (location: ShareCoordinate) => Promise<void>;
  clearMessages: () => void;
};

export function useShareTrip() {
  const [activeSession, setActiveSession] = useState<ShareSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const startSharing = useCallback(async (
    currentLocation: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ) => {
    if (activeSession) return;
    setIsStarting(true);
    clearMessages();
    try {
      const session = await shareService.startSharing(currentLocation, destination);
      setActiveSession(session);
      setSuccessMessage('Compartilhamento iniciado.');
      // Auto-limpeza do feedback após 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage('Não foi possível iniciar o compartilhamento.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsStarting(false);
    }
  }, [activeSession, clearMessages]);

  const stopSharing = useCallback(async () => {
    if (!activeSession) return;
    setIsStopping(true);
    clearMessages();
    try {
      await shareService.stopSharing(activeSession.token);
      setActiveSession(null);
      setSuccessMessage('Compartilhamento encerrado.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage('Não foi possível encerrar o compartilhamento.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsStopping(false);
    }
  }, [activeSession, clearMessages]);

  const copyShareLink = useCallback(async () => {
    if (!activeSession) return;
    setIsCopying(true);
    clearMessages();
    try {
      await Clipboard.setStringAsync(activeSession.shareUrl);
      setSuccessMessage('Link copiado com sucesso.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage('Não foi possível copiar o link.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsCopying(false);
    }
  }, [activeSession, clearMessages]);

  const updateSharingLocation = useCallback(async (location: ShareCoordinate) => {
    if (!activeSession) return;

    try {
      await shareService.updateLocation(activeSession.token, location);
    } catch (err: any) {
      setErrorMessage('Nao foi possivel atualizar a localizacao compartilhada.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [activeSession]);

  return {
    activeSession,
    isStarting,
    isStopping,
    isCopying,
    errorMessage,
    successMessage,
    startSharing,
    stopSharing,
    copyShareLink,
    updateSharingLocation,
    clearMessages,
  } satisfies UseShareTripResult;
}
