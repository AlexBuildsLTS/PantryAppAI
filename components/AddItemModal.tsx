import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function AddItemModal({ visible, onClose, onRefresh }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [location, setLocation] = useState<'pantry' | 'fridge' | 'freezer'>(
    'pantry'
  );
  const [loading, setLoading] = useState(false);

  // Animation Values
  const translateY = useSharedValue(600);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
    } else {
      translateY.value = withTiming(600);
    }
  }, [visible]);

  const handleAdd = async () => {
    if (!name) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return Alert.alert('Missing Info', 'What are we adding to the pantry?');
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 1. Get the household (Optimized: we could also store this in AuthContext)
      const { data: memberData } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user?.id)
        .single();

      if (!memberData) throw new Error('Join a household to add items.');

      // 2. Insert into Supabase
      const { error } = await supabase.from('pantry_items').insert({
        name,
        location,
        household_id: memberData.household_id,
        added_by: user?.id,
        status: 'fresh',
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setName('');
      onRefresh();
      onClose();
    } catch (error: any) {
      Alert.alert('Database Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.container}>
        {/* Tap background to close */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={30} style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[styles.sheet, animatedStyle]}>
            <View style={styles.handle} />

            <Text style={styles.title}>New Item</Text>

            <View style={styles.inputContainer}>
              <Feather
                name="shopping-bag"
                size={20}
                color="#666"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Item name..."
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <Text style={styles.label}>Storage Location</Text>
            <View style={styles.selector}>
              {['pantry', 'fridge', 'freezer'].map((loc) => (
                <TouchableOpacity
                  key={loc}
                  onPress={() => setLocation(loc as any)}
                  style={[
                    styles.option,
                    location === loc && styles.activeOption,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      location === loc && styles.activeOptionText,
                    ]}
                  >
                    {loc.charAt(0).toUpperCase() + loc.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleAdd}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Syncing...' : 'Add to Inventory'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#333',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 25 },
  label: { color: '#999', fontSize: 14, marginBottom: 10, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
    height: 60,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 16 },
  selector: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  option: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#262626',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeOption: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  optionText: { color: '#999', fontWeight: '600' },
  activeOptionText: { color: '#FFF' },
  saveButton: {
    backgroundColor: '#22C55E',
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
