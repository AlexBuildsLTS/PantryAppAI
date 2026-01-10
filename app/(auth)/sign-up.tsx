/**
 * @file sign-up.tsx
 * @description AAA+ Tier Registration with Metadata Sync.
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors, shadows, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);

    if (error) {
      Alert.alert('Registration Error', error.message);
      setLoading(false);
    } else {
      Alert.alert('Success', 'Check your email for the verification link.');
      router.replace('/(auth)/sign-in');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Join Pantry Pal
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Start your organized culinary journey.
            </Text>
          </View>

          <BlurView
            intensity={isDark ? 40 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.glassCard, { borderColor: colors.border }]}
          >
            {[
              {
                label: 'FULL NAME',
                icon: 'person-outline',
                placeholder: 'John Doe',
                value: fullName,
                setter: setFullName,
              },
              {
                label: 'EMAIL',
                icon: 'mail-outline',
                placeholder: 'chef@pantry.ai',
                value: email,
                setter: setEmail,
                type: 'email-address',
              },
              {
                label: 'PASSWORD',
                icon: 'lock-closed-outline',
                placeholder: '••••••••',
                value: password,
                setter: setPassword,
                secure: true,
              },
            ].map((field, idx) => (
              <View key={idx} style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {field.label}
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
                    name={field.icon as any}
                    size={20}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text }]}
                    value={field.value}
                    onChangeText={field.setter}
                    secureTextEntry={field.secure}
                    keyboardType={field.type as any}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                shadows.medium,
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Generating Vault...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  header: { marginBottom: 32, marginTop: 40 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 16, marginTop: 6 },
  glassCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: '800', marginBottom: 6, letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  primaryButton: {
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
