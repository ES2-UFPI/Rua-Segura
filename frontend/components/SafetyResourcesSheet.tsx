import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShareSession } from '../services/shareService';

const COLORS = {
  primaryGreen: '#16A34A',
  primaryBlue: '#062B55',
  white: '#FFFFFF',
  textDark: '#273142',
  textMuted: '#697586',
  danger: '#DC2626',
};

interface SafetyResourcesSheetProps {
  activeSession: ShareSession | null;
  isStarting: boolean;
  isStopping: boolean;
  isCopying: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onStartSharing: () => void;
  onStopSharing: () => void;
  onCopyLink: () => void;
  onClose: () => void;
}

export function SafetyResourcesSheet({
  activeSession,
  isStarting,
  isStopping,
  isCopying,
  errorMessage,
  successMessage,
  onStartSharing,
  onStopSharing,
  onCopyLink,
  onClose,
}: SafetyResourcesSheetProps) {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Overlay escuro translúcido */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Bottom Sheet */}
      <View style={styles.sheetContainer}>
        {/* Handle estético e cabeçalho */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>Recursos de segurança</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              accessibilityRole="button" 
              accessibilityLabel="Fechar recursos de segurança"
            >
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sheetContent}>
          {errorMessage && (
            <View style={[styles.messageBanner, styles.errorBanner]}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>
                Não foi possível atualizar o compartilhamento. Tente novamente.
              </Text>
            </View>
          )}

          {successMessage && (
            <View style={[styles.messageBanner, styles.successBanner]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primaryGreen} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Item principal de Compartilhamento */}
          <TouchableOpacity
            style={[styles.shareItem, activeSession && styles.shareItemActive]}
            onPress={!activeSession ? onStartSharing : undefined}
            disabled={!activeSession && isStarting}
            activeOpacity={0.7}
          >
            <View style={styles.shareItemLeft}>
              <View style={[styles.iconContainer, activeSession && styles.iconContainerActive]}>
                <Ionicons
                  name={activeSession ? 'share-social' : 'share-social-outline'}
                  size={22}
                  color={activeSession ? COLORS.white : COLORS.primaryBlue}
                />
              </View>

              <View style={styles.textContainer}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.shareItemTitle}>
                    {activeSession ? 'Compartilhando viagem' : 'Compartilhar viagem'}
                  </Text>
                  {activeSession && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Ativo</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.shareItemSubtitle}>
                  {activeSession
                    ? 'Seu trajeto está sendo compartilhado em tempo real.'
                    : 'Envie sua localização e detalhes do trajeto para alguém de confiança.'}
                </Text>
              </View>
            </View>

            <View style={styles.shareItemRight}>
              {!activeSession ? (
                isStarting ? (
                  <ActivityIndicator size="small" color={COLORS.primaryBlue} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                )
              ) : (
                <TouchableOpacity
                  style={styles.stopActionBtn}
                  onPress={onStopSharing}
                  disabled={isStopping}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Parar compartilhamento de viagem"
                >
                  {isStopping ? (
                    <ActivityIndicator size="small" color={COLORS.danger} />
                  ) : (
                    <Text style={styles.stopActionText}>Parar</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

          {/* Link gerado para acompanhamento se ativo */}
          {activeSession && (
            <View style={styles.linkWrapper}>
              <Text style={styles.linkHeader}>Link de acompanhamento:</Text>
              <View style={styles.linkDisplayRow}>
                <Text style={styles.linkUrlText} numberOfLines={1} ellipsizeMode="middle">
                  {activeSession.shareUrl}
                </Text>
                <TouchableOpacity
                  style={[styles.copyIconButton, isCopying && styles.disabledCopy]}
                  onPress={onCopyLink}
                  disabled={isCopying}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Copiar link do trajeto"
                >
                  {isCopying ? (
                    <ActivityIndicator size="small" color={COLORS.primaryGreen} />
                  ) : (
                    <Ionicons name="copy-outline" size={20} color={COLORS.primaryGreen} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 100,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    zIndex: 101,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  sheetTitleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  closeButton: {
    padding: 4,
  },
  sheetContent: {
    paddingHorizontal: 20,
  },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    minHeight: 88,
  },
  shareItemActive: {
    borderColor: '#DCFCE7',
    backgroundColor: '#F0FDF4',
  },
  shareItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F0FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconContainerActive: {
    backgroundColor: COLORS.primaryGreen,
  },
  textContainer: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  shareItemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  activeBadge: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  shareItemSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  shareItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1.2,
    borderColor: COLORS.danger,
  },
  stopActionText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  linkWrapper: {
    marginTop: 14,
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkHeader: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  linkDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  linkUrlText: {
    flex: 1,
    color: COLORS.primaryBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  copyIconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledCopy: {
    opacity: 0.6,
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 6,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  successBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  successText: {
    color: COLORS.primaryGreen,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
