import React, { useState, useEffect } from "react";
import { View, StyleSheet, Switch, TextInput, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Card } from "@/components/Card";
import { useChallenge } from "@/hooks/useChallenge";
import { useHabitLog, useCreateHabitLog, useUpdateHabitLog } from "@/hooks/useHabitLogs";
import { getToday, formatLongDate } from "@/lib/date-utils";
import type { LogStackParamList } from "@/navigation/LogStackNavigator";
import type { HabitLog } from "@shared/schema";

type RouteParams = RouteProp<LogStackParamList, "HabitsLog">;

export default function HabitsLogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();

  const date = route.params?.date || getToday();
  const { data: challenge } = useChallenge();
  const { data: existingLog, isLoading } = useHabitLog(date);
  const createHabitLog = useCreateHabitLog();
  const updateHabitLog = useUpdateHabitLog();

  const [waterDone, setWaterDone] = useState(false);
  const [stepsDone, setStepsDone] = useState(false);
  const [steps, setSteps] = useState("");
  const [sleepDone, setSleepDone] = useState(false);
  const [sleepHours, setSleepHours] = useState("");

  useEffect(() => {
    if (existingLog) {
      const log = existingLog as HabitLog;
      setWaterDone(log.waterDone || false);
      setStepsDone(log.stepsDone || false);
      setSteps(log.steps?.toString() || "");
      setSleepDone(log.sleepDone || false);
      setSleepHours(log.sleepHours?.toString() || "");
    }
  }, [existingLog]);

  const handleSave = async () => {
    if (!challenge) return;

    const data = {
      challengeId: challenge.id,
      date,
      waterDone,
      stepsDone,
      steps: steps ? parseInt(steps) : null,
      sleepDone,
      sleepHours: sleepHours ? parseFloat(sleepHours) : null,
    };

    try {
      if (existingLog) {
        await updateHabitLog.mutateAsync({ id: (existingLog as HabitLog).id, data });
      } else {
        await createHabitLog.mutateAsync(data);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save habits");
    }
  };

  const isSaving = createHabitLog.isPending || updateHabitLog.isPending;
  const completedCount = [waterDone, stepsDone, sleepDone].filter(Boolean).length;

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

      <View style={[styles.progressHeader, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={styles.progressText}>
          {completedCount}/3 habits completed
        </ThemedText>
        <View style={styles.progressDots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                { backgroundColor: i < completedCount ? theme.success : theme.border }
              ]}
            />
          ))}
        </View>
      </View>

      <Card style={styles.habitCard}>
        <View style={styles.habitRow}>
          <View style={styles.habitInfo}>
            <View style={[styles.habitIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="droplet" size={24} color={theme.primary} />
            </View>
            <View>
              <ThemedText style={styles.habitTitle}>Water</ThemedText>
              <ThemedText style={[styles.habitSubtitle, { color: theme.textSecondary }]}>
                Did you drink enough water?
              </ThemedText>
            </View>
          </View>
          <Switch
            value={waterDone}
            onValueChange={setWaterDone}
            trackColor={{ false: theme.border, true: theme.success }}
            thumbColor="#FFF"
          />
        </View>
      </Card>

      <Card style={styles.habitCard}>
        <View style={styles.habitRow}>
          <View style={styles.habitInfo}>
            <View style={[styles.habitIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="navigation" size={24} color={theme.primary} />
            </View>
            <View>
              <ThemedText style={styles.habitTitle}>Steps</ThemedText>
              <ThemedText style={[styles.habitSubtitle, { color: theme.textSecondary }]}>
                Goal: {challenge?.stepGoal?.toLocaleString() || "10,000"} steps
              </ThemedText>
            </View>
          </View>
          <Switch
            value={stepsDone}
            onValueChange={setStepsDone}
            trackColor={{ false: theme.border, true: theme.success }}
            thumbColor="#FFF"
          />
        </View>
        {stepsDone ? (
          <View style={styles.optionalInput}>
            <ThemedText style={[styles.optionalLabel, { color: theme.textSecondary }]}>
              Steps (optional)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="e.g., 12000"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={steps}
              onChangeText={setSteps}
            />
          </View>
        ) : null}
      </Card>

      <Card style={styles.habitCard}>
        <View style={styles.habitRow}>
          <View style={styles.habitInfo}>
            <View style={[styles.habitIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="moon" size={24} color={theme.primary} />
            </View>
            <View>
              <ThemedText style={styles.habitTitle}>Sleep</ThemedText>
              <ThemedText style={[styles.habitSubtitle, { color: theme.textSecondary }]}>
                Goal: {challenge?.sleepGoal || 8}+ hours
              </ThemedText>
            </View>
          </View>
          <Switch
            value={sleepDone}
            onValueChange={setSleepDone}
            trackColor={{ false: theme.border, true: theme.success }}
            thumbColor="#FFF"
          />
        </View>
        {sleepDone ? (
          <View style={styles.optionalInput}>
            <ThemedText style={[styles.optionalLabel, { color: theme.textSecondary }]}>
              Hours slept (optional)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="e.g., 7.5"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={sleepHours}
              onChangeText={setSleepHours}
            />
          </View>
        ) : null}
      </Card>

      <Button
        onPress={handleSave}
        disabled={isSaving}
        style={styles.saveButton}
      >
        {isSaving ? "Saving..." : existingLog ? "Update Habits" : "Save Habits"}
      </Button>
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
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  progressText: {
    ...Typography.headline,
  },
  progressDots: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  habitCard: {
    marginBottom: Spacing.md,
  },
  habitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  habitInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  habitTitle: {
    ...Typography.headline,
  },
  habitSubtitle: {
    ...Typography.footnote,
  },
  optionalInput: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  optionalLabel: {
    ...Typography.footnote,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
