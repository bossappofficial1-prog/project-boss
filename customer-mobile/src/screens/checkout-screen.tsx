import { CartItemCard } from "@/features/cart/components/cart-item-card";
import { usePaymentMethods } from "@/src/features/checkout/hooks/use-payment-methods";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useCartStore } from "@/src/stores/cart.store";
import { useCheckoutStore } from "@/src/stores/checkout.store";
import type { PaymentMethod } from "@/types/payment";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  Check,
  CreditCard,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StackHeader } from "../components/ui/stack-header";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function calcFees(method: PaymentMethod, subtotal: number) {
  let transactionFee = 0;
  let applicationFee = 0;

  if (method.type === "qris") {
    transactionFee = Math.round(subtotal * 0.02);
    applicationFee = Math.round(subtotal * 0.03);
  } else if (method.type === "va") {
    transactionFee = 4000;
    applicationFee = Math.round(subtotal * 0.03);
  }

  return { transactionFee, applicationFee };
}

const CATEGORIES = [
  { id: "all" as const, label: "Semua" },
  { id: "qris" as const, label: "QRIS" },
  { id: "va" as const, label: "Virtual Account" },
  { id: "manual" as const, label: "Manual" },
] as const;

export default function CheckoutScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { outletId } = useLocalSearchParams<{ outletId: string }>();
  const items = useCartStore((s) => s.items);
  const tableId = useCartStore((s) => s.tableId);
  const tableName = useCartStore((s) => s.tableName);
  const tableOutletId = useCartStore((s) => s.tableOutletId);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateItem = useCartStore((s) => s.updateItem);
  const setCheckoutData = useCheckoutStore((s) => s.setCheckoutData);

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "qris" | "va" | "manual"
  >("all");

  const {
    data: paymentMethods,
    isLoading: isMethodsLoading,
    error: methodsError,
  } = usePaymentMethods();

  const filteredMethods = useMemo(() => {
    if (!paymentMethods) return [];
    if (selectedCategory === "all") return paymentMethods;
    return paymentMethods.filter((m) => m.type === selectedCategory);
  }, [paymentMethods, selectedCategory]);

  // Filter items for selected outlet
  const outletItems = items.filter((i) => i.outletId === outletId);
  const outletName = outletItems[0]?.outletName || "";

  // Calculate totals
  const subtotal = outletItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );
  const itemCount = outletItems.reduce((sum, i) => sum + i.quantity, 0);

  // Tax: use the first item's tax rate (all items in same outlet share tax)
  const taxItem = outletItems.find((i) => i.taxPercentage);
  const taxRate = taxItem?.taxPercentage || 0;
  const taxName = taxItem?.taxName || "Pajak";
  const taxAmount = taxRate > 0 ? Math.round(subtotal * (taxRate / 100)) : 0;

  // Dynamic fees — match web CheckoutPage.tsx exactly
  const { transactionFee, applicationFee, grandTotal } = useMemo(() => {
    if (!selectedPayment) {
      return {
        transactionFee: 0,
        applicationFee: 0,
        grandTotal: subtotal + taxAmount,
      };
    }
    const { transactionFee: txnFee, applicationFee: appFee } = calcFees(
      selectedPayment,
      subtotal,
    );
    return {
      transactionFee: txnFee,
      applicationFee: appFee,
      grandTotal: subtotal + taxAmount + txnFee + appFee,
    };
  }, [selectedPayment, subtotal, taxAmount]);

  if (outletItems.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground }}>
          Tidak ada item untuk checkout
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 16,
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
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <StackHeader
        onBack={() => router.back()}
        title="Checkout"
        description={`${itemCount} ${itemCount === 1 ? "item" : "item"} · ${outletName}`}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {tableId && tableOutletId === outletId && (
          <View
            style={{
              marginHorizontal: 12,
              marginTop: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: `${c.primary}10`,
              borderWidth: 1,
              borderColor: `${c.primary}20`,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                backgroundColor: c.primary,
                padding: 6,
                borderRadius: 8,
              }}
            >
              <UtensilsCrossed size={14} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: c.primary,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Pengantaran ke Meja
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: c.foreground,
                  marginTop: 1,
                }}
              >
                {`Pesanan Anda akan diantar langsung ke Meja ${
                  (tableName?.toLowerCase()?.includes("meja")
                    ? tableName.toLowerCase().replace("meja", "").trim()
                    : tableName) || tableId
                }`}
              </Text>
            </View>
          </View>
        )}

        {/* Items */}
        <View
          style={{
            marginTop: 8,
            marginHorizontal: 12,
            backgroundColor: c.card,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Store size={15} color={c.primary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: c.foreground,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {outletName}
            </Text>
            <Text
              style={{ fontSize: 12.5, fontWeight: "600", color: c.primary }}
            >
              {formatPrice(subtotal)}
            </Text>
          </View>

          {outletItems.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onUpdateSlot={(itemId, schedule) =>
                updateItem(itemId, {
                  selectedSlot: schedule.slot.id,
                  slotStartTime: schedule.slot.startTime,
                  slotEndTime: schedule.slot.endTime,
                  slotDate: schedule.slot.date,
                })
              }
            />
          ))}
        </View>

        {/* Price Breakdown */}
        <View
          style={{
            marginTop: 8,
            marginHorizontal: 12,
            backgroundColor: c.card,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Receipt size={15} color={c.primary} />
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: c.foreground }}
            >
              Ringkasan Pembayaran
            </Text>
          </View>

          <View style={{ padding: 14, gap: 10 }}>
            {/* Subtotal */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                Subtotal ({itemCount} item)
              </Text>
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: c.foreground }}
              >
                {formatPrice(subtotal)}
              </Text>
            </View>

            {/* Tax */}
            {taxAmount > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                  {taxName} ({taxRate}%)
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: c.foreground,
                  }}
                >
                  {formatPrice(taxAmount)}
                </Text>
              </View>
            )}

            <View
              style={{
                height: 1,
                backgroundColor: c.border,
                marginVertical: 2,
              }}
            />

            {/* Transaction fee — only shown after payment method selected */}
            {selectedPayment && transactionFee > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                  Biaya Transaksi
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: c.foreground,
                  }}
                >
                  {formatPrice(transactionFee)}
                </Text>
              </View>
            )}

            {/* Application fee */}
            {selectedPayment && applicationFee > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                  Biaya Aplikasi
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: c.foreground,
                  }}
                >
                  {formatPrice(applicationFee)}
                </Text>
              </View>
            )}

            {/* Grand total */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: c.foreground }}
              >
                Total Pembayaran
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: c.primary }}
              >
                {formatPrice(grandTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View
          style={{
            marginTop: 8,
            marginHorizontal: 12,
            backgroundColor: c.card,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <CreditCard size={15} color={c.primary} />
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: c.foreground }}
            >
              Metode Pembayaran
            </Text>
          </View>

          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 6,
              paddingHorizontal: 14,
              paddingTop: 10,
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count =
                cat.id === "all"
                  ? paymentMethods?.length || 0
                  : paymentMethods?.filter((m) => m.type === cat.id).length ||
                    0;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: isActive ? c.primary : `${c.primary}10`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "500",
                      color: isActive ? c.primaryForeground : c.primary,
                    }}
                  >
                    {cat.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Methods list */}
          <View style={{ padding: 14, gap: 8 }}>
            {isMethodsLoading ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text
                  style={{
                    fontSize: 12,
                    color: c.mutedForeground,
                    marginTop: 8,
                  }}
                >
                  Memuat metode pembayaran...
                </Text>
              </View>
            ) : methodsError ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <AlertTriangle size={24} color={c.destructive} />
                <Text
                  style={{
                    fontSize: 13,
                    color: c.destructive,
                    marginTop: 8,
                    fontWeight: "500",
                  }}
                >
                  Gagal memuat metode pembayaran
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: c.mutedForeground,
                    marginTop: 4,
                  }}
                >
                  {methodsError.message || "Coba lagi nanti"}
                </Text>
              </View>
            ) : filteredMethods.length > 0 ? (
              filteredMethods.map((method) => {
                const isSelected = selectedPayment?.id === method.id;
                const isDisabled = method.disable;

                return (
                  <Pressable
                    key={method.id}
                    disabled={isDisabled}
                    onPress={() => setSelectedPayment(method)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: isSelected ? c.primary : c.border,
                      backgroundColor: isSelected
                        ? `${c.primary}10`
                        : isDisabled
                          ? c.muted
                          : "transparent",
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                  >
                    {/* Radio */}
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: isSelected ? c.primary : c.mutedForeground,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: c.primary,
                          }}
                        />
                      )}
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: c.foreground,
                        }}
                      >
                        {method.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: c.mutedForeground,
                          marginTop: 1,
                        }}
                        numberOfLines={1}
                      >
                        {method.description}
                      </Text>
                    </View>

                    {isSelected && <Check size={16} color={c.primary} />}
                    {isDisabled && (
                      <Text style={{ fontSize: 10, color: c.mutedForeground }}>
                        Tersedia nanti
                      </Text>
                    )}
                  </Pressable>
                );
              })
            ) : (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <CreditCard size={24} color={c.mutedForeground} />
                <Text
                  style={{
                    fontSize: 13,
                    color: c.mutedForeground,
                    marginTop: 8,
                  }}
                >
                  Tidak ada metode tersedia
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Security */}
        <View
          style={{
            marginTop: 8,
            marginHorizontal: 12,
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            // backgroundColor: "#f0fdf4",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
          }}
          className="bg-green-500/10"
        >
          <ShieldCheck size={16} color="#16a34a" style={{ marginTop: 1 }} />
          <Text
            style={{ fontSize: 11, color: "#15803d", flex: 1, lineHeight: 16 }}
          >
            Pembayaran diproses secara aman. Data kamu dilindungi dengan
            enkripsi end-to-end.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar */}
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
            Total Pembayaran
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: c.primary }}>
            {formatPrice(grandTotal)}
          </Text>
        </View>

        <Pressable
          disabled={!selectedPayment}
          onPress={() => {
            if (!selectedPayment) return;
            setCheckoutData({
              outlets: [
                {
                  outletId: outletId || "",
                  outletName,
                  subtotal,
                  items: outletItems,
                },
              ],
              subtotal,
              tax: taxAmount,
              taxName,
              grandTotal,
              transactionFee,
              applicationFee,
              selectedPaymentMethod: selectedPayment,
            });
            router.push("/payment/new");
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: selectedPayment ? c.primary : c.muted,
          }}
        >
          <ShoppingBag
            size={16}
            color={selectedPayment ? c.primaryForeground : c.mutedForeground}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: selectedPayment ? c.primaryForeground : c.mutedForeground,
            }}
          >
            {selectedPayment ? "Buat Pesanan" : "Pilih metode pembayaran"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
