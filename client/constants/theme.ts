import { Platform } from "react-native";

// Apple-style iOS colors based on design_guidelines.md
export const Colors = {
  light: {
    text: "#000000",
    textSecondary: "#666666",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8E8E93",
    tabIconSelected: "#007AFF",
    link: "#007AFF",
    primary: "#007AFF",
    success: "#34C759",
    warning: "#FF9500",
    neutral: "#8E8E93",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#E8E8E8",
    backgroundSecondary: "#E0E0E0",
    backgroundTertiary: "#D8D8D8",
    border: "#E5E5E5",
    cardBackground: "#E8E8E8",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#ABABAB",
    buttonText: "#FFFFFF",
    tabIconDefault: "#98989D",
    tabIconSelected: "#0A84FF",
    link: "#0A84FF",
    primary: "#0A84FF",
    success: "#30D158",
    warning: "#FF9F0A",
    neutral: "#98989D",
    backgroundRoot: "#000000",
    backgroundDefault: "#1C1C1E",
    backgroundSecondary: "#2C2C2E",
    backgroundTertiary: "#38383A",
    border: "#38383A",
    cardBackground: "#1C1C1E",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  inputHeight: 50,
  buttonHeight: 44,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  full: 9999,
};

// Apple SF Pro inspired typography
export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: "700" as const,
  },
  title1: {
    fontSize: 28,
    fontWeight: "400" as const,
  },
  title2: {
    fontSize: 22,
    fontWeight: "400" as const,
  },
  title3: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  headline: {
    fontSize: 17,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 17,
    fontWeight: "400" as const,
  },
  callout: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: "400" as const,
  },
  footnote: {
    fontSize: 13,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
};

// Card shadow for iOS
export const CardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08, // Increased from 0.05 for better visibility in light mode
  shadowRadius: 8,
  elevation: 2,
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
