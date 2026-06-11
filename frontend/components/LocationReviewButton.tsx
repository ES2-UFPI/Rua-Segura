import React from 'react';
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationReviewButtonProps {
  onPress: () => void;
  isSelected: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function LocationReviewButton({
  onPress,
  isSelected,
  disabled = false,
  containerStyle,
}: LocationReviewButtonProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          isSelected ? styles.buttonSelected : styles.buttonNormal,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
          size={24}
          color="#ffffff"
        />
        <Text style={styles.text}>
          {isSelected ? 'Avaliar' : 'Registrar Avaliação'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Sombra sutil que se soma à elevação do pai
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  buttonNormal: {
    // Tom verde esmeralda profundo premium
    backgroundColor: '#0f766e',
  },
  buttonSelected: {
    // Gradiente laranja/vermelho escuro para indicar o ponto selecionado pronto para avaliação
    backgroundColor: '#ea580c',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  buttonDisabled: {
    backgroundColor: '#687076',
    opacity: 0.5,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});