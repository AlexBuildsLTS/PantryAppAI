/**
 * @module NotificationsScreen
 * Real-time expiration monitoring suite.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: alerts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .lte(
          'expiry_date',
          new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
        )
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) =>
      await supabase.from('pantry_items').delete().eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <ScrollView
        className="flex-1 px-6 pt-16"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#22C55E"
          />
        }
      >
        <Text className="mb-2 text-3xl font-black text-white">Alerts</Text>
        <Text className="mb-8 text-white/40">
          Items requiring immediate attention.
        </Text>

        {alerts.length === 0 ? (
          <View className="items-center justify-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
            <Feather name="check-circle" size={48} color="#22C55E" />
            <Text className="mt-4 font-bold text-white">All Clear!</Text>
            <Text className="mt-1 text-center text-white/30">
              Everything is fresh.
            </Text>
          </View>
        ) : (
          alerts.map((item) => (
            <View
              key={item.id}
              className="bg-orange-500/10 mb-4 p-5 rounded-[30px] border border-orange-500/20 flex-row items-center"
            >
              <View className="items-center justify-center w-12 h-12 mr-4 bg-orange-500/20 rounded-2xl">
                <Feather name="alert-triangle" size={20} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-white">
                  {item.name}
                </Text>
                <Text className="text-xs font-bold uppercase text-orange-500/60">
                  Expires {new Date(item.expiry_date!).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteItem.mutate(item.id)}>
                <Feather name="trash-2" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
