import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { ArrowLeft, Search, X } from "lucide-react-native";
import React, { ReactNode, useEffect, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";

type BaseProps = {
  /** When provided, shows a back button that calls this. Omit to hide. */
  onBack?: () => void;
  /** Slot for right side */
  rightContent?: ReactNode;
  /** Hide the bottom border */
  noBorder?: boolean;
  /** Extra styles on the root container */
  style?: ViewStyle;
};

type DefaultProps = BaseProps & {
  variant?: "default";
  title?: string;
  description?: string;
  /** Custom left slot — overrides back button entirely */
  leftContent?: ReactNode;
  // search props not allowed
  searchValue?: never;
  onSearchChange?: never;
  searchPlaceholder?: never;
  onSearchSubmit?: never;
  autoFocus?: never;
};

type SearchProps = BaseProps & {
  variant: "search";
  searchValue: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  onSearchSubmit?: () => void;
  autoFocus?: boolean;
  // title props not allowed
  title?: never;
  description?: never;
  leftContent?: never;
};

type StackHeaderProps = DefaultProps | SearchProps;

export const StackHeader = (props: StackHeaderProps) => {
  const c = useThemeColors();
  const inputRef = useRef<TextInput>(null);

  const { onBack, rightContent, noBorder = false, style } = props;

  useEffect(() => {
    if (props.variant === "search" && props.autoFocus !== false) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, []);

  const rootStyle = [
    styles.root,
    {
      paddingTop: 16,
      backgroundColor: c.background,
      borderBottomWidth: noBorder ? 0 : 1,
      borderBottomColor: noBorder ? "transparent" : c.topBar.border,
    },
    style,
  ];

  // ── Search variant ──
  if (props.variant === "search") {
    return (
      <View style={rootStyle}>
        <View style={styles.row}>
          {onBack && (
            <Pressable onPress={onBack} hitSlop={10} style={styles.arrowBtn}>
              <ArrowLeft size={22} color={c.foreground} strokeWidth={2} />
            </Pressable>
          )}

          <View style={[styles.searchBar, { backgroundColor: c.search.bg }]}>
            <Search size={16} color={c.mutedForeground} strokeWidth={2} />
            <TextInput
              ref={inputRef}
              value={props.searchValue}
              onChangeText={props.onSearchChange}
              placeholder={props.searchPlaceholder ?? "Search..."}
              placeholderTextColor={c.mutedForeground}
              style={[styles.searchInput, { color: c.foreground }]}
              returnKeyType="search"
              onSubmitEditing={props.onSearchSubmit}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {props.searchValue.length > 0 && (
              <Pressable
                onPress={() => props.onSearchChange("")}
                hitSlop={8}
                style={[
                  styles.clearBtn,
                  { backgroundColor: c.mutedForeground + "28" },
                ]}
              >
                <X size={11} color={c.mutedForeground} strokeWidth={2.5} />
              </Pressable>
            )}
          </View>

          {rightContent}
        </View>
      </View>
    );
  }

  // ── Default variant ──
  const left =
    props.leftContent ??
    (onBack ? (
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={[styles.backBtn, { backgroundColor: c.muted }]}
      >
        <ArrowLeft size={18} color={c.foreground} strokeWidth={2} />
      </Pressable>
    ) : null);

  return (
    <View style={rootStyle}>
      <View style={styles.row}>
        {left != null && <View style={styles.side}>{left}</View>}

        <View style={styles.center}>
          {props.title && (
            <Text
              style={[styles.title, { color: c.foreground }]}
              numberOfLines={1}
            >
              {props.title}
            </Text>
          )}
          {props.description && (
            <Text
              style={[styles.description, { color: c.mutedForeground }]}
              numberOfLines={1}
            >
              {props.description}
            </Text>
          )}
        </View>

        {rightContent != null && (
          <View style={[styles.side, styles.sideRight]}>{rightContent}</View>
        )}
      </View>
    </View>
  );
};

type HeaderIconBtnProps = {
  icon: ReactNode;
  onPress: () => void;
  badge?: number;
};

export const HeaderIconBtn = ({ icon, onPress, badge }: HeaderIconBtnProps) => {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={[styles.backBtn, { backgroundColor: c.muted }]}
    >
      {icon}
      {badge != null && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: c.primary }]}>
          <Text style={[styles.badgeText, { color: c.primaryForeground }]}>
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

type HeaderTextBtnProps = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export const HeaderTextBtn = ({
  label,
  onPress,
  destructive = false,
}: HeaderTextBtnProps) => {
  const c = useThemeColors();
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Text
        style={[
          styles.textBtn,
          { color: destructive ? c.destructive : c.primary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  side: {
    width: 32,
    alignItems: "flex-start",
  },
  sideRight: {
    alignItems: "flex-end",
  },
  center: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 1,
    letterSpacing: -0.1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0,
  },
  textBtn: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    letterSpacing: -0.1,
  },
  clearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
