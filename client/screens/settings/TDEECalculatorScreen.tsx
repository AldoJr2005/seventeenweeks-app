import React from "react";
import { StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { TDEECalculator } from "@/components/TDEECalculator";
import { useChallenge, useUpdateChallenge } from "@/hooks/useChallenge";
import type { Challenge } from "@shared/schema";

export default function TDEECalculatorScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: challenge } = useChallenge() as { data: Challenge | null };
  const updateChallenge = useUpdateChallenge();

  const handleCalorieGoalSet = async (calories: number) => {
    if (!challenge) return;

    try {
      await updateChallenge.mutateAsync({
        id: challenge.id,
        data: { targetCalories: calories },
      });
      Alert.alert(
        "Calorie Goal Updated",
        `Your daily calorie goal is now ${calories} calories.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update calorie goal. Please try again.");
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
      <TDEECalculator
        initialWeight={challenge?.startWeight}
        onCalorieGoalSet={handleCalorieGoalSet}
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
});
