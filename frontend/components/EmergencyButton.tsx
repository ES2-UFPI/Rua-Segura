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
      <Ionicons name="warning" size={38} color="#ffffff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 95,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C44133', 
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#E8A89E',
    shadowColor: '#C44133',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 99,
    elevation: 10,
  },
});