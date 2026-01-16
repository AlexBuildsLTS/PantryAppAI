
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface ThemeColors {
  border: string;
  text: string;
  textSecondary: string;
}

interface EmptyStateProps {
  colors: ThemeColors;
}

/**
 * EmptyState: Placeholder for empty records.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ colors }) => (
  <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyWrap}>
    <MaterialCommunityIcons name="package-variant-closed" size={100} color={colors.border} />
    <Text style={[styles.emptyTitle, { color: colors.text }]}>Vault Empty</Text>
    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Add records to begin enterprise tracking.</Text>
  </Animated.View>
);



const styles = StyleSheet.create({
  emptyWrap: { flex: 1, alignItems: 'center' as const, marginTop: 80, paddingHorizontal: 60 },
  emptyTitle: { fontSize: 32, fontWeight: '900', marginTop: 25 },
  emptySub: { fontSize: 15, textAlign: 'center', marginTop: 10, opacity: 0.6 },
});

export default EmptyState;