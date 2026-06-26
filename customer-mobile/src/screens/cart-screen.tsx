import { CartItemCard } from "@/features/cart/components/cart-item-card";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useCartStore } from "@/src/stores/cart.store";
import { router } from "expo-router";
import {
  CheckCircle,
  Circle,
  ShoppingCart,
  Store,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function CartScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const tableId = useCartStore((s) => s.tableId);
  const tableName = useCartStore((s) => s.tableName);
  const tableOutletId = useCartStore((s) => s.tableOutletId);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateItem = useCartStore((s) => s.updateItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);

  const handleUpdateSlot = useCallback(
    (itemId: string, schedule: any) => {
      updateItem(itemId, {
        selectedSlot: schedule.slot.id,
        slotStartTime: schedule.slot.startTime,
        slotEndTime: schedule.slot.endTime,
        slotDate: schedule.slot.date,
      });
    },
    [updateItem],
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const outletMap = new Map<
    string,
    { name: string; slug: string; items: typeof items }
  >();
  for (const item of items) {
    const key = item.outletId;
    if (!outletMap.has(key)) {
      outletMap.set(key, { name: item.outletName, slug: item.slug, items: [] });
    }
    outletMap.get(key)!.items.push(item);
  }
  const outletGroups = Array.from(outletMap.entries());

  const selectedItems = selectedOutletId
    ? outletMap.get(selectedOutletId)?.items || []
    : [];
  const selectedTotal = selectedItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: insets.top,
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: c.muted,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <ShoppingCart size={32} color={c.mutedForeground} strokeWidth={1.5} />
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: c.foreground,
            marginBottom: 6,
          }}
        >
          Keranjang Kosong
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: c.mutedForeground,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Tambahkan produk dari outlet untuk memulai pesanan
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)")}
          style={{
            marginTop: 20,
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 12,
            backgroundColor: c.primary,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: c.primaryForeground,
            }}
          >
            Mulai Belanja
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: c.card,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <View style={{ gap: 2 }}>
          <Text
            style={{ fontSize: 18, fontWeight: "700", color: c.foreground }}
          >
            Keranjang
          </Text>
          {totalItems > 0 && (
            <Text style={{ fontSize: 11, color: c.mutedForeground }}>
              {totalItems} item · {outletGroups.length} outlet
            </Text>
          )}
        </View>
        {items.length > 0 && (
          <Pressable
            onPress={clearCart}
            hitSlop={8}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Trash2 size={13} color={c.destructive} />
            <Text
              style={{ fontSize: 12, fontWeight: "600", color: c.destructive }}
            >
              Hapus Semua
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {outletGroups.length > 1 && (
          <View
            style={{
              marginHorizontal: 12,
              marginTop: 8,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 8,
              backgroundColor: `${c.primary}10`,
            }}
          >
            <Text
              style={{ fontSize: 11.5, color: c.foreground, lineHeight: 16 }}
            >
              Pilih satu outlet untuk checkout. Item dari outlet lain tidak
              diproses.
            </Text>
          </View>
        )}

        {outletGroups.map(([outletId, group]) => {
          const isSelected = selectedOutletId === outletId;
          const groupTotal = group.items.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0,
          );

          return (
            <Pressable
              key={outletId}
              onPress={() => setSelectedOutletId(outletId)}
              style={{
                marginTop: 8,
                backgroundColor: c.card,
                borderRadius: 12,
                marginHorizontal: 12,
                overflow: "hidden",
                borderWidth: isSelected ? 1.5 : 1,
                borderColor: isSelected ? c.primary : c.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                {isSelected ? (
                  <CheckCircle size={17} color={c.primary} />
                ) : (
                  <Circle size={17} color={c.mutedForeground} />
                )}

                <Pressable
                  onPress={() => router.push(`/outlet/${group.slug}`)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <Store size={14} color={c.primary} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: c.foreground,
                      marginRight: 6,
                    }}
                    numberOfLines={1}
                  >
                    {group.name}
                  </Text>
                  {tableId && tableOutletId === outletId && (
                    <View
                      style={{
                        backgroundColor: `${c.primary}15`,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        borderWidth: 0.5,
                        borderColor: `${c.primary}40`,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "700",
                          color: c.primary,
                          textTransform: "uppercase",
                        }}
                      >
                        {tableName || tableId}
                      </Text>
                    </View>
                  )}
                </Pressable>
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: "600",
                    color: c.primary,
                  }}
                >
                  {formatPrice(groupTotal)}
                </Text>
              </View>

              {group.items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeItem}
                  onUpdateSlot={handleUpdateSlot}
                />
              ))}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bottom checkout bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom + 10,
          backgroundColor: c.card,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 12.5, color: c.mutedForeground }}>
            {selectedOutletId
              ? `Total · ${selectedCount} item`
              : "Pilih outlet"}
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: selectedOutletId ? c.primary : c.mutedForeground,
            }}
          >
            {selectedOutletId ? formatPrice(selectedTotal) : "—"}
          </Text>
        </View>

        <Pressable
          disabled={!selectedOutletId}
          onPress={() => {
            if (!selectedOutletId) return;
            router.push({
              pathname: "/checkout",
              params: { outletId: selectedOutletId },
            });
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: selectedOutletId ? c.primary : c.muted,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: selectedOutletId ? c.primaryForeground : c.mutedForeground,
            }}
          >
            {selectedOutletId
              ? `Checkout (${selectedCount})`
              : "Pilih outlet terlebih dahulu"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
