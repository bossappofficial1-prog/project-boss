import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  size?: "sm" | "md" | "lg";
  /**
   * Set true when this component sits inside a parent that already
   * has the correct background (e.g. inside a Card or Sheet).
   * Default false — component owns its own background so it always
   * respects the active theme regardless of what the parent renders.
   */
  transparent?: boolean;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  transparent = false,
}: EmptyStateProps) => {
  const c = useThemeColors();
  const s = sizes[size];

  return (
    <View
      style={[
        styles.root,
        { paddingVertical: s.padding },
        !transparent && { backgroundColor: c.background },
      ]}
    >
      {Icon && (
        <View
          style={[
            styles.iconWrap,
            {
              width: s.iconBox,
              height: s.iconBox,
              borderRadius: s.iconBox / 2,
              backgroundColor: c.muted,
              borderColor: c.border,
            },
          ]}
        >
          <Icon size={s.iconSize} color={c.mutedForeground} strokeWidth={1.5} />
        </View>
      )}

      <View style={[styles.text, { marginTop: Icon ? s.gap : 0 }]}>
        <Text
          style={[styles.title, { color: c.foreground, fontSize: s.titleSize }]}
        >
          {title}
        </Text>
        {description && (
          <Text
            style={[
              styles.desc,
              { color: c.mutedForeground, fontSize: s.descSize, marginTop: 4 },
            ]}
          >
            {description}
          </Text>
        )}
      </View>

      {(action || secondaryAction) && (
        <View style={[styles.actions, { marginTop: s.gap }]}>
          {action && (
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrimary,
                { backgroundColor: c.primary, height: s.btnHeight },
              ]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: c.primaryForeground, fontSize: s.btnFontSize },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          )}
          {secondaryAction && (
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnSecondary,
                {
                  borderColor: c.border,
                  height: s.btnHeight,
                  marginTop: action ? 8 : 0,
                },
              ]}
              onPress={secondaryAction.onPress}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: c.foreground, fontSize: s.btnFontSize },
                ]}
              >
                {secondaryAction.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
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
  },
  btn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  btnPrimary: {},
  btnSecondary: {
    borderWidth: 1,
  },
  btnText: {
    fontWeight: "500",
    letterSpacing: -0.1,
  },
});
