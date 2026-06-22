import { ThemeProvider } from "@/components/ThemeProvider";
import { SnackbarProvider } from "@/components/ui/snackbar";
import { queryClient } from "@/lib/query-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { SocketProvider } from "@/src/lib/socket-context";
import { QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const ONBOARDING_KEY = "hasSeenOnboarding";

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const [loaded, error] = useFonts({
    PoppinsLight: require("../assets/fonts/Poppins-Light.ttf"),
    PoppinsRegular: require("../assets/fonts/Poppins-Regular.ttf"),
    PoppinsMedium: require("../assets/fonts/Poppins-Medium.ttf"),
    PoppinsSemiBold: require("../assets/fonts/Poppins-SemiBold.ttf"),
    PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingChecked(true);
      if (!val && segments[0] !== "onboarding") {
        setTimeout(() => router.replace("/onboarding"), 500);
      }
    });
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SnackbarProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="outlet/[slug]"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "ios_from_right",
          }}
        />
        <Stack.Screen
          name="outlet/[slug]/product/[id]"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "ios_from_right",
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "ios_from_right",
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "ios_from_right",
          }}
        />
        <Stack.Screen
          name="payment/[orderId]"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "ios_from_right",
          }}
        />
      </Stack>
    </SnackbarProvider>
  );
}

export default function RootLayout() {
  const c = useThemeColors();
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.primary }}>
        <SocketProvider>
          <ThemeProvider>
            <RootLayoutInner />
          </ThemeProvider>
        </SocketProvider>
      </SafeAreaView>
    </QueryClientProvider>
  );
}
