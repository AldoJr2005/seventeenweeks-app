import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

type TrainingStyle = "strength" | "hybrid" | "cardio_focused";
type PreferredSplit = "push_pull_legs" | "upper_lower" | "full_body" | "bro_split";

interface WorkoutPreferences {
  workoutsPerWeek: number;
  trainingStyle: TrainingStyle;
  preferredSplit: PreferredSplit;
  runningDaysPerWeek: number;
}

interface WorkoutPreferenceSetupProps {
  initialPreferences?: Partial<WorkoutPreferences>;
  onSave: (preferences: WorkoutPreferences) => void;
  isLoading?: boolean;
}

const TRAINING_STYLES: { value: TrainingStyle; label: string; description: string; icon: string }[] = [
  { value: "strength", label: "Strength", description: "Focus on building muscle", icon: "award" },
  { value: "hybrid", label: "Hybrid", description: "Mix of strength and cardio", icon: "activity" },
  { value: "cardio_focused", label: "Cardio Focused", description: "Emphasize cardiovascular fitness", icon: "heart" },
];

const SPLITS: { value: PreferredSplit; label: string; description: string }[] = [
  { value: "push_pull_legs", label: "Push/Pull/Legs", description: "6 days with rest between" },
  { value: "upper_lower", label: "Upper/Lower", description: "4 days alternating" },
  { value: "full_body", label: "Full Body", description: "3 days total body" },
  { value: "bro_split", label: "Body Part Split", description: "5-6 days muscle groups" },
];

export function WorkoutPreferenceSetup({ 
  initialPreferences, 
  onSave,
  isLoading 
}: WorkoutPreferenceSetupProps) {
  const { theme } = useTheme();
  
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(initialPreferences?.workoutsPerWeek || 4);
  const [trainingStyle, setTrainingStyle] = useState<TrainingStyle>(
    (initialPreferences?.trainingStyle as TrainingStyle) || "hybrid"
  );
  const [preferredSplit, setPreferredSplit] = useState<PreferredSplit>(
    (initialPreferences?.preferredSplit as PreferredSplit) || "push_pull_legs"
  );
  const [runningDaysPerWeek, setRunningDaysPerWeek] = useState(initialPreferences?.runningDaysPerWeek || 0);

  const handleSave = () => {
    if (workoutsPerWeek < 1 || workoutsPerWeek > 7) {
      Alert.alert("Invalid Input", "Please select between 1-7 workout days per week.");
      return;
    }
    onSave({
      workoutsPerWeek,
      trainingStyle,
      preferredSplit,
      runningDaysPerWeek,
    });
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Workout Preferences</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Set up your training schedule and style
      </ThemedText>

      <Card style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Workouts Per Week</ThemedText>
        <ThemedText style={[styles.sectionHint, { color: theme.textSecondary }]}>
          How many days will you train?
        </ThemedText>
        <View style={styles.daysRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <Pressable
              key={day}
              style={[
                styles.dayButton,
                { borderColor: theme.border },
                workoutsPerWeek === day && { backgroundColor: theme.link, borderColor: theme.link },
              ]}
              onPress={() => setWorkoutsPerWeek(day)}
            >
              <ThemedText 
                style={[
                  styles.dayText,
                  workoutsPerWeek === day && { color: "#FFFFFF" }
                ]}
              >
                {day}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Training Style</ThemedText>
        <View style={styles.optionsContainer}>
          {TRAINING_STYLES.map((style) => (
            <Pressable
              key={style.value}
              style={[
                styles.optionCard,
                { borderColor: theme.border, backgroundColor: theme.backgroundDefault },
                trainingStyle === style.value && { 
                  borderColor: theme.link, 
                  backgroundColor: theme.link + "10" 
                },
              ]}
              onPress={() => setTrainingStyle(style.value)}
            >
              <View style={styles.optionIconContainer}>
                <Feather 
                  name={style.icon as any} 
                  size={24} 
                  color={trainingStyle === style.value ? theme.link : theme.textSecondary} 
                />
                {trainingStyle === style.value && (
                  <View style={[styles.checkBadge, { backgroundColor: theme.link }]}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <ThemedText style={styles.optionLabel}>{style.label}</ThemedText>
              <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>
                {style.description}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Preferred Split</ThemedText>
        <View style={styles.splitContainer}>
          {SPLITS.map((split) => (
            <Pressable
              key={split.value}
              style={[
                styles.splitOption,
                { borderColor: theme.border },
                preferredSplit === split.value && { 
                  borderColor: theme.link, 
                  backgroundColor: theme.link + "10" 
                },
              ]}
              onPress={() => setPreferredSplit(split.value)}
            >
              <View style={styles.splitContent}>
                <ThemedText style={styles.splitLabel}>{split.label}</ThemedText>
                <ThemedText style={[styles.splitDesc, { color: theme.textSecondary }]}>
                  {split.description}
                </ThemedText>
              </View>
              {preferredSplit === split.value && (
                <Feather name="check-circle" size={20} color={theme.link} />
              )}
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Running Days</ThemedText>
        <ThemedText style={[styles.sectionHint, { color: theme.textSecondary }]}>
          Additional cardio sessions per week
        </ThemedText>
        <View style={styles.daysRow}>
          {[0, 1, 2, 3, 4, 5].map((day) => (
            <Pressable
              key={day}
              style={[
                styles.dayButton,
                { borderColor: theme.border },
                runningDaysPerWeek === day && { backgroundColor: theme.link, borderColor: theme.link },
              ]}
              onPress={() => setRunningDaysPerWeek(day)}
            >
              <ThemedText 
                style={[
                  styles.dayText,
                  runningDaysPerWeek === day && { color: "#FFFFFF" }
                ]}
              >
                {day}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Card>

      <Button onPress={handleSave} style={styles.saveButton} disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Preferences"}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  title: {
    ...Typography.title2,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  card: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    ...Typography.footnote,
    marginBottom: Spacing.md,
  },
  daysRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    ...Typography.headline,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  optionCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  optionIconContainer: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  checkBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    ...Typography.callout,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  optionDesc: {
    ...Typography.caption,
    textAlign: "center",
  },
  splitContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  splitOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  splitContent: {
    flex: 1,
  },
  splitLabel: {
    ...Typography.callout,
  },
  splitDesc: {
    ...Typography.footnote,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
});
