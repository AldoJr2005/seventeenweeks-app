import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Pressable, Dimensions, ActivityIndicator } from "react-native";
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
import { WeightChart } from "@/components/WeightChart";
import { useChallenge } from "@/hooks/useChallenge";
import { useWeeklyCheckIns, useWeeklyPhotos } from "@/hooks/useWeeklyData";
import { useDayLogs } from "@/hooks/useDayLogs";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { getCurrentWeekNumber } from "@/lib/date-utils";
import type { ProgressStackParamList } from "@/navigation/ProgressStackNavigator";
import type { WeeklyCheckIn, DayLog, WorkoutLog } from "@shared/schema";

type NavigationProp = NativeStackNavigationProp<ProgressStackParamList>;

const TABS = ["Charts", "Photos", "Insights"] as const;
type TabType = typeof TABS[number];

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>("Charts");

  const { data: challenge, isLoading: challengeLoading } = useChallenge();
  const { data: weeklyCheckIns } = useWeeklyCheckIns(challenge?.id);
  const { data: weeklyPhotos } = useWeeklyPhotos(challenge?.id);
  const { data: dayLogs } = useDayLogs(challenge?.id);
  const { data: workoutLogs } = useWorkoutLogs(challenge?.id);

  if (challengeLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
        <Feather name="bar-chart-2" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { marginTop: Spacing.lg }]}>No Challenge Yet</ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Start your challenge to see progress
        </ThemedText>
      </View>
    );
  }

  const checkIns = (weeklyCheckIns as WeeklyCheckIn[] | undefined) || [];
  const sortedCheckIns = [...checkIns].sort((a, b) => a.weekNumber - b.weekNumber);
  const currentWeek = getCurrentWeekNumber(challenge.startDate);
  const startWeight = challenge.startWeight;
  const latestCheckIn = sortedCheckIns.length > 0 ? sortedCheckIns[sortedCheckIns.length - 1] : null;
  const currentWeight = latestCheckIn?.weight || startWeight;
  const weightChange = currentWeight ? currentWeight - startWeight : 0;
  const goalWeight = challenge.goalWeight;

  const expectedWeeklyLoss = goalWeight ? (startWeight - goalWeight) / 17 : 0;
  const expectedCurrentWeight = goalWeight ? startWeight - (expectedWeeklyLoss * currentWeek) : null;
  const onPace = expectedCurrentWeight ? (currentWeight || startWeight) <= expectedCurrentWeight : true;

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
      <View style={[styles.tabBar, { backgroundColor: theme.backgroundDefault }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: theme.backgroundRoot }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <ThemedText style={[
              styles.tabText,
              { color: activeTab === tab ? theme.text : theme.textSecondary }
            ]}>
              {tab}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {activeTab === "Charts" ? (
        <>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>Weight Progress</ThemedText>
              {goalWeight ? (
                <View style={[styles.paceBadge, { backgroundColor: onPace ? theme.success + "15" : theme.warning + "15" }]}>
                  <ThemedText style={[styles.paceBadgeText, { color: onPace ? theme.success : theme.warning }]}>
                    {onPace ? "On pace" : "Behind pace"}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            
            <View style={styles.weightStats}>
              <View style={styles.weightStat}>
                <ThemedText style={[styles.weightLabel, { color: theme.textSecondary }]}>Start</ThemedText>
                <ThemedText style={styles.weightValue}>{startWeight}</ThemedText>
                <ThemedText style={[styles.weightUnit, { color: theme.textSecondary }]}>{challenge.unit}</ThemedText>
              </View>
              <View style={styles.weightStat}>
                <ThemedText style={[styles.weightLabel, { color: theme.textSecondary }]}>Current</ThemedText>
                <ThemedText style={styles.weightValue}>{currentWeight || "-"}</ThemedText>
                <ThemedText style={[styles.weightUnit, { color: theme.textSecondary }]}>{challenge.unit}</ThemedText>
              </View>
              <View style={styles.weightStat}>
                <ThemedText style={[styles.weightLabel, { color: theme.textSecondary }]}>Change</ThemedText>
                <ThemedText style={[styles.weightValue, { color: weightChange <= 0 ? theme.success : theme.warning }]}>
                  {weightChange <= 0 ? "" : "+"}{weightChange.toFixed(1)}
                </ThemedText>
                <ThemedText style={[styles.weightUnit, { color: theme.textSecondary }]}>{challenge.unit}</ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <WeightChart
              checkIns={sortedCheckIns}
              startWeight={startWeight}
              goalWeight={goalWeight}
              unit={challenge.unit}
            />
          </Card>

          <Card style={styles.card}>
            <ThemedText style={styles.cardTitle}>Weekly Compliance</ThemedText>
            
            <View style={styles.complianceStats}>
              <View style={styles.complianceStat}>
                <ThemedText style={styles.complianceValue}>
                  {((dayLogs as DayLog[] | undefined)?.filter(l => !l.skipped).length || 0)}
                </ThemedText>
                <ThemedText style={[styles.complianceLabel, { color: theme.textSecondary }]}>
                  Days Logged
                </ThemedText>
              </View>
              <View style={styles.complianceStat}>
                <ThemedText style={styles.complianceValue}>
                  {((workoutLogs as WorkoutLog[] | undefined)?.filter(l => l.type !== "Rest").length || 0)}
                </ThemedText>
                <ThemedText style={[styles.complianceLabel, { color: theme.textSecondary }]}>
                  Workouts
                </ThemedText>
              </View>
              <View style={styles.complianceStat}>
                <ThemedText style={styles.complianceValue}>
                  {checkIns.length}
                </ThemedText>
                <ThemedText style={[styles.complianceLabel, { color: theme.textSecondary }]}>
                  Check-Ins
                </ThemedText>
              </View>
            </View>
          </Card>
        </>
      ) : activeTab === "Photos" ? (
        <>
          <Pressable
            style={[styles.compareButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("PhotoCompare", {})}
          >
            <Feather name="columns" size={20} color="#FFF" />
            <ThemedText style={styles.compareButtonText}>Compare Photos</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.viewAllButton, { borderColor: theme.border }]}
            onPress={() => navigation.navigate("Photos")}
          >
            <ThemedText>View All Photos</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </>
      ) : (
        <Card style={styles.card}>
          <ThemedText style={styles.cardTitle}>Insights</ThemedText>
          
          <View style={styles.insightItem}>
            <Feather name="check-circle" size={20} color={theme.success} />
            <ThemedText style={styles.insightText}>
              You've logged {((dayLogs as DayLog[] | undefined)?.filter(l => !l.skipped).length || 0)} days of nutrition
            </ThemedText>
          </View>

          <View style={styles.insightItem}>
            <Feather name="activity" size={20} color={theme.primary} />
            <ThemedText style={styles.insightText}>
              {((workoutLogs as WorkoutLog[] | undefined)?.filter(l => l.type !== "Rest").length || 0)} workouts completed so far
            </ThemedText>
          </View>

          <View style={styles.insightItem}>
            <Feather name="camera" size={20} color={theme.warning} />
            <ThemedText style={styles.insightText}>
              {((weeklyPhotos as any[] | undefined)?.length || 0)} of {currentWeek} weekly photos taken
            </ThemedText>
          </View>

          <View style={styles.insightItem}>
            <Feather name="trending-down" size={20} color={theme.success} />
            <ThemedText style={styles.insightText}>
              {weightChange <= 0 ? `You've lost ${Math.abs(weightChange).toFixed(1)} ${challenge.unit}` : "Keep pushing, you've got this!"}
            </ThemedText>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.headline,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  tabText: {
    ...Typography.subheadline,
    fontWeight: "500",
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
  paceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  paceBadgeText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  weightStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.md,
  },
  weightStat: {
    alignItems: "center",
  },
  weightLabel: {
    ...Typography.footnote,
    marginBottom: Spacing.xs,
  },
  weightValue: {
    ...Typography.title3,
  },
  weightUnit: {
    ...Typography.caption,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  complianceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  complianceStat: {
    alignItems: "center",
  },
  complianceValue: {
    ...Typography.largeTitle,
    marginBottom: Spacing.xs,
  },
  complianceLabel: {
    ...Typography.footnote,
  },
  compareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  compareButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  insightText: {
    ...Typography.body,
    flex: 1,
  },
});
