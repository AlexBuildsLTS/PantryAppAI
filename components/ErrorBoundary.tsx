/**
 * @component ErrorBoundary
 * Catches JavaScript errors anywhere in the child component tree.
 */
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="items-center justify-center flex-1 p-10 bg-background dark:bg-black">
          <Feather name="alert-circle" size={64} color="#EF4444" />
          <Text className="mt-6 text-2xl font-bold text-white">
            Something went wrong
          </Text>
          <Text className="mt-2 mb-8 text-center text-text-secondary">
            {this.state.error?.message}
          </Text>
          <TouchableOpacity
            className="px-8 py-4 bg-primary rounded-2xl"
            onPress={() => this.setState({ hasError: false })}
          >
            <Text className="font-bold text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
