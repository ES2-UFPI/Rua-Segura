import { useState, useEffect, useRef } from 'react';
import { shareService, SharedRouteDetails } from '../services/shareService';
export function useSharedRouteTracking(token: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'INVALID' | 'EXPIRED' | 'NETWORK' | null>(null);
  const [session, setSession] = useState<SharedRouteDetails | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchTrackingData = async (isInitial = false) => {
    if (!token) return;
    try {
      if (isInitial) setLoading(true);
      const data = await shareService.getSharedRoute(token);
      setSession(data);
      setError(null);
    } catch (err: any) {
      if (err.message === 'LINK_INVALID') {
        setError('INVALID');
      } else if (err.message === 'LINK_EXPIRED') {
        setError('EXPIRED');
      } else {
        setError('NETWORK');
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTrackingData(true);
    // Polling ativo a cada 10 segundos
    pollingIntervalRef.current = setInterval(() => {
      fetchTrackingData(false);
    }, 10000);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [token]);
  return {
    loading,
    error,
    session,
    refetch: () => fetchTrackingData(false),
  };
}