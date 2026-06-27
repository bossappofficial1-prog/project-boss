import { ThemeProvider } from "@/components/ThemeProvider";
import { SnackbarProvider } from "@/components/ui/snackbar";
import AppUpdatePrompt from "@/src/components/app-update-prompt";
import { queryClient } from "@/lib/query-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { SocketProvider } from "@/src/lib/socket-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
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
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    // Jangan hideAsync dulu — tunggu sampai kita tahu route tujuan
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setNeedsOnboarding(!val);
      setOnboardingChecked(true);
    });
  }, [loaded]);

  useEffect(() => {
    if (!onboardingChecked) return;
    if (needsOnboarding) {
      router.replace("/onboarding");
    } else {
      router.replace("/(tabs)");
    }
    SplashScreen.hideAsync();
  }, [onboardingChecked, needsOnboarding]);

  if (!loaded || !onboardingChecked) return null;

  return (
    <SnackbarProvider>
      <AppUpdatePrompt />
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
