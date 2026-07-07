import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOccurrenceInteraction } from '../hooks/useOccurrenceInteraction';

const COLORS = {
  primaryGreen: '#16A34A',
  primaryBlue: '#062B55',
  white: '#FFFFFF',
  textDark: '#273142',
  textMuted: '#697586',
  danger: '#DC2626',
  lightGray: '#F8FAFC',
  border: '#E2E8F0',
};

interface OccurrenceDetailSheetProps {
  occurrenceId: number;
  onClose: () => void;
}

export function OccurrenceDetailSheet({ occurrenceId, onClose }: OccurrenceDetailSheetProps) {
  const {
    occurrence,
    comments,
    loading,
    successMessage,
    errorMessage,
    isSubmittingComment,
    isSubmittingValidation,
    submitComment,
    submitValidation,
    userVote,
  } = useOccurrenceInteraction(occurrenceId);

  const [commentText, setCommentText] = useState('');
  const [isReviewMode, setIsReviewMode] = useState(false);

  const handleConfirmComment = async () => {
    if (!commentText.trim()) return;
    const ok = await submitComment(commentText);
    if (ok) {
      setCommentText(''); // limpa o input após envio com sucesso
      setIsReviewMode(false);
    }
  };

  const getStatusLabelAndColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmada', color: COLORS.primaryGreen, bg: '#F0FDF4' };
      case 'contested':
        return { label: 'Contestada', color: COLORS.danger, bg: '#FEF2F2' };
      default:
        return { label: 'Pendente', color: '#D97706', bg: '#FEF3C7' };
    }
  };

  if (loading) {
    return (
      <View style={styles.absoluteContainer} pointerEvents="box-none">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
          </View>
          <ActivityIndicator size="large" color={COLORS.primaryBlue} style={{ marginVertical: 40 }} />
        </View>
      </View>
    );
  }

  if (!occurrence) return null;

  const statusStyle = getStatusLabelAndColor(occurrence.communityStatus);

  return (
    <View style={styles.absoluteContainer} pointerEvents="box-none">
      {/* Overlay translúcido de fundo */}
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      {/* Container do Bottom Sheet */}
      <View style={styles.sheetContainer}>
        {/* Cabeçalho */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHandle} />
          <View style={styles.titleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.categoryTitle}>{occurrence.category}</Text>
              <Text style={styles.locationSubtitle}>{occurrence.locationDescription}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mensagens de Sucesso ou Erro */}
        {errorMessage && (
          <View style={[styles.banner, styles.errorBanner]}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        {successMessage && (
          <View style={[styles.banner, styles.successBanner]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primaryGreen} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Detalhes da Ocorrência */}
        <View style={styles.occurrenceBody}>
          <Text style={styles.descriptionText}>{occurrence.description}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.badgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(occurrence.createdAt).toLocaleDateString('pt-BR')} às {new Date(occurrence.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Seção de Validação/Confirmação com regras visuais de voto único */}
        <View style={styles.validationSection}>
          <TouchableOpacity
            style={[
              styles.valButton,
              userVote === 'confirm' ? styles.confirmButtonActive : styles.confirmButtonInactive
            ]}
            disabled={isSubmittingValidation}
            onPress={() => submitValidation('confirm')}
          >
            <Ionicons
              name={userVote === 'confirm' ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={20}
              color={userVote === 'confirm' ? COLORS.white : COLORS.primaryGreen}
            />
            <Text style={[
              styles.valButtonText,
              userVote === 'confirm' ? styles.valButtonTextActive : styles.valButtonTextInactiveConfirm
            ]}>
              Confirmar ({occurrence.confirmationsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.valButton,
              userVote === 'contest' ? styles.contestButtonActive : styles.contestButtonInactive
            ]}
            disabled={isSubmittingValidation}
            onPress={() => submitValidation('contest')}
          >
            <Ionicons
              name={userVote === 'contest' ? 'close-circle' : 'close-circle-outline'}
              size={20}
              color={userVote === 'contest' ? COLORS.white : COLORS.danger}
            />
            <Text style={[
              styles.valButtonText,
              userVote === 'contest' ? styles.valButtonTextActive : styles.valButtonTextInactiveContest
            ]}>
              Contestar ({occurrence.contestationsCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Comentários */}
        <Text style={styles.sectionTitle}>Comentários da comunidade</Text>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          style={styles.commentsList}
          contentContainerStyle={{ paddingBottom: 8 }}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{item.authorName}</Text>
                <Text style={styles.commentDate}>
                  {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.commentContent}>{item.content}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyCommentsText}>Nenhum comentário adicionado ainda.</Text>
          }
        />

        {/* Input de Escrever Comentário ou Área de Revisão */}
        {isReviewMode ? (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewLabel}>Revisar comentário antes de enviar:</Text>
            <View style={styles.reviewTextWrapper}>
              <Text style={styles.reviewText}>{commentText}</Text>
            </View>
            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={[styles.reviewBtn, styles.reviewCancelBtn]}
                onPress={() => {
                  setCommentText('');
                  setIsReviewMode(false);
                }}
              >
                <Text style={styles.reviewCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewBtn, styles.reviewEditBtn]}
                onPress={() => setIsReviewMode(false)}
              >
                <Text style={styles.reviewEditText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewBtn, styles.reviewConfirmBtn]}
                onPress={handleConfirmComment}
                disabled={isSubmittingComment}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.reviewConfirmText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Adicione um comentário..."
              placeholderTextColor={COLORS.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              maxLength={250}
            />
            <TouchableOpacity
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
              onPress={() => {
                if (commentText.trim()) {
                  setIsReviewMode(true);
                }
              }}
              disabled={!commentText.trim()}
            >
              <Ionicons name="send" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    paddingHorizontal: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 14,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  locationSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  occurrenceBody: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.textDark,
    lineHeight: 22,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  validationSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  valButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmButtonActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
    borderWidth: 1.5,
  },
  confirmButtonInactive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1.5,
  },
  contestButtonActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
  contestButtonInactive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1.5,
  },
  valButtonText: {
    fontWeight: '800',
    fontSize: 14,
  },
  valButtonTextActive: {
    color: COLORS.white,
  },
  valButtonTextInactiveConfirm: {
    color: COLORS.primaryGreen,
  },
  valButtonTextInactiveContest: {
    color: COLORS.danger,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  commentsList: {
    maxHeight: 180,
  },
  commentItem: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: '700',
    fontSize: 12,
    color: COLORS.textDark,
  },
  commentDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  commentContent: {
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 18,
  },
  emptyCommentsText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 13,
    marginVertical: 12,
  },
  inputArea: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textDark,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: COLORS.primaryBlue,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  banner: {
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
  reviewContainer: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  reviewLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  reviewTextWrapper: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
    fontWeight: '500',
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  reviewBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewCancelText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  reviewEditBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  reviewEditText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  reviewConfirmBtn: {
    backgroundColor: COLORS.primaryBlue,
  },
  reviewConfirmText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
});
