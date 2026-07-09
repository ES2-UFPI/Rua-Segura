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
        disabled={disabled}
      >
        <Ionicons
          name={isSelected ? 'create-outline' : 'location-outline'}
          size={22}
          color="#FFFFFF"
        />
        <Text style={styles.text}>
          {isSelected ? 'Registrar ocorrencia' : 'Marcar local'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  buttonNormal: {
    backgroundColor: '#1A3550',
  },
  buttonSelected: {
    backgroundColor: '#3B9B6E',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
