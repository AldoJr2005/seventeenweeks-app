import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import type { Challenge } from "@shared/schema";

interface PreChallengeScreenProps {
  challenge: Challenge;
  onEditPlan?: () => void;
}

function getTimeRemaining(startDate: string) {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const diff = start.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, total: diff };
}

function formatStartDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PreChallengeScreen({ challenge, onEditPlan }: PreChallengeScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { logout } = useAuth();
  
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(challenge.startDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(challenge.startDate));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [challenge.startDate]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Challenge Starts In</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {formatStartDate(challenge.startDate)}
        </ThemedText>
      </View>

      <View style={styles.countdownContainer}>
        <CountdownUnit value={timeRemaining.days} label="Days" theme={theme} />
        <ThemedText style={[styles.separator, { color: theme.textSecondary }]}>:</ThemedText>
        <CountdownUnit value={timeRemaining.hours} label="Hours" theme={theme} />
        <ThemedText style={[styles.separator, { color: theme.textSecondary }]}>:</ThemedText>
        <CountdownUnit value={timeRemaining.minutes} label="Min" theme={theme} />
        <ThemedText style={[styles.separator, { color: theme.textSecondary }]}>:</ThemedText>
        <CountdownUnit value={timeRemaining.seconds} label="Sec" theme={theme} />
      </View>

      <Card style={styles.planCard}>
        <ThemedText style={styles.cardTitle}>Your Plan</ThemedText>
        <View style={styles.planRow}>
          <View style={styles.planItem}>
            <Feather name="target" size={20} color={theme.primary} />
            <View>
              <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Goal Weight</ThemedText>
              <ThemedText style={styles.planValue}>
                {challenge.goalWeight ? `${challenge.goalWeight} ${challenge.unit}` : "Not set"}
              </ThemedText>
            </View>
          </View>
          <View style={styles.planItem}>
            <Feather name="zap" size={20} color={theme.primary} />
            <View>
              <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Daily Calories</ThemedText>
              <ThemedText style={styles.planValue}>
                {challenge.targetCalories ? `${challenge.targetCalories} kcal` : "Not set"}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.planRow}>
          <View style={styles.planItem}>
            <Feather name="activity" size={20} color={theme.primary} />
            <View>
              <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Workouts/Week</ThemedText>
              <ThemedText style={styles.planValue}>
                {challenge.workoutsPerWeek ?? 4}
              </ThemedText>
            </View>
          </View>
          <View style={styles.planItem}>
            <Feather name="clock" size={20} color={theme.primary} />
            <View>
              <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Fasting</ThemedText>
              <ThemedText style={styles.planValue}>
                {challenge.fastingType ? challenge.fastingType.replace("_", ":") : "Not set"}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        {onEditPlan ? (
          <Button onPress={onEditPlan} style={styles.actionButton}>
            Edit Plan
          </Button>
        ) : null}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.logoutText, { color: theme.textSecondary }]}>Log Out</ThemedText>
        </Pressable>
      </View>

      <ThemedText style={[styles.helpText, { color: theme.textSecondary }]}>
        You can only log data once your challenge begins. Check back on Monday!
      </ThemedText>
    </ThemedView>
  );
}

function CountdownUnit({ value, label, theme }: { value: number; label: string; theme: any }) {
  return (
    <View style={styles.countdownUnit}>
      <View style={[styles.countdownBox, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={styles.countdownValue}>{String(value).padStart(2, "0")}</ThemedText>
      </View>
      <ThemedText style={[styles.countdownLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    ...Typography.largeTitle,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  countdownUnit: {
    alignItems: "center",
  },
  countdownBox: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 56,
    alignItems: "center",
  },
  countdownValue: {
    ...Typography.title1,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  countdownLabel: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    textTransform: "uppercase",
  },
  separator: {
    ...Typography.title2,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  planCard: {
    width: "100%",
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    ...Typography.headline,
    marginBottom: Spacing.lg,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  planItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  planLabel: {
    ...Typography.caption,
  },
  planValue: {
    ...Typography.subheadline,
    fontWeight: "600",
  },
  actions: {
    width: "100%",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    width: "100%",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  logoutText: {
    ...Typography.callout,
  },
  helpText: {
    ...Typography.footnote,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
