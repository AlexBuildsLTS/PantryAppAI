import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ActivityIndicator,
  Image,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AIService } from '@/services/AIService';
import { PantryDatabase } from '@/database/PantryDatabase';
import { AIDetectionResult } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

interface AIFoodScannerProps {
  visible: boolean;
  onClose: () => void;
  onItemsAdded: () => void;
}

export function AIFoodScanner({ visible, onClose, onItemsAdded }: AIFoodScannerProps) {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<AIDetectionResult[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));
  const cameraRef = useRef<CameraView>(null);
  const { execute: executeAsync } = useAsyncOperation();

  useEffect(() => {
    if (visible && !showResults) {
      startScanAnimation();
    }
  }, [visible, showResults]);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanAnimation, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleCaptureAndAnalyze = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready. Please try again.');
      return;
    }

    try {
      setIsAnalyzing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      if (!photo?.base64) {
        throw new Error('Failed to capture image data');
      }

      setCapturedImage(photo.uri);
      const results = await AIService.analyzeImage(photo.base64);
      
      if (!results || results.length === 0) {
        Alert.alert('No Items Detected', 'The AI could not identify any food items. Please try again with a clearer picture.', [{ text: 'OK', onPress: () => setIsAnalyzing(false) }]);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDetectedItems(results);
      setSelectedItems(new Set(results.map((item) => item.itemName)));
      setShowResults(true);

    } catch (error: any) {
      let errorMessage = error.message || 'An unknown error occurred.';
      Alert.alert('Analysis Failed', errorMessage, [{ text: 'OK', onPress: () => setIsAnalyzing(false) }]);
    } finally {
      if (!showResults) setIsAnalyzing(false);
    }
  };

  const toggleItemSelection = (itemName: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemName)) newSelection.delete(itemName);
    else newSelection.add(itemName);
    setSelectedItems(newSelection);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddSelectedItems = async () => {
    const itemsToAdd = detectedItems.filter((item) => selectedItems.has(item.itemName));
    if (itemsToAdd.length === 0) return;

    const result = await executeAsync(async () => {
      for (const item of itemsToAdd) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (item.estimatedExpiry || 7));
        await PantryDatabase.addItem({ name: item.itemName, quantity: 1, unit: 'pcs', location: item.suggestedLocation || 'Pantry', expiryDate: expiryDate.toISOString() });
      }
    }, 'Adding detected items');

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onItemsAdded();
      handleClose();
      Alert.alert('✅ Items Added!', `Added ${itemsToAdd.length} item${itemsToAdd.length > 1 ? 's' : ''} to your pantry.`);
    }
  };

  const handleClose = () => {
    scanAnimation.stopAnimation();
    setShowResults(false);
    setDetectedItems([]);
    setSelectedItems(new Set());
    setCapturedImage(null);
    setIsAnalyzing(false);
    onClose();
  };

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <BlurView intensity={20} style={styles.overlay}>
          <View style={[ styles.permissionContainer, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="brain" size={64} color={theme.colors.primary} />
            <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>AI Food Scanner</Text>
            <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>Grant camera access to use our AI-powered food recognition technology.</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <LinearGradient colors={theme.gradients.primary as any} style={styles.buttonGradient}><Text style={styles.buttonText}>Enable Camera</Text></LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}><Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text></TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {!showResults ? (
          <CameraView ref={cameraRef} style={styles.camera} facing="back" flash={flashEnabled ? 'on' : 'off'}>
            <View style={styles.cameraOverlay}>
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                  <TouchableOpacity style={styles.headerButton} onPress={handleClose}><Feather name="x" size={24} color="#FFFFFF" /></TouchableOpacity>
                  <View style={styles.headerCenter}><MaterialCommunityIcons name="brain" size={24} color="#FFFFFF" /><Text style={styles.headerTitle}>AI Food Scanner</Text></View>
                  <TouchableOpacity style={styles.headerButton} onPress={() => setFlashEnabled(!flashEnabled)}><Feather name={flashEnabled ? "zap" : "zap-off"} size={24} color={flashEnabled ? "#F59E0B" : "#FFFFFF"} /></TouchableOpacity>
                </View>
                <View style={styles.scanFrame}><View style={styles.frameCorners}><View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} /><View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} /></View></View>
                <View style={styles.instructions}>
                  <Text style={styles.instructionTitle}>{isAnalyzing ? 'Analyzing...' : 'Position Food Items'}</Text>
                  <Text style={styles.instructionText}>{isAnalyzing ? 'AI is identifying your food items' : 'Frame your food items clearly for best results'}</Text>
                </View>
                <View style={styles.controls}>
                  <TouchableOpacity style={[styles.captureButton, isAnalyzing && { opacity: 0.5 }]} onPress={handleCaptureAndAnalyze} disabled={isAnalyzing}>
                    <LinearGradient colors={isAnalyzing ? ['#9CA3AF', '#6B7280'] : theme.gradients.primary as any} style={styles.captureButtonGradient}>
                      {isAnalyzing ? <ActivityIndicator size="large" color="#FFFFFF" /> : <Feather name="camera" size={32} color="#FFFFFF" />}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </CameraView>
        ) : (
          <SafeAreaView style={styles.resultsContainer}>
            <View style={[ styles.resultsHeader, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity onPress={() => setShowResults(false)}><Feather name="camera" size={24} color={theme.colors.primary} /></TouchableOpacity>
              <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>AI Detection Results</Text>
              <TouchableOpacity onPress={handleClose}><Feather name="x" size={24} color={theme.colors.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Detected Items ({detectedItems.length})</Text>
              {detectedItems.map((item, index) => {
                const isSelected = selectedItems.has(item.itemName);
                return (
                  <TouchableOpacity key={index} style={[ styles.detectedItem, { backgroundColor: theme.colors.surface, borderColor: isSelected ? theme.colors.primary : theme.colors.border, borderWidth: isSelected ? 2 : 1 } ]} onPress={() => toggleItemSelection(item.itemName)}>
                      <View style={styles.itemInfo}><Text style={[styles.itemName, { color: theme.colors.text }]}>{item.itemName}</Text><Text style={[styles.itemCategory, { color: theme.colors.textSecondary }]}>{item.category}</Text></View>
                      <View style={[ styles.checkbox, { borderColor: isSelected ? theme.colors.primary : theme.colors.border, backgroundColor: isSelected ? theme.colors.primary : 'transparent' } ]}>
                        {isSelected && <Feather name="check" size={16} color="#FFFFFF" />}
                      </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={[styles.resultsFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity style={[ styles.addButton, selectedItems.size === 0 && { opacity: 0.5 }]} onPress={handleAddSelectedItems} disabled={selectedItems.size === 0}>
                <LinearGradient colors={theme.gradients.primary as any} style={styles.addButtonGradient}>
                  <Feather name="plus" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scanFrame: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  frameCorners: { width: 300, height: 300, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFFFFF', borderWidth: 5, borderRadius: 12 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  instructions: { paddingHorizontal: 40, paddingVertical: 20, alignItems: 'center' },
  instructionTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  instructionText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', lineHeight: 22 },
  controls: { paddingBottom: 40, alignItems: 'center' },
  captureButton: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 4, borderColor: 'white' },
  captureButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultsContainer: { flex: 1 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  resultsTitle: { fontSize: 20, fontWeight: '700' },
  itemsList: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  detectedItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemCategory: { fontSize: 14, marginTop: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  resultsFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1 },
  addButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  permissionContainer: { margin: 20, padding: 40, borderRadius: 20, alignItems: 'center' },
  permissionTitle: { fontSize: 24, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  permissionText: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginVertical: 24 },
  permissionButton: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  cancelButton: { paddingVertical: 16 },
  cancelText: { fontSize: 16, fontWeight: '600' },
});