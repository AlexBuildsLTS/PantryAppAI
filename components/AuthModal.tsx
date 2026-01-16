import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AuthModal({ visible, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, name);

      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      Alert.alert('Auth Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={50} className="justify-center flex-1 px-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="bg-surface p-8 rounded-[40px] border border-white/10 shadow-2xl">
            <Text className="mb-2 text-3xl font-bold text-white">
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </Text>
            <Text className="mb-8 text-text-tertiary">
              {isLogin
                ? 'Sign in to sync your pantry'
                : 'Create an account to start tracking'}
            </Text>
            

            {!isLogin && (
              <AuthInput
                icon="user"
                placeholder="Full Name"
                value={name}
                onChange={setName}
              />
            )}
            <AuthInput
              icon="mail"
              placeholder="Email"
              value={email}
              onChange={setEmail}
              keyboardType="email-address"
            />
            <AuthInput
              icon="lock"
              placeholder="Password"
              value={password}
              onChange={setPassword}
              secure
            />

            <TouchableOpacity
              onPress={handleAuth}
              className="items-center justify-center mt-4 shadow-lg bg-primary h-14 rounded-2xl shadow-primary/30"
            >
              <Text className="text-lg font-bold text-white">
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              className="self-center mt-6"
            >
              <Text className="text-text-tertiary">
                {isLogin ? "Don't have an account? " : 'Already registered? '}
                <Text className="font-bold text-primary">Switch</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const AuthInput = ({
  icon,
  placeholder,
  value,
  onChange,
  secure,
  ...props
}: any) => (
  <View className="flex-row items-center px-4 mb-4 border bg-background h-14 rounded-2xl border-white/5">
    <Feather name={icon} size={18} color="#64748B" />
    <TextInput
      className="flex-1 ml-3 text-white"
      placeholder={placeholder}
      placeholderTextColor="#64748B"
      value={value}
      onChangeText={onChange}
      secureTextEntry={secure}
      {...props}
    />
  </View>
);
