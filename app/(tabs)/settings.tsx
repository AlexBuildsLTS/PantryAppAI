/**
 * @module SettingsScreen
 * Command center for account management and system preferences.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const { mode, toggleTheme } = useTheme();

  return (
    <ScrollView className="flex-1 bg-[#0A0A0A] px-6 pt-16">
      <Text className="mb-8 text-3xl font-black text-white">Settings</Text>

      {/* USER PROFILE BENTO CARD */}
      <View className="bg-surface p-6 rounded-[40px] border border-white/5 flex-row items-center mb-8">
        <View className="items-center justify-center w-16 h-16 rounded-full bg-primary/20">
          <Text className="text-2xl font-bold text-primary">
            {user?.email?.[0].toUpperCase()}
          </Text>
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-xl font-bold text-white" numberOfLines={1}>
            {profile?.full_name || 'Premium Member'}
          </Text>
          <Text className="text-xs tracking-tighter uppercase text-text-tertiary">
            {user?.email}
          </Text>
        </View>
      </View>

      <Text className="text-white/30 font-bold uppercase text-[10px] tracking-widest ml-4 mb-4">
        Preferences
      </Text>
      <View className="bg-surface rounded-[35px] border border-white/5 overflow-hidden mb-8">
        <SettingToggle
          icon="moon"
          label="Dark Appearance"
          value={mode === 'dark'}
          onToggle={toggleTheme}
        />
        <SettingToggle
          icon="bell"
          label="Push Notifications"
          value={true}
          onToggle={() => {}}
        />
      </View>

      <Text className="text-white/30 font-bold uppercase text-[10px] tracking-widest ml-4 mb-4">
        Household
      </Text>
      <View className="bg-surface rounded-[35px] border border-white/5 p-6 mb-8">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-bold text-white">Manage Members</Text>
            <Text className="text-xs text-text-tertiary">
              Share your pantry with family
            </Text>
          </View>
          <Feather name="users" size={20} color="#22C55E" />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          signOut();
        }}
        className="bg-red-500/10 h-16 rounded-[25px] border border-red-500/20 items-center justify-center mb-20"
      >
        <Text className="font-bold text-red-500">Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const SettingToggle = ({ icon, label, value, onToggle }: any) => (
  <View className="flex-row items-center justify-between p-6 border-b border-white/5">
    <View className="flex-row items-center">
      <Feather name={icon} size={20} color="white" />
      <Text className="ml-4 font-medium text-white">{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ true: '#22C55E' }}
    />
  </View>
);
