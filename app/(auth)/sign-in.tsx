/**
 * @file sign-in.tsx
 * @description AAA+ Tier Glassmorphic Sign-In.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, shadows, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your credentials.');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      Alert.alert('Auth Error', error.message);
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.branding}>
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: colors.primary },
              shadows.medium,
            ]}
          >
            <Ionicons name="fast-food" size={40} color="white" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Pantry Pal</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enterprise Inventory Management
          </Text>
        </View>

        <BlurView
          intensity={isDark ? 40 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.glassCard, { borderColor: colors.border }]}
        >
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              EMAIL
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                placeholder="chef@pantrypal.ai"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text }]}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              PASSWORD
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text }]}
                secureTextEntry
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              shadows.medium,
              loading && { opacity: 0.8 },
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </BlurView>

        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={{ color: colors.textSecondary }}>
              New here?{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                Create an Account
              </Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  branding: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 16, marginTop: 4 },
  glassCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  primaryButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  footerLink: { marginTop: 32, alignItems: 'center' },
});
