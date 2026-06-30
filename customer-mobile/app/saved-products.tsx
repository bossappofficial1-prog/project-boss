import { router } from "expo-router";
import { Bookmark, Store } from "lucide-react-native";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/empty-state";
import { StackHeader } from "@/src/components/ui/stack-header";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { formatPrice } from "@/src/lib/utils";
import { useFavoritesStore } from "@/src/stores/favorites.store";
import defaultProduct from "@assets/images/default-product.png";

export default function SavedProductsScreen() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { savedProducts, toggleSavedProduct } = useFavoritesStore();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <StackHeader title="Produk Tersimpan" onBack={() => router.back()} />

      {savedProducts.length === 0 ? (
        <View
          style={{
            marginVertical: 60,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <EmptyState
            icon={Bookmark}
            title="Belum Ada Produk Tersimpan"
            description="Simpan produk yang Anda minati untuk menemukannya dengan mudah di sini."
          />
        </View>
      ) : (
        <FlatList
          data={savedProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (item.outletSlug) {
                  router.push(
                    `/outlet/${item.outletSlug}/product/${item.id}?from=save-products`,
                  );
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
                  item.image?.startsWith("/")
                    ? defaultProduct
                    : item.image
                      ? { uri: item.image }
                      : defaultProduct
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
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                <Text
                  style={{ fontSize: 13, fontWeight: "700", color: c.primary }}
                >
                  {formatPrice(item.price)}
                </Text>

                {item.outletName && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 2,
                    }}
                  >
                    <Store size={12} color={c.mutedForeground} />
                    <Text
                      style={{ fontSize: 11, color: c.mutedForeground }}
                      numberOfLines={1}
                    >
                      {item.outletName}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => toggleSavedProduct(item)}
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
                <Bookmark size={16} color={c.primary} fill={c.primary} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
