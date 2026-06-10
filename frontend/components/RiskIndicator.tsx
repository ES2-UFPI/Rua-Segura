import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiskVisualStrategy, RiskLevel } from '../config/RiskVisualStrategy';

interface RiskIndicatorProps {
  level: string;
  score?: number;
}

export default function RiskIndicator({ level, score }: RiskIndicatorProps) {
  // Garantia de fallback caso o backend envie um nível não mapeado
  const safeLevel = (level in RiskVisualStrategy ? level : 'AZUL') as RiskLevel;
  const config = RiskVisualStrategy[safeLevel];

  return (
    <View style={[styles.container, { backgroundColor: config.color }]}>
      <View style={styles.content}>
        <Ionicons name={config.icon} size={32} color="#ffffff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{config.bannerText}</Text>
          <Text style={styles.description}>{config.description}</Text>
          {score !== undefined && (
            <Text style={styles.score}>Pontuação atual: {score}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    zIndex: 100,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  description: {
    color: '#ffffff',
    fontSize: 13,
    opacity: 0.9,
  },
  score: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
    opacity: 0.75,
  }
});