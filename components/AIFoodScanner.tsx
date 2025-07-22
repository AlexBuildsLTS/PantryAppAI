import * as React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Animated,
  ActivityIndicator,
  ColorValue,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Camera, Sparkles, Check, CreditCard as Edit3, Plus, Zap, Brain } from 'lucide-react-native';
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
  const [isAnalyzing, setIsAnalyzing] = React.useState(false); // Fix: Removed unused Camera permissions hook
  const [detectedItems, setDetectedItems] = React.useState<AIDetectionResult[]>([]);
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [showResults, setShowResults] = React.useState(false);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [scanAnimation] = React.useState(new Animated.Value(0));
  const { execute: executeAsync } = useAsyncOperation();

  React.useEffect(() => {
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

  const handleCapture = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate image capture and AI analysis
      const mockImageUri = 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg';
      setCapturedImage(mockImageUri);
      
      const results = await AIService.analyzeImage(mockImageUri);
      setDetectedItems(results);
      setSelectedItems(new Set(results.map(item => item.itemName)));
      setShowResults(true);
    } catch (error) {
      Alert.alert('Analysis Failed', 'Could not analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleItemSelection = (itemName: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName);
    } else {
      newSelected.add(itemName);
    }
    setSelectedItems(newSelected);
  };

  const handleAddSelectedItems = async () => {
    const itemsToAdd = detectedItems.filter(item => selectedItems.has(item.itemName));
    
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
      onItemsAdded();
      handleClose();
      Alert.alert(
        'Items Added! 🎉',
        `Successfully added ${itemsToAdd.length} items to your pantry.`,
        [{ text: 'Great!', style: 'default' }]
      );
    }
  };

  const handleClose = () => {
    setShowResults(false);
    setDetectedItems([]);
    setSelectedItems(new Set());
    setCapturedImage(null);
    setIsAnalyzing(false);
    onClose();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return theme.colors.success;
    if (confidence >= 0.7) return theme.colors.warning;
    return theme.colors.error;
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
          <View style={[styles.permissionContainer, { backgroundColor: theme.colors.surface }]}>
            <Brain size={64} color={theme.colors.primary} />
            <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
              AI Food Scanner
            </Text>
            <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
              Grant camera access to use our AI-powered food recognition system.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <LinearGradient
                colors={theme.gradients.primary as [ColorValue, ColorValue, ...ColorValue[]]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Enable Camera</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
    </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {!showResults ? (
          <CameraView style={styles.camera}>
            <View style={styles.cameraOverlay}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Brain size={24} color="#FFFFFF" />
                  <Text style={styles.headerTitle}>AI Food Scanner</Text>
                </View>
                <View style={styles.placeholder} />
              </View>

              <View style={styles.scanArea}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  
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

                  {isAnalyzing && (
                    <View style={styles.analysisOverlay}>
                      <ActivityIndicator size="large" color="#22C55E" />
                      <Text style={styles.analysisText}>
                        AI is analyzing your food...
                      </Text>
                      <Text style={styles.analysisSubtext}>
                        This may take a few seconds
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.instructions}>
                <Sparkles size={24} color="#22C55E" />
                <Text style={styles.instructionText}>
                  Position food items in the frame
                </Text>
                <Text style={styles.instructionSubtext}>
                  Our AI will identify and categorize them automatically
                </Text>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity
                  style={[styles.captureButton, isAnalyzing && styles.captureButtonDisabled]}
                  onPress={handleCapture}
                  disabled={isAnalyzing}
                >
                  <LinearGradient
                    colors={isAnalyzing ? ['#9CA3AF', '#6B7280'] : ['#22C55E', '#16A34A']}
                    style={styles.captureButtonGradient}
                  >
                    {isAnalyzing ? (
                      <Zap size={32} color="#FFFFFF" />
                    ) : (
                      <Camera size={32} color="#FFFFFF" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        ) : (
          <View style={[styles.resultsContainer, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.resultsHeader, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
                AI Detection Results
              </Text>
              <View style={styles.placeholder} />
            </View>

            {capturedImage && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageLabel}>Analyzed Image</Text>
                </View>
              </View>
            )}

            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Detected Items ({detectedItems.length})
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                Select items to add to your pantry
              </Text>

              {detectedItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.detectedItem,
                    { 
                      backgroundColor: theme.colors.surface,
                      borderColor: selectedItems.has(item.itemName) 
                        ? theme.colors.primary 
                        : theme.colors.border
                    }
                  ]}
                  onPress={() => toggleItemSelection(item.itemName)}
                >
                  <View style={styles.itemInfo}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemName, { color: theme.colors.text }]}>
                        {item.itemName}
                      </Text>
                      <View style={styles.confidenceBadge}>
                        <View 
                          style={[
                            styles.confidenceDot, 
                            { backgroundColor: getConfidenceColor(item.confidence) }
                          ]} 
                        />
                        <Text style={[styles.confidenceText, { color: theme.colors.textSecondary }]}>
                          {Math.round(item.confidence * 100)}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemCategory, { color: theme.colors.textSecondary }]}>
                        {item.category} • {item.suggestedLocation}
                      </Text>
                      <Text style={[styles.itemExpiry, { color: theme.colors.textSecondary }]}>
                        Expires in ~{item.estimatedExpiry} days
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemActions}>
                    {selectedItems.has(item.itemName) ? (
                      <View style={[styles.selectedIcon, { backgroundColor: theme.colors.primary }]}>
                        <Check size={20} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={[styles.unselectedIcon, { borderColor: theme.colors.border }]} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.resultsFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.retakeButton, { borderColor: theme.colors.border }]}
                onPress={() => setShowResults(false)}
              >
                <Camera size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.retakeText, { color: theme.colors.textSecondary }]}>
                  Retake
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.addButton,
                  selectedItems.size === 0 && { opacity: 0.5 }
                ]}
                onPress={handleAddSelectedItems}
                disabled={selectedItems.size === 0}
              >
                <LinearGradient colors={theme.gradients.primary as any} style={styles.addButtonGradient}>
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>
                    Add {selectedItems.size} Items
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 300,
    height: 300,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#22C55E',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
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
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  analysisText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  analysisSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  instructions: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  controls: {
    paddingBottom: 60,
    alignItems: 'center',
  },
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
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  imagePreview: {
    height: 120,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  imageLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  detectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemDetails: {
    gap: 2,
  },
  itemCategory: {
    fontSize: 14,
  },
  itemExpiry: {
    fontSize: 12,
  },
  itemActions: {
    marginLeft: 12,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  resultsFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
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
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});