import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiskVisualStrategy, RiskLevel } from '../config/RiskVisualStrategy';

interface RiskIndicatorProps {
  level: string;
  score?: number;
}

export default function RiskIndicator({
  level,
  score,
}: RiskIndicatorProps) {
  const [expanded, setExpanded] = useState(true);

  const safeLevel = (
    level in RiskVisualStrategy ? level : 'AZUL'
  ) as RiskLevel;

  const config = RiskVisualStrategy[safeLevel];

  useEffect(() => {
    const timer = setTimeout(() => {
      setExpanded(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!expanded) {
    return (
      <TouchableOpacity
        style={[
          styles.floatingIcon,
          { backgroundColor: config.color },
        ]}
        onPress={() => setExpanded(true)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={config.icon}
          size={18}
          color={config.textColor || '#ffffff'}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.color,
          borderColor: config.color,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={config.icon}
          size={24}
          color={config.textColor || '#ffffff'}
        />

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.textColor || '#ffffff' }]}>
            {config.bannerText}
          </Text>

          <Text style={[styles.description, { color: config.textColor || '#ffffff' }]}>
            {config.description}
          </Text>

          {score !== undefined && (
            <Text style={[styles.score, { color: config.textColor || '#ffffff' }]}>
              Pontuação atual: {score}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setExpanded(false)}
        >
          <Ionicons
            name="close"
            size={16}
            color={config.textColor || '#ffffff'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',

    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 8,

    borderRadius: 20,
    borderWidth: 1,

    maxWidth: '90%',

    zIndex: 1000,
    elevation: 6,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  textContainer: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },

  description: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.95,
  },

  score: {
    color: '#ffffff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
    opacity: 0.8,
  },

  closeButton: {
    marginLeft: 8,
    padding: 4,
  },

  floatingIcon: {
    position: 'absolute',

    // abaixo do botão de dica
    top: 58,
    right: 12,

    width: 38,
    height: 38,
    borderRadius: 19,

    borderWidth: 1.5,
    borderColor: '#334155',

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 1000,
    elevation: 5,

    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});