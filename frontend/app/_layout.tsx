import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';

// Ignore expo-notifications warning in Expo Go for SDK 53
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false, // Esconde a barra nativa do topo
        }}
      />
    </SafeAreaProvider>
  );
}