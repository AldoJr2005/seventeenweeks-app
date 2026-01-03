import React, { useEffect } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, CardShadow } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useChallenge } from "@/hooks/useChallenge";
import { useDayLogs } from "@/hooks/useDayLogs";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useHabitLogs } from "@/hooks/useHabitLogs";
import { useWeeklyPhotos, useWeeklyCheckIns } from "@/hooks/useWeeklyData";
import { getToday, getCurrentWeekNumber, getWeekNumber, isMonday, formatDisplayDate } from "@/lib/date-utils";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import type { Challenge, DayLog, WorkoutLog, HabitLog, WeeklyPhoto, WeeklyCheckIn } from "@shared/schema";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { data: challenge, isLoading: challengeLoading } = useChallenge();
  const { data: dayLogs } = useDayLogs(challenge?.id);
  const { data: workoutLogs } = useWorkoutLogs(challenge?.id);
  const { data: habitLogs } = useHabitLogs(challenge?.id);
  const { data: weeklyPhotos } = useWeeklyPhotos(challenge?.id);
  const { data: weeklyCheckIns } = useWeeklyCheckIns(challenge?.id);

  const today = getToday();
  const currentWeek = challenge ? getCurrentWeekNumber(challenge.startDate) : 1;

  useEffect(() => {
    if (!challengeLoading && !challenge) {
      navigation.navigate("Onboarding");
    }
  }, [challenge, challengeLoading, navigation]);

  if (challengeLoading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!challenge) {
    return null;
  }

  const todayNutrition = (dayLogs as DayLog[] | undefined)?.find(log => log.date === today);
  const todayWorkout = (workoutLogs as WorkoutLog[] | undefined)?.find(log => log.date === today);
  const todayHabits = (habitLogs as HabitLog[] | undefined)?.find(log => log.date === today);
  const currentPhoto = (weeklyPhotos as WeeklyPhoto[] | undefined)?.find(p => p.weekNumber === currentWeek);
  const currentCheckIn = (weeklyCheckIns as WeeklyCheckIn[] | undefined)?.find(c => c.weekNumber === currentWeek);

  const nutritionStatus = todayNutrition ? (todayNutrition.skipped ? "Skipped" : "Done") : "Pending";
  const workoutStatus = todayWorkout ? "Done" : "Pending";
  const photoStatus = currentPhoto ? "Done" : "Pending";
  const checkInStatus = currentCheckIn ? "Done" : "Pending";

  const habitsCompleted = [
    todayHabits?.waterDone,
    todayHabits?.stepsDone,
    todayHabits?.sleepDone,
  ].filter(Boolean).length;

  const weekDayLogs = (dayLogs as DayLog[] | undefined)?.filter(log => {
    const logWeek = getWeekNumber(challenge.startDate, log.date);
    return logWeek === currentWeek && !log.skipped;
  }) || [];

  const weekWorkouts = (workoutLogs as WorkoutLog[] | undefined)?.filter(log => {
    const logWeek = getWeekNumber(challenge.startDate, log.date);
    return logWeek === currentWeek && log.type !== "Rest";
  }) || [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText style={styles.weekLabel}>Week {currentWeek} of 17</ThemedText>
      <ThemedText style={[styles.dateLabel, { color: theme.textSecondary }]}>
        {formatDisplayDate(today)}
      </ThemedText>

      <Card style={styles.card}>
        <ThemedText style={styles.cardTitle}>Today's Checklist</ThemedText>
        
        <ChecklistItem
          icon="edit-3"
          label="Nutrition"
          status={nutritionStatus}
          theme={theme}
          onPress={() => navigation.getParent()?.navigate("LogTab", { screen: "NutritionLog", params: { date: today } })}
        />
        <ChecklistItem
          icon="activity"
          label="Workout"
          status={workoutStatus}
          theme={theme}
          onPress={() => navigation.getParent()?.navigate("LogTab", { screen: "WorkoutLog", params: { date: today } })}
        />
        <ChecklistItem
          icon="droplet"
          label="Habits"
          status={habitsCompleted > 0 ? `${habitsCompleted}/3` : "Pending"}
          theme={theme}
          onPress={() => navigation.getParent()?.navigate("LogTab", { screen: "HabitsLog", params: { date: today } })}
        />
      </Card>

      <Card style={styles.card}>
        <ThemedText style={styles.cardTitle}>This Week</ThemedText>
        
        <ChecklistItem
          icon="camera"
          label="Monday Photo"
          status={photoStatus}
          theme={theme}
          onPress={() => navigation.navigate("WeeklyCheckIn", { weekNumber: currentWeek })}
        />
        <ChecklistItem
          icon="trending-down"
          label="Weekly Weigh-In"
          status={checkInStatus}
          theme={theme}
          onPress={() => navigation.navigate("WeeklyCheckIn", { weekNumber: currentWeek })}
        />
      </Card>

      <Card style={styles.card}>
        <ThemedText style={styles.cardTitle}>Streaks & Progress</ThemedText>
        
        <View style={styles.statsRow}>
          <StatItem label="Nutrition" value={`${weekDayLogs.length}/7`} theme={theme} />
          <StatItem label="Workouts" value={`${weekWorkouts.length}`} theme={theme} />
          <StatItem label="Habits" value={`${habitsCompleted}/3`} theme={theme} />
        </View>
        
        <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: theme.success,
                width: `${Math.min(100, (currentWeek / 17) * 100)}%`
              }
            ]} 
          />
        </View>
        <ThemedText style={[styles.progressText, { color: theme.textSecondary }]}>
          Challenge Progress: {Math.round((currentWeek / 17) * 100)}%
        </ThemedText>
      </Card>

      <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
      
      <View style={styles.actionsGrid}>
        <ActionButton
          icon="edit-3"
          label="Log Nutrition"
          onPress={() => navigation.getParent()?.navigate("LogTab", { screen: "NutritionLog", params: { date: today } })}
          theme={theme}
          primary
        />
        <ActionButton
          icon="activity"
          label="Log Workout"
          onPress={() => navigation.getParent()?.navigate("LogTab", { screen: "WorkoutLog", params: { date: today } })}
          theme={theme}
        />
        <ActionButton
          icon="camera"
          label="Upload Photo"
          onPress={() => navigation.navigate("WeeklyCheckIn", { weekNumber: currentWeek })}
          theme={theme}
        />
        <ActionButton
          icon="check-circle"
          label="Weekly Check-In"
          onPress={() => navigation.navigate("WeeklyCheckIn", { weekNumber: currentWeek })}
          theme={theme}
        />
      </View>
    </ScrollView>
  );
}

function ChecklistItem({ 
  icon, 
  label, 
  status, 
  theme, 
  onPress 
}: { 
  icon: keyof typeof Feather.glyphMap; 
  label: string; 
  status: string; 
  theme: any;
  onPress: () => void;
}) {
  const isDone = status === "Done" || status.includes("/");
  const statusColor = isDone ? theme.success : theme.textSecondary;
  
  return (
    <Pressable 
      style={({ pressed }) => [styles.checklistItem, { opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
    >
      <View style={styles.checklistLeft}>
        <Feather name={icon} size={20} color={theme.textSecondary} />
        <ThemedText style={styles.checklistLabel}>{label}</ThemedText>
      </View>
      <View style={styles.checklistRight}>
        <ThemedText style={[styles.checklistStatus, { color: statusColor }]}>{status}</ThemedText>
        {isDone ? (
          <Feather name="check-circle" size={18} color={theme.success} />
        ) : (
          <Feather name="chevron-right" size={18} color={theme.textSecondary} />
        )}
      </View>
    </Pressable>
  );
}

function StatItem({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={styles.statItem}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

function ActionButton({ 
  icon, 
  label, 
  onPress, 
  theme,
  primary = false 
}: { 
  icon: keyof typeof Feather.glyphMap; 
  label: string; 
  onPress: () => void; 
  theme: any;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        { 
          backgroundColor: primary ? theme.primary : theme.backgroundDefault,
          opacity: pressed ? 0.8 : 1,
        }
      ]}
      onPress={onPress}
    >
      <Feather name={icon} size={24} color={primary ? "#FFF" : theme.text} />
      <ThemedText style={[styles.actionLabel, { color: primary ? "#FFF" : theme.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  weekLabel: {
    ...Typography.largeTitle,
    marginBottom: Spacing.xs,
  },
  dateLabel: {
    ...Typography.subheadline,
    marginBottom: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.headline,
    marginBottom: Spacing.lg,
  },
  checklistItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  checklistLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  checklistLabel: {
    ...Typography.body,
  },
  checklistRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checklistStatus: {
    ...Typography.subheadline,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...Typography.title2,
    fontWeight: "600",
  },
  statLabel: {
    ...Typography.footnote,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    ...Typography.footnote,
    textAlign: "center",
  },
  sectionTitle: {
    ...Typography.title3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionButton: {
    width: "48%",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionLabel: {
    ...Typography.footnote,
    fontWeight: "500",
    textAlign: "center",
  },
});
