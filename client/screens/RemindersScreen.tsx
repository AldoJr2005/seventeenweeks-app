import React, { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useChallenge, useUpdateChallenge } from "@/hooks/useChallenge";
import type { Challenge } from "@shared/schema";

const DEFAULT_TIMES = {
  nutrition: "20:30",
  workout: "18:00",
  photo: "10:00",
  weighIn: "10:15",
  habits: "21:00",
};

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const { data: challenge } = useChallenge();
  const updateChallenge = useUpdateChallenge();

  const reminderTimes = (challenge as Challenge | undefined)?.reminderTimes || DEFAULT_TIMES;

  const [times, setTimes] = useState({
    nutrition: reminderTimes.nutrition || DEFAULT_TIMES.nutrition,
    workout: reminderTimes.workout || DEFAULT_TIMES.workout,
    photo: reminderTimes.photo || DEFAULT_TIMES.photo,
    weighIn: reminderTimes.weighIn || DEFAULT_TIMES.weighIn,
    habits: reminderTimes.habits || DEFAULT_TIMES.habits,
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSave = async () => {
    if (!challenge) return;

    try {
      await updateChallenge.mutateAsync({
        id: (challenge as Challenge).id,
        data: { reminderTimes: times },
      });
      Alert.alert("Saved", "Reminder times updated successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save reminder times");
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
      <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
        Set when you'd like to receive reminders for each activity. Reminders won't fire if you've already completed the task.
      </ThemedText>

      <Card style={styles.card}>
        <ReminderRow
          icon="edit-3"
          label="Nutrition"
          description="If not logged by this time"
          time={formatTime(times.nutrition)}
          theme={theme}
        />
      </Card>

      <Card style={styles.card}>
        <ReminderRow
          icon="activity"
          label="Workout"
          description="If not logged by this time"
          time={formatTime(times.workout)}
          theme={theme}
        />
      </Card>

      <Card style={styles.card}>
        <ReminderRow
          icon="camera"
          label="Weekly Photo"
          description="Every Monday"
          time={formatTime(times.photo)}
          theme={theme}
        />
      </Card>

      <Card style={styles.card}>
        <ReminderRow
          icon="trending-down"
          label="Weekly Weigh-In"
          description="Every Monday"
          time={formatTime(times.weighIn)}
          theme={theme}
        />
      </Card>

      <Card style={styles.card}>
        <ReminderRow
          icon="check-square"
          label="Daily Habits"
          description="If any habits incomplete"
          time={formatTime(times.habits)}
          theme={theme}
        />
      </Card>

      <View style={[styles.infoBox, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="info" size={16} color={theme.textSecondary} />
        <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
          Smart reminders are enabled. You won't be notified if you've already completed or skipped the activity.
        </ThemedText>
      </View>

      <Button
        onPress={handleSave}
        disabled={updateChallenge.isPending}
        style={styles.saveButton}
      >
        {updateChallenge.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </ScrollView>
  );
}

function ReminderRow({ 
  icon, 
  label, 
  description,
  time, 
  theme 
}: { 
  icon: keyof typeof Feather.glyphMap; 
  label: string; 
  description: string;
  time: string; 
  theme: any;
}) {
  return (
    <View style={styles.reminderRow}>
      <View style={styles.reminderLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name={icon} size={20} color={theme.primary} />
        </View>
        <View>
          <ThemedText style={styles.reminderLabel}>{label}</ThemedText>
          <ThemedText style={[styles.reminderDescription, { color: theme.textSecondary }]}>
            {description}
          </ThemedText>
        </View>
      </View>
      <View style={[styles.timeContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText style={styles.timeText}>{time}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    ...Typography.body,
    marginBottom: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.md,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  reminderLabel: {
    ...Typography.headline,
  },
  reminderDescription: {
    ...Typography.footnote,
    marginTop: 2,
  },
  timeContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  timeText: {
    ...Typography.subheadline,
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoText: {
    ...Typography.footnote,
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
});
