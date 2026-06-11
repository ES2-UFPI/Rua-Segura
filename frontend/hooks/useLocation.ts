import { useState, useEffect } from 'react';
import * as Location from 'expo-location'; 
import * as TaskManager from 'expo-task-manager'; 
import { DeviceLocationService } from '@/services/nativos/DeviceLocationService';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('[Background Task] Erro na tarefa de localização:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const lat = locations[0].coords.latitude;
    const lng = locations[0].coords.longitude;
    console.log(`[Background Task] GPS moveu em background! Lat: ${lat}, Lng: ${lng}`);
  }
});

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
      console.log('[useLocation Hook] Estado updated com erro de captura.');
      setState({
        latitude: null,
        longitude: null,
        loading: false,
        error: 'Não foi possível obter a localização automática.',
      });
    }
  };

  const startBackgroundLocation = async () => {
    try {
      console.log('[useLocation Hook] Solicitando permissões de localização "Sempre" para Background...');
      const { status } = await Location.requestBackgroundPermissionsAsync();
      
      if (status === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, 
          distanceInterval: 50,
          foregroundService: {
            notificationTitle: "Rua Segura Ativo",
            notificationBody: "Monitorando a segurança do seu trajeto.",
          }
        });
        console.log('[useLocation Hook] Monitoramento em segundo plano iniciado com sucesso.');
      } else {
        console.log('[useLocation Hook] Permissão de localização em background negada.');
      }
    } catch (err: any) {
      console.log('[useLocation Hook]  Restrição detectada (esperado no Expo Go):', err.message);
    }
  };

  useEffect(() => {
    void getUserLocation();

    let posicaoInscricao: Location.LocationSubscription | null = null;

    const iniciarMonitoramentoAtivo = async () => {
      try {
        posicaoInscricao = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 50, 
            timeInterval: 10000,
          },
          (location) => {
            console.log(`[useLocation Foreground] GPS moveu significativamente: Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}`);
            setState({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              loading: false,
              error: null,
            });
          }
        );
      } catch (err) {
        console.error('[useLocation Foreground] Erro ao iniciar observador de posição:', err);
      }
    };

    void iniciarMonitoramentoAtivo();

    return () => {
      if (posicaoInscricao) {
        posicaoInscricao.remove();
      }
    };
  }, []);

  return {
    ...state,
    getUserLocation,
    startBackgroundLocation, 
  };
};