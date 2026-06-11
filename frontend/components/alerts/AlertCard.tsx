import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertLevel, AlertPayload } from '@/services/alertApi';

const alertVisualConfig: Record<
  AlertLevel,
  {
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
  }
> = {
  AZUL: {
    color: '#036D9A',
    icon: 'shield-checkmark-outline',
    title: 'Zona de Baixo Risco',
    message: 'Nenhuma criticidade reportada proxima.',
  },
  AMARELO: {
    color: '#FDEA6F',
    icon: 'warning-outline',
    title: 'Zona de Atencao',
    message: 'Ocorrencias moderadas detectadas por perto.',
  },
  VERMELHO: {
    color: '#CF0000',
    icon: 'alert-circle-outline',
    title: 'Zona Critica',
    message: 'Elevada taxa de severidade e incidentes.',
  },
};

interface AlertCardProps {
  alert: AlertPayload;
  onDismiss: () => void;
}

export default function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const config = alertVisualConfig[alert.level];

  return (
    <View style={[styles.card, { borderColor: config.color }]}>
      <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
        <Ionicons name={config.icon} size={22} color="#ffffff" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{alert.title ?? config.title}</Text>
        <Text style={styles.description}>{alert.message ?? config.message}</Text>
      </View>

      <TouchableOpacity
        accessibilityLabel="Fechar alerta"
        onPress={onDismiss}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={18} color="#e2e8f0" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  description: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },
  meta: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

