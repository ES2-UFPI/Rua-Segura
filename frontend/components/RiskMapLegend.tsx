import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { RiskLevel, RiskVisualStrategy } from '../config/RiskVisualStrategy';

interface RiskMapLegendProps {
  isRightHanded?: boolean;
}

const riskLegendLevels: { level: RiskLevel; label: string }[] = [
  { level: 'AZUL', label: 'Seguro' },
  { level: 'AMARELO', label: 'Risco moderado' },
  { level: 'VERMELHO', label: 'Alto risco' },
];

export default function RiskMapLegend({ isRightHanded = true }: RiskMapLegendProps) {
  return (
    <View
      pointerEvents="box-none"
      accessible
      accessibilityLabel="Legenda de risco do mapa: seguro, risco moderado e alto risco."
      style={styles.container}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pointerEvents="box-none"
        contentContainerStyle={styles.scrollContent}
      >
        {riskLegendLevels.map(({ level, label }) => {
          const config = RiskVisualStrategy[level];

          return (
            <View key={level} style={styles.chip} pointerEvents="auto">
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: config.color,
                  },
                ]}
              />
              <Text style={styles.label}>{label}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
});

