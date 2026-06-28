import { router } from "expo-router";
import { Heart, MapPin, StoreIcon } from "lucide-react-native";
import { FlatList, Image, Pressable, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { StackHeader } from "@/src/components/ui/stack-header";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useFavoritesStore } from "@/src/stores/favorites.store";
import defaultOutlet from "@assets/images/default-outlet.webp";

export default function FavoriteOutletsScreen() {
  const c = useThemeColors();
  const { favoriteOutlets, toggleFavoriteOutlet } = useFavoritesStore();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <StackHeader title="Outlet Favorit" onBack={() => router.back()} />

      {favoriteOutlets.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <EmptyState
            icon={StoreIcon}
            title="Belum Ada Outlet Favorit"
            description="Tandai outlet favorit Anda untuk menemukannya dengan mudah di sini."
          />
        </View>
      ) : (
        <FlatList
          data={favoriteOutlets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (item.slug) {
                  router.push(`/outlet/${item.slug}`);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                backgroundColor: c.card,
                borderWidth: 1,
                borderColor: c.border,
                gap: 12,
              }}
            >
              <Image
                source={
                  item.image?.startsWith("/default")
                    ? defaultOutlet
                    : item.image
                    ? { uri: item.image }
                    : defaultOutlet
                }
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  backgroundColor: c.muted,
                }}
                resizeMode="cover"
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: c.foreground,
                  }}
                >
                  {item.name}
                </Text>
                {item.address && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <MapPin size={12} color={c.mutedForeground} />
                    <Text
                      style={{ fontSize: 12, color: c.mutedForeground }}
                      numberOfLines={1}
                    >
                      {item.address}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => toggleFavoriteOutlet(item)}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: c.muted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heart size={16} color={c.destructive} fill={c.destructive} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
