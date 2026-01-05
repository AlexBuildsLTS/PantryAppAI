/**
 * @file settings.tsx
 * @description AAA+ Tier Command Center for Pantry Pal.
 * Features: Profile Orchestration, Household QR Sharing, Security Gates,
 * and System Preferences with high-fidelity haptics.
 * @author Pantry Pal Engineering
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

// Internal Systems
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * @component BentoMenuItem
 * High-fidelity menu row with internal state support.
 */
const BentoMenuItem = ({
  icon,
  label,
  subLabel,
  value,
  onToggle,
  type = 'toggle',
  onPress,
  color,
}: any) => {
  const { colors } = useTheme();

  const content = (
    <View style={styles.menuItemInner}>
      <View style={styles.menuLeft}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: (color || colors.primary) + '15' },
          ]}
        >
          <Feather name={icon} size={20} color={color || colors.primary} />
        </View>
        <View>
          <Text style={[styles.menuText, { color: colors.text }]}>{label}</Text>
          {subLabel && (
            <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
              {subLabel}
            </Text>
          )}
        </View>
      </View>
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={(val) => {
            Haptics.selectionAsync();
            onToggle(val);
          }}
          trackColor={{ false: colors.border, true: color || colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
        />
      ) : (
        <Feather name="chevron-right" size={18} color={colors.border} />
      )}
    </View>
  );

  if (type === 'link') {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.menuItemWrapper}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.menuItemWrapper}>{content}</View>;
};

export default function SettingsScreen() {
  // Fixed: 'isDark' is assumed to be added to ThemeContext as per previous fix
  const { colors, mode, toggleTheme } = useTheme();
  const isDark = mode === 'dark';

  const { user, profile, household, signOut } = useAuth();

  // Local UX State
  const [showQR, setShowQR] = useState(false);
  const [biometrics, setBiometrics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [aiCategorize, setAiCategorize] = useState(true);

  const handleSignOut = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Terminating Session', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  const handleSupport = () => {
    Linking.openURL('mailto:support@pantrypal.ai');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Fixed: Removed 'layout' prop from ScrollView (not valid) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. ELITE PROFILE CARD */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[
            styles.profileCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  profile?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${
                    profile?.full_name || 'User'
                  }&background=6366f1&color=fff`,
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
            <Text style={[styles.userName, { color: colors.text }]}>
              {profile?.full_name || 'Chef Member'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
            <View
              style={[styles.badge, { backgroundColor: colors.primary + '15' }]}
            >
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {profile?.role?.toUpperCase() || 'MEMBER'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 2. HOUSEHOLD SYNC */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          HOUSEHOLD ORCHESTRATION
        </Text>
        <View
          style={[
            styles.bentoGroup,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.householdHeader}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowQR(!showQR);
            }}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#8B5CF615' }]}>
                <MaterialCommunityIcons
                  name="home-group"
                  size={22}
                  color="#8B5CF6"
                />
              </View>
              <View>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {household?.name || 'Active Household'}
                </Text>
                <Text
                  style={[styles.menuSubtext, { color: colors.textSecondary }]}
                >
                  Tap to reveal invite QR
                </Text>
              </View>
            </View>
            {/* Fixed: 'qr-code' is not a Feather icon, using 'grid' or Material version */}
            <MaterialCommunityIcons
              name={showQR ? 'chevron-up' : 'qrcode'}
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>

          {showQR && (
            <Animated.View entering={FadeInUp} style={styles.qrContent}>
              <View style={[styles.qrWrapper, { borderColor: colors.border }]}>
                <QRCode
                  value={`pantrypal://join/${household?.id}`}
                  size={180}
                  backgroundColor="white"
                  color="black"
                />
              </View>
              <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
                Let a family member scan this to sync their pantry with yours
                instantly.
              </Text>
            </Animated.View>
          )}
        </View>

        {/* 3. SYSTEM CONFIGURATION */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          SYSTEM PREFERENCES
        </Text>
        <View
          style={[
            styles.bentoGroup,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <BentoMenuItem
            icon="moon"
            label="Dark Appearance"
            subLabel="Optimized for OLED black"
            value={isDark}
            onToggle={toggleTheme}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <BentoMenuItem
            icon="shield"
            label="Biometric Security"
            subLabel="FaceID / TouchID"
            value={biometrics}
            onToggle={setBiometrics}
            color="#10B981"
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <BentoMenuItem
            icon="bell"
            label="Push Intelligence"
            subLabel="Expiry alerts & AI tips"
            value={notifications}
            onToggle={setNotifications}
            color="#F59E0B"
          />
        </View>

        {/* 4. AI ENGINE SETTINGS */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          AI ENGINE SETTINGS
        </Text>
        <View
          style={[
            styles.bentoGroup,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <BentoMenuItem
            icon="cpu"
            label="Auto-Categorize"
            subLabel="Gemini vision tagging"
            value={aiCategorize}
            onToggle={setAiCategorize}
            color={colors.primary}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <BentoMenuItem
            type="link"
            icon="mail"
            label="AI Feedback Loop"
            subLabel="Report misidentified items"
            onPress={handleSupport}
            color="#64748B"
          />
        </View>

        {/* 5. SESSION TERMINATION */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.logoutBtn, { borderColor: colors.error + '40' }]}
          onPress={handleSignOut}
        >
          <Feather name="power" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            End Secure Session
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Pantry Pal Enterprise • Build 2026.1.5{'\n'}
          Encrypted End-to-End
        </Text>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  profileCard: {
    flexDirection: 'row',
    padding: 24,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
    }),
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
    borderColor: '#0A0A0A',
  },
  profileInfo: { marginLeft: 20, flex: 1 },
  userName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  userEmail: { fontSize: 13, marginTop: 2, fontWeight: '500', opacity: 0.6 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  sectionLabel: {
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
    marginBottom: 32,
  },
  menuItemWrapper: { paddingVertical: 4 },
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { fontSize: 16, fontWeight: '700' },
  menuSubtext: { fontSize: 12, marginTop: 2, fontWeight: '500', opacity: 0.5 },
  divider: { height: 1, marginHorizontal: 20 },
  householdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  qrContent: { alignItems: 'center', padding: 32, paddingTop: 0 },
  qrWrapper: {
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 28,
    borderWidth: 1,
  },
  qrHint: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  logoutBtn: {
    height: 68,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '800' },
  footerText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 32,
    opacity: 0.3,
  },
});
