import { useThemeColors } from "@/src/hooks/use-theme-colors";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export const Skeleton = ({
  width = "100%",
  height = 16,
  borderRadius = 6,
  style,
}: SkeletonProps) => {
  const c = useThemeColors();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: c.skeletonBg, opacity },
        style,
      ]}
    />
  );
};

export const SkeletonListItem = ({
  showAvatar = true,
}: {
  showAvatar?: boolean;
}) => {
  const c = useThemeColors();
  return (
    <View style={[skeletonStyles.listItem, { borderBottomColor: c.border }]}>
      {showAvatar && (
        <Skeleton
          width={40}
          height={40}
          borderRadius={20}
          style={{ marginRight: 12 }}
        />
      )}
      <View style={skeletonStyles.listText}>
        <Skeleton width="55%" height={13} borderRadius={4} />
        <Skeleton
          width="80%"
          height={11}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
      </View>
    </View>
  );
};

export const SkeletonCard = () => {
  const c = useThemeColors();
  return (
    <View
      style={[
        skeletonStyles.card,
        { backgroundColor: c.card, borderColor: c.cardBorder },
      ]}
    >
      <Skeleton width="100%" height={120} borderRadius={8} />
      <View style={{ marginTop: 12 }}>
        <Skeleton width="65%" height={13} borderRadius={4} />
        <Skeleton
          width="45%"
          height={11}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
        <Skeleton
          width="30%"
          height={11}
          borderRadius={4}
          style={{ marginTop: 4 }}
        />
      </View>
    </View>
  );
};

export const SkeletonTagRow = ({ count = 4 }: { count?: number }) => (
  <View style={skeletonStyles.tagRow}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton
        key={i}
        width={56 + (i % 2) * 16}
        height={28}
        borderRadius={14}
        style={{ marginRight: 8 }}
      />
    ))}
  </View>
);

const skeletonStyles = StyleSheet.create({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listText: { flex: 1 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  tagRow: { flexDirection: "row", flexWrap: "nowrap" },
});

type LoadingSpinnerProps = {
  size?: number;
  color?: string;
};

export const LoadingSpinner = ({ size = 20, color }: LoadingSpinnerProps) => {
  const c = useThemeColors();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const strokeColor = color ?? c.primary;
  const borderWidth = size <= 16 ? 2 : size <= 28 ? 2.5 : 3;

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor: `${strokeColor}30`,
        borderTopColor: strokeColor,
        transform: [{ rotate: spin }],
      }}
    />
  );
};

// fullScreen=false (default) → owns its background via c.background so the
//   spinner is always visible regardless of parent background color.
// fullScreen=true → absolute overlay covering the whole screen.
// transparent=true → no background, useful when embedded in a parent that
//   already has the right background (e.g. inside a Card).

type LoadingStateProps = {
  fullScreen?: boolean;
  /** Skip background; parent must provide the correct themed background. */
  transparent?: boolean;
};

export const LoadingState = ({
  fullScreen = false,
  transparent = false,
}: LoadingStateProps) => {
  const c = useThemeColors();

  if (fullScreen) {
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          loadingStyles.center,
          { backgroundColor: c.background, zIndex: 10 },
        ]}
      >
        <LoadingSpinner size={22} />
      </View>
    );
  }

  return (
    <View
      style={[
        loadingStyles.inline,
        !transparent && { backgroundColor: c.background },
      ]}
    >
      <LoadingSpinner size={22} />
    </View>
  );
};

const loadingStyles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  inline: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    width: "100%",
  },
});
