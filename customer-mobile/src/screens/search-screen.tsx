import { router, useLocalSearchParams } from "expo-router";
import {
  MapPin,
  Package,
  Search as SearchIcon,
  SearchSlash,
  Store,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { getOutletById } from "@/features/outlet/services/outlet.service";
import { apiClient } from "@/services/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import defaultOutlet from "@assets/images/default-outlet.webp";
import defaultProduct from "@assets/images/default-product.png";
import { EmptyState } from "../components/ui/empty-state";
import { LoadingState } from "../components/ui/loading-state";
import { StackHeader } from "../components/ui/stack-header";

interface SearchOutlet {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  address?: string | null;
  isOpen?: boolean | null;
  business?: { name?: string | null };
}

interface SearchProduct {
  id: string;
  name: string;
  image?: string | null;
  type: "GOODS" | "SERVICE" | "TICKET";
  outletId: string;
}

export default function SearchScreen() {
  const c = useThemeColors();
  const { q: initialQ } = useLocalSearchParams<{ q?: string }>();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState(initialQ || "");
  const [outlets, setOutlets] = useState<SearchOutlet[]>([]);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setOutlets([]);
      setProducts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [outletRes, productRes] = await Promise.all([
          apiClient.get<{ data: SearchOutlet[] }>(
            `/outlets?search=${encodeURIComponent(query.trim())}&take=5`,
          ),
          apiClient.get<{ data: SearchProduct[] }>(
            `/products/search?name=${encodeURIComponent(query.trim())}`,
          ),
        ]);
        setOutlets(outletRes.data || []);
        setProducts(productRes.data || []);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleProductPress = useCallback(async (product: SearchProduct) => {
    try {
      const outlet = await getOutletById(product.outletId);
      if (outlet.slug) {
        router.push(`/outlet/${outlet.slug}/product/${product.id}?from=search`);
      }
    } catch {
      // silent
    }
  }, []);

  const hasResults = outlets.length > 0 || products.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StackHeader
        variant="search"
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Cari produk atau outlet..."
        onBack={() => router.back()}
      />

      {isLoading ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginVertical: 80,
          }}
        >
          <LoadingState />
        </View>
      ) : query.trim() && !hasResults ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginVertical: 80,
          }}
        >
          <EmptyState
            icon={SearchSlash}
            title="Tidak Ditemukan"
            description={`Tidak ditemukan hasil untuk "${query}"`}
          />
        </View>
      ) : !query.trim() ? (
        <View
          style={{
            alignItems: "center",
            marginVertical: 80,
          }}
        >
          <EmptyState
            title="Cari outlet atau produk favorit kamu"
            icon={SearchIcon}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ paddingBottom: 24 }}
        >
          {outlets.length > 0 && (
            <View style={{ paddingTop: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: c.foreground,
                  paddingHorizontal: 16,
                  marginBottom: 8,
                }}
              >
                Outlet
              </Text>
              {outlets.map((outlet) => (
                <Pressable
                  key={outlet.id}
                  onPress={() => {
                    if (outlet.slug) router.push(`/outlet/${outlet.slug}`);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                  }}
                >
                  <Image
                    source={
                      outlet.image
                        ? outlet.image.startsWith("/default")
                          ? defaultOutlet
                          : { uri: outlet.image }
                        : defaultOutlet
                    }
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      backgroundColor: c.skeleton,
                    }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                      numberOfLines={1}
                    >
                      {outlet.name}
                    </Text>
                    {outlet.address && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <MapPin size={11} color={c.mutedForeground} />
                        <Text
                          style={{ fontSize: 12, color: c.mutedForeground }}
                          numberOfLines={1}
                        >
                          {outlet.address}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Store size={18} color={c.mutedForeground} />
                </Pressable>
              ))}
            </View>
          )}

          {products.length > 0 && (
            <View style={{ paddingTop: outlets.length > 0 ? 8 : 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: c.foreground,
                  paddingHorizontal: 16,
                  marginBottom: 8,
                }}
              >
                Produk
              </Text>
              {products.map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => handleProductPress(product)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                  }}
                >
                  <Image
                    source={
                      product.image
                        ? !product.image.startsWith("/defaults")
                          ? { uri: product.image }
                          : defaultProduct
                        : defaultProduct
                    }
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      backgroundColor: c.skeleton,
                    }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 2,
                      }}
                    >
                      <Package size={11} color={c.mutedForeground} />
                      <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                        {product.type === "GOODS"
                          ? "Barang"
                          : product.type === "SERVICE"
                            ? "Layanan"
                            : "Tiket"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
