import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useChallenge } from "@/hooks/useChallenge";
import { useWeeklyCheckIns, useCreateWeeklyCheckIn, useUpdateWeeklyCheckIn } from "@/hooks/useWeeklyData";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import type { WeeklyCheckIn } from "@shared/schema";

type RouteParams = RouteProp<HomeStackParamList, "WeeklyCheckIn">;

export default function WeeklyCheckInScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const weekNumber = route.params?.weekNumber || 1;

  const { data: challenge } = useChallenge();
  const { data: weeklyCheckIns } = useWeeklyCheckIns(challenge?.id);
  const createCheckIn = useCreateWeeklyCheckIn();
  const updateCheckIn = useUpdateWeeklyCheckIn();

  const existingCheckIn = (weeklyCheckIns as WeeklyCheckIn[] | undefined)?.find(c => c.weekNumber === weekNumber);

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [chest, setChest] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (existingCheckIn) {
      setWeight(existingCheckIn.weight?.toString() || "");
      setWaist(existingCheckIn.waist?.toString() || "");
      setHips(existingCheckIn.hips?.toString() || "");
      setChest(existingCheckIn.chest?.toString() || "");
      setNotes(existingCheckIn.notes || "");
    }
  }, [existingCheckIn]);

  const handleSave = async () => {
    if (!challenge) return;

    try {
      const checkInData = {
        challengeId: challenge.id,
        weekNumber,
        weight: weight ? parseFloat(weight) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        chest: chest ? parseFloat(chest) : null,
        notes: notes || null,
      };

      if (existingCheckIn) {
        await updateCheckIn.mutateAsync({ id: existingCheckIn.id, data: checkInData });
      } else if (weight) {
        await createCheckIn.mutateAsync(checkInData);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save check-in");
    }
  };

  const isSaving = createCheckIn.isPending || updateCheckIn.isPending;
  const unit = challenge?.unit || "lbs";

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }
      ]}
    >
      <ThemedText style={styles.weekTitle}>Week {weekNumber} Check-In</ThemedText>

      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Weigh-In</ThemedText>
        
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Weight ({unit})
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.weightInput,
              { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            placeholder="0.0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Measurements (optional)</ThemedText>
        
        <View style={styles.measurementsRow}>
          <View style={styles.measurementInput}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Waist
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="in"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={waist}
              onChangeText={setWaist}
            />
          </View>
          <View style={styles.measurementInput}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Hips
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="in"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={hips}
              onChangeText={setHips}
            />
          </View>
          <View style={styles.measurementInput}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Chest
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="in"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={chest}
              onChangeText={setChest}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Notes
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            placeholder="How are you feeling this week?"
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>
      </Card>

      <Button
        onPress={handleSave}
        disabled={isSaving}
        style={styles.saveButton}
      >
        {isSaving ? "Saving..." : "Save Check-In"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  weekTitle: {
    ...Typography.title2,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.footnote,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  weightInput: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  measurementsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  measurementInput: {
    flex: 1,
  },
  notesInput: {
    height: 80,
    paddingTop: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});
