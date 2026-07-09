import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiskVisualStrategy, RiskLevel } from '../config/RiskVisualStrategy';

interface RiskIndicatorProps {
  level: string;
  score?: number;
  count?: number;
  onOpenLegend?: () => void;
}

export default function RiskIndicator({
  level,
  score = 0,
  count = 0,
  onOpenLegend,
}: RiskIndicatorProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);

  const safeLevel = (
    level in RiskVisualStrategy ? level : 'AZUL'
  ) as RiskLevel;

  const config = RiskVisualStrategy[safeLevel];

  return (
    <>
      {/* Header Pill */}
      <TouchableOpacity
        style={[styles.pill, { backgroundColor: config.color }]}
        onPress={() => setDetailsVisible(true)}
        activeOpacity={0.8}
        accessibilityLabel={`Status do risco na área: ${config.bannerText}. Clique para ver detalhes.`}
      >
        <Ionicons
          name={config.icon}
          size={14}
          color={config.textColor || '#ffffff'}
        />
        <Text style={[styles.pillText, { color: config.textColor || '#ffffff' }]}>
          {config.bannerText}
        </Text>
      </TouchableOpacity>

      {/* Risk Details Popup Modal */}
      <Modal
        visible={detailsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Ionicons name="shield-outline" size={20} color="#3B9B6E" />
                <Text style={styles.title}>Status de Segurança</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailsVisible(false)}>
                <Ionicons name="close" size={22} color="#1A3550" />
              </TouchableOpacity>
            </View>

            {/* Risk Badge & Level */}
            <View style={[styles.detailsBadge, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon} size={24} color={config.textColor || '#ffffff'} />
              <Text style={[styles.detailsBadgeText, { color: config.textColor || '#ffffff' }]}>
                {config.bannerText}
              </Text>
            </View>

            {/* Detailed Description */}
            <Text style={styles.descText}>{config.description}</Text>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Índice Risco</Text>
                <Text style={styles.statValue}>{score.toFixed(1)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Ocorrências</Text>
                <Text style={styles.statValue}>{count}</Text>
              </View>
            </View>

            {/* Link to Legend */}
            <TouchableOpacity
              style={styles.legendLink}
              onPress={() => {
                setDetailsVisible(false);
                if (onOpenLegend) {
                  onOpenLegend();
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.legendLinkText}>Entender legenda de cores</Text>
              <Ionicons name="arrow-forward" size={14} color="#3B9B6E" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 53, 80, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE7F0',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#1A3550',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBadge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsBadgeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  descText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    paddingVertical: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: '#1A3550',
    fontSize: 18,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    backgroundColor: '#E8EEF5',
  },
  legendLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  legendLinkText: {
    color: '#3B9B6E',
    fontSize: 13,
    fontWeight: '700',
  },
});
