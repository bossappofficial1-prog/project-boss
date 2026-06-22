import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { AlertTriangle, Clock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface Props {
  expiryTime: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiryTime, onExpire }: Props) {
  const c = useThemeColors();
  const [remaining, setRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
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
      <View
        style={{
          marginHorizontal: 12,
          marginTop: 8,
          padding: 12,
          borderRadius: 12,
          backgroundColor: `${c.destructive}12`,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <AlertTriangle size={16} color={c.destructive} />
        <Text style={{ fontSize: 13, fontWeight: "500", color: c.destructive }}>
          Pembayaran kedaluwarsa
        </Text>
      </View>
    );
  }

  const isUrgent = remaining.total < 3600;
  const isCritical = remaining.total < 600;
  const tone = isCritical ? c.destructive : isUrgent ? c.warning : c.primary;

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
        padding: 14,
        borderRadius: 12,
        backgroundColor: `${tone}10`,
        borderWidth: 0.5,
        borderColor: `${tone}30`,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <Clock size={16} color={tone} />
        <Text style={{ fontSize: 13, fontWeight: "500", color: tone }}>
          Waktu tersisa
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {remaining.hours > 0 && (
          <>
            <TimeUnit value={remaining.hours} label="jam" color={tone} />
            <Text
              style={{
                fontSize: 28,
                fontWeight: "500",
                color: tone,
                marginHorizontal: 2,
              }}
            >
              :
            </Text>
          </>
        )}
        <TimeUnit value={remaining.minutes} label="menit" color={tone} />
        <Text
          style={{
            fontSize: 28,
            fontWeight: "500",
            color: tone,
            marginHorizontal: 2,
          }}
        >
          :
        </Text>
        <TimeUnit value={remaining.seconds} label="detik" color={tone} />
      </View>

      {isUrgent && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 8,
          }}
        >
          <AlertTriangle size={12} color={tone} />
          <Text style={{ fontSize: 11, fontWeight: "500", color: tone }}>
            {isCritical
              ? "Segera selesaikan, kurang dari 10 menit"
              : "Pembayaran akan segera kedaluwarsa"}
          </Text>
        </View>
      )}
    </View>
  );
}

function TimeUnit({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "500",
          color,
          fontVariant: ["tabular-nums"],
        }}
      >
        {String(value).padStart(2, "0")}
      </Text>
      <Text style={{ fontSize: 10, color, opacity: 0.7 }}>{label}</Text>
    </View>
  );
}
