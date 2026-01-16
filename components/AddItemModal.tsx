/**
 * @file components/AddItemModal.tsx
 * @description AAA+ Tier Master Provision Entry System.
 * UPDATES:
 * 1. CATEGORY ENGINE: Implements horizontal chip-selector for food groups.
 * 2. QUANTITY STEPPER: Precision numeric controls with unit management.
 * 3. SCHEMA SYNC: Strictly enforces lowercase enums ('fresh', 'admin') for SQL integrity.
 * 4. BOOTSTRAP LOGIC: Atomic household creation to prevent 403 Forbidden redirects.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
  Platform,
  ScrollView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { SlideInDown, FadeIn, SlideInUp, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// INTERNAL SYSTEM INFRASTRUCTURE
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { TablesInsert } from '../types/database.types';
import { CATEGORIES } from '../lib/pantryConstants';

interface AddItemModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialData?: { name?: string; quantity?: number; expiry_date?: string; category?: string };
}

export default function AddItemModal({ isVisible, onClose, initialData }: AddItemModalProps) {
  const { household, user, refreshMetadata } = useAuth();
  const queryClient = useQueryClient();

  // --- 🛡️ STATE MANAGEMENT ---
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pantry');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('pcs');
  const [expiry, setExpiry] = useState(new Date().toISOString());
  const [isSaving, setIsSaving] = useState(false);
  const [isCalOpen, setIsCalOpen] = useState(false);

  // Sync state with props (useful for AI Scanner hand-off)
  useEffect(() => {
    if (isVisible) {
      setName(initialData?.name || '');
      setQty(initialData?.quantity || 1);
      setCategory(initialData?.category || 'Pantry');
      setExpiry(initialData?.expiry_date || new Date(Date.now() + 7 * 86400000).toISOString());
    }
  }, [isVisible, initialData]);

  /**
   * CORE LOGIC: Commit to Vault
   * Orchestrates household bootstrapping and inventory insertion.
   */
  const onSave = async () => {
    if (!name.trim()) return Alert.alert("Validation", "Nomenclature (Name) is required.");
    if (!user?.id) return Alert.alert("Auth Sync", "Session identity lost. Re-login required.");

    setIsSaving(true);
    let targetHouseholdId = household?.id;

    try {
      // PHASE 1: BOOTSTRAP (If user has no household)
      if (!targetHouseholdId) {
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // 1. Create Household record
        const { data: newH, error: hErr } = await supabase
          .from('households')
          .insert({
            name: `${user.email?.split('@')[0] || 'My'} Vault`,
            invite_code: inviteCode,
            currency: 'USD'
          } as TablesInsert<'households'>)
          .select()
          .single();

        if (hErr) throw hErr;
        targetHouseholdId = newH.id;

        // 2. Assign User as Admin
        const { error: mErr } = await supabase
          .from('household_members')
          .insert({
            household_id: targetHouseholdId,
            user_id: user.id,
            member_role: 'admin' // Fixed: lowercase to match user_role enum
          } as TablesInsert<'household_members'>);

        if (mErr) throw mErr;

        // Force AuthContext to hydrate the new relationship
        await refreshMetadata();
      }

      // PHASE 2: INVENTORY INSERTION
      const payload: TablesInsert<'pantry_items'> = {
        household_id: targetHouseholdId,
        user_id: user.id,
        name: name.trim(),
        category: category,
        quantity: qty,
        unit: unit,
        expiry_date: expiry,
        status: 'fresh', // Fixed: lowercase to match item_status enum
        updated_at: new Date().toISOString()
      };

      const { error: itemErr } = await supabase.from('pantry_items').insert(payload);
      if (itemErr) throw itemErr;

      // PHASE 3: SUCCESS ORCHESTRATION
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['pantry-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      onClose();

    } catch (err: any) {
      console.error("[AddItemModal] Critical Error:", err.message);
      Alert.alert("System Failure", err.message || "Failed to commit to database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View entering={FadeIn.duration(400)} style={styles.sheetContainer}>
            <BlurView intensity={Platform.OS === 'ios' ? 90 : 100} tint="dark" style={styles.sheet}>
              {/* Header Block */}
              <Animated.View entering={SlideInDown.duration(350)} style={styles.headerRow}>
                <View>
                  <Text style={styles.sheetTitle}>Provision Log</Text>
                  <Text style={styles.sheetSubtitle}>SYNCING TO {household?.name || 'NEW VAULT'}</Text>
                </View>
                <Animated.View entering={SlideInRight.duration(350)}>
                  <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
                    <Feather name="x" size={20} color="white" />
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Nomenclature Input */}
                <Text style={styles.fieldLabel}>DESIGNATION</Text>
                <Animated.View entering={SlideInLeft.duration(350)} style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="tag-outline" size={20} color="#10B981" />
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Item name..."
                    placeholderTextColor="#555"
                  />
                </Animated.View>
                {/* Category Engine */}
                <Text style={styles.fieldLabel}>CLASSIFICATION</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        setCategory(cat);
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[styles.catChip, category === cat && { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                    >
                      <Text style={[styles.catChipText, category === cat && { color: 'white' }]}>{cat.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* Quantity Stepper */}
                <View style={styles.stepperContainer}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>QUANTITY</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        onPress={() => setQty(Math.max(1, qty - 1))}
                        style={styles.stepBtn}
                      >
                        <Feather name="minus" size={20} color="white" />
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{qty}</Text>
                      <TouchableOpacity
                        onPress={() => setQty(qty + 1)}
                        style={styles.stepBtn}
                      >
                        <Feather name="plus" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flex: 0.8 }}>
                    <Text style={styles.fieldLabel}>UNIT</Text>
                    <TouchableOpacity
                      onPress={() => setUnit(unit === 'pcs' ? 'kg' : unit === 'kg' ? 'ml' : 'pcs')}
                      style={styles.unitToggle}
                    >
                      <Text style={styles.unitText}>{unit.toUpperCase()}</Text>
                      <Feather name="repeat" size={14} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Expiration Logic */}
                <Text style={styles.fieldLabel}>EXPIRATION THRESHOLD</Text>
                <TouchableOpacity style={styles.dateControl} onPress={() => setIsCalOpen(true)}>
                  <Feather name="calendar" size={18} color="#3B82F6" />
                  <Text style={styles.dateValue}>
                    {new Date(expiry).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </Text>
                  <Feather name="chevron-right" size={18} color="#444" />
                </TouchableOpacity>
                {/* Final Commitment Button */}
                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                  onPress={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="shield-check-outline" size={20} color="white" />
                      <Text style={styles.saveBtnText}>COMMIT TO INVENTORY</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </BlurView>
          </Animated.View>
        </View>
      </Modal>
      {/* Date Preset Modal */}
      <Modal visible={isCalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsCalOpen(false)} />
          <Animated.View entering={FadeIn.duration(400)} style={styles.presetSheet}>
            <Text style={styles.presetTitle}>Expiration Presets</Text>
            <View style={styles.presetGrid}>
              {[3, 7, 14, 30, 90].map(days => (
                <Animated.View entering={SlideInUp.duration(350)} key={days} style={{ width: '47%' }}>
                  <TouchableOpacity
                    style={styles.presetBtn}
                    onPress={() => {
                      setExpiry(new Date(Date.now() + days * 86400000).toISOString());
                      setIsCalOpen(false);
                    }}
                  >
                    <Text style={styles.presetBtnText}>+{days} DAYS</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheetContainer: { width: '100%', maxHeight: '85%' },
  sheet: { borderTopLeftRadius: 44, borderTopRightRadius: 44, padding: 32, paddingBottom: 50, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  sheetTitle: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  sheetSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  closeCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  fieldLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 12, marginTop: 16 },
  inputWrapper: { height: 64, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  textInput: { flex: 1, color: 'white', fontSize: 17, fontWeight: '700', marginLeft: 12 },
  catRow: { flexDirection: 'row', marginTop: 4 },
  catChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', marginRight: 10 },
  catChipText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '900' },
  stepperContainer: { flexDirection: 'row', gap: 20, marginTop: 10 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  stepBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  qtyVal: { color: 'white', fontSize: 20, fontWeight: '900', minWidth: 30, textAlign: 'center' },
  unitToggle: { height: 64, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  unitText: { color: 'white', fontSize: 16, fontWeight: '800' },
  dateControl: { height: 64, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  dateValue: { flex: 1, color: 'white', fontSize: 16, fontWeight: '700' },
  saveBtn: { height: 72, backgroundColor: '#10B981', borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 40, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  presetSheet: { backgroundColor: '#0A0A0A', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 32, paddingBottom: 60, borderWidth: 1, borderColor: '#222' },
  presetTitle: { color: 'white', fontSize: 18, fontWeight: '900', marginBottom: 24 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  presetBtn: { width: '47%', paddingVertical: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  presetBtnText: { color: 'white', fontWeight: '900', fontSize: 13, letterSpacing: 1 }
});