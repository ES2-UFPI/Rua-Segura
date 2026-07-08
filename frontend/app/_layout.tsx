import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import { HandednessProvider } from '@/context/HandednessContext';

// Ignore expo-notifications warning in Expo Go for SDK 53
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <HandednessProvider>
        <Stack
          screenOptions={{
            headerShown: false, // Esconde a barra nativa do topo
          }}
        />
      </HandednessProvider>
    </SafeAreaProvider>
  );
}