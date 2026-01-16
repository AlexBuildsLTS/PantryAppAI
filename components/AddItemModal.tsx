/**
 * @file AddItemModal.tsx
 * @description senior-level verification workflow for inventory items.
 * Corrected: Fixed Reanimated 3 animation exports and removed unused variables.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { SlideInUp } from 'react-native-reanimated'; // FIXED: Correct member name

// Internal Systems
import { useTheme } from '../contexts/ThemeContext';
import { FoodItemRepository } from '../services/repositories/FoodItemRepository';
import { useAuth } from '../contexts/AuthContext';

interface AddItemModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialData?: any;
}

export default function AddItemModal({
  isVisible,
  onClose,
  initialData,
}: AddItemModalProps) {
  const { colors } = useTheme();
  const { user, household } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('Pantry');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setQuantity(initialData.quantity?.toString() || '1');
      setUnit(initialData.unit || 'pcs');
      setCategory(initialData.category || 'Pantry');
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!name || isSaving) return;

    try {
      setIsSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await FoodItemRepository.addItem({
        name,
        quantity: parseFloat(quantity),
        unit,
        category,
        expiry_date: expiryDate || null,
        household_id: household?.id,
        added_by: user?.id,
        status: 'fresh',
      } as any);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();

      // Reset State
      setName('');
      setExpiryDate('');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <BlurView intensity={60} tint="dark" style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.View
            entering={SlideInUp.springify().damping(15)} // FIXED: SlideInUp
            style={[
              styles.content,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Add to Inventory
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>ITEM NAME</Text>
              <View style={[styles.inputBox, { borderColor: colors.border }]}>
                <MaterialCommunityIcons
                  name="food-apple"
                  size={20}
                  color={colors.primary}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Organic Milk"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>QUANTITY</Text>
                  <View
                    style={[styles.inputBox, { borderColor: colors.border }]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      keyboardType="numeric"
                      value={quantity}
                      onChangeText={setQuantity}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>UNIT</Text>
                  <View
                    style={[styles.inputBox, { borderColor: colors.border }]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={unit}
                      onChangeText={setUnit}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.label}>EXPIRATION (YYYY-MM-DD)</Text>
              <View style={[styles.inputBox, { borderColor: colors.border }]}>
                <Feather
                  name="calendar"
                  size={18}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="2026-05-20"
                  placeholderTextColor={colors.textSecondary}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveBtnText}>Confirm & Add</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    padding: Platform.OS === 'web' ? 20 : 0
  },
  container: { 
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
  },
  content: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: Platform.OS === 'web' ? 40 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 40 : 0,
    borderWidth: 1,
    padding: 32,
    maxHeight: '90%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 24,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 16 },
  saveBtn: {
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  saveBtnText: { color: 'white', fontSize: 18, fontWeight: '800' },
});