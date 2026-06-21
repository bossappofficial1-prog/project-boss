import { ScheduleModal } from "@/features/cart/components/schedule-modal";
import type { CartItem, SelectedSchedule } from "@/features/cart";
import { resolveImageSource } from "@/lib/image";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { mapProduct } from "@/src/lib/utils";
import {
  Calendar,
  Clock,
  Minus,
  Plus,
  ShoppingCart,
  Timer,
  Trash2,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatScheduleDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

export function CartItemCard({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateSlot,
}: {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateSlot?: (itemId: string, schedule: SelectedSchedule) => void;
}) {
  const c = useThemeColors();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const isService = item.type === "SERVICE";
  const Icon = mapProduct[item.type]?.icon || ShoppingCart;

  const handleScheduleSelect = useCallback(
    (schedule: SelectedSchedule) => {
      if (!schedule?.slot?.id) return;
      onUpdateSlot?.(item.id, schedule);
      setShowScheduleModal(false);
    },
    [item.id, onUpdateSlot],
  );

  const formattedSlot = useMemo(() => {
    if (!item.slotDate || !item.slotStartTime || !item.slotEndTime) return null;
    return {
      date: formatScheduleDate(item.slotDate),
      time: `${item.slotStartTime} - ${item.slotEndTime}`,
    };
  }, [item.slotDate, item.slotStartTime, item.slotEndTime]);

  return (
    <View
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      }}
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Image
          source={
            item.image
              ? resolveImageSource(item.image)
              : require("@assets/images/default-product.png")
          }
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            backgroundColor: c.muted,
          }}
          resizeMode="cover"
        />

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text
                style={{
                  fontSize: 13.5,
                  fontWeight: "500",
                  color: c.foreground,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 2,
                }}
              >
                <Icon
                  color={`#${mapProduct[item.type]?.color || "a3a3a3"}`}
                  size={11}
                />
                <Text
                  style={{ fontSize: 10.5, color: c.mutedForeground }}
                  numberOfLines={1}
                >
                  {mapProduct[item.type]?.label} · {item.outletName}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => onRemoveItem(item.id)}
              hitSlop={6}
              style={{
                width: 24,
                height: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={15} color={c.mutedForeground} />
            </Pressable>
          </View>

          {isService && formattedSlot && (
            <View
              style={{
                marginTop: 6,
                padding: 8,
                borderRadius: 8,
                backgroundColor: `${c.primary}08`,
                borderWidth: 1,
                borderColor: `${c.primary}20`,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Calendar size={12} color={c.primary} />
                <Text
                  style={{ fontSize: 11, color: c.foreground, flex: 1 }}
                  numberOfLines={1}
                >
                  {formattedSlot.date}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <Clock size={12} color={c.primary} />
                <Text style={{ fontSize: 11, color: c.mutedForeground }} numberOfLines={1}>
                  {formattedSlot.time}
                </Text>
              </View>
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
            }}
          >
            {isService ? (
              <Pressable
                onPress={() => setShowScheduleModal(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  backgroundColor: `${c.primary}15`,
                }}
              >
                <Timer size={12} color={c.primary} />
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: "500",
                    color: c.primary,
                  }}
                >
                  {formattedSlot ? "Ganti Jadwal" : "Pilih Jadwal"}
                </Text>
              </Pressable>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Pressable
                  onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  style={({ pressed }: any) => ({
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: c.border,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: item.quantity <= 1 ? 0.4 : pressed ? 0.7 : 1,
                  })}
                >
                  <Minus size={13} color={c.foreground} />
                </Pressable>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: c.foreground,
                    minWidth: 20,
                    textAlign: "center",
                  }}
                >
                  {item.quantity}
                </Text>
                <Pressable
                  onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={
                    !!(item.maxQuantity && item.quantity >= item.maxQuantity)
                  }
                  style={({ pressed }: any) => ({
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: c.border,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity:
                      item.maxQuantity != null &&
                      item.quantity >= item.maxQuantity
                        ? 0.4
                        : pressed
                          ? 0.7
                          : 1,
                  })}
                >
                  <Plus size={13} color={c.foreground} />
                </Pressable>
              </View>
            )}

            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: c.primary,
              }}
            >
              {formatPrice(item.price * item.quantity)}
            </Text>
          </View>
        </View>
      </View>

      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSelectSchedule={handleScheduleSelect}
          productName={item.name}
          productId={item.productId}
          outletId={item.outletId}
          durationMinutes={item.serviceDurationMinutes}
        />
      )}
    </View>
  );
}
