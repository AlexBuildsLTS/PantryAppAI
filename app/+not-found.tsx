import { Link, Stack } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center p-6">
        <View className="w-24 h-24 bg-red-500/10 rounded-[30px] items-center justify-center mb-6">
          <Feather name="alert-octagon" size={48} color="#EF4444" />
        </View>
        <Text className="mb-2 text-3xl font-black text-white">
          Lost in Space?
        </Text>
        <Text className="mb-10 text-base text-center text-white/40">
          We couldn't find the pantry you're looking for.
        </Text>

        <Link href="/" asChild>
          <TouchableOpacity className="px-10 py-4 shadow-lg bg-primary rounded-2xl shadow-primary/20">
            <Text className="text-lg font-bold text-white">
              Return to Kitchen
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}
