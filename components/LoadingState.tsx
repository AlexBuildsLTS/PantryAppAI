import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface ThemeColors {
  primary: string;
  text: string;
}

interface LoadingStateProps {
  colors: ThemeColors;
  active: boolean;
}

/**
 * LoadingState: Visual feedback node.
 */
const LoadingState: React.FC<LoadingStateProps> = ({ colors, active }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={colors.primary} />
    {active && <Text style={[styles.aiLoadText, { color: colors.text }]}>GEMINI IS ANALYZING VISUALS...</Text>}
  </View>
);

const styles = {
  aiLoadText: { marginTop: 25, fontWeight: '900' as const, letterSpacing: 2, fontSize: 12 },
};

export default LoadingState;