import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  TextInput,
  ColorValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Database, 
  Info, 
  Shield, 
  Trash2,
  Moon,
  ChevronRight,
  User,
  LogOut,
  Key,
  Brain
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PantryDatabase } from '@/database/PantryDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { AIService } from '@/services/AIService';
import { lightTheme, darkTheme } from '@/styles/themes';

export default function SettingsScreen() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { theme, toggleTheme, isDark } = useTheme();
  const currentTheme = isDark ? darkTheme : lightTheme;

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleSaveApiKey = async () => {
    try {
      if (apiKey.trim()) {
        AIService.setApiKey(apiKey.trim());
        await AsyncStorage.setItem('@pantrypal_ai_api_key', apiKey.trim());
        Alert.alert('Success', 'AI API key saved successfully');
      }
      setShowApiKeyInput(false);
      setApiKey('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };
  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your pantry items and shopping list. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear pantry database
              const items = await PantryDatabase.getAllItems();
              for (const item of items) {
                await PantryDatabase.deleteItem(item.id!);
              }
              
              // Clear shopping list
              await AsyncStorage.removeItem('shoppingList');
              
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Pantry Pal',
      'Pantry Pal v1.0.0\n\nA smart food inventory management app with AI-powered features to help you reduce waste and save money.\n\nFeatures:\n• AI Food Recognition\n• Smart Notifications\n• Analytics & Insights\n• Cross-device Sync\n\nDeveloped with ❤️ for better food management.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is our priority:\n\n• Local data storage by default\n• Optional cloud sync with encryption\n• No personal data collection\n• AI processing is anonymous\n• You control your data\n\nFor full details, visit our privacy policy at pantrypal.com/privacy',
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent, 
    color 
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    color: string;
  }) => (
    <TouchableOpacity style={[styles.settingItem, { backgroundColor: currentTheme.colors.surface }]} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Icon size={20} color={color} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: currentTheme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: currentTheme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (onPress && <ChevronRight size={20} color={currentTheme.colors.textTertiary} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <LinearGradient
        colors={currentTheme.gradients.primary as [ColorValue, ColorValue]}
        start={[0, 0]}
        end={[1, 1]}
        locations={[0, 0.8]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <SettingsIcon size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your Pantry Pal experience</Text>
        </View>
      </LinearGradient>

      <ScrollView style={[styles.content, { backgroundColor: currentTheme.colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Account</Text>
          <View style={styles.sectionCard}>
            {isAuthenticated ? (
              <>
                <SettingItem
                  icon={User}
                  title={user?.displayName || 'User Profile'}
                  subtitle={user?.email}
                  color="#3B82F6"
                  onPress={() => {/* Navigate to profile */}}
                />
                <View style={[styles.separator, { backgroundColor: currentTheme.colors.border }]} />
                <SettingItem
                  icon={Database}
                  title="Sync Data"
                  subtitle="Backup and sync across devices"
                  color="#10B981"
                  onPress={() => Alert.alert('Sync', 'Data sync is enabled for your account')}
                />
                <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                <SettingItem
                  icon={Shield}
                  title="Account Security"
                  subtitle="Manage password and security"
                  color="#8B5CF6"
                  onPress={() => Alert.alert('Security', 'Account security settings')}
                />
                <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                <SettingItem
                  icon={LogOut}
                  title="Sign Out"
                  subtitle="Sign out of your account"
                  color="#EF4444"
                  onPress={handleSignOut}
                />
              </>
            ) : (
              <SettingItem
                icon={User}
                title="Sign In / Sign Up"
                subtitle="Sync your data across devices"
                color="#3B82F6"
                onPress={() => setShowAuthModal(true)}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>AI Features</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={Brain}
              title="AI API Key"
              subtitle="Configure your own AI service key"
              color="#8B5CF6"
              onPress={() => setShowApiKeyInput(true)}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Preferences</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={Bell}
              title="Notifications"
              subtitle="Get alerts for expiring items"
              color="#F59E0B"
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.success }}
                  thumbColor={notificationsEnabled ? '#FFFFFF' : '#F3F4F6'}
                />
              }
            />
            <View style={[styles.separator, { backgroundColor: currentTheme.colors.border }]} />
            <SettingItem
              icon={Moon}
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              color="#6366F1"
              rightComponent={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.success }}
                  thumbColor={isDark ? '#FFFFFF' : '#F3F4F6'}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Data</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={Database}
              title="Backup Data"
              subtitle="Export your pantry data"
              color="#3B82F6"
              onPress={() => Alert.alert('Coming Soon', 'Data backup feature will be available in a future update.')}
            />
            <View style={[styles.separator, { backgroundColor: currentTheme.colors.border }]} />
            <SettingItem
              icon={Trash2}
              title="Clear All Data"
              subtitle="Delete all items and lists"
              color="#EF4444"
              onPress={handleClearAllData}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Support</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={Shield}
              title="Privacy Policy"
              subtitle="How we protect your data"
              color="#10B981"
              onPress={handlePrivacy}
            />
            <View style={[styles.separator, { backgroundColor: currentTheme.colors.border }]} />
            <SettingItem
              icon={Info}
              title="About"
              subtitle="App version and information"
              color="#8B5CF6"
              onPress={handleAbout}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: currentTheme.colors.textSecondary }]}>
            Made with ❤️ for better food management
          </Text>
          <Text style={[styles.versionText, { color: currentTheme.colors.textTertiary }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* AI API Key Input Modal */}
      {showApiKeyInput && (
        <View style={styles.modalOverlay}>
          <View style={[styles.apiKeyModal, { backgroundColor: currentTheme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
              AI API Key
            </Text>
            <Text style={[styles.modalSubtitle, { color: currentTheme.colors.textSecondary }]}>
              Enter your OpenAI, Google Vision, or other AI service API key for enhanced food recognition.
            </Text>
            <TextInput
              style={[styles.apiKeyInput, { 
                backgroundColor: currentTheme.colors.background,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text
              }]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-..."
              placeholderTextColor={currentTheme.colors.textTertiary}
              secureTextEntry
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { borderColor: currentTheme.colors.border }]}
                onPress={() => {
                  setShowApiKeyInput(false);
                  setApiKey('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveApiKey}
              >
                <LinearGradient
                  colors={currentTheme.gradients.primary as [ColorValue, ColorValue]}
                  style={styles.modalButtonGradient}
                > 
                  <Text style={styles.modalButtonPrimaryText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 68,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 16,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  apiKeyModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});