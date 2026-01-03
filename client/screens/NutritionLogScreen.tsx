import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useChallenge } from "@/hooks/useChallenge";
import { useDayLog, useCreateDayLog, useUpdateDayLog } from "@/hooks/useDayLogs";
import { getToday, formatLongDate, addDays } from "@/lib/date-utils";
import type { LogStackParamList } from "@/navigation/LogStackNavigator";
import type { DayLog } from "@shared/schema";

type RouteParams = RouteProp<LogStackParamList, "NutritionLog">;

export default function NutritionLogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();

  const date = route.params?.date || getToday();
  const { data: challenge } = useChallenge();
  const { data: existingLog, isLoading } = useDayLog(date);
  const createDayLog = useCreateDayLog();
  const updateDayLog = useUpdateDayLog();

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [notes, setNotes] = useState("");
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    if (existingLog) {
      const log = existingLog as DayLog;
      setCalories(log.calories?.toString() || "");
      setProtein(log.protein?.toString() || "");
      setCarbs(log.carbs?.toString() || "");
      setFat(log.fat?.toString() || "");
      setNotes(log.notes || "");
      setIsSkipped(log.skipped || false);
    }
  }, [existingLog]);

  const handleSave = async () => {
    if (!challenge) return;

    const data = {
      challengeId: challenge.id,
      date,
      calories: calories ? parseInt(calories) : null,
      protein: protein ? parseInt(protein) : null,
      carbs: carbs ? parseInt(carbs) : null,
      fat: fat ? parseInt(fat) : null,
      notes: notes || null,
      skipped: isSkipped,
      skippedReason: isSkipped ? "User marked as skipped" : null,
    };

    try {
      if (existingLog) {
        await updateDayLog.mutateAsync({ id: (existingLog as DayLog).id, data });
      } else {
        await createDayLog.mutateAsync(data);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save nutrition log");
    }
  };

  const handleSkip = () => {
    setIsSkipped(!isSkipped);
  };

  const isSaving = createDayLog.isPending || updateDayLog.isPending;
  const isValid = isSkipped || calories;

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

      {isSkipped ? (
        <View style={[styles.skippedContainer, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="x-circle" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.skippedText, { color: theme.textSecondary }]}>
            Marked as skipped
          </ThemedText>
          <Pressable onPress={handleSkip}>
            <ThemedText style={[styles.undoText, { color: theme.primary }]}>
              Undo
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Calories
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.largeInput,
                { 
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={calories}
              onChangeText={setCalories}
              autoFocus
            />
          </View>

          <View style={styles.macrosRow}>
            <View style={styles.macroInput}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Protein (g)
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
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={protein}
                onChangeText={setProtein}
              />
            </View>

            <View style={styles.macroInput}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Carbs (g)
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
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={carbs}
                onChangeText={setCarbs}
              />
            </View>

            <View style={styles.macroInput}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Fat (g)
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
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={fat}
                onChangeText={setFat}
              />
            </View>
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
              placeholder="Add notes..."
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.skipButton, { borderColor: theme.border }]}
          onPress={handleSkip}
        >
          <Feather name={isSkipped ? "edit-3" : "x"} size={20} color={theme.textSecondary} />
          <ThemedText style={{ color: theme.textSecondary }}>
            {isSkipped ? "Log Instead" : "Skip Day"}
          </ThemedText>
        </Pressable>

        <Button
          onPress={handleSave}
          disabled={!isValid || isSaving}
          style={styles.saveButton}
        >
          {isSaving ? "Saving..." : existingLog ? "Update" : "Save"}
        </Button>
      </View>
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
  largeInput: {
    height: 64,
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
  },
  macrosRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  macroInput: {
    flex: 1,
  },
  notesInput: {
    height: 100,
    paddingTop: Spacing.md,
  },
  skippedContainer: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  skippedText: {
    ...Typography.headline,
    marginTop: Spacing.lg,
  },
  undoText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: "auto",
    paddingTop: Spacing.xl,
  },
  skipButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  saveButton: {
    flex: 2,
  },
});
