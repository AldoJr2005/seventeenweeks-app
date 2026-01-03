import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useChallenge, useUpdateChallenge } from "@/hooks/useChallenge";
import type { Challenge } from "@shared/schema";

type FastingType = "16:8" | "18:6" | "20:4" | "none";

const FASTING_PRESETS: { type: FastingType; label: string; fastHours: number; eatHours: number; description: string }[] = [
  { type: "16:8", label: "16:8", fastHours: 16, eatHours: 8, description: "Most popular - Fast 16h, eat 8h" },
  { type: "18:6", label: "18:6", fastHours: 18, eatHours: 6, description: "Intermediate - Fast 18h, eat 6h" },
  { type: "20:4", label: "20:4", fastHours: 20, eatHours: 4, description: "Advanced - Fast 20h, eat 4h" },
  { type: "none", label: "None", fastHours: 0, eatHours: 24, description: "No fasting schedule" },
];

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

function formatTime(timeStr: string): string {
  const [hours] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

export default function FastingSettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { data: challenge } = useChallenge() as { data: Challenge | null };
  const updateChallenge = useUpdateChallenge();

  const [selectedType, setSelectedType] = useState<FastingType>(
    (challenge?.fastingType as FastingType) || "none"
  );
  const [startTime, setStartTime] = useState(challenge?.eatingStartTime || "12:00");
  const [showStartPicker, setShowStartPicker] = useState(false);

  const endTime = React.useMemo(() => {
    const preset = FASTING_PRESETS.find((p) => p.type === selectedType);
    if (!preset || selectedType === "none") return "00:00";
    const [startHour] = startTime.split(":").map(Number);
    const endHour = (startHour + preset.eatHours) % 24;
    return `${endHour.toString().padStart(2, "0")}:00`;
  }, [selectedType, startTime]);

  const handleSave = async () => {
    if (!challenge) return;

    try {
      await updateChallenge.mutateAsync({
        id: challenge.id,
        data: {
          fastingType: selectedType,
          eatingStartTime: startTime,
          eatingEndTime: endTime,
        },
      });
      Alert.alert(
        "Fasting Settings Saved",
        selectedType === "none" 
          ? "Fasting tracking has been disabled."
          : `Your ${selectedType} fasting schedule has been set.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save settings. Please try again.");
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { 
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <ThemedText style={styles.title}>Fasting Schedule</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Choose an intermittent fasting protocol
      </ThemedText>

      <Card style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Fasting Type</ThemedText>
        <View style={styles.typeContainer}>
          {FASTING_PRESETS.map((preset) => (
            <Pressable
              key={preset.type}
              style={[
                styles.typeOption,
                { borderColor: theme.border },
                selectedType === preset.type && { 
                  borderColor: preset.type === "none" ? theme.neutral : theme.link, 
                  backgroundColor: (preset.type === "none" ? theme.neutral : theme.link) + "10" 
                },
              ]}
              onPress={() => setSelectedType(preset.type)}
            >
              <View style={styles.typeHeader}>
                <ThemedText style={styles.typeLabel}>{preset.label}</ThemedText>
                {selectedType === preset.type && (
                  <Feather 
                    name="check-circle" 
                    size={20} 
                    color={preset.type === "none" ? theme.neutral : theme.link} 
                  />
                )}
              </View>
              <ThemedText style={[styles.typeDesc, { color: theme.textSecondary }]}>
                {preset.description}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Card>

      {selectedType !== "none" && (
        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Eating Window Start</ThemedText>
          <ThemedText style={[styles.sectionHint, { color: theme.textSecondary }]}>
            When does your eating window begin?
          </ThemedText>
          
          <Pressable 
            style={[styles.timeSelector, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
            onPress={() => setShowStartPicker(!showStartPicker)}
          >
            <Feather name="sun" size={20} color={theme.success} />
            <ThemedText style={styles.selectedTime}>{formatTime(startTime)}</ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </Pressable>

          {showStartPicker && (
            <View style={styles.timePickerContainer}>
              {TIME_OPTIONS.map((time) => (
                <Pressable
                  key={time}
                  style={[
                    styles.timeOption,
                    { borderColor: theme.border },
                    startTime === time && { backgroundColor: theme.link, borderColor: theme.link },
                  ]}
                  onPress={() => {
                    setStartTime(time);
                    setShowStartPicker(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.timeOptionText,
                      startTime === time && { color: "#FFFFFF" },
                    ]}
                  >
                    {formatTime(time)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.schedulePreview}>
            <View style={styles.scheduleRow}>
              <View style={[styles.scheduleIcon, { backgroundColor: theme.success + "20" }]}>
                <Feather name="sun" size={16} color={theme.success} />
              </View>
              <View style={styles.scheduleInfo}>
                <ThemedText style={[styles.scheduleLabel, { color: theme.textSecondary }]}>
                  Start Eating
                </ThemedText>
                <ThemedText style={styles.scheduleTime}>{formatTime(startTime)}</ThemedText>
              </View>
            </View>
            <View style={[styles.scheduleLine, { backgroundColor: theme.border }]} />
            <View style={styles.scheduleRow}>
              <View style={[styles.scheduleIcon, { backgroundColor: theme.neutral + "20" }]}>
                <Feather name="moon" size={16} color={theme.neutral} />
              </View>
              <View style={styles.scheduleInfo}>
                <ThemedText style={[styles.scheduleLabel, { color: theme.textSecondary }]}>
                  Stop Eating
                </ThemedText>
                <ThemedText style={styles.scheduleTime}>{formatTime(endTime)}</ThemedText>
              </View>
            </View>
          </View>
        </Card>
      )}

      <Button onPress={handleSave} style={styles.saveButton} disabled={updateChallenge.isPending}>
        {updateChallenge.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  title: {
    ...Typography.title2,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    ...Typography.footnote,
    marginBottom: Spacing.md,
  },
  typeContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  typeOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  typeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  typeLabel: {
    ...Typography.headline,
  },
  typeDesc: {
    ...Typography.footnote,
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  selectedTime: {
    ...Typography.headline,
    flex: 1,
  },
  timePickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  timeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  timeOptionText: {
    ...Typography.callout,
  },
  schedulePreview: {
    marginTop: Spacing.lg,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  scheduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    ...Typography.caption,
  },
  scheduleTime: {
    ...Typography.headline,
  },
  scheduleLine: {
    width: 2,
    height: 24,
    marginLeft: 17,
    marginVertical: Spacing.xs,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
});
