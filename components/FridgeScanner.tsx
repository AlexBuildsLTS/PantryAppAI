import * as React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur'; // Import BlurView as a named import
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera as CameraIcon, Sparkles, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface FridgeScannerProps {
  visible: boolean;
  onClose: () => void;
  onItemsDetected: (items: string[]) => void;
}

const { width, height } = Dimensions.get('window');

export function FridgeScanner({ visible, onClose, onItemsDetected }: FridgeScannerProps) {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [scanAnimation] = React.useState(new Animated.Value(0));
  const [pulseAnimation] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    if (visible) {
      startAnimations();
    } else { scanAnimation.stopAnimation(); pulseAnimation.stopAnimation(); } // Fix: Use stopAnimation() instead of stop()
  }, [visible]);

  const startAnimations = () => {
    // Scanning line animation (looping)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for scan button (looping)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis - in production, this would call an AI service
    // like Google Vision API, AWS Rekognition, or a custom ML model
    setTimeout(() => {
      const mockDetectedItems = [
        'Milk',
        'Eggs',
        'Cheese',
        'Apples',
        'Carrots',
        'Yogurt',
        'Orange Juice',
        'Lettuce'
      ];
      
      setIsAnalyzing(false);
      onItemsDetected(mockDetectedItems);
      onClose();
      
      Alert.alert(
        'Items Detected! 🎉',
        `Found ${mockDetectedItems.length} items in your fridge. They've been added to your pantry!`,
        [{ text: 'Great!', style: 'default' }]
      );
    }, 3000);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return visible ? ( 
      <Modal visible={visible} animationType="slide" transparent={true}> 
        <BlurView intensity={20} style={styles.overlay}>
          <View style={[styles.permissionContainer, { backgroundColor: theme.colors.surface }]}>
            <CameraIcon size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
              Camera Permission Required
            </Text>
            <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
              We need camera access to scan your fridge and automatically identify food items using AI.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Grant Permission</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    ) : null;
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView style={styles.camera}>
          <View style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>AI Fridge Scanner</Text>
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
                      AI is analyzing your fridge...
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.instructions}>
              <Sparkles size={24} color="#22C55E" />
              <Text style={styles.instructionText}>
                Position your fridge contents in the frame
              </Text>
              <Text style={styles.instructionSubtext}>
                Our AI will automatically identify food items
              </Text>
            </View>

            <View style={styles.controls}>
              <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
                <TouchableOpacity
                  style={[styles.scanButton, isAnalyzing && styles.scanButtonDisabled]}
                  onPress={analyzeImage}
                  disabled={isAnalyzing}
                >
                  <LinearGradient
                    colors={isAnalyzing ? ['#9CA3AF', '#6B7280'] : ['#22C55E', '#16A34A']}
                    style={styles.scanButtonGradient}
                  >
                    {isAnalyzing ? (
                      <RefreshCw size={28} color="#FFFFFF" />
                    ) : (
                      <Sparkles size={28} color="#FFFFFF" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </CameraView>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  analysisText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
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
  scanButton: {
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
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    borderRadius: 20,
    margin: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
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