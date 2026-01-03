import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, TextInput, Platform, Alert, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useBaselineSnapshot, useCreateBaselineSnapshot, useUpdateBaselineSnapshot } from "@/hooks/useBaseline";
import type { Challenge, BaselineSnapshot } from "@shared/schema";

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
  const [showBaselineForm, setShowBaselineForm] = useState(false);
  const [typicalSteps, setTypicalSteps] = useState("");
  const [typicalCalories, setTypicalCalories] = useState("");
  const [typicalSleep, setTypicalSleep] = useState("");
  const [baselinePhoto, setBaselinePhoto] = useState<string | null>(null);

  const { data: existingBaseline } = useBaselineSnapshot(challenge.id);
  const createBaseline = useCreateBaselineSnapshot();
  const updateBaseline = useUpdateBaselineSnapshot();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(challenge.startDate));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [challenge.startDate]);

  useEffect(() => {
    if (existingBaseline) {
      setTypicalSteps(existingBaseline.typicalSteps?.toString() || "");
      setTypicalCalories(existingBaseline.typicalCalories?.toString() || "");
      setTypicalSleep(existingBaseline.typicalSleep?.toString() || "");
      setBaselinePhoto(existingBaseline.baselinePhotoUri || null);
    }
  }, [existingBaseline]);

  const handleLogout = async () => {
    await logout();
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Web Limitation", "Camera is not available on web. Please use Expo Go on your device to take photos.");
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      if (permission.status === "denied" && !permission.canAskAgain) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to take a baseline photo.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Open Settings", 
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.log("Cannot open settings");
                }
              }
            }
          ]
        );
      } else {
        Alert.alert("Permission needed", "Camera access is required to take a baseline photo.");
      }
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].base64 
        ? `data:image/jpeg;base64,${result.assets[0].base64}`
        : result.assets[0].uri;
      setBaselinePhoto(uri);
    }
  };

  const handleSaveBaseline = async () => {
    const data = {
      challengeId: challenge.id,
      baselineWeight: challenge.startWeight,
      baselinePhotoUri: baselinePhoto,
      typicalSteps: typicalSteps ? parseInt(typicalSteps) : null,
      typicalCalories: typicalCalories ? parseInt(typicalCalories) : null,
      typicalSleep: typicalSleep ? parseFloat(typicalSleep) : null,
    };

    try {
      if (existingBaseline) {
        await updateBaseline.mutateAsync({ id: existingBaseline.id, data });
      } else {
        await createBaseline.mutateAsync(data);
      }
      setShowBaselineForm(false);
    } catch (error) {
      console.error("Failed to save baseline:", error);
    }
  };

  const hasBaseline = !!existingBaseline;

  return (
    <KeyboardAwareScrollViewCompat 
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
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

      <Card style={styles.baselineCard}>
        <View style={styles.baselineHeader}>
          <View>
            <ThemedText style={styles.cardTitle}>Week 0 Baseline</ThemedText>
            <ThemedText style={[styles.baselineSubtitle, { color: theme.textSecondary }]}>
              Capture your starting point
            </ThemedText>
          </View>
          {hasBaseline ? (
            <Feather name="check-circle" size={24} color={theme.success} />
          ) : null}
        </View>

        {showBaselineForm ? (
          <View style={styles.baselineForm}>
            <Pressable 
              style={[styles.photoButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
              onPress={handleTakePhoto}
            >
              {baselinePhoto ? (
                <Image source={{ uri: baselinePhoto }} style={styles.photoPreview} contentFit="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Feather name="camera" size={32} color={theme.textSecondary} />
                  <ThemedText style={[styles.photoText, { color: theme.textSecondary }]}>Take Photo</ThemedText>
                </View>
              )}
            </Pressable>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Typical Daily Steps</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g., 5000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={typicalSteps}
                onChangeText={setTypicalSteps}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Typical Daily Calories</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g., 2000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={typicalCalories}
                onChangeText={setTypicalCalories}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Typical Sleep (hours)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g., 7"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={typicalSleep}
                onChangeText={setTypicalSleep}
              />
            </View>

            <View style={styles.formButtons}>
              <Pressable 
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setShowBaselineForm(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Button 
                onPress={handleSaveBaseline}
                disabled={createBaseline.isPending || updateBaseline.isPending}
                style={styles.saveButton}
              >
                {createBaseline.isPending || updateBaseline.isPending ? "Saving..." : "Save Baseline"}
              </Button>
            </View>
          </View>
        ) : (
          <Button 
            onPress={() => setShowBaselineForm(true)}
            style={styles.captureButton}
          >
            {hasBaseline ? "Edit Baseline" : "Capture Baseline"}
          </Button>
        )}
      </Card>

      <Card style={styles.planCard}>
        <View style={styles.planHeader}>
          <ThemedText style={styles.cardTitle}>Your Plan</ThemedText>
          <ThemedText style={[styles.planReadyLabel, { color: theme.success }]}>
            Plan ready - begins Monday
          </ThemedText>
        </View>

        <View style={styles.planSection}>
          <ThemedText style={[styles.planSectionTitle, { color: theme.textSecondary }]}>Goals</ThemedText>
          <View style={styles.planRow}>
            <View style={styles.planItem}>
              <Feather name="target" size={18} color={theme.primary} />
              <View>
                <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Goal Weight</ThemedText>
                <ThemedText style={styles.planValue}>
                  {challenge.goalWeight ? `${challenge.goalWeight} ${challenge.unit}` : "Not set"}
                </ThemedText>
              </View>
            </View>
            <View style={styles.planItem}>
              <Feather name="trending-down" size={18} color={theme.primary} />
              <View>
                <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Weekly Loss</ThemedText>
                <ThemedText style={styles.planValue}>
                  {challenge.targetWeeklyLoss ? `${challenge.targetWeeklyLoss} lb/wk` : "1 lb/wk"}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.planSection}>
          <ThemedText style={[styles.planSectionTitle, { color: theme.textSecondary }]}>Nutrition</ThemedText>
          <View style={styles.planRow}>
            <View style={styles.planItem}>
              <Feather name="zap" size={18} color={theme.primary} />
              <View>
                <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Daily Calories</ThemedText>
                <ThemedText style={styles.planValue}>
                  {challenge.targetCalories ? `${challenge.targetCalories} kcal` : "Not set"}
                </ThemedText>
              </View>
            </View>
            <View style={styles.planItem}>
              <Feather name="pie-chart" size={18} color={theme.primary} />
              <View>
                <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Macros</ThemedText>
                <ThemedText style={styles.planValue}>
                  {challenge.targetProteinGrams ? `P:${challenge.targetProteinGrams} C:${challenge.targetCarbsGrams} F:${challenge.targetFatGrams}` : "Balanced"}
                </ThemedText>
              </View>
            </View>
          </View>
          {challenge.fastingType ? (
            <View style={[styles.planRow, { marginTop: Spacing.sm }]}>
              <View style={styles.planItem}>
                <Feather name="clock" size={18} color={theme.primary} />
                <View>
                  <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Fasting</ThemedText>
                  <ThemedText style={styles.planValue}>
                    {challenge.fastingType.replace("_", ":")}
                    {challenge.eatingStartTime && challenge.eatingEndTime ? ` (${challenge.eatingStartTime} - ${challenge.eatingEndTime})` : ""}
                  </ThemedText>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.planSection}>
          <ThemedText style={[styles.planSectionTitle, { color: theme.textSecondary }]}>Activity</ThemedText>
          <View style={styles.planRow}>
            <View style={styles.planItem}>
              <Feather name="activity" size={18} color={theme.primary} />
              <View>
                <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Workouts</ThemedText>
                <ThemedText style={styles.planValue}>
                  {challenge.workoutsPerWeek ?? 4}x/week ({challenge.preferredSplit || "PPL"})
                </ThemedText>
              </View>
            </View>
            <View style={styles.planItem}>
              <Feather name="navigation" size={18} color={theme.primary} />
              <View>
                <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Step Goal</ThemedText>
                <ThemedText style={styles.planValue}>
                  {(challenge.stepGoal ?? 10000).toLocaleString()}/day
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.planSection}>
          <ThemedText style={[styles.planSectionTitle, { color: theme.textSecondary }]}>Reminders</ThemedText>
          <View style={styles.planRow}>
            <View style={styles.planItem}>
              <Feather name="bell" size={18} color={theme.primary} />
              <View>
                <ThemedText style={[styles.planLabel, { color: theme.textSecondary }]}>Intensity</ThemedText>
                <ThemedText style={styles.planValue}>
                  {challenge.reminderIntensity || "Normal"}
                </ThemedText>
              </View>
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
        You can only log data once your challenge begins. Use this time to prepare!
      </ThemedText>
    </KeyboardAwareScrollViewCompat>
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
    marginBottom: Spacing.xl,
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
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.headline,
  },
  planReadyLabel: {
    ...Typography.caption,
    fontWeight: "600",
  },
  planSection: {
    marginBottom: Spacing.lg,
  },
  planSectionTitle: {
    ...Typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  planItem: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  baselineCard: {
    width: "100%",
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  baselineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  baselineSubtitle: {
    ...Typography.footnote,
    marginTop: Spacing.xs,
  },
  baselineForm: {
    gap: Spacing.md,
  },
  photoButton: {
    width: "100%",
    aspectRatio: 3 / 4,
    maxHeight: 200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  photoText: {
    ...Typography.footnote,
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    ...Typography.footnote,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    ...Typography.body,
  },
  formButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    flex: 2,
  },
  captureButton: {
    marginTop: Spacing.sm,
  },
});
