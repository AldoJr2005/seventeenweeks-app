import React from "react";
import { StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { WorkoutPreferenceSetup } from "@/components/WorkoutPreferenceSetup";
import { useChallenge, useUpdateChallenge } from "@/hooks/useChallenge";
import type { Challenge } from "@shared/schema";

export default function WorkoutPreferencesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: challenge } = useChallenge() as { data: Challenge | null };
  const updateChallenge = useUpdateChallenge();

  const handleSave = async (preferences: {
    workoutsPerWeek: number;
    trainingStyle: string;
    preferredSplit: string;
    runningDaysPerWeek: number;
  }) => {
    if (!challenge) return;

    try {
      await updateChallenge.mutateAsync({
        id: challenge.id,
        data: {
          workoutsPerWeek: preferences.workoutsPerWeek,
          trainingStyle: preferences.trainingStyle,
          preferredSplit: preferences.preferredSplit,
          runningDaysPerWeek: preferences.runningDaysPerWeek,
        },
      });
      Alert.alert(
        "Preferences Saved",
        "Your workout preferences have been updated.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save preferences. Please try again.");
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <WorkoutPreferenceSetup
        initialPreferences={{
          workoutsPerWeek: challenge?.workoutsPerWeek || 4,
          trainingStyle: (challenge?.trainingStyle as any) || "hybrid",
          preferredSplit: (challenge?.preferredSplit as any) || "push_pull_legs",
          runningDaysPerWeek: challenge?.runningDaysPerWeek || 0,
        }}
        onSave={handleSave}
        isLoading={updateChallenge.isPending}
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
});
