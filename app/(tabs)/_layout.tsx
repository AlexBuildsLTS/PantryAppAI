import { Tabs } from 'expo-router';
import { ShoppingCart, Package, Bell, Settings, ChefHat, BarChart3 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{ 
          title: 'Shopping',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{ 
          title: 'Recipes',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <ChefHat size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ 
          title: 'Analytics',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts', 
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <Bell size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}