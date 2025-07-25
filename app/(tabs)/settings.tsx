import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  TextInput,
  SafeAreaView,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PantryDatabase } from '@/database/PantryDatabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { AIService } from '@/services/AIService';
import { lightTheme, darkTheme } from '@/styles/themes';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const SettingItem = ({
  iconName,
  title,
  subtitle,
  onPress,
  rightComponent,
  color,
  iconSet = 'Feather',
}: {
  iconName: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  color: string;
  iconSet?: 'Feather' | 'MaterialCommunityIcons';
}) => {
  const { theme } = useTheme();
  const Icon = iconSet === 'Feather' ? Feather : MaterialCommunityIcons;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };
  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.98);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={!onPress && !rightComponent}
      >
        <View style={styles.settingLeft}>
          <View
            style={[styles.iconContainer, { backgroundColor: `${color}20` }]}
          >
            <Icon name={iconName} size={20} color={color} />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightComponent ||
          (onPress && (
            <Feather
              name="chevron-right"
              size={20}
              color={theme.colors.textTertiary}
            />
          ))}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ApiKeyModal = ({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}) => {
  const { theme } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }
    setIsValidating(true);
    try {
      const isValid = await AIService.testApiKey(apiKey.trim());
      if (isValid) {
        await AIService.setApiKey(apiKey.trim());
        onSave();
        setApiKey('');
        onClose();
        Alert.alert('Success', 'API key saved and validated successfully!');
      } else {
        Alert.alert(
          'Invalid API Key',
          'The key is not valid. Please check and try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate API key.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={[
              styles.apiKeyModal,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                OpenAI API Key
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Feather
                  name="x"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text
                style={[
                  styles.modalDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Enter your OpenAI API key to enable AI-powered food recognition.
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.apiKeyInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="sk-..."
                  placeholderTextColor={theme.colors.textTertiary}
                  secureTextEntry
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { borderColor: theme.colors.border },
                  ]}
                  onPress={onClose}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButtonPrimary,
                    { opacity: isValidating ? 0.7 : 1 },
                  ]}
                  onPress={handleSave}
                  disabled={isValidating}
                >
                  <LinearGradient
                    colors={theme.gradients.primary as any}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonTextPrimary}>
                      {isValidating ? 'Validating...' : 'Save & Test'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

export default function SettingsScreen() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const currentTheme = isDark ? darkTheme : lightTheme;
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 100], [150, 90], Extrapolate.CLAMP),
  }));
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [20, 70], [1, 0], Extrapolate.CLAMP),
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, 100],
          [1, 0.8],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    setHasApiKey(!!(await AIService.getApiKey()));
  };
  const handleSignOut = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  const handleClearData = () =>
    Alert.alert('Clear All Data', 'This is permanent.', [
      { text: 'Cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await PantryDatabase.clearAllData();
          await AsyncStorage.removeItem('shoppingList');
          if (isAuthenticated) signOut();
          Alert.alert('Success', 'All data has been cleared.');
        },
      },
    ]);
  const handleApiKeySaved = () => {
    checkApiKey();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAIFeaturePress = (featureAction: () => void) => {
    if (hasApiKey) {
      featureAction();
    } else {
      Alert.alert(
        'API Key Required',
        'Please configure your OpenAI API key first to use this feature.',
        [{ text: 'OK', onPress: () => setShowApiKeyModal(true) }]
      );
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <Animated.View style={[styles.header, animatedHeaderStyle]}>
        <LinearGradient
          colors={currentTheme.gradients.primary as any}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={[styles.headerContent, animatedTitleStyle]}>
          <Feather name="settings" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </Animated.View>
      </Animated.View>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: currentTheme.colors.text }]}
          >
            Account
          </Text>
          <View style={styles.sectionCard}>
            {isAuthenticated ? (
              <>
                <SettingItem
                  iconName="user"
                  title={user?.displayName || 'User Profile'}
                  subtitle={user?.email}
                  color="#3B82F6"
                />
                <SettingItem
                  iconName="log-out"
                  title="Sign Out"
                  color="#EF4444"
                  onPress={handleSignOut}
                />
              </>
            ) : (
              <SettingItem
                iconName="user"
                title="Sign In / Sign Up"
                subtitle="Sync your data"
                color="#3B82F6"
                onPress={() => setShowAuthModal(true)}
              />
            )}
          </View>
        </View>
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: currentTheme.colors.text }]}
          >
            Preferences
          </Text>
          <View style={styles.sectionCard}>
            <SettingItem
              iconName="bell"
              title="Notifications"
              subtitle="Expiration alerts"
              color="#F59E0B"
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{
                    false: currentTheme.colors.border,
                    true: currentTheme.colors.primary,
                  }}
                  thumbColor={'#FFFFFF'}
                />
              }
            />
            <SettingItem
              iconName="moon"
              title="Dark Mode"
              subtitle="Switch themes"
              color="#6366F1"
              rightComponent={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{
                    false: currentTheme.colors.border,
                    true: currentTheme.colors.primary,
                  }}
                  thumbColor={'#FFFFFF'}
                />
              }
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: currentTheme.colors.text }]}
          >
            AI Features
          </Text>
          <View style={styles.sectionCard}>
            <SettingItem
              iconName="key"
              title="AI API Key"
              subtitle={
                hasApiKey
                  ? 'OpenAI key configured ✓'
                  : 'Configure OpenAI API key'
              }
              color="#8B5CF6"
              onPress={() => setShowApiKeyModal(true)}
            />
            <SettingItem
              iconName="camera"
              title="Food Recognition"
              subtitle="AI-powered food scanning"
              color="#22C55E"
              onPress={() =>
                handleAIFeaturePress(() =>
                  Alert.alert(
                    'Ready to Scan!',
                    'Use the AI Camera button on the main Pantry screen.'
                  )
                )
              }
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: currentTheme.colors.text }]}
          >
            Data & Support
          </Text>
          <View style={styles.sectionCard}>
            <SettingItem
              iconName="trash-2"
              title="Clear All Data"
              subtitle="Reset the application state"
              color="#EF4444"
              onPress={handleClearData}
            />
            <SettingItem
              iconName="help-circle"
              title="Help & FAQ"
              color="#34D399"
            />
          </View>
        </View>
        <View style={styles.footer}>
          <Text
            style={[
              styles.versionText,
              { color: currentTheme.colors.textTertiary },
            ]}
          >
            Pantry Pal Version 1.0.0
          </Text>
        </View>
      </Animated.ScrollView>
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <ApiKeyModal
        visible={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { justifyContent: 'center', alignItems: 'center' },
  headerContent: { alignItems: 'center' },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: { borderRadius: 16, overflow: 'hidden' },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingSubtitle: { fontSize: 14, marginTop: 2 },
  footer: { alignItems: 'center', paddingVertical: 32 },
  versionText: { fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  apiKeyModal: {
    margin: 20,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalContent: { padding: 20, paddingTop: 10 },
  modalDescription: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  inputContainer: { marginBottom: 24 },
  apiKeyInput: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
  },
  modalButtonPrimary: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  modalButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  modalButtonTextPrimary: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
