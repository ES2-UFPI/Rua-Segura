import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertPayload } from '@/services/alertApi';
import AlertCard from './AlertCard';

interface AlertScreenProps {
  alerts: AlertPayload[];
  onDismiss: (alertId: string) => void;
}

export default function AlertScreen({
  alerts,
  onDismiss,
}: AlertScreenProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDismiss={() => onDismiss(alert.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    bottom: 104,
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 120,
  },
});

