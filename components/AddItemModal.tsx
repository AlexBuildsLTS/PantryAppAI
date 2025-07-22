import * as React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { StatusBar } from 'react-native'; // Keep this import if StatusBar is used elsewhere
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Calendar, MapPin, Package, Hash, Scan } from 'lucide-react-native';
import DatePicker from 'react-native-date-picker';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { PantryDatabase } from '@/database/PantryDatabase';
import { PantryItem, LocationType, UnitType } from '@/types/PantryItem';
import { useTheme } from '@/contexts/ThemeContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { validatePantryItem, sanitizeInput } from '@/utils/validation';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: PantryItem) => void;
  editingItem?: PantryItem | null;
}

export function AddItemModal({ visible, onClose, onSave, editingItem }: AddItemModalProps) {
  const { theme } = useTheme();
  const [name, setName] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [unit, setUnit] = React.useState<UnitType>('pcs');
  const [location, setLocation] = React.useState<LocationType>('Pantry');
  const [expiryDate, setExpiryDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = React.useState(false);
  const [slideAnim] = React.useState(new Animated.Value(0));
  const { execute: executeAsync, isLoading } = useAsyncOperation();

  const units: UnitType[] = ['pcs', 'g', 'kg', 'ml', 'L', 'cups', 'tbsp', 'tsp'];
  const locations: LocationType[] = ['Pantry', 'Fridge', 'Freezer'];

  React.useEffect(() => {
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
      
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, editingItem]);

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('pcs');
    setLocation('Pantry');
    
    // Set default expiry to 7 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    setExpiryDate(defaultExpiry);
  };

  const handleSave = async () => {
    const itemData = {
      name: sanitizeInput(name),
      quantity: Number(quantity),
      unit,
      location,
      expiryDate: expiryDate.toISOString()
    };

    const validationErrors = validatePantryItem(itemData);
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }

    const result = await executeAsync(async () => {
      if (editingItem) {
        await PantryDatabase.updateItem(editingItem.id!, itemData);
      } else {
        await PantryDatabase.addItem(itemData);
      }
    }, editingItem ? 'Updating item' : 'Adding item');

    if (result.success) {
      onSave(itemData as PantryItem);
      onClose();
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    // In a real app, you would look up the barcode in a product database
    setName(`Product ${barcode.slice(-6)}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      // @ts-ignore: onRequestClose is a valid prop for Modal
      onRequestClose={onClose}
    >
      
        
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} /> 
        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface },
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Item Name</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1, backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Package size={20} color={theme.colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g., Milk, Bread, Apples"
                    placeholderTextColor={theme.colors.textTertiary}
                    maxLength={50}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.scanButton, { backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary }]}
                  onPress={() => setShowBarcodeScanner(true)}
                >
                  <Scan size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Quantity</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Hash size={20} color={theme.colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Enter quantity"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsContainer}>
                  {units.map((unitOption) => (
                    <TouchableOpacity
                      key={unitOption}
                      style={[
                        styles.optionButton,
                        { 
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border 
                        },
                        unit === unitOption && { 
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary 
                        },
                      ]}
                      onPress={() => setUnit(unitOption)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: unit === unitOption ? '#FFFFFF' : theme.colors.textSecondary },
                        ]}
                      >
                        {unitOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Location</Text>
              <View style={styles.optionsContainer}>
                {locations.map((locationOption) => (
                  <TouchableOpacity
                    key={locationOption}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border 
                      },
                      location === locationOption && { 
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary 
                      },
                    ]}
                    onPress={() => setLocation(locationOption)}
                  >
                    <MapPin
                      size={16}
                      color={location === locationOption ? '#FFFFFF' : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        { color: location === locationOption ? '#FFFFFF' : theme.colors.textSecondary },
                      ]}
                    >
                      {locationOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Expiry Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={theme.colors.textTertiary} />
                <Text style={[styles.dateText, { color: theme.colors.text }]}>
                  {expiryDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: theme.colors.border }]} 
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, { opacity: isLoading ? 0.7 : 1 }]} 
              onPress={handleSave}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}  
                style={styles.saveGradient}
              >
                <Text style={styles.saveText}>
                  {isLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add Item')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <DatePicker
          modal
          open={showDatePicker}
          date={expiryDate}
          onConfirm={(selectedDate) => {
            setShowDatePicker(false);
            setExpiryDate(selectedDate);
          }}
          onCancel={() => setShowDatePicker(false)}
          mode="date"
          title="Select Expiry Date"
          minimumDate={new Date()}
        />

        <BarcodeScanner
          visible={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onBarcodeScanned={handleBarcodeScanned}
        />
        
      </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    maxHeight: 500,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
