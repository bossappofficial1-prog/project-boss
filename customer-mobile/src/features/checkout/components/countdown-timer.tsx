import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react-native";
import { View, Text } from "react-native";
import { useThemeColors } from "@/src/hooks/use-theme-colors";

interface Props {
  expiryTime: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiryTime, onExpire }: Props) {
  const c = useThemeColors();
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, new Date(expiryTime).getTime() - Date.now());
      const total = Math.floor(diff / 1000);
      setRemaining({
        hours: Math.floor(total / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
        total,
      });
      if (total === 0 && !expired) {
        setExpired(true);
        onExpire?.();
      }
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [expiryTime]);

  if (expired) {
    return (
      <View style={{ marginHorizontal: 12, marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: "#fef2f2", flexDirection: "row", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={16} color="#dc2626" />
        <Text style={{ fontSize: 13, fontWeight: "500", color: "#dc2626" }}>Pembayaran kedaluwarsa</Text>
      </View>
    );
  }

  const isUrgent = remaining.total < 3600;
  const isCritical = remaining.total < 600;
  const bgColor = isCritical ? "#fef2f2" : isUrgent ? "#fff7ed" : "#fefce8";
  const textColor = isCritical ? "#dc2626" : isUrgent ? "#ea580c" : "#ca8a04";
  const borderColor = isCritical ? "#fecaca" : isUrgent ? "#fed7aa" : "#fef08a";

  return (
    <View style={{ marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 12, backgroundColor: bgColor, borderWidth: 1, borderColor: borderColor }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Clock size={16} color={textColor} />
        <Text style={{ fontSize: 13, fontWeight: "600", color: textColor }}>Waktu Tersisa</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {remaining.hours > 0 && (
          <>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 28, fontWeight: "700", color: textColor, fontVariant: ["tabular-nums"] }}>
                {String(remaining.hours).padStart(2, "0")}
              </Text>
              <Text style={{ fontSize: 10, color: textColor, opacity: 0.7, textTransform: "uppercase" }}>Jam</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: textColor, marginHorizontal: 2 }}>:</Text>
          </>
        )}
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: textColor, fontVariant: ["tabular-nums"] }}>
            {String(remaining.minutes).padStart(2, "0")}
          </Text>
          <Text style={{ fontSize: 10, color: textColor, opacity: 0.7, textTransform: "uppercase" }}>Menit</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: "700", color: textColor, marginHorizontal: 2 }}>:</Text>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: textColor, fontVariant: ["tabular-nums"] }}>
            {String(remaining.seconds).padStart(2, "0")}
          </Text>
          <Text style={{ fontSize: 10, color: textColor, opacity: 0.7, textTransform: "uppercase" }}>Detik</Text>
        </View>
      </View>

      {isUrgent && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
          <AlertTriangle size={12} color={textColor} />
          <Text style={{ fontSize: 11, fontWeight: "500", color: textColor }}>
            {isCritical ? "Pembayaran akan segera kadaluarsa!" : "Pembayaran akan segera kadaluarsa"}
          </Text>
        </View>
      )}
    </View>
  );
}
