import { useThemeColors } from "@/src/hooks/use-theme-colors";
import {
  AlertCircle,
  RefreshCw,
  ServerOff,
  ShieldOff,
  WifiOff,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ErrorVariant =
  | "generic"
  | "network"
  | "server"
  | "permission"
  | "notFound";

type ErrorStateProps = {
  variant?: ErrorVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  onBack?: () => void;
  size?: "sm" | "md" | "lg";
  /** See EmptyState for explanation. Default false. */
  transparent?: boolean;
};

const variantConfig: Record<
  ErrorVariant,
  { icon: any; defaultTitle: string; defaultDesc: string }
> = {
  generic: {
    icon: AlertCircle,
    defaultTitle: "Something went wrong",
    defaultDesc: "An unexpected error occurred. Please try again.",
  },
  network: {
    icon: WifiOff,
    defaultTitle: "No connection",
    defaultDesc: "Check your internet connection and try again.",
  },
  server: {
    icon: ServerOff,
    defaultTitle: "Server error",
    defaultDesc: "Our servers are having trouble. We're on it.",
  },
  permission: {
    icon: ShieldOff,
    defaultTitle: "Access denied",
    defaultDesc: "You don't have permission to view this.",
  },
  notFound: {
    icon: AlertCircle,
    defaultTitle: "Not found",
    defaultDesc: "This page or item doesn't exist or was removed.",
  },
};

const sizes = {
  sm: {
    padding: 24,
    iconBox: 40,
    iconSize: 18,
    gap: 12,
    titleSize: 14,
    descSize: 12,
    btnHeight: 34,
    btnFontSize: 13,
  },
  md: {
    padding: 40,
    iconBox: 52,
    iconSize: 22,
    gap: 16,
    titleSize: 15,
    descSize: 13,
    btnHeight: 40,
    btnFontSize: 14,
  },
  lg: {
    padding: 56,
    iconBox: 64,
    iconSize: 26,
    gap: 20,
    titleSize: 17,
    descSize: 14,
    btnHeight: 44,
    btnFontSize: 15,
  },
};

export const ErrorState = ({
  variant = "generic",
  title,
  description,
  onRetry,
  onBack,
  size = "md",
  transparent = false,
}: ErrorStateProps) => {
  const c = useThemeColors();
  const s = sizes[size];
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <View
      style={[
        styles.root,
        { paddingVertical: s.padding },
        !transparent && { backgroundColor: c.background },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            width: s.iconBox,
            height: s.iconBox,
            borderRadius: s.iconBox / 2,
            backgroundColor: `${c.destructive}14`,
            borderColor: `${c.destructive}28`,
          },
        ]}
      >
        <Icon size={s.iconSize} color={c.destructive} strokeWidth={1.5} />
      </View>

      <View style={[styles.text, { marginTop: s.gap }]}>
        <Text
          style={[styles.title, { color: c.foreground, fontSize: s.titleSize }]}
        >
          {title ?? config.defaultTitle}
        </Text>
        <Text
          style={[
            styles.desc,
            { color: c.mutedForeground, fontSize: s.descSize, marginTop: 4 },
          ]}
        >
          {description ?? config.defaultDesc}
        </Text>
      </View>

      {(onRetry || onBack) && (
        <View style={[styles.actions, { marginTop: s.gap }]}>
          {onRetry && (
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnRetry,
                {
                  backgroundColor: c.secondary,
                  borderColor: c.border,
                  height: s.btnHeight,
                },
              ]}
              onPress={onRetry}
              activeOpacity={0.7}
            >
              <RefreshCw
                size={s.btnFontSize - 1}
                color={c.foreground}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.btnText,
                  {
                    color: c.foreground,
                    fontSize: s.btnFontSize,
                    marginLeft: 6,
                  },
                ]}
              >
                Try again
              </Text>
            </TouchableOpacity>
          )}

          {onBack && (
            <TouchableOpacity
              style={{ marginTop: onRetry ? 8 : 0 }}
              onPress={onBack}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.backText,
                  { color: c.mutedForeground, fontSize: s.btnFontSize - 1 },
                ]}
              >
                Go back
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  text: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  desc: {
    textAlign: "center",
    lineHeight: 19,
  },
  actions: {
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
  },
  btn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    flexDirection: "row",
  },
  btnRetry: {
    borderWidth: 1,
  },
  btnText: {
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  backText: {
    fontWeight: "400",
  },
});
