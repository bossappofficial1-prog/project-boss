import {
  useCancelOrder,
  useConfirmOrder,
  useOrders,
} from "@/src/features/orders/hooks/use-orders";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useCartStore } from "@/src/stores/cart.store";
import { useProfileStore } from "@/src/stores/profile.store";
import type { OrderDetail } from "@/src/types/order";
import { router } from "expo-router";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  Clock,
  Hourglass,
  Phone,
  Play,
  RefreshCw,
  Search,
  ShoppingBag,
  XCircle,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const orderDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - orderDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hari Ini";
  if (days === 1) return "Kemarin";
  if (days < 7) return d.toLocaleDateString("id-ID", { weekday: "long" });
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bg: string;
    icon: typeof CheckCircle;
    label: string;
    accentBar: string;
  }
> = {
  AWAITING_PAYMENT: {
    color: "#d97706",
    bg: "#fef3c7",
    icon: Hourglass,
    label: "Menunggu Pembayaran",
    accentBar: "#f59e0b",
  },
  PROCESSING: {
    color: "#2563eb",
    bg: "#dbeafe",
    icon: Clock,
    label: "Diproses",
    accentBar: "#3b82f6",
  },
  CONFIRMED: {
    color: "#0891b2",
    bg: "#cffafe",
    icon: CheckCircle,
    label: "Dikonfirmasi",
    accentBar: "#06b6d4",
  },
  READY: {
    color: "#0891b2",
    bg: "#cffafe",
    icon: CheckCircle,
    label: "Siap",
    accentBar: "#06b6d4",
  },
  ON_GOING: {
    color: "#ea580c",
    bg: "#fff7ed",
    icon: Play,
    label: "Sedang Berlangsung",
    accentBar: "#f97316",
  },
  COMPLETED: {
    color: "#16a34a",
    bg: "#f0fdf4",
    icon: CheckCircle,
    label: "Selesai",
    accentBar: "#22c55e",
  },
  CANCELLED: {
    color: "#dc2626",
    bg: "#fef2f2",
    icon: XCircle,
    label: "Dibatalkan",
    accentBar: "#ef4444",
  },
};

type SortOption = "newest" | "oldest" | "price-high" | "price-low";

const TABS: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "Semua" },
  { key: "AWAITING_PAYMENT", label: "Belum Bayar" },
  { key: "PROCESSING", label: "Diproses" },
  { key: "COMPLETED", label: "Selesai" },
  { key: "CANCELLED", label: "Batal" },
];

function StatusTabs({
  activeTab,
  onTabChange,
  counts,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: Record<string, number>;
}) {
  const c = useThemeColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = counts[tab.key] || 0;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor: isActive ? c.primary : `${c.primary}10`,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: isActive ? c.primaryForeground : c.primary,
              }}
            >
              {tab.label}
            </Text>
            {count > 0 && (
              <View
                style={{
                  backgroundColor: isActive ? c.primaryForeground : c.primary,
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: isActive ? c.primary : c.primaryForeground,
                  }}
                >
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function OrderCard({
  order,
  onPay,
  onCancel,
  onConfirm,
  onContact,
  isBusy,
}: {
  order: OrderDetail;
  onPay?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  onContact?: () => void;
  isBusy?: boolean;
}) {
  const c = useThemeColors();
  const config = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PROCESSING;
  const Icon = config.icon;
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const isAwaitingVerification =
    order.orderStatus === "AWAITING_PAYMENT" &&
    (order.transaction?.status === "AWAITING_VERIFICATION" ||
      order.transaction?.status === "PROOF_SUBMITTED");
  const hasServiceProduct = order.items.some(
    (i) => i.product.type === "SERVICE",
  );

  const formatDateStr = formatDate(order.createdAt);

  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      {/* Accent bar */}
      <View style={{ height: 3, backgroundColor: config.accentBar }} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 8,
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
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: config.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} color={config.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 4 }}>
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}
              numberOfLines={1}
            >
              {order.outlet.name}
            </Text>
            <Text
              style={{ fontSize: 11, color: c.mutedForeground, marginTop: 1 }}
            >
              {formatDateStr}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 12,
            backgroundColor: config.bg,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: config.color,
            }}
          />
          <Text
            style={{ fontSize: 10, fontWeight: "600", color: config.color }}
          >
            {isAwaitingVerification ? "Verifikasi" : config.label}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View
        style={{
          marginHorizontal: 14,
          padding: 10,
          borderRadius: 10,
          backgroundColor: `${c.primary}06`,
          borderWidth: 1,
          borderColor: `${c.primary}15`,
        }}
      >
        {order.items.slice(0, 3).map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 4,
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
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  backgroundColor: c.background,
                  borderWidth: 1,
                  borderColor: c.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: c.foreground,
                  }}
                >
                  {item.quantity}
                </Text>
              </View>
              <Text
                style={{ fontSize: 12, color: c.foreground, flex: 1 }}
                numberOfLines={1}
              >
                {item.product.name}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: c.foreground,
                marginLeft: 8,
              }}
            >
              {formatPrice(item.priceAtTimeOfOrder * item.quantity)}
            </Text>
          </View>
        ))}
        {order.items.length > 3 && (
          <Text
            style={{ fontSize: 11, color: c.mutedForeground, marginTop: 4 }}
          >
            +{order.items.length - 3} item lainnya
          </Text>
        )}
      </View>

      {/* Cancellation/rejection note */}
      {(order.cancellationReason || order.transaction?.rejectionNote) && (
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 8,
            padding: 8,
            borderRadius: 8,
            backgroundColor: "#fef2f2",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <AlertCircle size={14} color="#dc2626" style={{ marginTop: 1 }} />
          <Text
            style={{ fontSize: 11, color: "#dc2626", flex: 1, lineHeight: 16 }}
          >
            {order.cancellationReason ||
              order.transaction?.rejectionNote ||
              "Dibatalkan"}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginTop: 8,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            color: c.mutedForeground,
            fontFamily: "monospace",
          }}
        >
          #{order.id.slice(0, 8)}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: c.primary }}>
          {formatPrice(order.totalAmount)}
        </Text>
      </View>

      {/* Quick actions */}
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
                  paddingVertical: 10,
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
                  Bayar
                </Text>
              </Pressable>
              <Pressable
                onPress={onCancel}
                disabled={isBusy}
                style={{
                  flex: 1,
                  paddingVertical: 10,
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
                    color: c.foreground,
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
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.border,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <Phone size={14} color={c.foreground} />
              <Text
                style={{ fontSize: 12, fontWeight: "500", color: c.foreground }}
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
                  paddingVertical: 10,
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
            onPress={onContact}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <RefreshCw size={14} color={c.foreground} />
            <Text
              style={{ fontSize: 12, fontWeight: "500", color: c.foreground }}
            >
              Pesan Ulang
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export default function OrdersScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const profilePhone = useProfileStore((s) => s.phone);
  const addItem = useCartStore((s) => s.addItem);
  const clearOutletItems = useCartStore((s) => s.clearOutletItems);

  const { data: orders, isLoading, error, refetch } = useOrders();
  const cancelMutation = useCancelOrder();
  const confirmMutation = useConfirmOrder();

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [busyAction, setBusyAction] = useState<{
    orderId: string;
    action: string;
  } | null>(null);

  const { groupedOrders, statusCounts } = useMemo(() => {
    if (!orders?.length) {
      return {
        groupedOrders: [] as Array<{
          key: string;
          label: string;
          orders: OrderDetail[];
        }>,
        statusCounts: { ALL: 0 },
      };
    }

    const counts: Record<string, number> = { ALL: orders.length };
    for (const o of orders) {
      const key =
        o.orderStatus === "CONFIRMED" || o.orderStatus === "ON_GOING"
          ? "PROCESSING"
          : o.orderStatus;
      counts[key] = (counts[key] || 0) + 1;
    }

    let result = orders;
    if (activeTab !== "ALL") {
      if (activeTab === "PROCESSING") {
        result = orders.filter((o) =>
          ["PROCESSING", "CONFIRMED", "ON_GOING"].includes(o.orderStatus),
        );
      } else {
        result = orders.filter((o) => o.orderStatus === activeTab);
      }
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.outlet.name.toLowerCase().includes(q) ||
          o.items.some((i) => i.product.name.toLowerCase().includes(q)),
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "price-high":
        sorted.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case "price-low":
        sorted.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
    }

    // Group by date
    const groups: Array<{ key: string; label: string; orders: OrderDetail[] }> =
      [];
    const groupMap = new Map<string, OrderDetail[]>();
    for (const order of sorted) {
      const key = formatDateGroup(order.createdAt);
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
        groups.push({ key, label: key, orders: groupMap.get(key)! });
      }
      groupMap.get(key)!.push(order);
    }

    return { groupedOrders: groups, statusCounts: counts };
  }, [orders, activeTab, searchQuery, sortBy]);

  const handlePay = useCallback((order: OrderDetail) => {
    router.push(`/payment/${order.id}`);
  }, []);

  const handleCancel = useCallback(
    async (order: OrderDetail) => {
      setBusyAction({ orderId: order.id, action: "cancel" });
      try {
        await cancelMutation.mutateAsync(order.id);
      } catch {}
      setBusyAction(null);
    },
    [cancelMutation],
  );

  const handleConfirm = useCallback(
    async (order: OrderDetail) => {
      setBusyAction({ orderId: order.id, action: "confirm" });
      try {
        await confirmMutation.mutateAsync(order.id);
      } catch {}
      setBusyAction(null);
    },
    [confirmMutation],
  );

  const handleContact = useCallback((order: OrderDetail) => {
    const phone = normalizePhone(order.outlet.phone);
    if (!phone) return;
    const msg = `Halo *${order.outlet.name}*,\n\nSaya ingin menanyakan pesanan #${order.id.slice(0, 8)}.\n\nTerima kasih.`;
    router.push(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
  }, []);

  // Missing phone
  if (!profilePhone) {
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
        <Phone size={40} color={c.mutedForeground} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: c.foreground,
            marginTop: 12,
          }}
        >
          Nomor Telepon Belum diatur
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: c.mutedForeground,
            marginTop: 4,
            textAlign: "center",
          }}
        >
          Silakan atur nomor telepon di halaman profil terlebih dahulu.
        </Text>
      </View>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          paddingTop: insets.top + 12,
        }}
      >
        <View style={{ paddingHorizontal: 14, marginBottom: 12 }}>
          <Text
            style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}
          >
            Pesanan Saya
          </Text>
          <Text
            style={{ fontSize: 12, color: c.mutedForeground, marginTop: 2 }}
          >
            Riwayat dan status pesanan
          </Text>
        </View>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </View>
    );
  }

  // Error
  if (error) {
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
        <AlertCircle size={40} color={c.destructive} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: c.foreground,
            marginTop: 12,
          }}
        >
          Gagal memuat pesanan
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: c.mutedForeground,
            marginTop: 4,
            textAlign: "center",
          }}
        >
          {error.message}
        </Text>
        <Pressable
          onPress={() => refetch()}
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
            Coba Lagi
          </Text>
        </Pressable>
      </View>
    );
  }

  // Empty
  if (!orders || orders.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingTop: insets.top,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: c.muted,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <ShoppingBag size={28} color={c.mutedForeground} strokeWidth={1.5} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground }}>
          Belum ada pesanan
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: c.mutedForeground,
            marginTop: 4,
            textAlign: "center",
          }}
        >
          Mulai belanja untuk melihat riwayat pesanan di sini.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 14,
          paddingBottom: 10,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}>
          Pesanan Saya
        </Text>
        <Text style={{ fontSize: 12, color: c.mutedForeground, marginTop: 2 }}>
          {orders.length} pesanan · Riwayat dan status
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ marginBottom: 8 }}>
        <StatusTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={statusCounts}
        />
      </View>

      {/* Search + Sort */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 12,
          gap: 8,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.card,
          }}
        >
          <Search size={14} color={c.mutedForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari pesanan..."
            placeholderTextColor={c.mutedForeground}
            style={{ flex: 1, fontSize: 12, color: c.foreground, padding: 0 }}
          />
        </View>
        <Pressable
          onPress={() => {
            const opts: SortOption[] = [
              "newest",
              "oldest",
              "price-high",
              "price-low",
            ];
            const idx = opts.indexOf(sortBy);
            setSortBy(opts[(idx + 1) % opts.length]);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.card,
          }}
        >
          <ArrowUpDown size={14} color={c.mutedForeground} />
          <Text style={{ fontSize: 11, color: c.mutedForeground }}>
            {sortBy === "newest"
              ? "Terbaru"
              : sortBy === "oldest"
                ? "Terlama"
                : sortBy === "price-high"
                  ? "Harga ↓"
                  : "Harga ↑"}
          </Text>
        </Pressable>
      </View>

      {/* Orders */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: 20,
          gap: 10,
        }}
      >
        {groupedOrders.map((group) => (
          <View style={{ display: "flex", gap: 6 }} key={group.key}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 4,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: c.mutedForeground,
                }}
              >
                {group.label}
              </Text>
              <Text style={{ fontSize: 11, color: c.mutedForeground }}>
                {group.orders.length} pesanan
              </Text>
            </View>

            {group.orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPay={() => handlePay(order)}
                onCancel={() => handleCancel(order)}
                onConfirm={() => handleConfirm(order)}
                onContact={() => handleContact(order)}
                isBusy={busyAction?.orderId === order.id}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
