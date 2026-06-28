import { useThemeColors } from "@/src/hooks/use-theme-colors";
import type { OutletDetail } from "@/features/outlet";
import { formatTime } from "@/src/lib/utils";
import { Text, View } from "react-native";
import { EmptyState } from "@/components/ui/empty-state";
import { Clock } from "lucide-react-native";

const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export function HoursScene({
  operatingHours,
  c,
}: {
  operatingHours: OutletDetail["operatingHours"];
  c: ReturnType<typeof useThemeColors>;
}) {
  const today = new Date().getDay();

  if (!operatingHours || operatingHours.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Belum ada jam buka"
        description="Outlet belum mengatur jadwal operasional."
        transparent
      />
    );
  }

  return (
    <View style={{ backgroundColor: c.card, padding: 16 }}>
      {operatingHours.map((hour) => {
        const isToday = hour.dayOfWeek === today;
        return (
          <View
            key={hour.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 10,
              paddingHorizontal: isToday ? 12 : 0,
              marginHorizontal: isToday ? -12 : 0,
              borderRadius: isToday ? 10 : 0,
              borderBottomWidth: isToday ? 0 : 0.5,
              borderBottomColor: c.border,
              backgroundColor: isToday ? c.muted : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: isToday ? "500" : "400",
                color: isToday ? c.primary : c.mutedForeground,
              }}
            >
              {DAY_NAMES[hour.dayOfWeek]}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontSize: 13,
                  color: hour.isOpen ? c.foreground : c.mutedForeground,
                }}
              >
                {hour.isOpen
                  ? `${formatTime(hour.openTime)} – ${formatTime(hour.closeTime)}`
                  : "Tutup"}
              </Text>
              {hour.breakStart && hour.breakEnd && (
                <Text style={{ fontSize: 10, color: c.warning }}>
                  {`Istirahat ${formatTime(hour.breakStart)} – ${formatTime(hour.breakEnd)}`}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
