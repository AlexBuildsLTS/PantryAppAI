/**
 * @file hooks/useShopping.ts
 * @description Custom React Query hooks for shopping list operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingService } from '../services/ShoppingService';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Hook for fetching the active shopping list for the household.
 */
export function useActiveShoppingList() {
  const { household } = useAuth();
  const householdId = household?.id;

  return useQuery({
    queryKey: ['active-shopping-list', householdId],
    queryFn: () => ShoppingService.fetchActiveShoppingList(householdId!),
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching shopping list items.
 */
export function useShoppingListItems(listId?: string) {
  return useQuery({
    queryKey: ['shopping-list-items', listId],
    queryFn: () => ShoppingService.fetchShoppingListItems(listId!),
    enabled: !!listId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for adding a new shopping list item.
 */
export function useAddShoppingItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ listId, name }: { listId: string; name: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const error = await ShoppingService.createShoppingListItem(listId, name, user.id);
      if (error) throw error;
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', listId] });
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
  });
}

/**
 * Hook for toggling the bought status of a shopping list item.
 */
export function useToggleShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, currentStatus, listId }: { itemId: string; currentStatus: boolean; listId: string }) => {
      const error = await ShoppingService.toggleItemStatus(itemId, currentStatus);
      if (error) throw error;
      return { itemId, currentStatus };
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', listId] });
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
  });
}

/**
 * Hook for restocking bought items (moving them to pantry).
 */
export function useRestockItems() {
  const queryClient = useQueryClient();
  const { household, user } = useAuth();

  return useMutation({
    mutationFn: async (boughtItems: any[]) => {
      if (!household?.id || !user?.id) throw new Error('Household or user not found');
      await ShoppingService.restockItems(boughtItems, household.id, user.id);
    },
    onSuccess: (_, __, context) => {
      // Invalidate both shopping list and pantry queries
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items'] });
      queryClient.invalidateQueries({ queryKey: ['pantry-inventory'] });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });
}