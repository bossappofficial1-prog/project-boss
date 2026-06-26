import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { Pressable, ScrollView, Text, View } from "react-native";

const TABS: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "Semua" },
  { key: "AWAITING_PAYMENT", label: "Belum Bayar" },
  { key: "PROCESSING", label: "Diproses" },
  { key: "COMPLETED", label: "Selesai" },
  { key: "CANCELLED", label: "Batal" },
];

export function StatusTabs({
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
      contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = counts[tab.key] || 0;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor: isActive ? c.primary : c.card,
              borderWidth: 1,
              borderColor: isActive ? c.primary : c.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: isActive ? c.primaryForeground : c.mutedForeground,
              }}
            >
              {tab.label}
            </Text>
            {count > 0 && (
              <View
                style={{
                  backgroundColor: isActive
                    ? `${c.primaryForeground}25`
                    : `${c.primary}15`,
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: isActive ? c.primaryForeground : c.primary,
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
