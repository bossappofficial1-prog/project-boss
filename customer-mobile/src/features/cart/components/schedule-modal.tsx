import type { SelectedSchedule } from "@/features/cart";
import { useGetSlotProduct } from "@/features/cart/hooks/use-booking-slot";
import type { BookingSlot } from "@/features/outlet";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useCartStore } from "@/src/stores/cart.store";
import { AlertCircle, Check, Clock, Info, Timer, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchedule: (selection: SelectedSchedule) => void;
  productName: string;
  productId: string;
  outletId: string;
  durationMinutes?: number;
  isOutletOpen?: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  // Time-only string like "08:00:00" or "08:00"
  const parts = iso.split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return iso;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isBeforeDate(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

function startOfTodayFn(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDaysFn(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date, fmt: "EEE" | "dd" | "MMM"): string {
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  if (fmt === "EEE") return dayNames[date.getDay()];
  if (fmt === "dd") return String(date.getDate()).padStart(2, "0");
  if (fmt === "MMM") return monthNames[date.getMonth()];
  return "";
}

const DATE_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  d.setHours(0, 0, 0, 0);
  return d;
});

export function ScheduleModal({
  isOpen,
  onClose,
  onSelectSchedule,
  productName,
  productId,
  outletId,
  durationMinutes,
  isOutletOpen = true,
}: ScheduleModalProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const existingServiceInCart = useCartStore((s) =>
    s.items.find(
      (item) =>
        item.type === "SERVICE" &&
        item.outletId === outletId &&
        item.productId === productId,
    ),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (!!existingServiceInCart?.slotDate)
      return new Date(existingServiceInCart.slotDate);
    return null;
  });
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);

  const { data: fetchedSlots, isLoading: isSlotsLoading } = useGetSlotProduct(
    productId,
    selectedDate,
  );

  const getSelectedSlot = useCartStore((s) => s.getItemById);
  const checkTimeConflict = useCartStore((s) => s.checkTimeConflict);

  const isReplaceMode = !!existingServiceInCart;
  const selectedSlotInCart = existingServiceInCart?.selectedSlot;
  const selectedDateInCart = new Date(
    existingServiceInCart?.slotDate || "",
  ).toDateString();

  const selectedSlotIdInCart = selectedSlot?.id
    ? getSelectedSlot(selectedSlot.id)
    : undefined;

  // Process, sort, and map slots — matching web logic exactly
  const processedSlots = useMemo(() => {
    if (!fetchedSlots || !selectedDate) return [];

    const now = new Date();
    const isSameDayAsToday = selectedDate.toDateString() === now.toDateString();

    return fetchedSlots
      .map((slot) => {
        const start = formatTime(slot.startTime);
        const end = formatTime(slot.endTime);

        let computedStatus = slot.status;
        let isPastSlot = false;

        if (isSameDayAsToday) {
          // Try ISO date first, fallback to time-only string like "08:00:00"
          let slotDate = new Date(slot.startTime);
          if (isNaN(slotDate.getTime())) {
            // Try parsing as "HH:mm:ss" or "HH:mm"
            const parts = slot.startTime.split(":");
            const h = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            if (!isNaN(h) && !isNaN(m)) {
              slotDate = new Date(selectedDate);
              slotDate.setHours(h, m, 0, 0);
            }
          }
          if (!isNaN(slotDate.getTime())) {
            isPastSlot = slotDate.getTime() <= now.getTime();
          }
        }

        if (isPastSlot) computedStatus = "PAST" as any;

        return {
          id: slot.id,
          startTime: start,
          endTime: end,
          date: slot.date,
          status: slot.status,
          computedStatus,
        } as BookingSlot & { computedStatus: string };
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [fetchedSlots, selectedDate]);

  const timeConflict = useMemo(() => {
    if (!selectedSlot || !outletId || !selectedDate || isReplaceMode)
      return null;

    return checkTimeConflict(outletId, {
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      date: toDateStr(selectedDate),
    });
  }, [selectedSlot, outletId, selectedDate, isReplaceMode, checkTimeConflict]);

  const handleSlotSelect = (slot: BookingSlot & { computedStatus: string }) => {
    if (["BOOKED", "BLOCKED", "PAST"].includes(slot.computedStatus)) return;
    if (slot.id === selectedSlotInCart) return;

    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (!selectedSlot || !selectedDate) return;

    onSelectSchedule({
      slot: {
        id: selectedSlot.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        date: toDateStr(selectedDate),
        status: selectedSlot.status,
      },
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
    onClose();
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: c.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "90%",
            paddingTop: 8,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: c.border,
              alignSelf: "center",
              marginBottom: 12,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: c.foreground,
                flex: 1,
              }}
            >
              {isReplaceMode ? "Ubah Jadwal Layanan" : "Pilih Jadwal Layanan"}
            </Text>
            <Pressable
              onPress={handleClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: c.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={c.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: c.muted,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: c.foreground,
                  marginBottom: 4,
                }}
                numberOfLines={2}
              >
                {productName}
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Timer size={14} color={c.mutedForeground} />
                <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                  Durasi: {durationMinutes || 30} menit
                </Text>
              </View>
            </View>

            {isReplaceMode && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: `${c.primary}10`,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <Info size={16} color={c.primary} style={{ marginTop: 1 }} />
                <Text
                  style={{
                    fontSize: 12,
                    color: c.foreground,
                    flex: 1,
                    lineHeight: 18,
                  }}
                >
                  Layanan ini sudah ada di keranjang. Silakan pilih waktu baru
                  jika ingin mengganti jadwal.
                </Text>
              </View>
            )}

            {timeConflict && !isReplaceMode && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginTop: 8,
                  padding: 10,
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
                  Bentrok dengan layanan{" "}
                  <Text style={{ fontWeight: "600" }}>
                    "{timeConflict.name}"
                  </Text>{" "}
                  pada pukul {timeConflict.slotStartTime} -{" "}
                  {timeConflict.slotEndTime}.
                </Text>
              </View>
            )}

            <View style={{ marginHorizontal: 16, marginTop: 16 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: c.foreground,
                  marginBottom: 10,
                }}
              >
                Tanggal
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {DATE_OPTIONS.map((date) => {
                  const isSelected =
                    selectedDate?.toDateString() === date.toDateString();
                  const today = startOfTodayFn();
                  const disabled = isBeforeDate(date, today);
                  const isCurrentSlotDate =
                    date.toDateString() === selectedDateInCart;

                  return (
                    <Pressable
                      key={date.toISOString()}
                      disabled={disabled}
                      onPress={() => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                      }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: isCurrentSlotDate
                          ? `${c.destructive}50`
                          : isSelected
                            ? c.primary
                            : disabled
                              ? c.muted
                              : `${c.primary}10`,
                        alignItems: "center",
                        minWidth: 70,
                        opacity: disabled ? 0.4 : 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: isCurrentSlotDate
                            ? c.primaryForeground
                            : isSelected
                              ? c.primaryForeground
                              : disabled
                                ? c.mutedForeground
                                : c.primary,
                          fontWeight: "500",
                          textTransform: "uppercase",
                        }}
                      >
                        {formatDate(date, "EEE")}
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: isSelected
                            ? c.primaryForeground
                            : disabled
                              ? c.mutedForeground
                              : c.foreground,
                          marginTop: 2,
                        }}
                      >
                        {formatDate(date, "dd")}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: isSelected
                            ? c.primaryForeground
                            : disabled
                              ? c.mutedForeground
                              : c.mutedForeground,
                        }}
                      >
                        {formatDate(date, "MMM")}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {selectedDate && (
              <View style={{ marginHorizontal: 16, marginTop: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <Clock size={14} color={c.mutedForeground} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: c.foreground,
                    }}
                  >
                    Waktu Tersedia
                  </Text>
                </View>

                {isSlotsLoading ? (
                  <View style={{ paddingVertical: 32, alignItems: "center" }}>
                    <ActivityIndicator size="large" color={c.primary} />
                  </View>
                ) : processedSlots.length > 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {processedSlots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      const isCurrentCartItem = slot.id === selectedSlotInCart;
                      const isDisabled =
                        ["BOOKED", "BLOCKED", "PAST"].includes(
                          slot.computedStatus,
                        ) || isCurrentCartItem;

                      let label = `${slot.startTime} - ${slot.endTime}`;
                      if (slot.computedStatus === "PAST") label = "Lewat";
                      else if (slot.computedStatus === "BLOCKED")
                        label = "Blocked";
                      else if (slot.computedStatus === "BOOKED")
                        label = "Booked";
                      else if (isCurrentCartItem) label = "Di Keranjang";

                      let bgColor = c.muted;
                      let textColor = c.foreground;
                      let borderColor = c.border;

                      if (isSelected) {
                        bgColor = c.primary;
                        textColor = c.primaryForeground;
                        borderColor = c.primary;
                      } else if (slot.computedStatus === "BOOKED") {
                        bgColor = c.destructive;
                        textColor = "#ffffff";
                        borderColor = "transparent";
                      } else if (slot.computedStatus === "BLOCKED") {
                        bgColor = c.warning;
                        textColor = "#ffffff";
                        borderColor = "transparent";
                      } else if (slot.computedStatus === "PAST") {
                        bgColor = c.muted;
                        textColor = c.mutedForeground;
                        borderColor = "transparent";
                      }

                      return (
                        <Pressable
                          key={slot.id}
                          disabled={isDisabled}
                          onPress={() => handleSlotSelect(slot)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 10,
                            backgroundColor: bgColor,
                            borderWidth: 1,
                            borderColor: isCurrentCartItem
                              ? "red"
                              : isSelected
                                ? c.primary
                                : borderColor,
                            opacity: isDisabled ? 0.5 : 1,
                            minWidth: "30%",
                            flex: 1,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: isSelected ? "600" : "500",
                              color: textColor,
                            }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <View
                    style={{
                      paddingVertical: 32,
                      alignItems: "center",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: c.border,
                      backgroundColor: c.muted,
                    }}
                  >
                    <Timer
                      size={28}
                      color={c.mutedForeground}
                      strokeWidth={1.5}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        color: c.mutedForeground,
                        marginTop: 8,
                      }}
                    >
                      Jadwal tidak tersedia
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: c.border,
            }}
          >
            <Pressable
              onPress={handleClose}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: c.foreground,
                }}
              >
                Batal
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={!selectedSlot || (!!timeConflict && !isReplaceMode)}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor:
                  !selectedSlot || (!!timeConflict && !isReplaceMode)
                    ? c.muted
                    : c.primary,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
              }}
            >
              {selectedSlot && <Check size={16} color={c.primaryForeground} />}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color:
                    !selectedSlot || (!!timeConflict && !isReplaceMode)
                      ? c.mutedForeground
                      : c.primaryForeground,
                }}
              >
                {!selectedSlot
                  ? "Pilih Waktu"
                  : timeConflict && !isReplaceMode
                    ? "Waktu Bentrok"
                    : `${isReplaceMode ? "Ganti ke" : "Konfirmasi"} ${selectedSlot.startTime}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
