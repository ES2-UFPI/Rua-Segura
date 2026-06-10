import * as Location from 'expo-location';

export const DeviceLocationService = {

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      console.log('[DeviceLocationService] Solicitando permissões de localização ao hardware...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('[DeviceLocationService] Permissão de GPS negada pelo usuário.');
        throw new Error('Permissão de localização negada.');
      }

      console.log('[DeviceLocationService] Permissão concedida. Acessando chip de GPS...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log(`[DeviceLocationService] Coordenadas obtidas com sucesso! [Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}]`);
      return location;
    } catch (error) {
      console.error('Erro no DeviceLocationService.getCurrentLocation:', error);
      return null;
    }
  },

  async watchPosition(callback: (location: Location.LocationObject) => void): Promise<Location.LocationSubscription | null> {
    try {
      console.log('[DeviceLocationService] Ativando monitoramento contínuo de posição (watchPosition)...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[DeviceLocationService] Monitoramento cancelado por falta de permissão.');
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 50,
        },
        (location) => {
          console.log(`[DeviceLocationService - Mudança] Usuário se deslocou 50m. Nova posição: [Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}]`);
          callback(location);
        }
      );

      console.log('[DeviceLocationService] Monitoramento em tempo real registrado com sucesso.');
      return subscription;
    } catch (error) {
      console.error('Erro no DeviceLocationService.watchPosition:', error);
      return null;
    }
  }
};