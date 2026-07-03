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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type RouteLocationDraft = {
  text: string;
  coordinates: Coordinates | null;
};

export type RouteSearchData = {
  origin: RouteLocationDraft;
  destination: RouteLocationDraft;
};

type FieldName = 'origin' | 'destination';

type Suggestion = {
  id: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  coordinates: Coordinates | null;
};

interface RouteSearchScreenProps {
  onSearch?: (data: RouteSearchData) => Promise<unknown>;
}

const EMPTY_LOCATION: RouteLocationDraft = {
  text: '',
  coordinates: null,
};

const SAVED_LOCATIONS: Suggestion[] = [
  {
    id: 'home',
    label: 'Casa',
    subtitle: 'Local salvo',
    icon: 'home-outline',
    coordinates: {
      latitude: -5.091,
      longitude: -42.802,
    },
  },
  {
    id: 'work',
    label: 'Trabalho',
    subtitle: 'Local salvo',
    icon: 'briefcase-outline',
    coordinates: {
      latitude: -5.0805,
      longitude: -42.7901,
    },
  },
];

const RECENT_LOCATIONS: Suggestion[] = [
  {
    id: 'ufpi',
    label: 'UFPI',
    subtitle: 'Busca recente',
    icon: 'time-outline',
    coordinates: {
      latitude: -5.0576,
      longitude: -42.7967,
    },
  },
  {
    id: 'centro',
    label: 'Centro',
    subtitle: 'Busca recente',
    icon: 'time-outline',
    coordinates: {
      latitude: -5.0892,
      longitude: -42.8016,
    },
  },
  {
    id: 'teresina-shopping',
    label: 'Teresina Shopping',
    subtitle: 'Busca recente',
    icon: 'time-outline',
    coordinates: {
      latitude: -5.0836,
      longitude: -42.7934,
    },
  },
];

const POPULAR_REGIONS: Suggestion[] = [
  {
    id: 'ininga',
    label: 'Ininga',
    subtitle: 'Região popular',
    icon: 'location-outline',
    coordinates: {
      latitude: -5.055,
      longitude: -42.797,
    },
  },
  {
    id: 'dirceu',
    label: 'Dirceu',
    subtitle: 'Região popular',
    icon: 'location-outline',
    coordinates: {
      latitude: -5.1008,
      longitude: -42.7443,
    },
  },
  {
    id: 'zona-leste',
    label: 'Zona Leste',
    subtitle: 'Região popular',
    icon: 'location-outline',
    coordinates: {
      latitude: -5.0665,
      longitude: -42.7712,
    },
  },
];


export default function RouteSearchScreen({ onSearch }: RouteSearchScreenProps) {
  const router = useRouter();
  const routeIcon = require('../assets/images/route.png');
  const [origin, setOrigin] = useState<RouteLocationDraft>(EMPTY_LOCATION);
  const [destination, setDestination] =
    useState<RouteLocationDraft>(EMPTY_LOCATION);

  const [activeField, setActiveField] = useState<FieldName>('origin');
  const [routeDraft, setRouteDraft] = useState<RouteSearchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid =
    origin.text.trim().length > 0 && destination.text.trim().length > 0;

  const handleChangeOrigin = (value: string) => {
    setOrigin({
      text: value,
      coordinates: null,
    });

    setActiveField('origin');
    setRouteDraft(null);
  };

  const handleChangeDestination = (value: string) => {
    setDestination({
      text: value,
      coordinates: null,
    });

    setActiveField('destination');
    setRouteDraft(null);
  };

  const handleClearOrigin = () => {
    if (isLoading) return;

    setOrigin(EMPTY_LOCATION);
    setRouteDraft(null);
    setActiveField('origin');
  };

  const handleClearDestination = () => {
    if (isLoading) return;

    setDestination(EMPTY_LOCATION);
    setRouteDraft(null);
    setActiveField('destination');
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    const selectedLocation: RouteLocationDraft = {
      text: suggestion.label,
      coordinates: suggestion.coordinates,
    };

    if (activeField === 'origin') {
      setOrigin(selectedLocation);
    } else {
      setDestination(selectedLocation);
    }

    setRouteDraft(null);
  };

  const prepareRouteDraft = (): RouteSearchData => {
    return {
      origin: {
        text: origin.text.trim(),
        coordinates: origin.coordinates,
      },
      destination: {
        text: destination.text.trim(),
        coordinates: destination.coordinates,
      },
    };
  };

  const handleSearch = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    try {
      const preparedRouteDraft = prepareRouteDraft();

      setRouteDraft(preparedRouteDraft);

      if (onSearch) {
        await onSearch(preparedRouteDraft);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      console.log('Dados disponíveis para requisição de rota:', preparedRouteDraft);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSuggestionSection = (title: string, suggestions: Suggestion[]) => {
    return (
      <View style={styles.suggestionSection}>
        <Text style={styles.suggestionSectionTitle}>{title}</Text>

        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={styles.suggestionItem}
            onPress={() => handleSelectSuggestion(suggestion)}
            activeOpacity={0.75}
          >
            <View style={styles.suggestionIcon}>
              <Ionicons name={suggestion.icon} size={18} color="#64748B" />
            </View>

            <View style={styles.suggestionTextBox}>
              <Text style={styles.suggestionText}>{suggestion.label}</Text>
              <Text style={styles.suggestionSubtitle}>
                {suggestion.subtitle}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>
    );
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

                <View style={styles.iconButton} />
              </View>

              <View style={styles.heroTextBox}>
                <Text style={styles.greeting}>Olá!</Text>
                <Text style={styles.heroTitle}>Para onde você quer ir?</Text>
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.routeCard}>
                <View style={styles.routeField}>
                  <View
                    style={[
                      styles.fieldIconContainer,
                      styles.originIconContainer,
                    ]}
                  >
                    <Ionicons name="locate" size={21} color="#16A34A" />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Origem</Text>

                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.textInput, styles.webInput]}
                        placeholder="Informe a origem"
                        placeholderTextColor="#94A3B8"
                        value={origin.text}
                        onChangeText={handleChangeOrigin}
                        editable={!isLoading}
                        accessibilityLabel="Campo de origem"
                        returnKeyType="next"
                        onFocus={() => setActiveField('origin')}
                        autoCorrect={false}
                        spellCheck={false}
                        autoCapitalize="none"
                        underlineColorAndroid="transparent"
                      />

                      {origin.text.length > 0 && !isLoading && (
                        <TouchableOpacity
                          onPress={handleClearOrigin}
                          style={styles.clearButton}
                          accessibilityLabel="Limpar origem"
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.routeField}>
                  <View
                    style={[
                      styles.fieldIconContainer,
                      styles.destinationIconContainer,
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={23}
                      color="#2563EB"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Destino</Text>

                    <View style={styles.inputRow}>
                    
                    <TextInput
                      style={[styles.textInput, styles.webInput]}
                      placeholder="Informe o destino"
                      placeholderTextColor="#94A3B8"
                      value={destination.text}
                      onChangeText={handleChangeDestination}
                      editable={!isLoading}
                      accessibilityLabel="Campo de destino"
                      returnKeyType="done"
                      onSubmitEditing={handleSearch}
                      onFocus={() => setActiveField('destination')}
                      autoCorrect={false}
                      spellCheck={false}
                      autoCapitalize="none"
                      underlineColorAndroid="transparent"
                    />

                      {destination.text.length > 0 && !isLoading && (
                        <TouchableOpacity
                          onPress={handleClearDestination}
                          style={styles.clearButton}
                          accessibilityLabel="Limpar destino"
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>

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

                    <Text style={styles.searchButtonText}>
                      Preparando rota...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Image
                      source={routeIcon}
                      style={styles.routeButtonIcon}
                      resizeMode="contain"
                    />

                    <Text style={styles.searchButtonText}>
                      Buscar rota segura
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {!isFormValid && !isLoading && (
                <Text style={styles.requiredHint}>
                  Informe origem e destino para continuar.
                </Text>
              )}


              <View style={styles.suggestionsCard}>
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.suggestionsTitle}>
                    {activeField === 'origin'
                      ? 'Escolha sua origem'
                      : 'Escolha seu destino'}
                  </Text>
                </View>

                <View style={styles.savedSection}>
                  <Text style={styles.suggestionSectionTitle}>
                    Locais salvos
                  </Text>

                  <View style={styles.savedLocationsRow}>
                    {SAVED_LOCATIONS.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion.id}
                        style={styles.savedLocationCard}
                        onPress={() => handleSelectSuggestion(suggestion)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.savedLocationIcon}>
                          <Ionicons
                            name={suggestion.icon}
                            size={20}
                            color="#16A34A"
                          />
                        </View>

                        <Text style={styles.savedLocationTitle}>
                          {suggestion.label}
                        </Text>
                        <Text style={styles.savedLocationSubtitle}>
                          {suggestion.subtitle}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {renderSuggestionSection('Buscas recentes', RECENT_LOCATIONS)}
                {renderSuggestionSection('Regiões populares', POPULAR_REGIONS)}
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
    textAlign: 'center',
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
    alignItems: 'flex-start',
    paddingVertical: 10,
  },

  fieldIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
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
  webInput: {
    outlineStyle: 'none',
    outlineWidth: 0,
  } as any,
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
  routeButtonIcon: {
  width: 22,
  height: 22,
  marginRight: 8,
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  requiredHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },

  draftCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF3',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    marginTop: 14,
  },

  draftText: {
    flex: 1,
    color: '#166534',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginLeft: 8,
  },

  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  suggestionsTitle: {
    flex: 1,
    color: '#102A56',
    fontSize: 14,
    fontWeight: '800',
  },

  savedSection: {
    paddingTop: 4,
  },

  savedLocationsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
  },

  savedLocationCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    padding: 12,
    alignItems: 'flex-start',
  },

  savedLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  savedLocationTitle: {
    color: '#102A56',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },

  savedLocationSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },

  suggestionSection: {
    paddingTop: 4,
  },

  suggestionSectionTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  suggestionTextBox: {
    flex: 1,
  },

  suggestionText: {
    color: '#102A56',
    fontSize: 14,
    fontWeight: '700',
  },

  suggestionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },

});