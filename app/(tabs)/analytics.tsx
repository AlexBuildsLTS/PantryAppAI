import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function AnalyticsScreen() {
  const { user } = useAuth();

  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('status, quantity');
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    total: items.length,
    consumed: items.filter((i) => i.status === 'consumed').length,
    wasted: items.filter((i) => i.status === 'expired' || i.status === 'wasted')
      .length,
  };

  const efficiency =
    stats.total > 0
      ? Math.round(((stats.total - stats.wasted) / stats.total) * 100)
      : 100;

  return (
    <ScrollView
      className="flex-1 bg-[#0A0A0A] px-6 pt-16"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#22C55E"
        />
      }
    >
      <Text className="mb-2 text-3xl font-bold text-white">Impact</Text>
      <Text className="mb-8 text-white/40">
        Your contribution to a sustainable kitchen.
      </Text>

      {/* BIG EFFICIENCY CARD */}
      <View className="bg-[#161616] p-8 rounded-[40px] border border-white/5 items-center mb-6">
        <View className="w-40 h-40 rounded-full border-[12px] border-[#22C55E]/10 items-center justify-center">
          <View className="items-center">
            <Text className="text-[#22C55E] text-5xl font-black">
              {efficiency}%
            </Text>
            <Text className="text-white/30 text-[10px] uppercase font-bold tracking-widest">
              Efficiency
            </Text>
          </View>
        </View>
        <Text className="mt-8 font-medium leading-6 text-center text-white/80">
          You've prevented{' '}
          <Text className="text-[#22C55E] font-bold">
            {stats.total - stats.wasted} items
          </Text>{' '}
          from going to waste this month.
        </Text>
      </View>

      {/* BENTO GRID STATS */}
      <View className="flex-row gap-4 mb-6">
        <View className="flex-1 bg-[#161616] p-6 rounded-[30px] border border-white/5">
          <Feather name="shopping-bag" size={24} color="#22C55E" />
          <Text className="mt-4 text-3xl font-bold text-white">
            {stats.total}
          </Text>
          <Text className="text-xs font-bold uppercase text-white/40">
            Stored
          </Text>
        </View>
        <View className="flex-1 bg-[#161616] p-6 rounded-[30px] border border-white/5">
          <Feather name="check-circle" size={24} color="#3B82F6" />
          <Text className="mt-4 text-3xl font-bold text-white">
            {stats.consumed}
          </Text>
          <Text className="text-xs font-bold uppercase text-white/40">
            Saved
          </Text>
        </View>
      </View>

      {/* ECO-INSIGHT GLASS CARD */}
      <BlurView
        intensity={20}
        className="mb-10 p-6 rounded-[35px] overflow-hidden bg-[#22C55E]/10 border border-[#22C55E]/20"
      >
        <View className="flex-row items-center mb-3">
          <Feather name="globe" size={20} color="#22C55E" />
          <Text className="text-[#22C55E] font-bold ml-2">
            Environmental Impact
          </Text>
        </View>
        <Text className="text-sm leading-6 text-white/70">
          Great job! Your current inventory management has reduced your
          household carbon footprint by approximately{' '}
          <Text className="font-bold text-white">8.4kg CO2</Text> this week.
        </Text>
      </BlurView>
    </ScrollView>
  );
}
