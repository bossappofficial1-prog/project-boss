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
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  ArrowUpDown,
  Check,
  ListChevronsDownUp,
  Phone,
  Search,
  ShoppingBag,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState } from "../components/ui/empty-state";
import { ErrorState } from "../components/ui/error-state";
import { LoadingState } from "../components/ui/loading-state";
import { StackHeader, HeaderIconBtn } from "../components/ui/stack-header";
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
  const [isSearching, setIsSearching] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

  const handleSortPress = useCallback(() => {
    setShowSortSheet(true);
  }, []);

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

  const flatListData = useMemo(() => {
    const result: (
      | { type: "header"; id: string; label: string; count: number }
      | { type: "item"; id: string; order: OrderDetail }
    )[] = [];
    for (const group of groupedOrders) {
      result.push({
        type: "header",
        id: `header-${group.key}`,
        label: group.label,
        count: group.orders.length,
      });
      for (const order of group.orders) {
        result.push({
          type: "item",
          id: `item-${order.id}`,
          order,
        });
      }
    }
    return result;
  }, [groupedOrders]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof flatListData)[0] }) => {
      if (item.type === "header") {
        return (
          <View style={{ marginTop: 14, marginBottom: 8 }}>
            <SectionLabel label={item.label} count={item.count} c={c} />
          </View>
        );
      }
      return (
        <View style={{ marginBottom: 10 }}>
          <OrderCard
            order={item.order}
            onPress={() => setSelectedOrder(item.order)}
            onPay={() => handlePay(item.order)}
            onCancel={() => handleCancel(item.order)}
            onConfirm={() => handleConfirm(item.order)}
            onContact={() => handleContact(item.order)}
            onReorder={() => handleReorder(item.order)}
            isBusy={busyAction?.orderId === item.order.id}
          />
        </View>
      );
    },
    [
      c,
      handlePay,
      handleCancel,
      handleConfirm,
      handleContact,
      handleReorder,
      busyAction,
    ],
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
    return <LoadingState fullScreen />;
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ErrorState
          title="Gagal Memuat"
          description={error?.message || "Gagal memuat data"}
          onRetry={refetch}
        />
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
      {isSearching ? (
        <StackHeader
          variant="search"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onBack={() => {
            setIsSearching(false);
            setSearchQuery("");
          }}
          searchPlaceholder="Cari pesanan..."
        />
      ) : (
        <StackHeader
          title="Pesanan Saya"
          description={`${orders.length} pesanan`}
          rightContent={
            <View style={{ flexDirection: "row", gap: 8 }}>
              <HeaderIconBtn
                icon={<Search size={16} color={c.foreground} />}
                onPress={() => setIsSearching(true)}
              />
              <HeaderIconBtn
                icon={<ArrowUpDown size={16} color={c.foreground} />}
                onPress={handleSortPress}
                badge={sortBy !== "newest" ? 1 : 0}
              />
            </View>
          }
        />
      )}

      {/* Tabs */}
      <View style={{ marginBottom: 10, paddingTop: 14 }}>
        <StatusTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={statusCounts}
        />
      </View>

      {/* Orders List */}
      <FlashList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.type}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={c.primary}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 48 }}>
            <EmptyState
              icon={ListChevronsDownUp}
              title="Tidak ada pesanan ditemukan"
            />
          </View>
        }
      />

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

      {/* Custom Bottom Sheet Sortir */}
      <SortBottomSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        sortBy={sortBy}
        onSelect={setSortBy}
        c={c}
      />
    </View>
  );
}

type SortBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  sortBy: SortOption;
  onSelect: (option: SortOption) => void;
  c: any;
};

function SortBottomSheet({
  visible,
  onClose,
  sortBy,
  onSelect,
  c,
}: SortBottomSheetProps) {
  const options: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Terbaru" },
    { value: "oldest", label: "Terlama" },
    { value: "price-high", label: "Harga Tertinggi" },
    { value: "price-low", label: "Harga Terendah" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: c.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 12,
            paddingHorizontal: 20,
            paddingBottom: 36,
            borderWidth: 1,
            borderColor: c.border,
            borderBottomWidth: 0,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Grab Handle */}
          <View
            style={{
              width: 38,
              height: 4,
              borderRadius: 2,
              backgroundColor: c.mutedForeground + "40",
              alignSelf: "center",
              marginBottom: 20,
            }}
          />

          {/* Title */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: c.foreground,
              marginBottom: 16,
            }}
          >
            Urutkan Pesanan
          </Text>

          {/* Options List */}
          <View style={{ gap: 4 }}>
            {options.map((opt) => {
              const isActive = sortBy === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border + "30",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? "600" : "400",
                      color: isActive ? c.primary : c.foreground,
                    }}
                  >
                    {opt.label}
                  </Text>
                  {isActive && (
                    <Check size={16} color={c.primary} strokeWidth={2.5} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
