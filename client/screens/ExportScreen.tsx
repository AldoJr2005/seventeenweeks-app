import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Pressable, Alert, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useChallenge } from "@/hooks/useChallenge";
import { useDayLogs } from "@/hooks/useDayLogs";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useHabitLogs } from "@/hooks/useHabitLogs";
import { useWeeklyCheckIns, useWeeklyPhotos } from "@/hooks/useWeeklyData";
import { getCurrentWeekNumber } from "@/lib/date-utils";
import type { Challenge, WeeklyCheckIn, DayLog, WorkoutLog, HabitLog } from "@shared/schema";

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);

  const { data: challenge } = useChallenge();
  const { data: dayLogs } = useDayLogs(challenge?.id);
  const { data: workoutLogs } = useWorkoutLogs(challenge?.id);
  const { data: habitLogs } = useHabitLogs(challenge?.id);
  const { data: weeklyCheckIns } = useWeeklyCheckIns(challenge?.id);
  const { data: weeklyPhotos } = useWeeklyPhotos(challenge?.id);

  const challengeData = challenge as Challenge | undefined;
  const checkIns = (weeklyCheckIns as WeeklyCheckIn[] | undefined) || [];
  const currentWeek = challengeData ? getCurrentWeekNumber(challengeData.startDate) : 1;

  const startWeight = challengeData?.startWeight || 0;
  const currentWeight = checkIns.length > 0 ? checkIns[checkIns.length - 1].weight : startWeight;
  const weightChange = currentWeight ? currentWeight - startWeight : 0;

  const nutritionDays = ((dayLogs as DayLog[] | undefined) || []).filter(l => !l.skipped).length;
  const workoutCount = ((workoutLogs as WorkoutLog[] | undefined) || []).filter(l => l.type !== "Rest").length;
  const photoCount = ((weeklyPhotos as any[] | undefined) || []).length;

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        challenge: challengeData,
        dayLogs,
        workoutLogs,
        habitLogs,
        weeklyCheckIns,
        weeklyPhotos: (weeklyPhotos as any[] | undefined)?.map(p => ({
          ...p,
          imageUri: "[Photo data not included in JSON export]"
        })),
      };

      const jsonString = JSON.stringify(data, null, 2);
      
      await Share.share({
        message: jsonString,
        title: "17-Week Challenge Data Export",
      });
    } catch (error) {
      Alert.alert("Export Failed", "Unable to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsExporting(true);
    try {
      const summary = `
17-Week Weight Loss Challenge Summary
=====================================

Week ${currentWeek} of 17

WEIGHT PROGRESS
- Starting Weight: ${startWeight} ${challengeData?.unit}
- Current Weight: ${currentWeight || "Not recorded"} ${challengeData?.unit}
- Total Change: ${weightChange <= 0 ? "" : "+"}${weightChange.toFixed(1)} ${challengeData?.unit}

COMPLIANCE
- Nutrition Logged: ${nutritionDays} days
- Workouts Completed: ${workoutCount}
- Weekly Photos: ${photoCount} of ${currentWeek}
- Weekly Check-Ins: ${checkIns.length} of ${currentWeek}

MEASUREMENTS
${checkIns.length > 0 ? checkIns.map(c => 
  `Week ${c.weekNumber}: ${c.weight || "-"} ${challengeData?.unit}${c.waist ? `, Waist: ${c.waist}"` : ""}${c.hips ? `, Hips: ${c.hips}"` : ""}${c.chest ? `, Chest: ${c.chest}"` : ""}`
).join("\n") : "No check-ins recorded yet"}

Keep up the great work!
      `.trim();

      await Share.share({
        message: summary,
        title: "Challenge Summary",
      });
    } catch (error) {
      Alert.alert("Error", "Unable to share summary. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <Card style={styles.summaryCard}>
        <ThemedText style={styles.cardTitle}>Challenge Summary</ThemedText>
        
        <View style={styles.summaryRow}>
          <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Progress</ThemedText>
          <ThemedText style={styles.summaryValue}>Week {currentWeek} of 17</ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Weight Change</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: weightChange <= 0 ? theme.success : theme.warning }]}>
            {weightChange <= 0 ? "" : "+"}{weightChange.toFixed(1)} {challengeData?.unit}
          </ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Nutrition Logged</ThemedText>
          <ThemedText style={styles.summaryValue}>{nutritionDays} days</ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Workouts</ThemedText>
          <ThemedText style={styles.summaryValue}>{workoutCount} completed</ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Photos</ThemedText>
          <ThemedText style={styles.summaryValue}>{photoCount} of {currentWeek}</ThemedText>
        </View>
      </Card>

      <ThemedText style={styles.sectionTitle}>Export Options</ThemedText>

      <Pressable
        style={[styles.exportOption, { backgroundColor: theme.backgroundDefault }]}
        onPress={handleGenerateSummary}
        disabled={isExporting}
      >
        <View style={[styles.exportIcon, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="file-text" size={24} color={theme.primary} />
        </View>
        <View style={styles.exportInfo}>
          <ThemedText style={styles.exportTitle}>Share Summary</ThemedText>
          <ThemedText style={[styles.exportDescription, { color: theme.textSecondary }]}>
            Text summary of your progress
          </ThemedText>
        </View>
        <Feather name="share" size={20} color={theme.textSecondary} />
      </Pressable>

      <Pressable
        style={[styles.exportOption, { backgroundColor: theme.backgroundDefault }]}
        onPress={handleExportJSON}
        disabled={isExporting}
      >
        <View style={[styles.exportIcon, { backgroundColor: theme.success + "20" }]}>
          <Feather name="download" size={24} color={theme.success} />
        </View>
        <View style={styles.exportInfo}>
          <ThemedText style={styles.exportTitle}>Export JSON</ThemedText>
          <ThemedText style={[styles.exportDescription, { color: theme.textSecondary }]}>
            Full data backup for offline storage
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>

      <View style={[styles.infoBox, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="info" size={16} color={theme.textSecondary} />
        <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
          Your data is stored locally on this device. Export regularly to keep a backup. Photo files are not included in JSON exports.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    ...Typography.headline,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    ...Typography.headline,
    marginBottom: 2,
  },
  exportDescription: {
    ...Typography.footnote,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  infoText: {
    ...Typography.footnote,
    flex: 1,
  },
});
