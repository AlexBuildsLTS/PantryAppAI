import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, Animated, ActivityIndicator, Image, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { AIService } from '@/services/AIService';
import { PantryDatabase } from '@/database/PantryDatabase';
import { AIDetectionResult } from '@/types';
import { useTheme } from '@/contexts/ThemeContext'; // Fix: Remove unused import
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AIFoodScannerProps { visible: boolean; onClose: () => void; onItemsAdded: () => void; }

export function AIFoodScanner({ visible, onClose, onItemsAdded }: AIFoodScannerProps) {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<AIDetectionResult[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const { execute: executeAsync } = useAsyncOperation();

  const handleCaptureAndAnalyze = async () => {
    if (!cameraRef.current) return;
    setIsAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      setCapturedImage(photo.uri);
      
      const results = await AIService.analyzeImage(photo.base64!);
      if (!results || results.length === 0) {
        Alert.alert('No Items Detected', 'The AI could not identify any food items. Please try again with a clearer picture.');
        setIsAnalyzing(false);
        return;
      }
      
      setDetectedItems(results);
      setSelectedItems(new Set(results.map(item => item.itemName)));
      setShowResults(true);
    } catch (error: any) {
      Alert.alert('Analysis Failed', error.message || 'An unknown error occurred. Make sure your API key is correct and has vision capabilities.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSelectedItems = async () => {
    const itemsToAdd = detectedItems.filter(item => selectedItems.has(item.itemName));
    const result = await executeAsync(async () => {
      for (const item of itemsToAdd) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (item.estimatedExpiry || 7));
        await PantryDatabase.addItem({ name: item.itemName, quantity: 1, unit: 'pcs', location: item.suggestedLocation || 'Pantry', expiryDate: expiryDate.toISOString() });
      }
    }, 'Adding detected items');

    if (result.success) {
      onItemsAdded();
      handleClose();
      Alert.alert('Items Added!', `Successfully added ${itemsToAdd.length} items to your pantry.`);
    }
  };
  
  const handleClose = () => {
    setShowResults(false); setDetectedItems([]); setSelectedItems(new Set()); setCapturedImage(null); setIsAnalyzing(false); onClose();
  };

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <BlurView intensity={20} style={styles.overlay}><View style={[styles.permissionContainer, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="brain" size={64} color={theme.colors.primary} />
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>AI Food Scanner</Text>
          <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>Grant camera access to use our AI-powered food recognition.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}><LinearGradient colors={theme.gradients.primary as any} style={styles.buttonGradient}><Text style={styles.buttonText}>Enable Camera</Text></LinearGradient></TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}><Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text></TouchableOpacity>
        </View></BlurView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {!showResults ? (
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            <View style={styles.cameraOverlay}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}><Feather name="x" size={24} color="#FFFFFF" /></TouchableOpacity>
                <View style={styles.headerCenter}><MaterialCommunityIcons name="brain" size={24} color="#FFFFFF" /><Text style={styles.headerTitle}>AI Food Scanner</Text></View>
                <View style={{ width: 40 }} />
              </View>
              {isAnalyzing && (
                <View style={styles.analysisOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.analysisText}>AI is analyzing your food...</Text>
                </View>
              )}
              <View style={styles.controls}>
                <TouchableOpacity style={[styles.captureButton, isAnalyzing && { opacity: 0.5 }]} onPress={handleCaptureAndAnalyze} disabled={isAnalyzing}>
                  <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.captureButtonGradient}>
                    <Feather name="camera" size={32} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        ) : (
          <SafeAreaView style={styles.resultsContainer}>
            <View style={[styles.resultsHeader, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity onPress={handleClose}><Feather name="x" size={24} color={theme.colors.textSecondary} /></TouchableOpacity>
              <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>AI Detection Results</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.itemsList}>
              {detectedItems.map((item, index) => (
                <TouchableOpacity key={index} style={[styles.detectedItem, { backgroundColor: theme.colors.surface, borderColor: selectedItems.has(item.itemName) ? theme.colors.primary : theme.colors.border }]} onPress={() => { /* Logic to select/deselect */ }}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.itemName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={[styles.resultsFooter, { borderTopColor: theme.colors.border }]}>
                <TouchableOpacity style={[styles.addButton, selectedItems.size === 0 && { opacity: 0.5 }]} onPress={handleAddSelectedItems} disabled={selectedItems.size === 0}>
                    <LinearGradient colors={theme.gradients.primary as any} style={styles.addButtonGradient}>
                        <Feather name="plus" size={20} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>Add {selectedItems.size} Items</Text>
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
  cameraOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  closeButton: { padding: 8 },
  analysisOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  analysisText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginTop: 16 },
  controls: { paddingBottom: 60, alignItems: 'center' },
  captureButton: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  captureButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultsContainer: { flex: 1 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  resultsTitle: { fontSize: 20, fontWeight: '700' },
  itemsList: { padding: 20 },
  detectedItem: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 2 },
  itemName: { fontSize: 16, fontWeight: '600' },
  resultsFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1 },
  addButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  permissionContainer: { margin: 20, padding: 40, borderRadius: 20, alignItems: 'center' },
  permissionTitle: { fontSize: 24, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  permissionText: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  permissionButton: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  cancelButton: { paddingVertical: 16 },
  cancelText: { fontSize: 16, fontWeight: '600' },
});