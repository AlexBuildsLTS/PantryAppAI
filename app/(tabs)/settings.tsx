/**
 * @file settings.tsx
 * @description Master AAA+ Tier Command Center & Identity Hub.
 * * ARCHITECTURAL MODULES:
 * 1. IDENTITY ORCHESTRATION: Maps user profile metadata with high-fidelity fallback logic.
 * 2. HOUSEHOLD SYNC ENGINE: Generates real-time QR tokens for synchronized supply tracking.
 * 3. HARDWARE SECURITY BRIDGE: Binds system switches to native Biometric hardware.
 * 4. DYNAMIC THEME ENGINE: Synchronizes layered depth and shadow tokens across mode swaps.
 * 5. SESSION TERMINATION: Implements the 'Hard Guard' logout protocol with warning feedback.
 */

/* cspell:disable-next-line */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInUp,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

// Internal System Contexts & Services
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { BiometricService } from '../../services/BiometricService';

export default function SettingsScreen() {
  const { colors, shadows, isDark, toggleTheme } = useTheme();
  const { profile, user, household, signOut } = useAuth();

  // Local hardware-link state
  const [bioEnabled, setBioEnabled] = useState(true);
  const [showQR, setShowQR] = useState(false);

  /**
   * MODULE 1: SECURITY HANDOVER
   * Description: Executes a hardware-backed challenge via 'BiometricService'.
   */
  const handleBiometricToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await BiometricService.authenticate();
    if (success) {
      setBioEnabled(!bioEnabled);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  /**
   * MODULE 2: SESSION TERMINATION
   * Description: Ends the secure session with Haptic warning feedback.
   */
  const handleSignOut = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Secure Session',
      'Are you sure you want to end your session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  /**
   * MODULE 3: DYNAMIC BENTO STYLING
   * Description: Combines Context colors with the Layered Depth Shadow Engine.
   */
  const cardStyle = useMemo(
    () => [
      styles.bentoGroup,
      { backgroundColor: colors.surface, borderColor: colors.border },
      !isDark && shadows.medium,
    ],
    [colors, isDark, shadows]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* MODULE 4: ELITE IDENTITY ARCHITECTURE 
            Description: Maps user profile and avatar data with dynamic fallbacks.
        */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[
            styles.profileCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            !isDark && shadows.medium,
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  profile?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${
                    profile?.full_name || 'U'
                  }&background=22C55E&color=fff`,
              }}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={[styles.cameraBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="camera" size={12} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profile?.full_name || 'Chef Member'}
            </Text>
            <Text
              style={[styles.profileEmail, { color: colors.textSecondary }]}
            >
              {user?.email}
            </Text>
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Text style={[styles.tierText, { color: colors.primary }]}>
                {profile?.role?.toUpperCase() || 'MEMBER'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* MODULE 5: HOUSEHOLD ORCHESTRATION 
            Description: Generates sharing tokens for real-time inventory synchronization.
        */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          HOUSEHOLD SYNC
        </Text>
        <View style={cardStyle}>
          <TouchableOpacity
            style={styles.householdHeader}
            onPress={() => {
              setShowQR(!showQR);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#8B5CF615' }]}>
                <MaterialCommunityIcons
                  name="home-group"
                  size={22}
                  color="#8B5CF6"
                />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {household?.name || 'Active Household'}
                </Text>
                <Text
                  style={[styles.rowSubLabel, { color: colors.textSecondary }]}
                >
                  Tap to reveal invite QR
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name={showQR ? 'chevron-up' : 'qrcode'}
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>

          {showQR && (
            <Animated.View
              entering={FadeInUp}
              layout={Layout.springify()}
              style={styles.qrContainer}
            >
              <View
                style={[
                  styles.qrWrapper,
                  { borderColor: colors.border },
                  !isDark && shadows.small,
                ]}
              >
                <QRCode
                  value={`pantrypal://join/${household?.id}`}
                  size={160}
                  backgroundColor="white"
                  color="black"
                />
              </View>
              <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
                Synchronize family inventory across all devices.
              </Text>
            </Animated.View>
          )}
        </View>

        {/* MODULE 6: SYSTEM CONFIGURATION PREFERENCES 
            Description: Real-time appearance and hardware security orchestration.
        */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          SYSTEM PREFERENCES
        </Text>
        <View style={cardStyle}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Feather name="moon" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                Dark Appearance
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => {
                Haptics.selectionAsync();
                toggleTheme();
              }}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#10B98115' }]}>
                <Feather name="shield" size={18} color="#10B981" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                Biometric Security
              </Text>
            </View>
            <Switch
              value={bioEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ true: '#10B981' }}
            />
          </View>
        </View>

        {/* MODULE 7: DANGER ZONE ORCHESTRATION */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[
            styles.logoutBtn,
            {
              borderColor: colors.error + '40',
              backgroundColor: colors.surface,
            },
            !isDark && shadows.small,
          ]}
        >
          <Feather name="power" size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            End Secure Session
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Pantry Pal Enterprise • Build 2026.1.9{'\n'}Hardware-Backed Encryption
        </Text>
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  profileCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  profileInfo: { marginLeft: 20, flex: 1 },
  profileName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  profileEmail: { fontSize: 13, marginTop: 2, fontWeight: '600', opacity: 0.5 },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  tierText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 8,
  },
  bentoGroup: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  householdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowLabel: { fontSize: 16, fontWeight: '700' },
  rowSubLabel: { fontSize: 12, fontWeight: '500', opacity: 0.5, marginTop: 2 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: { height: 1, marginHorizontal: 20 },
  qrContainer: { alignItems: 'center', padding: 32, paddingTop: 0 },
  qrWrapper: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 28,
    borderWidth: 1,
  },
  qrHint: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 18,
    fontWeight: '600',
  },
  logoutBtn: {
    height: 64,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '800' },
  footerText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.3,
    lineHeight: 16,
  },
});
