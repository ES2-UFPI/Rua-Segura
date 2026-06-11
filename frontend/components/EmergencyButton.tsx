import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmergencyButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function EmergencyButton({ onPress, style }: EmergencyButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel="Botão de Emergência"
    >
      <Ionicons name="warning" size={48} color="#ffffff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 95, // Erguido para o dobro de altura da base útil anterior (para dar espaço e destaque chamativo)
    width: 96,  // O dobro exato do tamanho padrão (antigo 48)
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dc2626', 
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fca5a5',
    shadowColor: '#dc2626',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    zIndex: 99,
    elevation: 12,
  },
});