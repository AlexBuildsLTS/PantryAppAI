import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import DatePicker from 'react-native-date-picker';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { PantryDatabase } from '@/database/PantryDatabase';
import { PantryItem, LocationType, UnitType } from '@/types/PantryItem';
import { useTheme } from '@/contexts/ThemeContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { validatePantryItem, sanitizeInput } from '@/utils/validation';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingItem?: PantryItem | null;
}

export function AddItemModal({ visible, onClose, onSave, editingItem }: AddItemModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<UnitType>('pcs');
  const [location, setLocation] = useState<LocationType>('Pantry');
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const { execute: executeAsync, isLoading } = useAsyncOperation();
  
  const modalY = useSharedValue(600);
  const animatedModalStyle = useAnimatedStyle(() => ({ transform: [{ translateY: modalY.value }] }));

  useEffect(() => {
    if (visible) {
      if (editingItem) {
        setName(editingItem.name);
        setQuantity(editingItem.quantity.toString());
        setUnit(editingItem.unit as UnitType);
        setLocation(editingItem.location as LocationType);
        setExpiryDate(new Date(editingItem.expiryDate));
      } else {
        resetForm();
      }
      modalY.value = withSpring(0, { damping: 15, stiffness: 120 });
    } else {
      modalY.value = withTiming(600, { duration: 300 });
    }
  }, [visible, editingItem]);

  const resetForm = () => {
    setName(''); setQuantity(''); setUnit('pcs'); setLocation('Pantry');
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    setExpiryDate(defaultExpiry);
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const itemData = { name: sanitizeInput(name), quantity: Number(quantity), unit, location, expiryDate: expiryDate.toISOString() };
    const validationErrors = validatePantryItem(itemData);
    if (validationErrors.length > 0) { Alert.alert('Validation Error', validationErrors.join('\n')); return; }

    const result = await executeAsync(async () => {
      if (editingItem) await PantryDatabase.updateItem(editingItem.id!, itemData);
      else await PantryDatabase.addItem(itemData);
    }, editingItem ? 'Updating item' : 'Adding item');

    if (result.success) { onSave(); onClose(); }
  };
  
  const handleBarcodeScanned = (barcode: string) => {
    setShowBarcodeScanner(false);
    setName(`Scanned Product ${barcode.slice(-4)}`);
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <BlurView intensity={20} style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
            <Animated.View style={[ styles.modalContainer, { backgroundColor: theme.colors.surface }, animatedModalStyle ]}>
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{editingItem ? 'Edit Item' : 'Add New Item'}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}><Feather name="x" size={24} color={theme.colors.textSecondary} /></TouchableOpacity>
                </View>
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Form sections... */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Item Name</Text>
                        <View style={styles.inputRow}>
                            <View style={[styles.inputContainer, { flex: 1, backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                <Feather name="package" size={20} color={theme.colors.textTertiary} />
                                <TextInput style={[styles.input, { color: theme.colors.text }]} value={name} onChangeText={setName} placeholder="e.g., Milk, Bread, Apples" placeholderTextColor={theme.colors.textTertiary} />
                            </View>
                            <TouchableOpacity style={[styles.scanButton, { backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowBarcodeScanner(true); }}>
                                <Feather name="camera" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                     {/* ... other form sections */}
                </ScrollView>
                <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                    <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.colors.border }]} onPress={onClose} disabled={isLoading}><Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.saveButton, { opacity: isLoading ? 0.7 : 1 }]} onPress={handleSave} disabled={isLoading}>
                        <LinearGradient colors={theme.gradients.primary as any} style={styles.saveGradient}><Text style={styles.saveText}>{isLoading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}</Text></LinearGradient>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
        <DatePicker modal open={showDatePicker} date={expiryDate} onConfirm={(date) => { setShowDatePicker(false); setExpiryDate(date); }} onCancel={() => setShowDatePicker(false)} mode="date" title="Select Expiry Date" minimumDate={new Date()} />
        <BarcodeScanner visible={showBarcodeScanner} onClose={() => setShowBarcodeScanner(false)} onBarcodeScanned={handleBarcodeScanned} />
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  closeButton: { padding: 4 },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, height: 48 },
  scanButton: { width: 48, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  footer: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
  saveButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveGradient: { paddingVertical: 14, alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});