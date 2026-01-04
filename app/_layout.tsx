import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';

// Theme Context
import { ThemeProvider } from '@/contexts/ThemeContext';

// 1. Initialize the QueryClient (This stops the DEP0190 Error)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen once the app is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    // 2. Wrap everything in the QueryClientProvider
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Main Tab Navigation */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Fixes the "No route named modal" warning */}
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal',
              animation: 'slide_from_bottom' 
            }} 
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}