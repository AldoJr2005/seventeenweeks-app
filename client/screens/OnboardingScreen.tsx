import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Image, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useCreateChallenge } from "@/hooks/useChallenge";
import { getUpcomingMonday, formatDate } from "@/lib/date-utils";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const createChallenge = useCreateChallenge();

  const [step, setStep] = useState(1);
  const [startWeight, setStartWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");

  const startDate = formatDate(getUpcomingMonday());

  const handleComplete = async () => {
    if (!startWeight) return;

    try {
      await createChallenge.mutateAsync({
        startDate,
        startWeight: parseFloat(startWeight),
        goalWeight: goalWeight ? parseFloat(goalWeight) : null,
        unit,
        stepGoal: 10000,
        sleepGoal: 8,
        reminderTimes: {
          nutrition: "20:30",
          workout: "18:00",
          photo: "10:00",
          weighIn: "10:15",
          habits: "21:00",
        },
        smartReminders: true,
      });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to create challenge:", error);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl }
      ]}
    >
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <ThemedText style={styles.title}>17-Week Challenge</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Your transformation starts here
      </ThemedText>

      {step === 1 ? (
        <View style={styles.stepContainer}>
          <ThemedText style={styles.stepTitle}>Step 1: Your Starting Point</ThemedText>
          
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Starting Weight
            </ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                placeholder="Enter weight"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={startWeight}
                onChangeText={setStartWeight}
              />
              <View style={styles.unitToggle}>
                <Pressable
                  style={[
                    styles.unitButton,
                    { backgroundColor: unit === "lbs" ? theme.primary : theme.backgroundDefault }
                  ]}
                  onPress={() => setUnit("lbs")}
                >
                  <ThemedText style={{ color: unit === "lbs" ? "#FFF" : theme.text }}>lbs</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.unitButton,
                    { backgroundColor: unit === "kg" ? theme.primary : theme.backgroundDefault }
                  ]}
                  onPress={() => setUnit("kg")}
                >
                  <ThemedText style={{ color: unit === "kg" ? "#FFF" : theme.text }}>kg</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Goal Weight (optional)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.fullInput,
                { 
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="Enter goal weight"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={goalWeight}
              onChangeText={setGoalWeight}
            />
          </View>

          <View style={styles.infoBox}>
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              Your challenge will start on Monday, {new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </ThemedText>
          </View>

          <Button 
            onPress={() => setStep(2)} 
            disabled={!startWeight}
            style={styles.nextButton}
          >
            Continue
          </Button>
        </View>
      ) : (
        <View style={styles.stepContainer}>
          <ThemedText style={styles.stepTitle}>Step 2: Ready to Begin</ThemedText>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Start Date</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Starting Weight</ThemedText>
              <ThemedText style={styles.summaryValue}>{startWeight} {unit}</ThemedText>
            </View>
            {goalWeight ? (
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Goal Weight</ThemedText>
                <ThemedText style={styles.summaryValue}>{goalWeight} {unit}</ThemedText>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Duration</ThemedText>
              <ThemedText style={styles.summaryValue}>17 Weeks</ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.motivationText, { color: theme.textSecondary }]}>
            You'll track daily nutrition, workouts, and habits. Every Monday, take a progress photo and weigh in. Let's do this!
          </ThemedText>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.backButton, { borderColor: theme.border }]}
              onPress={() => setStep(1)}
            >
              <ThemedText>Back</ThemedText>
            </Pressable>
            <Button 
              onPress={handleComplete}
              disabled={createChallenge.isPending}
              style={styles.startButton}
            >
              {createChallenge.isPending ? "Creating..." : "Start Challenge"}
            </Button>
          </View>
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: Spacing.lg,
    borderRadius: 16,
  },
  title: {
    ...Typography.largeTitle,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.title3,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.subheadline,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  fullInput: {
    width: "100%",
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  unitButton: {
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  infoText: {
    ...Typography.footnote,
    textAlign: "center",
  },
  nextButton: {
    marginTop: "auto",
  },
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  motivationText: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: "auto",
  },
  backButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  startButton: {
    flex: 2,
  },
});
