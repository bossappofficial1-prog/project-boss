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
import { EmptyState } from "../components/ui/empty-state";
import { StackHeader } from "../components/ui/stack-header";

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

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <StackHeader
        title="Keranjang"
        description={
          totalItems > 0
            ? `${totalItems} item · ${outletGroups.length} outlet`
            : undefined
        }
        rightContent={
          items.length > 0 && (
            <Pressable
              onPress={clearCart}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Trash2 size={13} color={c.destructive} />
            </Pressable>
          )
        }
      />

      {items.length == 0 ? (
        <View
          style={{
            top: insets.top,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <EmptyState
            title="Keranjang Kosong"
            icon={ShoppingCart}
            description="Tambahkan produk dari outlet untuk memulai pesanan"
            action={{
              label: "Mulai Belanja",
              onPress: () => router.push("/(tabs)"),
            }}
          />
        </View>
      ) : (
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
      )}

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
          disabled={!selectedOutletId || selectedCount == 0}
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
            backgroundColor: selectedOutletId
              ? selectedCount === 0
                ? c.muted
                : c.primary
              : c.muted,
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
