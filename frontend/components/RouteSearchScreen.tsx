import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export interface RouteSearchData {
  origin: string;
  destination: string;
}

interface RouteSearchScreenProps {
  onSearch?: (data: RouteSearchData) => Promise<unknown>;
}

export default function RouteSearchScreen({ onSearch }: RouteSearchScreenProps) {
  const router = useRouter();

  const [origin, setOrigin] = useState('Local atual');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = origin.trim().length > 0 && destination.trim().length > 0;

  const handleSearch = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      if (onSearch) {
        await onSearch({
          origin: origin.trim(),
          destination: destination.trim(),
        });
      }

      // TODO: integrar com o backend futuramente na issue de integração do fluxo de rotas.
      // Esta issue trata apenas da interface inicial, validação, loading e erro.
    } catch {
      setError('Não foi possível calcular a rota agora. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearOrigin = () => {
    if (!isLoading) setOrigin('');
  };

  const handleClearDestination = () => {
    if (!isLoading) setDestination('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#062B55"
        translucent={false}
      />

      <View style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.heroHeader}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.iconButton}
                  accessibilityLabel="Voltar"
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.logoText}>
                  Rotas <Text style={styles.logoTextHighlight}>Seguras</Text>
                </Text>

                <TouchableOpacity
                  style={styles.iconButton}
                  accessibilityLabel="Menu"
                  activeOpacity={0.7}
                >
                  <Ionicons name="menu" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.heroTextBox}>
                <Text style={styles.greeting}>Olá!</Text>
                <Text style={styles.heroTitle}>Para onde você quer ir?</Text>
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.routeCard}>
                <View style={styles.routeField}>
                  <View style={[styles.fieldIconContainer, styles.originIconContainer]}>
                    <Ionicons name="locate" size={21} color="#16A34A" />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Origem</Text>

                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Informe a origem"
                        placeholderTextColor="#94A3B8"
                        value={origin}
                        onChangeText={setOrigin}
                        editable={!isLoading}
                        accessibilityLabel="Campo de origem"
                        returnKeyType="next"
                      />

                      {origin.length > 0 && !isLoading && (
                        <TouchableOpacity
                          onPress={handleClearOrigin}
                          style={styles.clearButton}
                          accessibilityLabel="Limpar origem"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.routeField}>
                  <View style={[styles.fieldIconContainer, styles.destinationIconContainer]}>
                    <Ionicons name="location-outline" size={23} color="#2563EB" />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Destino</Text>

                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Informe o destino"
                        placeholderTextColor="#94A3B8"
                        value={destination}
                        onChangeText={setDestination}
                        editable={!isLoading}
                        accessibilityLabel="Campo de destino"
                        returnKeyType="done"
                        onSubmitEditing={handleSearch}
                      />

                      {destination.length > 0 && !isLoading && (
                        <TouchableOpacity
                          onPress={handleClearDestination}
                          style={styles.clearButton}
                          accessibilityLabel="Limpar destino"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.searchButton,
                  (!isFormValid || isLoading) && styles.searchButtonDisabled,
                ]}
                onPress={handleSearch}
                disabled={!isFormValid || isLoading}
                activeOpacity={0.85}
                accessibilityLabel="Buscar rota segura"
              >
                {isLoading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.searchButtonText}>Calculando rota...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="git-branch-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.searchButtonText}>Buscar rota segura</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.tipCard}>
                <View style={styles.tipIconContainer}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#1D4ED8" />
                </View>

                <View style={styles.tipTextWrapper}>
                  <Text style={styles.tipTitle}>Dica de segurança</Text>
                  <Text style={styles.tipText}>
                    Evite informar dados sensíveis em locais públicos.
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Como funciona?</Text>

                <View style={styles.infoItem}>
                  <View style={styles.infoNumber}>
                    <Text style={styles.infoNumberText}>1</Text>
                  </View>
                  <Text style={styles.infoText}>Informe sua origem.</Text>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoNumber}>
                    <Text style={styles.infoNumberText}>2</Text>
                  </View>
                  <Text style={styles.infoText}>Informe o destino desejado.</Text>
                </View>

                <View style={[styles.infoItem, styles.infoItemLast]}>
                  <View style={styles.infoNumber}>
                    <Text style={styles.infoNumberText}>3</Text>
                  </View>
                  <Text style={styles.infoText}>
                    Toque em buscar para solicitar uma rota segura.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#062B55',
  },

  screen: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flex: 1,
  },

  scrollContentContainer: {
    paddingBottom: 28,
  },

  hero: {
    backgroundColor: '#062B55',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 84,
  },

  heroHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginLeft: 4,
  },

  logoTextHighlight: {
    color: '#22C55E',
  },

  heroTextBox: {
    marginTop: 16,
  },

  greeting: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },

  content: {
    paddingHorizontal: 20,
    marginTop: -66,
  },

  routeCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },

  routeField: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fieldIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  originIconContainer: {
    backgroundColor: '#ECFDF3',
  },

  destinationIconContainer: {
    backgroundColor: '#EFF6FF',
  },

  inputWrapper: {
    flex: 1,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102A56',
    marginBottom: 1,
  },

  inputRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#102A56',
    paddingVertical: 3,
  },

  clearButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5EAF0',
    marginLeft: 46,
    marginRight: 58,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginLeft: 8,
  },

  searchButton: {
    height: 54,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#16A34A',
    shadowOpacity: 0.25,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },

  searchButtonDisabled: {
    backgroundColor: '#A7B4C4',
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 14,
    marginTop: 16,
  },

  tipIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  tipTextWrapper: {
    flex: 1,
  },

  tipTitle: {
    color: '#102A56',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },

  tipText: {
    color: '#526174',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  infoTitle: {
    color: '#102A56',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  infoItemLast: {
    marginBottom: 0,
  },

  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  infoNumberText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
  },

  infoText: {
    flex: 1,
    color: '#526174',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});