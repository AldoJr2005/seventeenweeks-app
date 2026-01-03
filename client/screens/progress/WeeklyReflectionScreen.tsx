import React from "react";
import { StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { WeeklyReflection } from "@/components/WeeklyReflection";
import { useChallenge } from "@/hooks/useChallenge";
import { useWeeklyReflection, useCreateWeeklyReflection, useUpdateWeeklyReflection } from "@/hooks/useReflections";
import type { Challenge, InsertWeeklyReflection } from "@shared/schema";

type WeeklyReflectionScreenParams = {
  weekNumber: number;
};

interface ReflectionFormData {
  weekNumber: number;
  challengeId: string;
  wentWell?: string;
  wasHard?: string;
  learned?: string;
  nextWeekFocus?: string;
  moodRating?: number;
  energyRating?: number;
  overallRating?: number;
}

export default function WeeklyReflectionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: WeeklyReflectionScreenParams }, "params">>();
  const weekNumber = route.params?.weekNumber || 1;

  const { data: challenge } = useChallenge() as { data: Challenge | null };
  const { data: existingReflection } = useWeeklyReflection(challenge?.id || "", weekNumber);
  const createReflection = useCreateWeeklyReflection();
  const updateReflection = useUpdateWeeklyReflection();

  const handleSave = async (data: ReflectionFormData) => {
    if (!challenge) return;

    try {
      if (existingReflection) {
        await updateReflection.mutateAsync({
          id: existingReflection.id,
          data: {
            wentWell: data.wentWell,
            wasHard: data.wasHard,
            learned: data.learned,
            nextWeekFocus: data.nextWeekFocus,
            moodRating: data.moodRating,
            energyRating: data.energyRating,
            overallRating: data.overallRating,
          },
        });
      } else {
        await createReflection.mutateAsync({
          challengeId: challenge.id,
          weekNumber,
          wentWell: data.wentWell,
          wasHard: data.wasHard,
          learned: data.learned,
          nextWeekFocus: data.nextWeekFocus,
          moodRating: data.moodRating,
          energyRating: data.energyRating,
          overallRating: data.overallRating,
        });
      }
      Alert.alert(
        "Reflection Saved",
        "Your weekly reflection has been saved.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save reflection. Please try again.");
    }
  };

  if (!challenge) return null;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <WeeklyReflection
        weekNumber={weekNumber}
        challengeId={challenge.id}
        existingReflection={existingReflection || undefined}
        onSave={handleSave}
        isLoading={createReflection.isPending || updateReflection.isPending}
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
});
