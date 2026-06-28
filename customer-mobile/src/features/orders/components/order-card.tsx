import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { formatDate, formatPrice } from "@/src/lib/utils";
import { OrderDetail } from "@/src/types/order";
import {
  AlertCircle,
  ChevronRight,
  Phone,
  RefreshCw,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { STATUS_CONFIG } from "./utils";

export function OrderCard({
  order,
  onPress,
  onPay,
  onCancel,
  onConfirm,
  onContact,
  onReorder,
  isBusy,
}: {
  order: OrderDetail;
  onPress?: () => void;
  onPay?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  onContact?: () => void;
  onReorder?: () => void;
  isBusy?: boolean;
}) {
  const c = useThemeColors();
  const config = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PROCESSING;
  const Icon = config.icon;
  const isAwaitingVerification =
    order.orderStatus === "AWAITING_PAYMENT" &&
    (order.transaction?.status === "AWAITING_VERIFICATION" ||
      order.transaction?.status === "PROOF_SUBMITTED");
  const hasServiceProduct = order.items.some(
    (i) => i.product.type === "SERVICE",
  );
  const statusLabel = isAwaitingVerification ? "Verifikasi" : config.label;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: c.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
        opacity: 1,
      }}
    >
      {/* Accent top bar */}
      <View style={{ height: 3, backgroundColor: config.color }} />

      {/* Header: outlet + status */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flex: 1,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              backgroundColor: config.color + 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={16} color={config.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: c.foreground }}
              numberOfLines={1}
            >
              {order.outlet.name}
            </Text>
            <Text
              style={{ fontSize: 11, color: c.mutedForeground, marginTop: 1 }}
            >
              {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 10,
              backgroundColor: config.color + 20,
            }}
          >
            <Text
              style={{ fontSize: 10, fontWeight: "600", color: config.color }}
            >
              {statusLabel}
            </Text>
          </View>
          <ChevronRight size={14} color={c.mutedForeground} />
        </View>
      </View>

      {/* Divider */}
      <View
        style={{ height: 1, backgroundColor: c.border, marginHorizontal: 14 }}
      />

      {/* Items preview */}
      <View style={{ paddingHorizontal: 14, paddingVertical: 10, gap: 4 }}>
        {order.items.slice(0, 3).map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: c.mutedForeground,
                  minWidth: 18,
                }}
              >
                {item.quantity}x
              </Text>
              <Text
                style={{ fontSize: 12, color: c.foreground, flex: 1 }}
                numberOfLines={1}
              >
                {item.product.name}
              </Text>
            </View>
            <Text
              style={{ fontSize: 12, color: c.mutedForeground, marginLeft: 8 }}
            >
              {formatPrice(item.priceAtTimeOfOrder * item.quantity)}
            </Text>
          </View>
        ))}
        {order.items.length > 3 && (
          <Text
            style={{ fontSize: 11, color: c.mutedForeground, marginTop: 2 }}
          >
            +{order.items.length - 3} item lainnya
          </Text>
        )}
      </View>

      {/* Cancellation reason */}
      {(order.cancellationReason || order.transaction?.rejectionNote) && (
        <View
          style={{
            marginHorizontal: 14,
            marginBottom: 8,
            padding: 8,
            borderRadius: 8,
            backgroundColor: `${c.destructive}0d`,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <AlertCircle
            size={13}
            color={c.destructive}
            style={{ marginTop: 1 }}
          />
          <Text
            style={{
              fontSize: 11,
              color: c.destructive,
              flex: 1,
              lineHeight: 16,
            }}
          >
            {order.cancellationReason || order.transaction?.rejectionNote}
          </Text>
        </View>
      )}

      {/* Footer: ID + total + actions */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <Text style={{ fontSize: 11, color: c.mutedForeground }}>
          #{order.id.slice(0, 8).toUpperCase()}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: c.foreground }}>
          {formatPrice(order.totalAmount)}
        </Text>
      </View>

      {/* Action buttons */}
      {(order.orderStatus === "AWAITING_PAYMENT" ||
        ["PROCESSING", "CONFIRMED"].includes(order.orderStatus) ||
        order.orderStatus === "COMPLETED") && (
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 14,
            paddingBottom: 12,
          }}
        >
          {order.orderStatus === "AWAITING_PAYMENT" &&
            !isAwaitingVerification && (
              <>
                <Pressable
                  onPress={onPay}
                  disabled={isBusy}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: c.primary,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: c.primaryForeground,
                    }}
                  >
                    Bayar Sekarang
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onCancel}
                  disabled={isBusy}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: c.border,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.mutedForeground,
                    }}
                  >
                    Batalkan
                  </Text>
                </Pressable>
              </>
            )}

          {["PROCESSING", "CONFIRMED"].includes(order.orderStatus) && (
            <>
              <Pressable
                onPress={onContact}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <Phone size={13} color={c.mutedForeground} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: c.foreground,
                  }}
                >
                  Hubungi
                </Text>
              </Pressable>
              {!hasServiceProduct && (
                <Pressable
                  onPress={onConfirm}
                  disabled={isBusy}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: c.primary,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: c.primaryForeground,
                    }}
                  >
                    Konfirmasi
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {order.orderStatus === "COMPLETED" && (
            <Pressable
              onPress={onReorder}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <RefreshCw size={13} color={c.mutedForeground} />
              <Text
                style={{ fontSize: 12, fontWeight: "500", color: c.foreground }}
              >
                Pesan Lagi
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}
