import { useThemeContext } from "@/src/components/ThemeProvider";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { formatDate, formatPrice } from "@/src/lib/utils";
import { OrderDetail } from "@/src/types/order";
import { Clock, Package, Phone, RefreshCw, ShoppingBag, Store, X } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DetailRow } from "./detail-row";
import { PAYMENT_STATUS_CONFIG, STATUS_CONFIG } from "./utils";

export function OrderDetailModal({
  order,
  onClose,
  c,
  onPay,
  onCancel,
  onConfirm,
  onContact,
  onReorder,
  isBusy,
}: {
  order: OrderDetail;
  onClose: () => void;
  c: ReturnType<typeof useThemeColors>;
  onPay?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  onContact?: () => void;
  onReorder?: () => void;
  isBusy?: boolean;
}) {
  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PROCESSING;
  const StatusIcon = cfg.icon;
  const insets = useSafeAreaInsets();
  const { colorScheme } = useThemeContext();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <View>
          <Text
            style={{ fontSize: 16, fontWeight: "700", color: c.foreground }}
          >
            Detail Pesanan
          </Text>
          <Text
            style={{ fontSize: 11, color: c.mutedForeground, marginTop: 1 }}
          >
            #{order.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: c.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} color={c.foreground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        {/* Status banner */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 14,
            borderRadius: 12,
            backgroundColor: colorScheme === "dark" ? cfg.bg + "10" : cfg.bg,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: `${cfg.color}20`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <StatusIcon size={20} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: cfg.color }}>
              {cfg.label}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: cfg.color,
                opacity: 0.7,
                marginTop: 2,
              }}
            >
              {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Cancellation reason */}
        {(order.cancellationReason || order.transaction?.rejectionNote) && (
          <View
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: `${c.destructive}0d`,
              borderLeftWidth: 3,
              borderLeftColor: c.destructive,
              gap: 4,
            }}
          >
            <Text
              style={{ fontSize: 11, fontWeight: "700", color: c.destructive }}
            >
              Alasan Pembatalan
            </Text>
            <Text
              style={{ fontSize: 12, color: c.destructive, lineHeight: 18 }}
            >
              {order.cancellationReason || order.transaction?.rejectionNote}
            </Text>
          </View>
        )}

        {/* Outlet & customer info */}
        <View style={{ gap: 6 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <Store size={13} color={c.mutedForeground} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: c.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Informasi
            </Text>
          </View>
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.border,
              overflow: "hidden",
            }}
          >
            {[
              { label: "Outlet", value: order.outlet.name },
              { label: "Pelanggan", value: order.customerDetails.name },
              { label: "Telepon", value: order.customerDetails.phone },
              { label: "Alamat", value: order.outlet.address },
            ].map((row, i, arr) => (
              <View key={row.label}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 11 }}>
                  <DetailRow label={row.label} value={row.value} c={c} />
                </View>
                {i < arr.length - 1 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: c.border,
                      marginHorizontal: 14,
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Items */}
        <View style={{ gap: 6 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <Package size={13} color={c.mutedForeground} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: c.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Item Pesanan
            </Text>
          </View>
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.border,
              overflow: "hidden",
            }}
          >
            {order.items.map((item, i) => (
              <View key={item.id}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                      numberOfLines={1}
                    >
                      {item.product.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: c.mutedForeground }}>
                      {item.quantity} x {formatPrice(item.priceAtTimeOfOrder)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: c.foreground,
                      marginLeft: 12,
                    }}
                  >
                    {formatPrice(item.priceAtTimeOfOrder * item.quantity)}
                  </Text>
                </View>
                {i < order.items.length - 1 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: c.border,
                      marginHorizontal: 14,
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Payment summary */}
        <View style={{ gap: 6 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <ShoppingBag size={13} color={c.mutedForeground} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: c.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Ringkasan Pembayaran
            </Text>
          </View>
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.border,
              overflow: "hidden",
            }}
          >
            {[
              order.transaction?.paymentMethod
                ? { label: "Metode", value: order.transaction.paymentMethod }
                : null,
              order.paymentStatus
                ? {
                    label: "Status Bayar",
                    value: PAYMENT_STATUS_CONFIG[order.paymentStatus].label,
                  }
                : null,
              order.midtransFee > 0
                ? {
                    label: "Biaya Layanan",
                    value: formatPrice(order.midtransFee),
                  }
                : null,
              order.taxAmount
                ? { label: "Pajak", value: formatPrice(order.taxAmount) }
                : null,
            ]
              .filter(Boolean)
              .map((row, i, arr) => (
                <View key={row!.label}>
                  <View style={{ paddingHorizontal: 14, paddingVertical: 11 }}>
                    <DetailRow label={row!.label} value={row!.value} c={c} />
                  </View>
                  {i < arr.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: c.border,
                        marginHorizontal: 14,
                      }}
                    />
                  )}
                </View>
              ))}

            {/* Total — highlighted */}
            <View style={{ height: 1, backgroundColor: c.border }} />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 13,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "700", color: c.foreground }}
              >
                Total
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: c.primary }}
              >
                {formatPrice(order.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Queue info */}
        {order.queueMeta && (
          <View style={{ gap: 6 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 2,
              }}
            >
              <Clock size={13} color={c.mutedForeground} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: c.mutedForeground,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Informasi Antrian
              </Text>
            </View>
            <View
              style={{
                backgroundColor: c.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                overflow: "hidden",
              }}
            >
              {[
                { label: "Posisi Anda", value: `#${order.queueMeta.position}` },
                {
                  label: "Di depan Anda",
                  value: `${order.queueMeta.totalAhead} orang`,
                },
              ].map((row, i, arr) => (
                <View key={row.label}>
                  <View style={{ paddingHorizontal: 14, paddingVertical: 11 }}>
                    <DetailRow label={row.label} value={row.value} c={c} />
                  </View>
                  {i < arr.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: c.border,
                        marginHorizontal: 14,
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Bottom Actions */}
      {(order.orderStatus === "AWAITING_PAYMENT" ||
        ["PROCESSING", "CONFIRMED"].includes(order.orderStatus) ||
        order.orderStatus === "COMPLETED") && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopWidth: 1,
            borderTopColor: c.border,
            backgroundColor: c.background,
            flexDirection: "row",
            gap: 8,
          }}
        >
          {order.orderStatus === "AWAITING_PAYMENT" &&
            !(
              order.transaction?.status === "AWAITING_VERIFICATION" ||
              order.transaction?.status === "PROOF_SUBMITTED"
            ) && (
              <>
                <Pressable
                  onPress={onPay}
                  disabled={isBusy}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: c.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
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
                    paddingVertical: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: c.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
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
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Phone size={14} color={c.mutedForeground} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: c.foreground,
                  }}
                >
                  Hubungi
                </Text>
              </Pressable>
              {!order.items.some((i) => i.product.type === "SERVICE") && (
                <Pressable
                  onPress={onConfirm}
                  disabled={isBusy}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: c.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
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
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} color={c.mutedForeground} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: c.foreground,
                }}
              >
                Pesan Lagi
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
