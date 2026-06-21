import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useCartStore } from "@/src/stores/cart.store";
import { Tabs } from "expo-router";
import {
  ClipboardList,
  Home,
  MapPin,
  ShoppingCart,
  User,
} from "lucide-react-native";
import { Text, View } from "react-native";

function CartTabIcon({ color }: { color: string }) {
  const totalItems = useCartStore((s) => s.getTotalItems());

  return (
    <View style={{ width: 24, height: 24 }}>
      <ShoppingCart
        size={22}
        color={color}
        strokeWidth={2}
        style={{ position: "absolute", top: 1, left: 1 }}
      />
      {totalItems > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: "#eb2525",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: "#ffffff",
            }}
          >
            {totalItems > 99 ? "99+" : totalItems}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const c = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.mutedForeground,
        tabBarStyle: {
          backgroundColor: c.tab.bg,
          borderTopColor: c.tab.border,
        },
        headerStyle: { backgroundColor: c.tab.bg },
        headerTintColor: c.foreground,
        headerTitleStyle: { fontFamily: "PoppinsSemiBold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color }) => (
            <Home size={22} color={color} strokeWidth={2} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: "Terdekat",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MapPin size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Keranjang",
          headerShown: false,
          tabBarIcon: ({ color }) => <CartTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Pesanan",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <ClipboardList size={22} color={color} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <User size={22} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
