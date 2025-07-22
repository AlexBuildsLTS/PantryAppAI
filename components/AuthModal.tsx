import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ visible, onClose, initialMode = 'signin' }: AuthModalProps) {
  const { theme } = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { execute: executeAsync, isLoading } = useAsyncOperation();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (mode === 'signup' && !displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    const result = await executeAsync(async () => {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
    }, mode === 'signin' ? 'Signing in' : 'Creating account');

    if (result.success) {
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setShowPassword(false);
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={20} style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {mode === 'signin' 
                  ? 'Sign in to sync your pantry across devices'
                  : 'Join Pantry Pal to save your data and sync across devices'
                }
              </Text>

              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Full Name</Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <User size={20} color={theme.colors.textTertiary} />
                    <TextInput
                      style={[styles.input, { color: theme.colors.text }]}
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Enter your full name"
                      placeholderTextColor={theme.colors.textTertiary}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Mail size={20} color={theme.colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Lock size={20} color={theme.colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color={theme.colors.textTertiary} />
                    ) : (
                      <Eye size={20} color={theme.colors.textTertiary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, { opacity: isLoading ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={isLoading}
                  >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.submitGradient}
                >   
                  <Text style={styles.submitText}>
                    {isLoading 
                      ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...') 
                      : (mode === 'signin' ? 'Sign In' : 'Create Account')
                    }
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.switchContainer}>
                <Text style={[styles.switchText, { color: theme.colors.textSecondary }]}>
                  {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                </Text>
                <TouchableOpacity onPress={switchMode}>
                  <Text style={[styles.switchLink, { color: theme.colors.primary }]}>
                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.disclaimer, { color: theme.colors.textTertiary }]}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
                Your data is encrypted and secure.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  switchText: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});