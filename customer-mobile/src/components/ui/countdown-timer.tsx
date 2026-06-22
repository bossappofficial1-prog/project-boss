import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { AlertTriangle, Clock } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

interface Props {
  expiryTime: string;
  onExpire?: () => void;
}

function padZero(n: number): string {
  return String(n).padStart(2, "0");
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
  }, [expiryTime, expired, onExpire]);

  useEffect(() => {
    if (remaining.total > 0 && remaining.total < 600) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulseAnim.setValue(1);
  }, [remaining.total < 600]);

  if (expired) {
    return (
      <View
        style={{
          marginHorizontal: 12,
          marginTop: 10,
          padding: 14,
          borderRadius: 14,
          backgroundColor: "#fef2f2",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderWidth: 1,
          borderColor: "#fecaca",
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: "#fee2e2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={16} color="#dc2626" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#dc2626" }}>
            Pembayaran Kedaluwarsa
          </Text>
          <Text style={{ fontSize: 11, color: "#dc2626", opacity: 0.7, marginTop: 1 }}>
            Silakan buat pesanan baru
          </Text>
        </View>
      </View>
    );
  }

  const isUrgent = remaining.total < 3600;
  const isCritical = remaining.total < 600;

  const palette = isCritical
    ? { bg: "#fef2f2", border: "#fecaca", accent: "#dc2626", muted: "#b91c1c" }
    : isUrgent
      ? { bg: "#fff7ed", border: "#fed7aa", accent: "#ea580c", muted: "#c2410c" }
      : { bg: "#fefce8", border: "#fef08a", accent: "#ca8a04", muted: "#a16207" };

  const timerDigits = [
    ...(remaining.hours > 0 ? [padZero(remaining.hours)] : []),
    padZero(remaining.minutes),
    padZero(remaining.seconds),
  ];

  const labels = remaining.hours > 0
    ? ["Jam", "Menit", "Detik"]
    : ["Menit", "Detik"];

  return (
    <Animated.View
      style={{
        marginHorizontal: 12,
        marginTop: 10,
        borderRadius: 14,
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: "hidden",
        opacity: isCritical ? pulseAnim : 1,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: `${palette.accent}18`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Clock size={14} color={palette.accent} />
        </View>
        <Text style={{ fontSize: 12, fontWeight: "600", color: palette.muted }}>
          Selesaikan pembayaran dalam
        </Text>
      </View>

      {/* Timer */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingBottom: 14,
          paddingHorizontal: 14,
        }}
      >
        {timerDigits.map((digit, i) => (
          <View key={i} style={{ alignItems: "center" }}>
            <View
              style={{
                minWidth: 52,
                height: 48,
                borderRadius: 10,
                backgroundColor: `${palette.accent}12`,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: palette.accent,
                  fontVariant: ["tabular-nums"],
                  letterSpacing: 1,
                }}
              >
                {digit}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 9,
                fontWeight: "500",
                color: palette.muted,
                marginTop: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {labels[i]}
            </Text>
          </View>
        )).reduce((acc, view, i) => {
          if (i === 0) return [view];
          acc.push(
            <Text
              key={`sep-${i}`}
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: palette.accent,
                opacity: 0.4,
                marginTop: -14,
              }}
            >
              :
            </Text>,
          );
          acc.push(view);
          return acc;
        }, [] as React.ReactNode[])}
      </View>

      {/* Warning */}
      {isUrgent && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginHorizontal: 14,
            marginBottom: 12,
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 8,
            backgroundColor: `${palette.accent}10`,
          }}
        >
          <AlertTriangle size={12} color={palette.accent} />
          <Text style={{ fontSize: 11, fontWeight: "500", color: palette.accent, flex: 1 }}>
            {isCritical
              ? "Pembayaran akan segera kadaluarsa!"
              : "Segera selesaikan pembayaran"}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
