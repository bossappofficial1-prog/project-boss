import { CountdownTimer } from "@/features/checkout/components/countdown-timer";
import { ManualPaymentUpload } from "@/features/checkout/components/manual-payment-upload";
import { createPayment } from "@/features/checkout/services/checkout.service";
import { getPaymentDetail } from "@/features/checkout/services/payment-detail.service";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useCartStore } from "@/src/stores/cart.store";
import { useCheckoutStore } from "@/src/stores/checkout.store";
import { useProfileStore } from "@/src/stores/profile.store";
import type { PaymentDetailData } from "@/types/payment-detail";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Info,
  Loader2,
  Phone,
  Receipt,
  Store,
  User,
  UtensilsCrossed,
  XCircle,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function normalizeStatus(status?: string): string {
  if (!status) return "UNKNOWN";
  const upper = status.toUpperCase();
  if (["AWAITING_PAYMENT", "PENDING"].includes(upper)) return "PENDING";
  if (upper === "AWAITING_VERIFICATION") return "AWAITING_VERIFICATION";
  if (upper === "PROCESSING") return "PROCESSING";
  if (
    ["SETTLEMENT", "SUCCESS", "PAID", "COMPLETED", "CONFIRMED"].includes(upper)
  )
    return "SUCCESS";
  if (["FAILURE", "FAILED", "DENY"].includes(upper)) return "FAILED";
  if (["EXPIRE", "EXPIRED"].includes(upper)) return "EXPIRED";
  if (["CANCEL", "CANCELLED"].includes(upper)) return "CANCELLED";
  return "UNKNOWN";
}

type StatusTone = "warning" | "info" | "success" | "destructive" | "neutral";

const STATUS_META: Record<
  string,
  { tone: StatusTone; icon: typeof CheckCircle; label: string; desc: string }
> = {
  PENDING: {
    tone: "warning",
    icon: Clock,
    label: "Menunggu pembayaran",
    desc: "Silakan lakukan pembayaran sebelum batas waktu berakhir.",
  },
  PROCESSING: {
    tone: "info",
    icon: Info,
    label: "Diproses",
    desc: "Pembayaran kamu sedang diproses.",
  },
  AWAITING_VERIFICATION: {
    tone: "warning",
    icon: Clock,
    label: "Menunggu verifikasi",
    desc: "Bukti pembayaran sedang diverifikasi outlet.",
  },
  SUCCESS: {
    tone: "success",
    icon: CheckCircle,
    label: "Pembayaran berhasil",
    desc: "Pesanan dikonfirmasi, terima kasih.",
  },
  FAILED: {
    tone: "destructive",
    icon: XCircle,
    label: "Pembayaran gagal",
    desc: "Pembayaran tidak dapat diproses.",
  },
  EXPIRED: {
    tone: "destructive",
    icon: AlertCircle,
    label: "Kedaluwarsa",
    desc: "Batas waktu pembayaran sudah habis.",
  },
  CANCELLED: {
    tone: "destructive",
    icon: AlertCircle,
    label: "Dibatalkan",
    desc: "Pesanan ini telah dibatalkan.",
  },
  UNKNOWN: {
    tone: "neutral",
    icon: Info,
    label: "Tidak diketahui",
    desc: "",
  },
};

function StatusBanner({ status }: { status: string }) {
  const c = useThemeColors();
  const key = normalizeStatus(status);
  const meta = STATUS_META[key] || STATUS_META.UNKNOWN;
  const Icon = meta.icon;

  const toneColor: Record<StatusTone, string> = {
    warning: c.warning,
    info: c.primary,
    success: c.success,
    destructive: c.destructive,
    neutral: c.mutedForeground,
  };
  const color = toneColor[meta.tone];

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: `${color}30`,
        backgroundColor: `${color}12`,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Icon size={18} color={color} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: "500", color }}>
          {meta.label}
        </Text>
        {meta.desc && (
          <Text style={{ fontSize: 12, color, opacity: 0.75 }}>
            {meta.desc}
          </Text>
        )}
      </View>
    </View>
  );
}

function VaDetails({ payment }: { payment: PaymentDetailData }) {
  const c = useThemeColors();
  const midtrans = payment.payment.midtrans;
  if (!midtrans) return null;
  const vaArr = (midtrans as any).va_numbers || (midtrans as any).vaNumbers;
  const va = vaArr?.[0];
  const vaNumber = va?.va_number || va?.vaNumber || (midtrans as any).va_number;
  const bank = (va?.bank || va?.bankCode || "VA").toUpperCase();
  if (!vaNumber) return null;
  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
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
          backgroundColor: `${c.primary}08`,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: c.mutedForeground,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Virtual Account {bank}
        </Text>
      </View>
      <View style={{ padding: 14, alignItems: "center" }}>
        <Text
          style={{ fontSize: 11, color: c.mutedForeground, marginBottom: 6 }}
        >
          Nomor Virtual Account
        </Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: c.foreground,
            fontFamily: "monospace",
            letterSpacing: 2,
          }}
        >
          {vaNumber}
        </Text>
        <Text style={{ fontSize: 11, color: c.mutedForeground, marginTop: 6 }}>
          Transfer ke nomor VA di atas sesuai jumlah yang tertera
        </Text>
      </View>
    </View>
  );
}

function QrisDetails({ payment }: { payment: PaymentDetailData }) {
  const c = useThemeColors();
  const midtrans = payment.payment.midtrans;
  if (!midtrans) return null;
  const qrAction = midtrans.actions?.find(
    (a) => a.name === "generate-qr-code" || a.name === "deeplink-redirect",
  );
  const qrUrl = qrAction?.url || (midtrans as any).qr_string;
  if (!qrUrl) return null;
  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
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
          backgroundColor: `${c.primary}08`,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: c.mutedForeground,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          QRIS
        </Text>
      </View>
      <View style={{ padding: 14, alignItems: "center" }}>
        {qrUrl.startsWith("http") ? (
          <Image
            source={{ uri: qrUrl }}
            style={{ width: 200, height: 200, borderRadius: 8 }}
            resizeMode="contain"
          />
        ) : (
          <Text
            style={{
              fontSize: 12,
              color: c.foreground,
              textAlign: "center",
              fontFamily: "monospace",
            }}
          >
            {qrUrl}
          </Text>
        )}
        <Text
          style={{
            fontSize: 11,
            color: c.mutedForeground,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Scan QRIS di atas untuk melakukan pembayaran
        </Text>
      </View>
    </View>
  );
}

function ManualDetails({ payment }: { payment: PaymentDetailData }) {
  const c = useThemeColors();
  const qrRef = useRef<any>(null);
  const [downloading, setDownloading] = useState(false);
  const manual = payment.payment.manual;
  if (!manual) return null;
  const inst = manual.intruction;
  if (!inst) return null;
  const bank = inst.bankAccount;
  const isQris = Boolean(
    (inst.qrImageUrl || inst.qrisString) &&
    (inst.manualType?.toLowerCase().includes("qris") ||
      manual.type?.toLowerCase().includes("qris")),
  );

  const handleDownloadQR = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      if (inst.qrisString && qrRef.current) {
        qrRef.current.toDataURL(async (data: string) => {
          try {
            const fileName = `QRIS-${inst.outletName || "Outlet"}.png`;
            const file = new File(Paths.cache, fileName);
            const base64Data = data.replace(/^data:image\/png;base64,/, "");
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++)
              bytes[i] = binaryStr.charCodeAt(i);
            await file.write(bytes);
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(file.uri, {
                mimeType: "image/png",
                dialogTitle: "Unduh QRIS",
              });
            }
          } catch (err) {
            console.error("Failed to save QR:", err);
          }
        });
      } else if (inst.qrImageUrl) {
        const fileName = `QRIS-${inst.outletName || "Outlet"}.png`;
        const file = new File(Paths.cache, fileName);
        const response = await fetch(inst.qrImageUrl);
        const data = await response.arrayBuffer();
        const bytes = new Uint8Array(data);
        await file.write(bytes);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: "image/png",
            dialogTitle: "Unduh QRIS",
          });
        }
      }
    } catch (err) {
      console.error("Failed to download QR:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
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
          backgroundColor: `${c.primary}08`,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: c.mutedForeground,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Instruksi Pembayaran Manual
        </Text>
      </View>
      <View style={{ padding: 14, gap: 12 }}>
        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "500",
              color: c.mutedForeground,
            }}
          >
            Outlet
          </Text>
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}
          >
            {inst.outletName || "-"}
          </Text>
          {inst.businessName && (
            <Text style={{ fontSize: 11, color: c.mutedForeground }}>
              {inst.businessName}
            </Text>
          )}
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 10,
            borderRadius: 8,
            backgroundColor: c.muted,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: c.mutedForeground,
            }}
          >
            Total Pembayaran
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: c.primary }}>
            {formatPrice(payment.totalAmount)}
          </Text>
        </View>
        {isQris && (inst.qrImageUrl || inst.qrisString) && (
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: c.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Scan QR
            </Text>
            <View
              style={{
                alignItems: "center",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: "#ffffff",
              }}
            >
              {inst.qrisString ? (
                <View style={{ alignItems: "center", gap: 12 }}>
                  <QRCode
                    value={inst.qrisString}
                    size={200}
                    backgroundColor="#ffffff"
                    color="#000000"
                    ref={qrRef}
                  />
                  <Pressable
                    onPress={handleDownloadQR}
                    disabled={downloading}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: c.border,
                      backgroundColor: c.background,
                    }}
                  >
                    {downloading ? (
                      <Loader2 size={14} color={c.primary} />
                    ) : (
                      <Download size={14} color={c.primary} />
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: c.primary,
                      }}
                    >
                      {downloading ? "Mengunduh..." : "Unduh QR (PNG)"}
                    </Text>
                  </Pressable>
                </View>
              ) : inst.qrImageUrl ? (
                <View style={{ alignItems: "center", gap: 12 }}>
                  <Image
                    source={{ uri: inst.qrImageUrl }}
                    style={{ width: 200, height: 200, borderRadius: 8 }}
                    resizeMode="contain"
                  />
                  <Pressable
                    onPress={handleDownloadQR}
                    disabled={downloading}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: c.border,
                      backgroundColor: c.background,
                    }}
                  >
                    {downloading ? (
                      <Loader2 size={14} color={c.primary} />
                    ) : (
                      <Download size={14} color={c.primary} />
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: c.primary,
                      }}
                    >
                      {downloading ? "Mengunduh..." : "Unduh QR (PNG)"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
            <Text
              style={{
                fontSize: 11,
                color: c.mutedForeground,
                textAlign: "center",
              }}
            >
              Scan QR ini menggunakan e-wallet favoritmu dan bayar sesuai
              nominalnya.
            </Text>
          </View>
        )}
        {bank && (bank.bankName || bank.accountNumber) && (
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: c.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Transfer Bank
            </Text>
            <View
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor: c.muted,
                gap: 8,
              }}
            >
              {bank.bankName && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                    Bank
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: c.foreground,
                    }}
                  >
                    {bank.bankName}
                  </Text>
                </View>
              )}
              {bank.accountNumber && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                      No. Rekening
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: c.foreground,
                        fontFamily: "monospace",
                        marginTop: 2,
                      }}
                    >
                      {bank.accountNumber}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {}}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: c.border,
                      backgroundColor: c.background,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: c.primary,
                      }}
                    >
                      Salin
                    </Text>
                  </Pressable>
                </View>
              )}
              {bank.accountHolder && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                    Atas Nama
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: c.foreground,
                    }}
                  >
                    {bank.accountHolder}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        {inst.note && (
          <View
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: "#fefce8",
              borderWidth: 1,
              borderColor: "#fef08a",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#a16207",
                marginBottom: 4,
              }}
            >
              Catatan
            </Text>
            <Text style={{ fontSize: 12, color: "#a16207", lineHeight: 18 }}>
              {inst.note}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function PaymentScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const isNewOrder = orderId === "new";

  const {
    outlets,
    subtotal,
    tax,
    taxName,
    grandTotal,
    transactionFee,
    applicationFee,
    selectedPaymentMethod,
    clearCheckout,
  } = useCheckoutStore();
  const tableId = useCartStore((s) => s.tableId);
  const tableName = useCartStore((s) => s.tableName);
  const tableOutletId = useCartStore((s) => s.tableOutletId);
  const clearOutletItems = useCartStore((s) => s.clearOutletItems);
  const profileName = useProfileStore((s) => s.fullName);
  const profilePhone = useProfileStore((s) => s.phone);
  const setProfileName = useProfileStore((s) => s.setFullName);
  const setProfilePhone = useProfileStore((s) => s.setPhone);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const effectiveOrderId = createdOrderId || (!isNewOrder ? orderId : null);

  const { data: paymentDetail } = useQuery({
    queryKey: ["payment-detail", effectiveOrderId],
    queryFn: () => getPaymentDetail(effectiveOrderId!),
    enabled: !!effectiveOrderId,
    refetchInterval: (query) => {
      const status = query.state.data?.payment?.status?.toUpperCase();
      if (
        ["PENDING", "PROCESSING", "AWAITING_VERIFICATION"].includes(
          status || "",
        )
      )
        return 10_000;
      return false;
    },
  });

  useEffect(() => {
    if (profileName) setName(profileName);
    if (profilePhone) setPhone(profilePhone);
  }, [profileName, profilePhone]);

  useEffect(() => {
    if (name !== profileName) setProfileName(name);
    if (phone !== profilePhone) setProfilePhone(phone);
  }, [name, phone]);

  // Invalidate orders cache ketika status pembayaran sudah final
  useEffect(() => {
    const status = normalizeStatus(
      paymentDetail?.payment?.status || paymentDetail?.status,
    );
    const finalStatuses = ["SUCCESS", "FAILED", "EXPIRED", "CANCELLED"];
    if (finalStatuses.includes(status)) {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  }, [paymentDetail?.payment?.status, paymentDetail?.status]);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Nama wajib diisi";
    if (!phone.trim()) e.phone = "Nomor telepon wajib diisi";
    else if (!/^(\+62|62|0)[0-9]{9,12}$/.test(phone.replace(/\s/g, "")))
      e.phone = "Nomor telepon tidak valid";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const itemCount = outlets.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );
  const outletName = outlets[0]?.outletName || "";

  const handlePay = async () => {
    if (!validate() || !selectedPaymentMethod) return;
    setIsLoading(true);
    setApiError(null);
    try {
      let outletId = "";
      let selectedSlotId: string | undefined;
      let staffId: string | undefined;
      const items = outlets.flatMap((outlet) => {
        if (!outletId) outletId = outlet.items[0]?.outletId || "";
        return outlet.items.map((item) => {
          if (item.type === "SERVICE" && item.selectedSlot && !selectedSlotId) {
            selectedSlotId = item.selectedSlot;
            if (item.staffId) staffId = item.staffId;
          }
          return { productId: item.productId, quantity: item.quantity };
        });
      });
      if (items.length === 0) throw new Error("Tidak ada item untuk diproses");

      const tableId = useCartStore.getState().tableId;
      const tableName = useCartStore.getState().tableName;
      const tableOutletId = useCartStore.getState().tableOutletId;

      const response = await createPayment({
        outletId,
        guestCustomer: { name: name.trim(), phone: phone.trim() },
        items,
        paymentMethod: "online",
        onlinePaymentChannel: selectedPaymentMethod.id,
        ...(selectedSlotId && { bookingSlotId: selectedSlotId }),
        ...(staffId && { staffId }),
        ...(tableOutletId === outletId && tableId && { tableId }),
        ...(tableOutletId === outletId &&
          tableName && { tableNumber: tableName }),
      });

      if (outletId) {
        clearOutletItems(outletId);
        if (tableOutletId === outletId) {
          useCartStore.getState().setTableId(null, null, null);
        }
      }
      clearCheckout();
      setCreatedOrderId(response.order_id);
      router.replace({
        pathname: "/payment/[orderId]",
        params: { orderId: response.order_id },
      });
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message ||
          err?.message ||
          "Gagal memproses pembayaran",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isManual = paymentDetail?.payment?.isManual;
  const paymentStatus = normalizeStatus(
    paymentDetail?.payment?.status || paymentDetail?.status,
  );
  const showCountdown = ["PENDING"].includes(paymentStatus);

  if (isNewOrder && (!selectedPaymentMethod || outlets.length === 0)) {
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
          Data pembayaran tidak ditemukan
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

  if (!isNewOrder && !paymentDetail) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={{ fontSize: 13, color: c.mutedForeground, marginTop: 12 }}>
          Memuat detail pembayaran...
        </Text>
      </View>
    );
  }

  const isPaymentDone = !!paymentDetail;
  const displayTotal = paymentDetail?.totalAmount ?? grandTotal;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 8,
          paddingHorizontal: 16,
          paddingBottom: 10,
          backgroundColor: c.card,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() =>
              isPaymentDone
                ? (() => {
                    queryClient.invalidateQueries({ queryKey: ["orders"] });
                    router.replace("/(tabs)/orders");
                  })()
                : router.back()
            }
            hitSlop={8}
          >
            <ArrowLeft size={22} color={c.foreground} />
          </Pressable>
          <Text
            style={{ fontSize: 18, fontWeight: "600", color: c.foreground }}
          >
            {isPaymentDone ? "Detail Pembayaran" : "Pembayaran"}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          ...(!isPaymentDone ? { paddingBottom: 180 } : { paddingBottom: 10 }),
        }}
      >
        {isPaymentDone && paymentDetail && (
          <>
            <StatusBanner
              status={paymentDetail.payment.status || paymentDetail.status}
            />

            {/* Countdown timer */}
            {showCountdown &&
              paymentDetail.status === "AWAITING_PAYMENT" &&
              (paymentDetail.payment.manual.intruction.expiry_time ||
                paymentDetail.payment.midtrans.expiry_time) && (
                <CountdownTimer
                  expiryTime={
                    paymentDetail.payment.manual.intruction.expiry_time! ||
                    paymentDetail.payment.midtrans.expiry_time!
                  }
                />
              )}

            {/* Payment Overview */}
            <View
              style={{
                marginHorizontal: 12,
                marginTop: 8,
                backgroundColor: c.card,
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <View style={{ padding: 14, gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                    Metode Pembayaran
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.foreground,
                      textTransform: "capitalize",
                    }}
                  >
                    {paymentDetail.payment.method || "-"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                    Total Tagihan
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: c.primary,
                    }}
                  >
                    {formatPrice(paymentDetail.totalAmount)}
                  </Text>
                </View>
                {paymentDetail.payment.midtrans?.expiry_time && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                      Berakhir Pada
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                    >
                      {new Date(
                        paymentDetail.payment.midtrans.expiry_time,
                      ).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Payment method details */}
            {isManual && <ManualDetails payment={paymentDetail} />}
            {isManual &&
              !paymentDetail.payment.manual?.paymentProofUrl &&
              paymentDetail.status === "AWAITING_PAYMENT" && (
                <ManualPaymentUpload orderId={effectiveOrderId!} />
              )}
            {!isManual && paymentDetail.payment.midtrans?.va_numbers && (
              <VaDetails payment={paymentDetail} />
            )}
            {!isManual &&
              !paymentDetail.payment.midtrans?.va_numbers &&
              paymentDetail.payment.midtrans?.actions && (
                <QrisDetails payment={paymentDetail} />
              )}

            {/* Order items */}
            <View
              style={{
                marginHorizontal: 12,
                marginTop: 8,
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
                  backgroundColor: `${c.primary}08`,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: c.mutedForeground,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Detail Pesanan
                </Text>
              </View>
              {paymentDetail.items.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: c.mutedForeground,
                        marginTop: 2,
                      }}
                    >
                      {item.quantity} x {formatPrice(item.price)}
                      {item.taxPercentage ? (
                        <Text style={{ color: "#2563eb" }}>
                          {" "}
                          +{item.taxName || "Pajak"} {item.taxPercentage}%
                        </Text>
                      ) : null}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: c.foreground,
                    }}
                  >
                    {formatPrice(item.subtotal ?? item.price * item.quantity)}
                  </Text>
                </View>
              ))}
              <View style={{ padding: 14, gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                    Subtotal
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.foreground,
                    }}
                  >
                    {formatPrice(
                      paymentDetail.items.reduce(
                        (a, i) => a + (i.subtotal ?? i.price * i.quantity),
                        0,
                      ),
                    )}
                  </Text>
                </View>
                {(paymentDetail.taxAmount ?? 0) > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                      {paymentDetail.taxName || "Pajak"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                    >
                      {formatPrice(paymentDetail.taxAmount!)}
                    </Text>
                  </View>
                )}
                {paymentDetail.feeDetail.transactionFee > 0 &&
                  paymentDetail.payment.method !== "QRIS_OFFLINE" &&
                  paymentDetail.payment.method !== "OWNER_TRANSFER" && (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                        Biaya Transaksi
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "500",
                          color: c.foreground,
                        }}
                      >
                        {formatPrice(paymentDetail.feeDetail.transactionFee)}
                      </Text>
                    </View>
                  )}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                    Biaya Aplikasi
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.foreground,
                    }}
                  >
                    {formatPrice(paymentDetail.feeDetail.appFee)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: c.border,
                    marginVertical: 2,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: c.foreground,
                    }}
                  >
                    Total Pembayaran
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: c.primary,
                    }}
                  >
                    {formatPrice(paymentDetail.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Customer info */}
            <View
              style={{
                marginHorizontal: 12,
                marginTop: 8,
                backgroundColor: c.card,
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <View style={{ padding: 14, gap: 8 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <User size={14} color={c.mutedForeground} />
                  <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                    Nama
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.foreground,
                      marginLeft: "auto",
                    }}
                  >
                    {paymentDetail.customerDetails.name}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Phone size={14} color={c.mutedForeground} />
                  <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                    Telepon
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.foreground,
                      marginLeft: "auto",
                    }}
                  >
                    {paymentDetail.customerDetails.phone}
                  </Text>
                </View>
              </View>
            </View>

            <Text
              style={{
                fontSize: 11,
                color: c.mutedForeground,
                textAlign: "center",
                marginTop: 16,
                marginBottom: 8,
                paddingHorizontal: 32,
              }}
            >
              Butuh bantuan? Hubungi outlet langsung atau kunjungi halaman
              pesanan.
            </Text>
          </>
        )}

        {!isPaymentDone && (
          <>
            {apiError && (
              <View
                style={{
                  marginHorizontal: 12,
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: `${c.destructive}15`,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <AlertCircle
                  size={16}
                  color={c.destructive}
                  style={{ marginTop: 1 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: c.destructive,
                    flex: 1,
                    lineHeight: 18,
                  }}
                >
                  {apiError}
                </Text>
              </View>
            )}

            {tableId && tableOutletId === (outlets[0]?.outletId || "") && (
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
                    Pemesanan di Meja Aktif
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

            {/* Customer Info */}
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
                <User size={15} color={c.primary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: c.foreground,
                  }}
                >
                  Data Pemesan
                </Text>
              </View>
              <View style={{ padding: 14, gap: 12 }}>
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.mutedForeground,
                      marginBottom: 6,
                    }}
                  >
                    Nama Lengkap
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor={c.mutedForeground}
                    style={{
                      borderWidth: 1,
                      borderColor: errors.name ? c.destructive : c.border,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: c.foreground,
                      backgroundColor: c.background,
                    }}
                  />
                  {errors.name && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: c.destructive,
                        marginTop: 4,
                      }}
                    >
                      {errors.name}
                    </Text>
                  )}
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.mutedForeground,
                      marginBottom: 6,
                    }}
                  >
                    Nomor Telepon
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="08xxxxxxxxxx"
                    placeholderTextColor={c.mutedForeground}
                    keyboardType="phone-pad"
                    style={{
                      borderWidth: 1,
                      borderColor: errors.phone ? c.destructive : c.border,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: c.foreground,
                      backgroundColor: c.background,
                    }}
                  />
                  {errors.phone && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: c.destructive,
                        marginTop: 4,
                      }}
                    >
                      {errors.phone}
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: `${c.primary}08`,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 6,
                  }}
                >
                  <AlertCircle
                    size={14}
                    color={c.primary}
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: c.mutedForeground,
                      flex: 1,
                      lineHeight: 16,
                    }}
                  >
                    Data digunakan oleh outlet untuk menghubungi kamu terkait
                    pesanan.
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Method */}
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
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: c.foreground,
                  }}
                >
                  Metode Pembayaran
                </Text>
              </View>
              <View style={{ padding: 14 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: c.muted,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                    >
                      {selectedPaymentMethod?.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: c.mutedForeground,
                        marginTop: 2,
                      }}
                    >
                      {selectedPaymentMethod?.description}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      backgroundColor:
                        selectedPaymentMethod?.type === "qris"
                          ? "#eff6ff"
                          : selectedPaymentMethod?.type === "va"
                            ? "#f0fdf4"
                            : c.background,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "500",
                        color:
                          selectedPaymentMethod?.type === "qris"
                            ? "#2563eb"
                            : selectedPaymentMethod?.type === "va"
                              ? "#16a34a"
                              : c.mutedForeground,
                      }}
                    >
                      {selectedPaymentMethod?.type === "qris"
                        ? "QRIS"
                        : selectedPaymentMethod?.type === "va"
                          ? "VA"
                          : "Manual"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Order Summary */}
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
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: c.foreground,
                  }}
                >
                  Ringkasan Pesanan
                </Text>
              </View>
              <View style={{ padding: 14, gap: 10 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Store size={13} color={c.mutedForeground} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.foreground,
                    }}
                  >
                    {outletName}
                  </Text>
                </View>
                {outlets.map((outlet) =>
                  outlet.items.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: c.mutedForeground,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {item.quantity}x {item.name}
                        {item.taxPercentage ? (
                          <Text style={{ color: "#2563eb" }}>
                            {" "}
                            +{item.taxName || "Pajak"} {item.taxPercentage}%
                          </Text>
                        ) : null}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "500",
                          color: c.foreground,
                          marginLeft: 8,
                        }}
                      >
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                    </View>
                  )),
                )}
                <View
                  style={{
                    height: 1,
                    backgroundColor: c.border,
                    marginVertical: 2,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                    Subtotal ({itemCount} item)
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.foreground,
                    }}
                  >
                    {formatPrice(subtotal)}
                  </Text>
                </View>
                {tax > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                      {taxName || "Pajak"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                    >
                      {formatPrice(tax)}
                    </Text>
                  </View>
                )}
                {transactionFee > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                      Biaya Transaksi
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                    >
                      {formatPrice(transactionFee)}
                    </Text>
                  </View>
                )}
                {applicationFee > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                      Biaya Aplikasi
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: c.foreground,
                      }}
                    >
                      {formatPrice(applicationFee)}
                    </Text>
                  </View>
                )}
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
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: c.foreground,
                    }}
                  >
                    Total Pembayaran
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: c.primary,
                    }}
                  >
                    {formatPrice(displayTotal)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
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
          ...(isPaymentDone && { display: "none" }),
        }}
      >
        {isPaymentDone ? (
          <View
            style={{ flexDirection: "row", gap: 10, display: "none" }}
          ></View>
        ) : (
          <>
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
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: c.primary }}
              >
                {formatPrice(displayTotal)}
              </Text>
            </View>
            <Pressable
              onPress={handlePay}
              disabled={isLoading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: isLoading ? c.muted : c.primary,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading && (
                <ActivityIndicator size="small" color={c.primaryForeground} />
              )}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isLoading ? c.mutedForeground : c.primaryForeground,
                }}
              >
                {isLoading ? "Memproses..." : "Bayar Sekarang"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
