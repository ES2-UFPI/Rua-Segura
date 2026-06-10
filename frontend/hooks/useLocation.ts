import { useState, useEffect } from 'react';
import { DeviceLocationService } from '@/services/nativos/DeviceLocationService';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationData>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  });

 const getUserLocation = async () => {
  console.log('[useLocation Hook] Método +getUserLocation() foi invocado. Atualizando estado para loading...');
  setState((prev) => ({ ...prev, loading: true, error: null }));
  
  const location = await DeviceLocationService.getCurrentLocation();

  if (location) {
    console.log(`[useLocation Hook] Estado atualizado com sucesso! [Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}]`);
    setState({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      loading: false,
      error: null,
    });
  } else {
    console.log('[useLocation Hook] Estado atualizado com erro de captura.');
    setState({
      latitude: null,
      longitude: null,
      loading: false,
      error: 'Não foi possível obter a localização automática.',
    });
  }
};

  useEffect(() => {
    void getUserLocation();
  }, []);

  return {
    ...state,
    getUserLocation, 
  };
};