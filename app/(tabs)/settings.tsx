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
  SafeAreaView,
  Linking
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PantryDatabase } from '@/database/PantryDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { AIService } from '@/services/AIService';
import { lightTheme, darkTheme } from '@/styles/themes';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, useAnimatedScrollHandler, interpolate, Extrapolate } from 'react-native-reanimated';

// Reusable Animated Setting Item Component
const SettingItem = ({ iconName, title, subtitle, onPress, rightComponent, color, iconSet = 'Feather' }: { iconName: any; title: string; subtitle?: string; onPress?: () => void; rightComponent?: React.ReactNode; color: string; iconSet?: 'Feather' | 'MaterialCommunityIcons' }) => {
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

  const handlePressIn = () => { if (onPress) scale.value = withSpring(0.98); };
  const handlePressOut = () => { scale.value = withSpring(1); };

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
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}><Icon name={iconName} size={20} color={color} /></View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
          </View>
        </View>
        {rightComponent || (onPress && <Feather name="chevron-right" size={20} color={theme.colors.textTertiary} />)}
      </TouchableOpacity>
    </Animated.View>
  );
};


export default function SettingsScreen() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { theme, toggleTheme, isDark } = useTheme();
  const currentTheme = isDark ? darkTheme : lightTheme;

  // Animation values
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (event) => { scrollY.value = event.contentOffset.y; } });
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 100], [150, 90], Extrapolate.CLAMP),
  }));
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [20, 70], [1, 0], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(scrollY.value, [0, 100], [1, 0.8], Extrapolate.CLAMP) }],
  }));

  // Handlers
  const handleSignOut = () => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Sign Out', style: 'destructive', onPress: signOut }]);
  const handleClearData = () => Alert.alert('Clear All Data', 'This is permanent.', [{ text: 'Cancel' }, { text: 'Clear All', style: 'destructive', onPress: async () => { await PantryDatabase.clearAllData(); Alert.alert('Success', 'All data has been cleared.'); }}]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <Animated.View style={[styles.header, animatedHeaderStyle]}>
        <LinearGradient colors={currentTheme.gradients.primary as any} style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[styles.headerContent, animatedTitleStyle]}>
          <Feather name="settings" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Account</Text>
          <View style={styles.sectionCard}>
            {isAuthenticated ? (
              <>
                <SettingItem iconName="user" title={user?.displayName || 'User Profile'} subtitle={user?.email} color="#3B82F6" />
                <SettingItem iconName="database" title="Sync Data" subtitle="Backup and sync" color="#10B981" />
                <SettingItem iconName="shield" title="Account Security" subtitle="Manage password" color="#8B5CF6" />
                <SettingItem iconName="log-out" title="Sign Out" color="#EF4444" onPress={handleSignOut} />
              </>
            ) : <SettingItem iconName="user" title="Sign In / Sign Up" subtitle="Sync your data" color="#3B82F6" onPress={() => setShowAuthModal(true)} />}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Preferences</Text>
          <View style={styles.sectionCard}>
            <SettingItem iconName="bell" title="Notifications" subtitle="Expiration alerts" color="#F59E0B" rightComponent={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }} thumbColor={'#FFFFFF'} />} />
            <SettingItem iconName="moon" title="Dark Mode" subtitle="Switch themes" color="#6366F1" rightComponent={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }} thumbColor={'#FFFFFF'} />} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Community & Support</Text>
          <View style={styles.sectionCard}>
            <SettingItem iconName="discord" iconSet="MaterialCommunityIcons" title="Join our Discord" color="#5865F2" onPress={() => Linking.openURL('https://discord.gg/your-invite')} />
            <SettingItem iconName="twitter" title="Follow on X" color="#1DA1F2" onPress={() => Linking.openURL('https://twitter.com/YourApp')} />
            <SettingItem iconName="help-circle" title="Help & FAQ" color="#34D399" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Developer</Text>
          <View style={styles.sectionCard}>
            <SettingItem iconName="brain" iconSet="MaterialCommunityIcons" title="AI API Key" subtitle="Configure your AI service key" color="#8B5CF6" onPress={() => setShowApiKeyInput(true)} />
            <SettingItem iconName="trash-2" title="Clear All Data" subtitle="Reset the application state" color="#EF4444" onPress={handleClearData} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: currentTheme.colors.textTertiary }]}>Pantry Pal Version 1.0.0</Text>
        </View>
      </Animated.ScrollView>

      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, },
  header: { justifyContent: 'center', alignItems: 'center' },
  headerContent: { alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  content: { paddingTop: 24, paddingHorizontal: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginLeft: 4 },
  sectionCard: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingSubtitle: { fontSize: 14, marginTop: 2 },
  footer: { alignItems: 'center', paddingVertical: 32 },
  versionText: { fontSize: 14 },
});