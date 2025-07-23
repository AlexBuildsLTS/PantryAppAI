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
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const { width } = Dimensions.get('window');

export function AIFoodScanner({
  visible,
  onClose,
  onItemsAdded,
}: AIFoodScannerProps) {
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
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
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

      // Take photo with high quality for better AI analysis
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      if (!photo.base64) {
        throw new Error('Failed to capture image data');
      }

      setCapturedImage(photo.uri);

      // Analyze the image with AI
      const results = await AIService.analyzeImage(photo.base64);
      
      if (!results || results.length === 0) {
        Alert.alert(
          'No Food Items Detected',
          'The AI could not identify any food items in this image. Please try again with a clearer picture of your food items.',
          [
            { text: 'Try Again', onPress: () => setIsAnalyzing(false) },
            { text: 'Cancel', onPress: handleClose }
          ]
        );
        return;
      }

      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setDetectedItems(results);
      setSelectedItems(new Set(results.map((item) => item.itemName)));
      setShowResults(true);

    } catch (error: any) {
      console.error('Camera capture or AI analysis failed:', error);
      
      let errorMessage = 'Failed to analyze the image. ';
      
      if (error.message?.includes('API')) {
        errorMessage += 'Please check your AI API key in settings.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage += 'Please check your internet connection.';
      } else {
        errorMessage += 'Please try again.';
      }

      Alert.alert('Analysis Failed', errorMessage, [
        { text: 'Try Again', onPress: () => setIsAnalyzing(false) },
        { text: 'Cancel', onPress: handleClose }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleItemSelection = (itemName: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemName)) {
      newSelection.delete(itemName);
    } else {
      newSelection.add(itemName);
    }
    setSelectedItems(newSelection);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddSelectedItems = async () => {
    const itemsToAdd = detectedItems.filter((item) =>
      selectedItems.has(item.itemName)
    );

    if (itemsToAdd.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to add.');
      return;
    }

    const result = await executeAsync(async () => {
      for (const item of itemsToAdd) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (item.estimatedExpiry || 7));
        
        await PantryDatabase.addItem({
          name: item.itemName,
          quantity: 1,
          unit: 'pcs',
          location: item.suggestedLocation || 'Pantry',
          expiryDate: expiryDate.toISOString(),
        });
      }
    }, 'Adding detected items');

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onItemsAdded();
      handleClose();
      
      Alert.alert(
        '✅ Items Added Successfully!',
        `Added ${itemsToAdd.length} item${itemsToAdd.length > 1 ? 's' : ''} to your pantry.`,
        [{ text: 'Great!', style: 'default' }]
      );
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.colors.success;
    if (confidence >= 0.6) return theme.colors.warning;
    return theme.colors.error;
  };

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <BlurView intensity={20} style={styles.overlay}>
          <View
            style={[
              styles.permissionContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <MaterialCommunityIcons
              name="brain"
              size={64}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.permissionTitle, { color: theme.colors.text }]}
            >
              AI Food Scanner
            </Text>
            <Text
              style={[
                styles.permissionText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Grant camera access to use our AI-powered food recognition technology.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <LinearGradient
                colors={theme.gradients.primary as any}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Enable Camera</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text
                style={[
                  styles.cancelText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {!showResults ? (
          <CameraView 
            ref={cameraRef} 
            style={styles.camera} 
            facing="back"
            flash={flashEnabled ? 'on' : 'off'}
          >
            <View style={styles.cameraOverlay}>
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleClose}
                  >
                    <Feather name="x" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.headerCenter}>
                    <MaterialCommunityIcons
                      name="brain"
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text style={styles.headerTitle}>AI Food Scanner</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setFlashEnabled(!flashEnabled)}
                  >
                    <Feather 
                      name={flashEnabled ? "zap" : "zap-off"} 
                      size={24} 
                      color={flashEnabled ? "#F59E0B" : "#FFFFFF"} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Scanning Frame */}
                <View style={styles.scanFrame}>
                  <View style={styles.frameCorners}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                  
                  {!isAnalyzing && (
                    <Animated.View
                      style={[
                        styles.scanLine,
                        {
                          transform: [
                            {
                              translateY: scanAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 280],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  )}
                </View>

                <View style={styles.instructions}>
                  <Text style={styles.instructionTitle}>
                    {isAnalyzing ? 'Analyzing...' : 'Position Food Items'}
                  </Text>
                  <Text style={styles.instructionText}>
                    {isAnalyzing 
                      ? 'AI is identifying your food items' 
                      : 'Frame your food items clearly for best results'
                    }
                  </Text>
                </View>

                <View style={styles.controls}>
                  <TouchableOpacity
                    style={[
                      styles.captureButton,
                      isAnalyzing && { opacity: 0.5 },
                    ]}
                    onPress={handleCaptureAndAnalyze}
                    disabled={isAnalyzing}
                  >
                    <LinearGradient
                      colors={isAnalyzing ? ['#9CA3AF', '#6B7280'] : theme.gradients.primary as any}
                      style={styles.captureButtonGradient}
                    >
                      {isAnalyzing ? (
                        <ActivityIndicator size="large" color="#FFFFFF" />
                      ) : (
                        <Feather name="camera" size={32} color="#FFFFFF" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </CameraView>
        ) : (
          <SafeAreaView style={styles.resultsContainer}>
            <View
              style={[
                styles.resultsHeader,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <TouchableOpacity onPress={handleClose}>
                <Feather
                  name="x"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
              <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
                AI Detection Results
              </Text>
              <TouchableOpacity onPress={() => setShowResults(false)}>
                <Feather
                  name="camera"
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            {capturedImage && (
              <View style={styles.capturedImageContainer}>
                <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
              </View>
            )}

            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Detected Items ({detectedItems.length})
              </Text>
              
              {detectedItems.map((item, index) => {
                const isSelected = selectedItems.has(item.itemName);
                const confidenceColor = getConfidenceColor(item.confidence);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.detectedItem,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => toggleItemSelection(item.itemName)}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: theme.colors.text }]}>
                          {item.itemName}
                        </Text>
                        <Text style={[styles.itemCategory, { color: theme.colors.textSecondary }]}>
                          {item.category}
                        </Text>
                      </View>
                      
                      <View style={styles.itemMeta}>
                        <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}20` }]}>
                          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                            {Math.round(item.confidence * 100)}%
                          </Text>
                        </View>
                        
                        <View style={[
                          styles.checkbox,
                          {
                            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                          }
                        ]}>
                          {isSelected && (
                            <Feather name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <View style={styles.detailItem}>
                        <Feather name="map-pin" size={14} color={theme.colors.textTertiary} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          {item.suggestedLocation}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Feather name="calendar" size={14} color={theme.colors.textTertiary} />
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          Expires in {item.estimatedExpiry} days
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View
              style={[
                styles.resultsFooter,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.selectAllButton,
                  { borderColor: theme.colors.border }
                ]}
                onPress={() => {
                  const allSelected = selectedItems.size === detectedItems.length;
                  if (allSelected) {
                    setSelectedItems(new Set());
                  } else {
                    setSelectedItems(new Set(detectedItems.map(item => item.itemName)));
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.selectAllText, { color: theme.colors.textSecondary }]}>
                  {selectedItems.size === detectedItems.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.addButton,
                  selectedItems.size === 0 && { opacity: 0.5 },
                ]}
                onPress={handleAddSelectedItems}
                disabled={selectedItems.size === 0}
              >
                <LinearGradient
                  colors={theme.gradients.primary as any}
                  style={styles.addButtonGradient}
                >
                  <Feather name="plus" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>
                    Add {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
                  </Text>
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
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  safeArea: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  frameCorners: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#22C55E',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  instructions: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  controls: { paddingBottom: 40, alignItems: 'center' },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: { flex: 1 },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  resultsTitle: { fontSize: 20, fontWeight: '700' },
  capturedImageContainer: {
    height: 120,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemsList: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  detectedItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemCategory: { fontSize: 14 },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: { fontSize: 14 },
  resultsFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  selectAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  permissionContainer: {
    margin: 20,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: 24,
  },
  permissionButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  cancelButton: { paddingVertical: 16 },
  cancelText: { fontSize: 16, fontWeight: '600' },
});