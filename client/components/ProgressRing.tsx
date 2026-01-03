import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Typography, Spacing } from "@/constants/theme";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  value?: string;
  subValue?: string;
  showPercentage?: boolean;
  compact?: boolean;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  color,
  backgroundColor,
  label,
  value,
  subValue,
  showPercentage = false,
  compact = false,
}: ProgressRingProps) {
  const { theme } = useTheme();
  const progressColor = color || theme.primary;
  const bgColor = backgroundColor || theme.backgroundTertiary;
  
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - clampedProgress * circumference;

  return (
    <View style={styles.container}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            stroke={bgColor}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <Circle
            stroke={progressColor}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.centerContent}>
          {value ? (
            <ThemedText style={compact ? styles.valueCompact : styles.value}>{value}</ThemedText>
          ) : showPercentage ? (
            <ThemedText style={compact ? styles.valueCompact : styles.value}>
              {Math.round(clampedProgress * 100)}%
            </ThemedText>
          ) : null}
          {subValue ? (
            <ThemedText style={[styles.subValue, { color: theme.textSecondary }]}>{subValue}</ThemedText>
          ) : null}
        </View>
      </View>
      {label ? (
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  ringContainer: {
    position: "relative",
  },
  svg: {
    transform: [{ rotateZ: "0deg" }],
  },
  centerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  value: {
    ...Typography.subheadline,
    fontWeight: "600",
  },
  valueCompact: {
    ...Typography.caption,
    fontWeight: "600",
  },
  subValue: {
    fontSize: 10,
    fontWeight: "400" as const,
    marginTop: -2,
  },
  label: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
