import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiskVisualStrategy, RiskLevel } from '../config/RiskVisualStrategy';

interface RiskIndicatorProps {
  level: string;
  score?: number;
  isRightHanded?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function RiskIndicator({
  level,
  isRightHanded = true,
}: RiskIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  const safeLevel = (
    level in RiskVisualStrategy ? level : 'AZUL'
  ) as RiskLevel;

  const config = RiskVisualStrategy[safeLevel];

  // Alinhamento lateral baseado na preferência manual
  const sidePosition = isRightHanded ? { right: 12 } : { left: 12 };
  
  // Define a direção do fluxo: se for destro, o texto aparece à esquerda do botão.
  const flexDirectionStyle = isRightHanded ? 'row' : 'row-reverse';

  if (!expanded) {
    return (
      <TouchableOpacity
        style={[
          styles.floatingIcon,
          { backgroundColor: config.color },
          sidePosition,
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
    <View style={[styles.layerContainer, sidePosition, { flexDirection: flexDirectionStyle }]}>
      
      {/* Caixa de Mensagem com limites de largura rígidos para forçar a quebra */}
      <View style={[styles.textBubble, { borderColor: config.color }]}>
        <Text style={styles.messageText} numberOfLines={0}>
          Risco da região sendo visualizada: {config.description}
        </Text>
      </View>

      {/* Botão circular transformado em gatilho de fechar ("X") */}
      <TouchableOpacity
        style={[styles.floatingIconActive, { backgroundColor: config.color }]}
        onPress={() => setExpanded(false)}
        activeOpacity={0.8}
      >
        <Ionicons
          name="close"
          size={18}
          color={config.textColor || '#ffffff'}
        />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  layerContainer: {
    position: 'absolute',
    top: 172,
    alignItems: 'center',
    zIndex: 1000,
    // Garante que o conjunto (balão + botão) não ocupe mais de 85% da largura do ecrã
    maxWidth: '85%',
    gap: 8,
  },
  floatingIcon: {
    position: 'absolute',
    top: 172,
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
  floatingIconActive: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    elevation: 6,
  },
  textBubble: {
    // Calculamos uma largura máxima dinâmica baseada no ecrã subtraindo o espaço do botão e das margens
    maxWidth: screenWidth * 0.7,
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: 'center',
  },
  messageText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    flexWrap: 'wrap',
  },
});