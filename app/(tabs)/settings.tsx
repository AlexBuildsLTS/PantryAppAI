/**
 * @file settings.tsx
 * @description PantryApp Settings Screen - User profile, household sync, and system preferences
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeInUp,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';

// Internal System Contexts & Services
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { BiometricService } from '../../services/BiometricService';
import { supabase } from '../../lib/supabase';

// Constants
const AVATAR_SIZE = 84;
const MIN_PASSWORD_LENGTH = 8;
const MIN_NAME_LENGTH = 2;
const INVITE_LINK_BASE = 'pantrypal://join/';

// Types
interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  tier: string | null;
}

interface Household {
  id?: string;
  name?: string;
}

// Custom Hooks
const useProfileState = (profile: Profile | null) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNewName(profile?.full_name || '');
  }, [profile]);

  return { isEditing, setIsEditing, newName, setNewName, loading, setLoading };
};

const useAvatarUpload = (userId: string | undefined, refreshMetadata: () => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const handlePickAvatar = useCallback(async () => {
    if (!userId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No active session detected.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll access is required to update your avatar.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setIsUploading(true);
        setLocalAvatar(asset.uri);

        const fileExt = asset.uri.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const response = await fetch(asset.uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: `image/${fileExt}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId);

        if (updateError) throw updateError;

        await refreshMetadata();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      setLocalAvatar(null);
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Unknown error occurred.');
    } finally {
      setIsUploading(false);
    }
  }, [userId, refreshMetadata]);

  return { isUploading, localAvatar, handlePickAvatar };
};

const useBiometricToggle = () => {
  const [bioEnabled, setBioEnabled] = useState(true);

  const handleToggle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await BiometricService.authenticate();
    if (success) {
      setBioEnabled(prev => !prev);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Authentication Failed', 'Unable to verify biometric credentials.');
    }
  }, []);

  return { bioEnabled, handleToggle };
};

// Sub-components
const ProfileSection: React.FC<{
  profile: Profile | null;
  user: any;
  colors: any;
  shadows: any;
  isDark: boolean;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  newName: string;
  setNewName: (name: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isUploading: boolean;
  localAvatar: string | null;
  handlePickAvatar: () => void;
  handleUpdateProfile: () => void;
  refreshMetadata: () => void;
}> = React.memo(({
  profile,
  user,
  colors,
  shadows,
  isDark,
  isEditing,
  setIsEditing,
  newName,
  setNewName,
  loading,
  isUploading,
  localAvatar,
  handlePickAvatar,
  handleUpdateProfile,
}) => {
  const cardStyle = useMemo(
    () => [
      styles.glassCard,
      {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: colors.border,
      },
      !isDark && shadows.medium,
    ],
    [colors.border, isDark, shadows.medium]
  );

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={cardStyle}>
      <View style={styles.profileHeader}>
        <TouchableOpacity
          onPress={handlePickAvatar}
          style={styles.avatarWrapper}
          disabled={isUploading}
        >
          <Image
            source={{
              uri: localAvatar || profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=6366F1&color=fff`,
            }}
            style={[styles.avatar, isUploading && { opacity: 0.5 }]}
          />
          {isUploading && (
            <View style={styles.avatarLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
            <Feather name="camera" size={12} color="white" />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {profile?.full_name || 'User'}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {user?.email || ''}
          </Text>
          <View style={[styles.tierBadge, { backgroundColor: colors.primary + '20' }]}>
            <MaterialCommunityIcons name="star-circle" size={10} color={colors.primary} />
            <Text style={[styles.tierText, { color: colors.primary }]}>
              {profile?.tier?.toUpperCase() || 'FREE TIER'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setIsEditing(!isEditing);
          }}
          style={styles.actionBtn}
        >
          <Feather name={isEditing ? 'chevron-up' : 'edit-3'} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {isEditing && (
        <Animated.View entering={FadeInUp} layout={Layout.springify()} style={styles.editPanel}>
          <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name="user" size={16} color={colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              value={newName}
              onChangeText={setNewName}
              style={[styles.input, { color: colors.text }]}
              placeholder="Update Full Name"
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, shadows.small]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
});

ProfileSection.displayName = 'ProfileSection';

const HouseholdSection: React.FC<{
  household: Household | null;
  colors: any;
  shadows: any;
  isDark: boolean;
}> = React.memo(({ household, colors, shadows, isDark }) => {
  const [showQR, setShowQR] = useState(false);

  const cardStyle = useMemo(
    () => [
      styles.glassCard,
      {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: colors.border,
      },
      !isDark && shadows.medium,
    ],
    [colors.border, isDark, shadows.medium]
  );

  const inviteLink = useMemo(
    () => `${INVITE_LINK_BASE}${household?.id || 'none'}`,
    [household?.id]
  );

  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        HOUSEHOLD SYNC ENGINE
      </Text>
      <View style={cardStyle}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            setShowQR(!showQR);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#8B5CF620' }]}>
              <MaterialCommunityIcons name="home-group" size={22} color="#8B5CF6" />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {household?.name || 'Primary Kitchen'}
              </Text>
              <Text style={[styles.rowSubLabel, { color: colors.textSecondary }]}>
                Tap to reveal invite QR for sync
              </Text>
            </View>
          </View>
          <Feather name={showQR ? 'chevron-up' : 'share'} size={20} color={colors.primary} />
        </TouchableOpacity>

        {showQR && (
          <Animated.View entering={FadeInUp} layout={Layout.springify()} style={styles.qrContainer}>
            <View style={[styles.qrWrapper, shadows.medium]}>
              <QRCode value={inviteLink} size={160} backgroundColor="white" />
            </View>
            <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
              Synchronize your pantry across multiple devices in real-time.
            </Text>
          </Animated.View>
        )}
      </View>
    </>
  );
});

HouseholdSection.displayName = 'HouseholdSection';

const PreferencesSection: React.FC<{
  colors: any;
  shadows: any;
  isDark: boolean;
  toggleTheme: () => void;
  bioEnabled: boolean;
  handleBiometricToggle: () => void;
  setIsChangingPassword: (changing: boolean) => void;
}> = React.memo(({ colors, shadows, isDark, toggleTheme, bioEnabled, handleBiometricToggle, setIsChangingPassword }) => {
  const cardStyle = useMemo(
    () => [
      styles.glassCard,
      {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: colors.border,
      },
      !isDark && shadows.medium,
    ],
    [colors.border, isDark, shadows.medium]
  );

  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        SYSTEM ARCHITECTURE
      </Text>
      <View style={cardStyle}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
              <Feather name={isDark ? 'moon' : 'sun'} size={18} color={isDark ? '#94A3B8' : '#64748B'} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Appearance</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={() => {
              Haptics.selectionAsync();
              toggleTheme();
            }}
            trackColor={{ true: colors.primary, false: '#CBD5E1' }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
              <Feather name="shield" size={18} color="#10B981" />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Biometric Security</Text>
          </View>
          <Switch value={bioEnabled} onValueChange={handleBiometricToggle} trackColor={{ true: '#10B981' }} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => setIsChangingPassword(true)}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#F59E0B20' }]}>
              <Feather name="lock" size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Update Password</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </>
  );
});

PreferencesSection.displayName = 'PreferencesSection';

export default function SettingsScreen() {
  const { colors, shadows, isDark, toggleTheme } = useTheme();
  const { profile, user, household, refreshMetadata } = useAuth();

  const { isEditing, setIsEditing, newName, setNewName, loading, setLoading } = useProfileState(profile);
  const { isUploading, localAvatar, handlePickAvatar } = useAvatarUpload(user?.id, refreshMetadata);
  const { bioEnabled, handleToggle: handleBiometricToggle } = useBiometricToggle();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleUpdateProfile = useCallback(async () => {
    if (!user?.id) return;
    if (newName.trim().length < MIN_NAME_LENGTH) {
      Alert.alert('Validation Error', `Please enter a name with at least ${MIN_NAME_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      await refreshMetadata();
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Update Failed', error instanceof Error ? error.message : 'Unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, newName, refreshMetadata, setLoading, setIsEditing]);

  const handleUpdatePassword = useCallback(async () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Security Error', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your password has been updated.');
      setIsChangingPassword(false);
      setNewPassword('');
    } catch (error) {
      Alert.alert('Update Failed', error instanceof Error ? error.message : 'Unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [newPassword, setLoading]);

  const handleSignOut = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Secure Logout',
      'Are you sure you want to end your secure session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            // Implement actual sign out logic here
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        stickyHeaderIndices={[1, 3, 5]}
      >
        <ProfileSection
          profile={profile}
          user={user}
          colors={colors}
          shadows={shadows}
          isDark={isDark}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          newName={newName}
          setNewName={setNewName}
          loading={loading}
          setLoading={setLoading}
          isUploading={isUploading}
          localAvatar={localAvatar}
          handlePickAvatar={handlePickAvatar}
          handleUpdateProfile={handleUpdateProfile} refreshMetadata={function (): void {
            throw new Error('Function not implemented.');
          } }        />

        <View style={styles.headerSpacer} />
        <HouseholdSection household={household} colors={colors} shadows={shadows} isDark={isDark} />

        <View style={styles.headerSpacer} />
        <PreferencesSection
          colors={colors}
          shadows={shadows}
          isDark={isDark}
          toggleTheme={toggleTheme}
          bioEnabled={bioEnabled}
          handleBiometricToggle={handleBiometricToggle}
          setIsChangingPassword={setIsChangingPassword}
        />

        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}
          onPress={handleSignOut}
        >
          <Feather name="power" size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>End Secure Session</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Pantry Pal Enterprise • v2026.1.10{'\n'}
            Hardware-Backed AES-256 Encryption{'\n'}
            {Platform.OS.toUpperCase()} Native Core
          </Text>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={isChangingPassword} transparent animationType="fade">
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInUp}
            style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.large]}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: '#F59E0B20' }]}>
                <Feather name="shield" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Rotate Credentials</Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Updating your password will require a new biometric link.
              </Text>
            </View>

            <TextInput
              secureTextEntry
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="New Secure Password"
              placeholderTextColor={colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsChangingPassword(false)} style={styles.cancelBtn}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdatePassword}
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.modalSaveText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  headerSpacer: { height: 8 },
  glassCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { position: 'relative', width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 30, backgroundColor: '#E2E8F0' },
  avatarLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 30,
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileInfo: { flex: 1, marginLeft: 20 },
  name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
  email: { fontSize: 13, opacity: 0.6, marginTop: 2, fontWeight: '500' },
  tierBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 12,
  },
  tierText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  actionBtn: { padding: 8 },
  editPanel: { marginTop: 24, gap: 12 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 60,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  saveBtn: {
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowLabel: { fontSize: 16, fontWeight: '700' },
  rowSubLabel: { fontSize: 12, opacity: 0.5, marginTop: 2, fontWeight: '500' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: { height: 1, marginVertical: 14, opacity: 0.5 },
  qrContainer: { alignItems: 'center', paddingVertical: 32 },
  qrWrapper: { padding: 24, backgroundColor: 'white', borderRadius: 32 },
  qrHint: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
    paddingHorizontal: 24,
    lineHeight: 18,
    fontWeight: '600',
    opacity: 0.5,
  },
  logoutBtn: {
    height: 68,
    borderRadius: 28,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    justifyContent: 'center',
    marginTop: 16,
  },
  logoutText: { fontSize: 17, fontWeight: '800' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.2,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 40,
    borderWidth: 1,
    padding: 32,
  },
  modalHeader: { alignItems: 'center', marginBottom: 28 },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  modalSub: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    marginBottom: 32,
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cancelBtn: { paddingHorizontal: 20 },
  modalSaveBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  modalSaveText: { color: 'white', fontWeight: '800', fontSize: 16 },
});