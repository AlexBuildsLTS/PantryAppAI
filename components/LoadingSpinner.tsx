/**
 * @component LoadingSpinner
 * A standardized loading indicator for data fetching and async operations.
 */
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 'large',
}: Props) {
  return (
    <View className="items-center justify-center flex-1 p-5 bg-background dark:bg-black">
      <ActivityIndicator size={size} color="#22C55E" />
      {message && (
        <Text className="mt-4 text-base font-medium text-center text-text-secondary">
          {message}
        </Text>
      )}
    </View>
  );
}
