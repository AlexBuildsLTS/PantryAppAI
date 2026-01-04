/**
 * @module ShoppingScreen
 * Cloud-synchronized shopping list with automated pantry replenishment.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ShoppingScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState('');

  // 1. Fetch Synced List
  const {
    data: list = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['shopping', user?.id],
    queryFn: async () => {
      const { data: household } = await supabase
        .from('household_members')
        .select('household_id')
        .single();
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('household_id', household?.household_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // 2. Add Mutation
  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: household } = await supabase
        .from('household_members')
        .select('household_id')
        .single();
      return supabase
        .from('shopping_list')
        .insert({ name, household_id: household?.household_id });
    },
    onSuccess: () => {
      setNewItem('');
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  return (
    <View className="flex-1 bg-[#0A0A0A] px-6 pt-16">
      <Text className="mb-2 text-3xl font-black text-white">Groceries</Text>
      <Text className="mb-8 text-white/40">
        Managed household shopping list.
      </Text>

      {/* INPUT BENTO */}
      <View className="flex-row items-center h-16 px-4 mb-8 border bg-surface rounded-2xl border-white/5">
        <TextInput
          className="flex-1 text-lg text-white"
          placeholder="Add to list..."
          placeholderTextColor="#444"
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={() => newItem && addMutation.mutate(newItem)}
        />
        <TouchableOpacity
          onPress={() => newItem && addMutation.mutate(newItem)}
          className="p-2 bg-primary rounded-xl"
        >
          <Feather name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#22C55E"
          />
        }
      >
        {list.map((item) => (
          <TouchableOpacity
            key={item.id}
            className="bg-surface mb-3 p-5 rounded-[25px] flex-row items-center border border-white/5"
          >
            <View
              className={`w-6 h-6 rounded-full border-2 ${
                item.is_completed
                  ? 'bg-primary border-primary'
                  : 'border-white/10'
              } items-center justify-center mr-4`}
            >
              {item.is_completed && (
                <Feather name="check" size={14} color="white" />
              )}
            </View>
            <Text
              className={`flex-1 text-lg ${
                item.is_completed ? 'text-white/20 line-through' : 'text-white'
              }`}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
