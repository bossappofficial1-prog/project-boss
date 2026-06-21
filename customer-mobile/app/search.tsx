import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  Package,
  Search as SearchIcon,
  Store,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getOutletById } from "@/features/outlet/services/outlet.service";
import { apiClient } from "@/services/api-client";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import defaultOutlet from "@assets/images/default-outlet.webp";
import defaultProduct from "@assets/images/default-product.png";

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
  const insets = useSafeAreaInsets();
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
        router.push(`/outlet/${outlet.slug}/product/${product.id}`);
      }
    } catch {
      // silent
    }
  }, []);

  const hasResults = outlets.length > 0 || products.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: c.topBar.bg,
          borderBottomWidth: 1,
          borderBottomColor: c.topBar.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={24} color={c.foreground} />
          </Pressable>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
              backgroundColor: c.search.bg,
              borderRadius: 12,
            }}
          >
            <SearchIcon size={18} color={c.mutedForeground} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Cari produk atau outlet..."
              placeholderTextColor={c.mutedForeground}
              style={{
                flex: 1,
                fontSize: 14,
                color: c.foreground,
                padding: 0,
              }}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <Text style={{ fontSize: 14, color: c.mutedForeground }}>
                  ✕
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : query.trim() && !hasResults ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: c.mutedForeground,
              textAlign: "center",
            }}
          >
            Tidak ditemukan hasil untuk "{query}"
          </Text>
        </View>
      ) : !query.trim() ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <SearchIcon
            size={48}
            color={c.mutedForeground}
            style={{ opacity: 0.3, marginBottom: 16 }}
          />
          <Text
            style={{
              fontSize: 15,
              color: c.mutedForeground,
              textAlign: "center",
            }}
          >
            Cari outlet atau produk favorit kamu
          </Text>
        </View>
      ) : (
        <View style={{ paddingBottom: 24 }}>
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
        </View>
      )}
    </View>
  );
}
