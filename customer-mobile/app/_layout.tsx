import { ThemeProvider } from "@/components/ThemeProvider";
import { SnackbarProvider } from "@/components/ui/snackbar";
import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

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

  useEffect(() => {
    if (error) throw error;
  }, [error]);
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SnackbarProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootLayoutInner />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
