import React from "react";
import { ScrollView, View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useChallenge } from "@/hooks/useChallenge";
import { useDayLogs } from "@/hooks/useDayLogs";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useHabitLogs } from "@/hooks/useHabitLogs";
import { getToday, formatDisplayDate, addDays } from "@/lib/date-utils";
import type { LogStackParamList } from "@/navigation/LogStackNavigator";
import type { DayLog, WorkoutLog, HabitLog } from "@shared/schema";

type NavigationProp = NativeStackNavigationProp<LogStackParamList>;

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { data: challenge } = useChallenge();
  const { data: dayLogs } = useDayLogs(challenge?.id);
  const { data: workoutLogs } = useWorkoutLogs(challenge?.id);
  const { data: habitLogs } = useHabitLogs(challenge?.id);

  const today = getToday();
  const yesterday = addDays(today, -1);

  const todayNutrition = (dayLogs as DayLog[] | undefined)?.find(log => log.date === today);
  const todayWorkout = (workoutLogs as WorkoutLog[] | undefined)?.find(log => log.date === today);
  const todayHabits = (habitLogs as HabitLog[] | undefined)?.find(log => log.date === today);

  const yesterdayNutrition = (dayLogs as DayLog[] | undefined)?.find(log => log.date === yesterday);
  const yesterdayWorkout = (workoutLogs as WorkoutLog[] | undefined)?.find(log => log.date === yesterday);

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
      <ThemedText style={styles.sectionTitle}>Today</ThemedText>
      <ThemedText style={[styles.dateLabel, { color: theme.textSecondary }]}>
        {formatDisplayDate(today)}
      </ThemedText>

      <Card 
        style={styles.card}
        onPress={() => navigation.navigate("NutritionLog", { date: today })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Feather name="edit-3" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <ThemedText style={styles.cardTitle}>Nutrition</ThemedText>
            {todayNutrition ? (
              todayNutrition.skipped ? (
                <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                  Skipped
                </ThemedText>
              ) : (
                <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                  {todayNutrition.calories} cal | P: {todayNutrition.protein}g
                </ThemedText>
              )
            ) : (
              <ThemedText style={[styles.cardSubtitle, { color: theme.warning }]}>
                Not logged yet
              </ThemedText>
            )}
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Card>

      <Card 
        style={styles.card}
        onPress={() => navigation.navigate("WorkoutLog", { date: today })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Feather name="activity" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <ThemedText style={styles.cardTitle}>Workout</ThemedText>
            {todayWorkout ? (
              <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                {todayWorkout.type} {todayWorkout.durationMin ? `- ${todayWorkout.durationMin} min` : ""}
              </ThemedText>
            ) : (
              <ThemedText style={[styles.cardSubtitle, { color: theme.warning }]}>
                Not logged yet
              </ThemedText>
            )}
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Card>

      <Card 
        style={styles.card}
        onPress={() => navigation.navigate("HabitsLog", { date: today })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Feather name="check-square" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <ThemedText style={styles.cardTitle}>Daily Habits</ThemedText>
            {todayHabits ? (
              <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                {[
                  todayHabits.waterDone && "Water",
                  todayHabits.stepsDone && "Steps",
                  todayHabits.sleepDone && "Sleep",
                ].filter(Boolean).join(", ") || "None completed"}
              </ThemedText>
            ) : (
              <ThemedText style={[styles.cardSubtitle, { color: theme.warning }]}>
                Not logged yet
              </ThemedText>
            )}
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Card>

      <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Yesterday</ThemedText>
      <ThemedText style={[styles.dateLabel, { color: theme.textSecondary }]}>
        {formatDisplayDate(yesterday)}
      </ThemedText>

      <Card 
        style={styles.card}
        onPress={() => navigation.navigate("NutritionLog", { date: yesterday })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Feather name="edit-3" size={24} color={theme.textSecondary} />
          </View>
          <View style={styles.cardContent}>
            <ThemedText style={styles.cardTitle}>Nutrition</ThemedText>
            {yesterdayNutrition ? (
              yesterdayNutrition.skipped ? (
                <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                  Skipped
                </ThemedText>
              ) : (
                <ThemedText style={[styles.cardSubtitle, { color: theme.success }]}>
                  {yesterdayNutrition.calories} cal | P: {yesterdayNutrition.protein}g
                </ThemedText>
              )
            ) : (
              <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Not logged
              </ThemedText>
            )}
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Card>

      <Card 
        style={styles.card}
        onPress={() => navigation.navigate("WorkoutLog", { date: yesterday })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Feather name="activity" size={24} color={theme.textSecondary} />
          </View>
          <View style={styles.cardContent}>
            <ThemedText style={styles.cardTitle}>Workout</ThemedText>
            {yesterdayWorkout ? (
              <ThemedText style={[styles.cardSubtitle, { color: theme.success }]}>
                {yesterdayWorkout.type}
              </ThemedText>
            ) : (
              <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Not logged
              </ThemedText>
            )}
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...Typography.title3,
    marginBottom: Spacing.xs,
  },
  dateLabel: {
    ...Typography.subheadline,
    marginBottom: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.headline,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.subheadline,
  },
});
