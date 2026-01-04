import React, { useEffect, useRef, useMemo, useState } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, CardShadow } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ProgressRing } from "@/components/ProgressRing";
import { useChallenge } from "@/hooks/useChallenge";
import { useDayLogs } from "@/hooks/useDayLogs";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useHabitLogs } from "@/hooks/useHabitLogs";
import { useWeeklyPhotos, useWeeklyCheckIns } from "@/hooks/useWeeklyData";
import { useFoodEntries } from "@/hooks/useFoodEntries";
import { getToday, getCurrentWeekNumber, getWeekNumber, isMonday, formatDisplayDate } from "@/lib/date-utils";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import type { Challenge, DayLog, WorkoutLog, HabitLog, WeeklyPhoto, WeeklyCheckIn, FoodEntry } from "@shared/schema";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_PADDING = Spacing.lg * 2;
const NUTRITION_CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING - Spacing.md;

const MOTIVATIONAL_PHRASES = [
  "Consistency over perfection.",
  "Keep the streak alive.",
  "One day at a time.",
  "Small steps, big results.",
  "Trust the process.",
  "Progress, not perfection.",
  "Every day counts.",
];

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
  const { data: foodEntries } = useFoodEntries(challenge?.id, today);
  const [nutritionCardIndex, setNutritionCardIndex] = useState(0);
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

  const nutritionDone = !!todayNutrition && !todayNutrition.skipped;
  const nutritionStatus = todayNutrition ? (todayNutrition.skipped ? "Skipped" : "Done") : "Pending";
  const workoutDone = !!todayWorkout;
  const workoutStatus = todayWorkout ? "Done" : "Pending";
  const weeklyCheckInStatus = currentPhoto && currentCheckIn 
    ? "Done" 
    : currentPhoto 
      ? "Weight pending" 
      : currentCheckIn 
        ? "Photo pending" 
        : "Pending";

  const habitsCompleted = [
    todayHabits?.waterDone,
    todayHabits?.stepsDone,
    todayHabits?.sleepDone,
  ].filter(Boolean).length;
  
  const allDailyComplete = nutritionDone && workoutDone && habitsCompleted === 3;
  const prevAllComplete = useRef(allDailyComplete);
  
  useEffect(() => {
    if (allDailyComplete && !prevAllComplete.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevAllComplete.current = allDailyComplete;
  }, [allDailyComplete]);
  
  const motivationalPhrase = MOTIVATIONAL_PHRASES[currentWeek % MOTIVATIONAL_PHRASES.length];

  const weekDayLogs = (dayLogs as DayLog[] | undefined)?.filter(log => {
    const logWeek = getWeekNumber(challenge.startDate, log.date);
    return logWeek === currentWeek && !log.skipped;
  }) || [];

  const weekWorkouts = (workoutLogs as WorkoutLog[] | undefined)?.filter(log => {
    const logWeek = getWeekNumber(challenge.startDate, log.date);
    return logWeek === currentWeek && log.type !== "Rest";
  }) || [];

  const targetCalories = challenge.targetCalories || 2000;
  const targetProtein = challenge.targetProteinGrams || 150;
  const targetCarbs = challenge.targetCarbsGrams || 200;
  const targetFat = challenge.targetFatGrams || 65;

  const nutritionTotals = useMemo(() => {
    if (!foodEntries) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 };
    return (foodEntries as FoodEntry[]).reduce((acc, entry) => ({
      calories: acc.calories + Math.round(entry.caloriesPerServing * entry.servingsCount),
      protein: acc.protein + Math.round((entry.proteinPerServing || 0) * entry.servingsCount),
      carbs: acc.carbs + Math.round((entry.carbsPerServing || 0) * entry.servingsCount),
      fat: acc.fat + Math.round((entry.fatPerServing || 0) * entry.servingsCount),
      fiber: acc.fiber + Math.round((entry.fiberPerServing || 0) * entry.servingsCount),
      sugar: acc.sugar + Math.round((entry.sugarPerServing || 0) * entry.servingsCount),
      sodium: acc.sodium + Math.round((entry.sodiumPerServing || 0) * entry.servingsCount),
      cholesterol: acc.cholesterol + Math.round((entry.cholesterolPerServing || 0) * entry.servingsCount),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 });
  }, [foodEntries]);

  const targetFiber = 25;
  const targetSugar = 50;
  const targetSodium = 2300;
  const targetCholesterol = 300;
  const netCarbs = Math.max(0, nutritionTotals.carbs - nutritionTotals.fiber);

  const caloriesRemaining = targetCalories - nutritionTotals.calories;
  const caloriesProgress = targetCalories > 0 ? nutritionTotals.calories / targetCalories : 0;
  const proteinProgress = targetProtein > 0 ? nutritionTotals.protein / targetProtein : 0;
  const carbsProgress = targetCarbs > 0 ? nutritionTotals.carbs / targetCarbs : 0;
  const fatProgress = targetFat > 0 ? nutritionTotals.fat / targetFat : 0;

  const handleNutritionScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / NUTRITION_CARD_WIDTH);
    if (index !== nutritionCardIndex) {
      setNutritionCardIndex(index);
      Haptics.selectionAsync();
    }
  };

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
      <ThemedText style={[styles.motivationalText, { color: theme.textSecondary }]}>
        {motivationalPhrase}
      </ThemedText>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardTitle}>Today's Checklist</ThemedText>
          {allDailyComplete ? (
            <View style={[styles.completedBadge, { backgroundColor: theme.success + "15" }]}>
              <Feather name="check" size={12} color={theme.success} />
              <ThemedText style={[styles.completedBadgeText, { color: theme.success }]}>Completed</ThemedText>
            </View>
          ) : null}
        </View>
        
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

      <View style={styles.nutritionDashboard}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleNutritionScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={NUTRITION_CARD_WIDTH}
          contentContainerStyle={{ gap: Spacing.sm }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.getParent()?.navigate("LogTab", { screen: "NutritionLog", params: { date: today } });
            }}
            style={({ pressed }) => [
              { width: NUTRITION_CARD_WIDTH },
              pressed && { opacity: 0.7 }
            ]}
          >
            <Card style={styles.nutritionCard}>
              <View style={styles.nutritionCardContent}>
                <ProgressRing
                  progress={caloriesProgress}
                  size={72}
                  strokeWidth={7}
                  color={caloriesProgress > 1 ? theme.warning : theme.primary}
                />
                <View style={styles.nutritionInfo}>
                  <ThemedText style={styles.nutritionMainValue}>
                    {caloriesRemaining > 0 ? caloriesRemaining.toLocaleString() : 0}
                  </ThemedText>
                  <ThemedText style={[styles.nutritionLabel, { color: theme.textSecondary }]}>
                    calories remaining
                  </ThemedText>
                  <ThemedText style={[styles.nutritionSubLabel, { color: theme.textSecondary }]}>
                    {nutritionTotals.calories.toLocaleString()} / {targetCalories.toLocaleString()} cal
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} style={styles.nutritionChevron} />
              </View>
            </Card>
          </Pressable>

          <Card style={[styles.nutritionCard, { width: NUTRITION_CARD_WIDTH }]}>
            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <ProgressRing
                  progress={carbsProgress}
                  size={52}
                  strokeWidth={5}
                  color="#FF9500"
                  compact
                />
                <ThemedText style={styles.macroValue}>{nutritionTotals.carbs}g</ThemedText>
                <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Carbs</ThemedText>
              </View>
              <View style={styles.macroItem}>
                <ProgressRing
                  progress={fatProgress}
                  size={52}
                  strokeWidth={5}
                  color="#FF3B30"
                  compact
                />
                <ThemedText style={styles.macroValue}>{nutritionTotals.fat}g</ThemedText>
                <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Fat</ThemedText>
              </View>
              <View style={styles.macroItem}>
                <ProgressRing
                  progress={proteinProgress}
                  size={52}
                  strokeWidth={5}
                  color="#34C759"
                  compact
                />
                <ThemedText style={styles.macroValue}>{nutritionTotals.protein}g</ThemedText>
                <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Protein</ThemedText>
              </View>
            </View>
          </Card>

          <Card style={[styles.nutritionCard, { width: NUTRITION_CARD_WIDTH }]}>
            <ThemedText style={styles.cardTitleSmall}>Heart Healthy</ThemedText>
            <View style={styles.progressBarsContainer}>
              <MiniProgressBar label="Fat" value={nutritionTotals.fat} target={targetFat} color="#FF3B30" unit="g" theme={theme} />
              <MiniProgressBar label="Sodium" value={nutritionTotals.sodium} target={targetSodium} color="#FF9500" unit="mg" theme={theme} />
              <MiniProgressBar label="Cholesterol" value={nutritionTotals.cholesterol} target={targetCholesterol} color="#AF52DE" unit="mg" theme={theme} />
            </View>
          </Card>

          <Card style={[styles.nutritionCard, { width: NUTRITION_CARD_WIDTH }]}>
            <ThemedText style={styles.cardTitleSmall}>Low Carb</ThemedText>
            <View style={styles.progressBarsContainer}>
              <MiniProgressBar label="Net Carbs" value={netCarbs} target={50} color="#007AFF" unit="g" theme={theme} />
              <MiniProgressBar label="Sugar" value={nutritionTotals.sugar} target={targetSugar} color="#FF2D55" unit="g" theme={theme} />
              <MiniProgressBar label="Fiber" value={nutritionTotals.fiber} target={targetFiber} color="#34C759" unit="g" theme={theme} />
            </View>
          </Card>
        </ScrollView>

        <Pressable 
          style={styles.paginationDots}
          onPress={() => navigation.getParent()?.navigate("LogTab", { screen: "NutritionLog", params: { date: today } })}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === nutritionCardIndex ? theme.primary : theme.backgroundTertiary }
              ]}
            />
          ))}
        </Pressable>
      </View>

      <Card style={styles.card}>
        <ThemedText style={styles.cardTitle}>This Week</ThemedText>
        
        <ChecklistItem
          icon="camera"
          label="Monday Photo + Weigh-In"
          status={weeklyCheckInStatus}
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
          label="Photo + Weigh-In"
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

function MiniProgressBar({
  label,
  value,
  target,
  color,
  unit,
  theme,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  unit: string;
  theme: any;
}) {
  const progress = Math.min(value / target, 1);
  const remaining = Math.max(0, target - value);
  return (
    <View style={styles.miniProgressContainer}>
      <View style={styles.miniProgressHeader}>
        <ThemedText style={styles.miniProgressLabel}>{label}</ThemedText>
        <ThemedText style={[styles.miniProgressValue, { color: theme.textSecondary }]}>
          {value}/{target}{unit}
        </ThemedText>
      </View>
      <View style={[styles.miniProgressBg, { backgroundColor: theme.backgroundTertiary }]}>
        <View style={[styles.miniProgressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
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
    marginBottom: Spacing.xs,
  },
  motivationalText: {
    ...Typography.footnote,
    fontStyle: "italic",
    marginBottom: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.headline,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  completedBadgeText: {
    ...Typography.caption,
    fontWeight: "600",
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
  nutritionDashboard: {
    marginBottom: Spacing.lg,
  },
  nutritionCard: {
    marginBottom: 0,
  },
  nutritionCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    paddingRight: Spacing.xs,
  },
  nutritionInfo: {
    flex: 1,
  },
  nutritionMainValue: {
    ...Typography.largeTitle,
    fontWeight: "700",
    fontSize: 40,
    letterSpacing: -0.5,
  },
  nutritionLabel: {
    ...Typography.subheadline,
    marginTop: Spacing.xs,
    fontWeight: "500",
  },
  nutritionSubLabel: {
    ...Typography.footnote,
    marginTop: Spacing.xs / 2,
    opacity: 0.8,
  },
  nutritionChevron: {
    opacity: 0.5,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  macroItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  macroValue: {
    ...Typography.headline,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  macroLabel: {
    ...Typography.caption,
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardTitleSmall: {
    ...Typography.subheadline,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  progressBarsContainer: {
    gap: Spacing.sm,
  },
  miniProgressContainer: {
    width: "100%",
  },
  miniProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  miniProgressLabel: {
    ...Typography.footnote,
    fontWeight: "500",
  },
  miniProgressValue: {
    ...Typography.caption,
  },
  miniProgressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  miniProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
