import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import SharedRouteTrackingScreen from '@/components/SharedRouteTrackingScreen';
export default function ShareTrackingPage() {
  const { token } = useLocalSearchParams<{ token: string }>();
  // Apenas delega a apresentação para o componente especializado
  return <SharedRouteTrackingScreen token={token ?? ''} />;
}