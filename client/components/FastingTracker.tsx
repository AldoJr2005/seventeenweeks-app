import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

type FastingType = "16:8" | "18:6" | "20:4" | "custom" | "none";

interface FastingTrackerProps {
  fastingType?: FastingType;
  eatingStartTime?: string;
  eatingEndTime?: string;
  onUpdateSettings?: (settings: {
    fastingType: FastingType;
    eatingStartTime: string;
    eatingEndTime: string;
  }) => void;
}

const FASTING_PRESETS: { type: FastingType; label: string; fastHours: number; eatHours: number }[] = [
  { type: "16:8", label: "16:8", fastHours: 16, eatHours: 8 },
  { type: "18:6", label: "18:6", fastHours: 18, eatHours: 6 },
  { type: "20:4", label: "20:4", fastHours: 20, eatHours: 4 },
  { type: "custom", label: "Custom", fastHours: 0, eatHours: 0 },
];

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

function formatTime(hours: number, minutes: number): string {
  const h = hours % 24;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

function getCurrentProgress(startTime: string, endTime: string): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);
  
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  
  let adjustedCurrent = currentMinutes;
  if (currentMinutes < startMinutes) {
    adjustedCurrent += 24 * 60;
  }
  
  if (adjustedCurrent >= startMinutes && adjustedCurrent <= endMinutes) {
    const total = endMinutes - startMinutes;
    const elapsed = adjustedCurrent - startMinutes;
    return Math.min(1, elapsed / total);
  }
  
  return adjustedCurrent > endMinutes ? 1 : 0;
}

export function FastingTracker({
  fastingType = "16:8",
  eatingStartTime = "12:00",
  eatingEndTime = "20:00",
  onUpdateSettings,
}: FastingTrackerProps) {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<FastingType>(fastingType);
  const [startTime, setStartTime] = useState(eatingStartTime);
  const [endTime, setEndTime] = useState(eatingEndTime);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { isEatingWindow, timeRemaining, progress, status } = useMemo(() => {
    const startMinutes = timeToMinutes(startTime);
    let endMinutes = timeToMinutes(endTime);
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    let adjustedCurrent = currentMinutes;
    if (currentMinutes < startMinutes && currentMinutes < (endMinutes % (24 * 60))) {
      adjustedCurrent = currentMinutes;
    }
    
    const inEatingWindow = 
      (adjustedCurrent >= startMinutes && adjustedCurrent < (endMinutes % (24 * 60))) ||
      (endMinutes > 24 * 60 && adjustedCurrent < (endMinutes % (24 * 60)));
    
    let remaining: number;
    let prog: number;
    let stat: string;

    if (inEatingWindow) {
      remaining = (endMinutes % (24 * 60)) - adjustedCurrent;
      if (remaining < 0) remaining += 24 * 60;
      const eatingDuration = endMinutes - startMinutes;
      prog = (adjustedCurrent - startMinutes) / eatingDuration;
      stat = "eating";
    } else {
      let nextStart = startMinutes;
      if (adjustedCurrent >= (endMinutes % (24 * 60))) {
        nextStart = startMinutes + 24 * 60;
      }
      remaining = nextStart - adjustedCurrent;
      if (remaining < 0) remaining += 24 * 60;
      const fastingDuration = 24 * 60 - (endMinutes - startMinutes);
      const elapsed = fastingDuration - remaining;
      prog = elapsed / fastingDuration;
      stat = "fasting";
    }

    const hours = Math.floor(remaining / 60);
    const mins = remaining % 60;
    
    return {
      isEatingWindow: inEatingWindow,
      timeRemaining: `${hours}h ${mins}m`,
      progress: Math.max(0, Math.min(1, prog)),
      status: stat,
    };
  }, [currentTime, startTime, endTime]);

  const progressWidth = useSharedValue(0);
  
  useEffect(() => {
    progressWidth.value = withSpring(progress, { damping: 20 });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const handleTypeSelect = (type: FastingType) => {
    setSelectedType(type);
    const preset = FASTING_PRESETS.find((p) => p.type === type);
    if (preset && preset.type !== "custom") {
      const newEndHour = (12 + preset.eatHours) % 24;
      setStartTime("12:00");
      setEndTime(`${newEndHour}:00`);
    }
  };

  const renderTimelineCircle = () => {
    const segments = 24;
    const startHour = parseTime(startTime).hours;
    const endHour = parseTime(endTime).hours;
    
    return (
      <View style={styles.timelineContainer}>
        <View style={styles.timelineCircle}>
          {Array.from({ length: segments }).map((_, i) => {
            const hour = i;
            let isEating = false;
            if (startHour < endHour) {
              isEating = hour >= startHour && hour < endHour;
            } else {
              isEating = hour >= startHour || hour < endHour;
            }
            const rotation = (i / segments) * 360 - 90;
            
            return (
              <View
                key={i}
                style={[
                  styles.timelineSegment,
                  {
                    backgroundColor: isEating ? theme.success : theme.neutral,
                    transform: [
                      { rotate: `${rotation}deg` },
                      { translateY: -50 },
                    ],
                  },
                ]}
              />
            );
          })}
          <View style={[styles.timelineCenter, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.statusEmoji}>
              {isEatingWindow ? "🍽" : "⏳"}
            </ThemedText>
            <ThemedText style={styles.timeRemainingText}>{timeRemaining}</ThemedText>
            <ThemedText style={[styles.statusText, { color: isEatingWindow ? theme.success : theme.primary }]}>
              {isEatingWindow ? "Eating Window" : "Fasting"}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  if (fastingType === "none" || selectedType === "none") {
    return (
      <Card style={styles.card}>
        <View style={styles.disabledContainer}>
          <Feather name="clock" size={48} color={theme.neutral} />
          <ThemedText style={[styles.disabledText, { color: theme.textSecondary }]}>
            Fasting tracking is not enabled
          </ThemedText>
          <Button onPress={() => handleTypeSelect("16:8")}>Enable Fasting</Button>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Fasting Timer</ThemedText>
          <View style={[styles.badge, { backgroundColor: isEatingWindow ? theme.success + "20" : theme.primary + "20" }]}>
            <ThemedText style={[styles.badgeText, { color: isEatingWindow ? theme.success : theme.primary }]}>
              {selectedType}
            </ThemedText>
          </View>
        </View>

        {renderTimelineCircle()}

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: isEatingWindow ? theme.success : theme.primary },
                progressStyle,
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <ThemedText style={[styles.progressLabel, { color: theme.textSecondary }]}>
              {formatTime(...Object.values(parseTime(startTime)) as [number, number])}
            </ThemedText>
            <ThemedText style={[styles.progressLabel, { color: theme.textSecondary }]}>
              {formatTime(...Object.values(parseTime(endTime)) as [number, number])}
            </ThemedText>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Fasting Schedule</ThemedText>
        <View style={styles.presetRow}>
          {FASTING_PRESETS.filter(p => p.type !== "custom").map((preset) => (
            <Pressable
              key={preset.type}
              style={[
                styles.presetButton,
                { borderColor: theme.border },
                selectedType === preset.type && { 
                  backgroundColor: theme.link, 
                  borderColor: theme.link 
                },
              ]}
              onPress={() => handleTypeSelect(preset.type)}
            >
              <ThemedText
                style={[
                  styles.presetText,
                  selectedType === preset.type && { color: "#FFFFFF" },
                ]}
              >
                {preset.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <ThemedText style={[styles.timeLabel, { color: theme.textSecondary }]}>
              Eating starts
            </ThemedText>
            <View style={[styles.timeDisplay, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <Feather name="sun" size={16} color={theme.success} />
              <ThemedText style={styles.timeValue}>
                {formatTime(...Object.values(parseTime(startTime)) as [number, number])}
              </ThemedText>
            </View>
          </View>
          <View style={styles.timeBlock}>
            <ThemedText style={[styles.timeLabel, { color: theme.textSecondary }]}>
              Eating ends
            </ThemedText>
            <View style={[styles.timeDisplay, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <Feather name="moon" size={16} color={theme.neutral} />
              <ThemedText style={styles.timeValue}>
                {formatTime(...Object.values(parseTime(endTime)) as [number, number])}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.headline,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.footnote,
    fontWeight: "600",
  },
  timelineContainer: {
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  timelineCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineSegment: {
    position: "absolute",
    width: 6,
    height: 16,
    borderRadius: 3,
    top: "50%",
    left: "50%",
    marginLeft: -3,
  },
  timelineCenter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  statusEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  timeRemainingText: {
    ...Typography.title2,
    fontWeight: "700",
  },
  statusText: {
    ...Typography.footnote,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: Spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  progressLabel: {
    ...Typography.caption,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  presetRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  presetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  presetText: {
    ...Typography.callout,
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  timeBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  timeLabel: {
    ...Typography.footnote,
  },
  timeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  timeValue: {
    ...Typography.callout,
    fontWeight: "600",
  },
  disabledContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  disabledText: {
    ...Typography.body,
    textAlign: "center",
  },
});
