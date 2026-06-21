const light = {
  background: "#fafafa",
  foreground: "#0a0a0a",

  card: "#ffffff",
  cardForeground: "#0a0a0a",

  primary: "#eb2525",
  primaryForeground: "#ffffff",

  secondary: "#f5f5f5",
  secondaryForeground: "#0a0a0a",

  muted: "#f5f5f5",
  mutedForeground: "#737373",

  accent: "#f5f5f5",
  accentForeground: "#0a0a0a",

  destructive: "#dc2626",
  destructiveForeground: "#ffffff",

  border: "#e5e5e5",
  input: "#e5e5e5",
  ring: "#eb2525",

  cardBorder: "#e5e5e5",

  success: "#22c55e",
  warning: "#f59e0b",

  topBarBg: "#ffffff",
  topBarBorder: "#f0f0f0",
  searchBg: "#f5f5f5",
  sectionBg: "#ffffff",
  quickActionBg: "#fafafa",
  categoryBg: "#f5f5f5",
  skeletonBg: "#f0f0f0",
  dividerBg: "#f5f5f5",
};

const dark = {
  background: "#0a0a0a",
  foreground: "#fafafa",

  card: "#171717",
  cardForeground: "#fafafa",

  primary: "#eb2525",
  primaryForeground: "#ffffff",

  secondary: "#262626",
  secondaryForeground: "#fafafa",

  muted: "#262626",
  mutedForeground: "#a3a3a3",

  accent: "#262626",
  accentForeground: "#fafafa",

  destructive: "#ef4444",
  destructiveForeground: "#ffffff",

  border: "#262626",
  input: "#262626",
  ring: "#eb2525",

  cardBorder: "#262626",

  success: "#22c55e",
  warning: "#f59e0b",

  topBarBg: "#171717",
  topBarBorder: "#262626",
  searchBg: "#262626",
  sectionBg: "#171717",
  quickActionBg: "#171717",
  categoryBg: "#262626",
  skeletonBg: "#262626",
  dividerBg: "#262626",
};

export const colors = { light, dark };
export type ThemeColors = typeof light;
