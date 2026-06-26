import { useSnackbar } from "@/components/ui/snackbar";
import {
  OrderCard,
  OrderDetailModal,
  SectionLabel,
  StatusTabs,
} from "@/features/orders";
import {
  useCancelOrder,
  useConfirmOrder,
  useOrders,
} from "@/src/features/orders/hooks/use-orders";
import { useNotifications } from "@/src/hooks/use-notifications";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useSocket } from "@/src/lib/socket-context";
import { useCartStore } from "@/src/stores/cart.store";
import { useProfileStore } from "@/src/stores/profile.store";
import type { OrderDetail } from "@/src/types/order";
import { router } from "expo-router";
import {
  AlertCircle,
  ArrowUpDown,
  Bell,
  Phone,
  Search,
  ShoppingBag,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { formatDateGroup, normalizePhone } from "../lib/utils";

type SortOption = "newest" | "oldest" | "price-high" | "price-low";

export default function OrdersScreen() {
  const c = useThemeColors();
  const profilePhone = useProfileStore((s) => s.phone);
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: orders, isLoading, error, refetch, isRefetching } = useOrders();
  const cancelMutation = useCancelOrder();
  const confirmMutation = useConfirmOrder();

  const { isConnected, joinUserRoom, onOrderStatusChanged } = useSocket();
  const { unreadCount } = useNotifications();
  const snackbar = useSnackbar();

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [busyAction, setBusyAction] = useState<{
    orderId: string;
    action: string;
  } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (profilePhone && isConnected) joinUserRoom(profilePhone);
  }, [profilePhone, isConnected, joinUserRoom]);

  useEffect(() => {
    const unsub = onOrderStatusChanged((payload) => {
      refetch();
      snackbar.success(
        payload.message || `Pesanan #${payload.orderId.slice(0, 8)} diperbarui`,
      );
    });
    return unsub;
  }, [onOrderStatusChanged, refetch, snackbar]);

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
    (order: OrderDetail) => {
      Alert.alert(
        "Batalkan Pesanan",
        `Yakin ingin membatalkan pesanan #${order.id.slice(0, 8)} dari ${order.outlet.name}?`,
        [
          { text: "Tidak", style: "cancel" },
          {
            text: "Ya, Batalkan",
            style: "destructive",
            onPress: async () => {
              setBusyAction({ orderId: order.id, action: "cancel" });
              try {
                await cancelMutation.mutateAsync(order.id);
              } catch {}
              setBusyAction(null);
            },
          },
        ],
      );
    },
    [cancelMutation],
  );

  const handleConfirm = useCallback(
    (order: OrderDetail) => {
      Alert.alert(
        "Konfirmasi Pesanan",
        `Yakin ingin mengkonfirmasi pesanan #${order.id.slice(0, 8)}?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Ya, Konfirmasi",
            onPress: async () => {
              setBusyAction({ orderId: order.id, action: "confirm" });
              try {
                await confirmMutation.mutateAsync(order.id);
              } catch {}
              setBusyAction(null);
            },
          },
        ],
      );
    },
    [confirmMutation],
  );

  const handleContact = useCallback((order: OrderDetail) => {
    const phone = normalizePhone(order.outlet.phone);
    if (!phone) return;
    const msg = `Halo *${order.outlet.name}*,\n\nSaya ingin menanyakan pesanan #${order.id.slice(0, 8)}.\n\nTerima kasih.`;
    router.push(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
  }, []);

  const handleReorder = useCallback(
    (order: OrderDetail) => {
      const performReorder = () => {
        clearCart();
        let allAdded = true;
        for (const item of order.items) {
          const added = addItem(
            order.outletId,
            order.outlet.name,
            order.outlet.slug || "",
            {
              id: item.product.id,
              name: item.product.name,
              type: item.product.type,
              image: item.product.image,
              price: item.priceAtTimeOfOrder,
            },
            item.quantity,
          );
          if (!added) {
            allAdded = false;
          }
        }
        if (allAdded) {
          snackbar.success(
            "Berhasil memesan kembali. Keranjang belanja diperbarui.",
          );
        } else {
          snackbar.success(
            "Beberapa produk berhasil ditambahkan ke keranjang.",
          );
        }
        router.push("/(tabs)/cart");
      };

      if (cartItems.length > 0) {
        Alert.alert(
          "Pesan Lagi",
          "Apakah Anda ingin memesan kembali produk dari pesanan ini? Keranjang belanja Anda saat ini akan dikosongkan.",
          [
            { text: "Batal", style: "cancel" },
            { text: "Ya, Pesan", onPress: performReorder },
          ],
        );
      } else {
        performReorder();
      }
    },
    [cartItems, addItem, clearCart, snackbar],
  );

  const sortLabel: Record<SortOption, string> = {
    newest: "Terbaru",
    oldest: "Terlama",
    "price-high": "Harga Tertinggi",
    "price-low": "Harga Terendah",
  };

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
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: c.muted,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Phone size={24} color={c.mutedForeground} strokeWidth={1.5} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: c.foreground }}>
          Nomor Telepon Belum Diatur
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: c.mutedForeground,
            marginTop: 4,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Silakan atur nomor telepon di halaman profil terlebih dahulu.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <View
          style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 10 }}
        >
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
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: c.muted,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <AlertCircle size={24} color={c.destructive} strokeWidth={1.5} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: c.foreground }}>
          Gagal Memuat
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
            paddingVertical: 10,
            paddingHorizontal: 28,
            borderRadius: 10,
            backgroundColor: c.primary,
          }}
        >
          <Text
            style={{
              fontSize: 13,
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

  if (!orders || orders.length === 0) {
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
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: c.muted,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <ShoppingBag size={28} color={c.mutedForeground} strokeWidth={1.5} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: c.foreground }}>
          Belum Ada Pesanan
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: c.mutedForeground,
            marginTop: 4,
            textAlign: "center",
            lineHeight: 20,
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
            Pesanan Saya
          </Text>
          <Text style={{ fontSize: 11, color: c.mutedForeground }}>
            {orders.length} pesanan
          </Text>
        </View>
        <View style={{ position: "relative" }}>
          <Pressable hitSlop={10}>
            <Bell size={20} color={c.foreground} strokeWidth={1.8} />
          </Pressable>
          {unreadCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#eb2525",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 3,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: "700", color: "#fff" }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={{ marginBottom: 10, paddingTop: 14 }}>
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
          paddingHorizontal: 16,
          gap: 8,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 9,
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
            style={{ flex: 1, fontSize: 13, color: c.foreground, padding: 0 }}
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
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.card,
          }}
        >
          <ArrowUpDown size={13} color={c.mutedForeground} />
          <Text style={{ fontSize: 12, color: c.mutedForeground }}>
            {sortLabel[sortBy]}
          </Text>
        </Pressable>
      </View>

      {/* Orders List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={"red"}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          gap: 16,
        }}
      >
        {groupedOrders.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 48 }}>
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>
              Tidak ada pesanan ditemukan
            </Text>
          </View>
        ) : (
          groupedOrders.map((group) => (
            <View key={group.key}>
              <SectionLabel
                label={group.label}
                count={group.orders.length}
                c={c}
              />
              <View style={{ gap: 10 }}>
                {group.orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPress={() => setSelectedOrder(order)}
                    onPay={() => handlePay(order)}
                    onCancel={() => handleCancel(order)}
                    onConfirm={() => handleConfirm(order)}
                    onContact={() => handleContact(order)}
                    onReorder={() => handleReorder(order)}
                    isBusy={busyAction?.orderId === order.id}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            c={c}
            onPay={() => {
              setSelectedOrder(null);
              handlePay(selectedOrder);
            }}
            onCancel={() => {
              setSelectedOrder(null);
              handleCancel(selectedOrder);
            }}
            onConfirm={() => {
              setSelectedOrder(null);
              handleConfirm(selectedOrder);
            }}
            onContact={() => {
              setSelectedOrder(null);
              handleContact(selectedOrder);
            }}
            onReorder={() => {
              setSelectedOrder(null);
              handleReorder(selectedOrder);
            }}
            isBusy={busyAction?.orderId === selectedOrder.id}
          />
        )}
      </Modal>
    </View>
  );
}
