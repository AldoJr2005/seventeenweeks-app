import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useChallenge } from "@/hooks/useChallenge";
import { useWorkoutLog, useCreateWorkoutLog, useUpdateWorkoutLog } from "@/hooks/useWorkoutLogs";
import { getToday, formatLongDate } from "@/lib/date-utils";
import { WORKOUT_TYPES, type WorkoutType } from "@shared/schema";
import type { LogStackParamList } from "@/navigation/LogStackNavigator";
import type { WorkoutLog } from "@shared/schema";

type RouteParams = RouteProp<LogStackParamList, "WorkoutLog">;

const WORKOUT_TEMPLATES: Record<string, string> = {
  Push: "Bench Press, Shoulder Press, Tricep Dips, Chest Flyes",
  Pull: "Pull-ups, Rows, Bicep Curls, Face Pulls",
  Legs: "Squats, Deadlifts, Lunges, Calf Raises",
  "Plyo-Abs": "Box Jumps, Planks, Mountain Climbers, Russian Twists",
};

export default function WorkoutLogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();

  const date = route.params?.date || getToday();
  const { data: challenge } = useChallenge();
  const { data: existingLog, isLoading } = useWorkoutLog(date);
  const createWorkoutLog = useCreateWorkoutLog();
  const updateWorkoutLog = useUpdateWorkoutLog();

  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (existingLog) {
      const log = existingLog as WorkoutLog;
      setWorkoutType(log.type as WorkoutType);
      setDuration(log.durationMin?.toString() || "");
      setNotes(log.notes || "");
      setExercises(log.exercises || "");
    }
  }, [existingLog]);

  const handleSelectType = (type: WorkoutType) => {
    setWorkoutType(type);
    if (type !== "Rest" && WORKOUT_TEMPLATES[type] && !exercises) {
      setExercises(WORKOUT_TEMPLATES[type]);
    }
  };

  const handleSave = async () => {
    if (!challenge || !workoutType) return;

    const data = {
      challengeId: challenge.id,
      date,
      type: workoutType,
      durationMin: duration ? parseInt(duration) : null,
      notes: notes || null,
      exercises: exercises || null,
    };

    try {
      if (existingLog) {
        await updateWorkoutLog.mutateAsync({ id: (existingLog as WorkoutLog).id, data });
      } else {
        await createWorkoutLog.mutateAsync(data);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowConfirmation(true);
      setTimeout(() => {
        navigation.goBack();
      }, 800);
    } catch (error) {
      Alert.alert("Error", "Failed to save workout log");
    }
  };

  const isSaving = createWorkoutLog.isPending || updateWorkoutLog.isPending;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
      ]}
    >
      <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
        {formatLongDate(date)}
      </ThemedText>

      <ThemedText style={styles.sectionTitle}>Workout Type</ThemedText>
      <View style={styles.typeGrid}>
        {WORKOUT_TYPES.map((type) => (
          <Pressable
            key={type}
            style={[
              styles.typeButton,
              { 
                backgroundColor: workoutType === type ? theme.primary : theme.backgroundDefault,
                borderColor: workoutType === type ? theme.primary : theme.border,
              }
            ]}
            onPress={() => handleSelectType(type)}
          >
            <Feather 
              name={type === "Rest" ? "moon" : "zap"} 
              size={20} 
              color={workoutType === type ? "#FFF" : theme.text} 
            />
            <ThemedText style={{ color: workoutType === type ? "#FFF" : theme.text, fontWeight: "500" }}>
              {type}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {workoutType && workoutType !== "Rest" ? (
        <>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Duration (minutes)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="e.g., 45"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={duration}
              onChangeText={setDuration}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Exercises
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.exercisesInput,
                { 
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="List your exercises..."
              placeholderTextColor={theme.textSecondary}
              value={exercises}
              onChangeText={setExercises}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Notes (optional)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.notesInput,
                { 
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="How did it go?"
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>
        </>
      ) : workoutType === "Rest" ? (
        <View style={[styles.restContainer, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="moon" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.restText, { color: theme.textSecondary }]}>
            Rest day selected
          </ThemedText>
          <ThemedText style={[styles.restSubtext, { color: theme.textSecondary }]}>
            Recovery is important too!
          </ThemedText>
        </View>
      ) : null}

      {showConfirmation ? (
        <View style={[styles.confirmationContainer, { backgroundColor: theme.success + "15" }]}>
          <Feather name="check-circle" size={24} color={theme.success} />
          <ThemedText style={[styles.confirmationText, { color: theme.success }]}>
            Workout logged. Nice work.
          </ThemedText>
        </View>
      ) : (
        <Button
          onPress={handleSave}
          disabled={!workoutType || isSaving}
          style={styles.saveButton}
        >
          {isSaving ? "Saving..." : existingLog ? "Update" : "Save Workout"}
        </Button>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    paddingHorizontal: Spacing.lg,
  },
  dateText: {
    ...Typography.subheadline,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.subheadline,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  exercisesInput: {
    height: 100,
    paddingTop: Spacing.md,
  },
  notesInput: {
    height: 80,
    paddingTop: Spacing.md,
  },
  restContainer: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  restText: {
    ...Typography.headline,
    marginTop: Spacing.lg,
  },
  restSubtext: {
    ...Typography.subheadline,
    marginTop: Spacing.sm,
  },
  saveButton: {
    marginTop: "auto",
  },
  confirmationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: "auto",
  },
  confirmationText: {
    ...Typography.headline,
    fontWeight: "600",
  },
});
