import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-xl font-semibold text-foreground">
          Halaman tidak ditemukan
        </Text>
        <Link href="/" className="mt-4">
          <Text className="text-primary text-base">Kembali ke beranda</Text>
        </Link>
      </View>
    </>
  );
}
