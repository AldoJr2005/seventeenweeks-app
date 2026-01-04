import React, { useState, useMemo } from "react";
import { View, StyleSheet, TextInput, Pressable, Image, Platform, Alert, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image as ExpoImage } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useCreateChallenge } from "@/hooks/useChallenge";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useCreateBaselineSnapshot } from "@/hooks/useBaseline";
import { getUpcomingMonday, formatDate } from "@/lib/date-utils";
import { calculateTDEE, calculateCalorieTarget } from "@/lib/tdee-utils";

const TOTAL_STEPS = 8;

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
  { id: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
  { id: "moderate", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
  { id: "active", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
  { id: "extreme", label: "Extremely Active", desc: "Athlete level activity" },
];

const DEFICIT_LEVELS = [
  { id: "conservative", label: "Conservative", lossPerWeek: 0.5, desc: "0.5 lbs/week - Sustainable" },
  { id: "moderate", label: "Moderate", lossPerWeek: 1.0, desc: "1 lb/week - Recommended" },
  { id: "aggressive", label: "Aggressive", lossPerWeek: 1.5, desc: "1.5 lbs/week - Challenging" },
];

const TRAINING_STYLES = [
  { id: "gym", label: "Gym", icon: "activity" as const },
  { id: "running", label: "Running", icon: "navigation" as const },
  { id: "home", label: "Home", icon: "home" as const },
  { id: "mixed", label: "Mixed", icon: "shuffle" as const },
];

const SPLIT_OPTIONS = [
  { id: "ppl", label: "Push/Pull/Legs" },
  { id: "upper_lower", label: "Upper/Lower" },
  { id: "full_body", label: "Full Body" },
  { id: "cardio", label: "Cardio-focused" },
];

const FASTING_TYPES = [
  { id: "16_8", label: "16:8", fastHours: 16, eatHours: 8 },
  { id: "18_6", label: "18:6", fastHours: 18, eatHours: 6 },
  { id: "20_4", label: "20:4", fastHours: 20, eatHours: 4 },
  { id: "none", label: "No Fasting", fastHours: 0, eatHours: 24 },
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const createChallenge = useCreateChallenge();
  const createBaseline = useCreateBaselineSnapshot();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [goalWeight, setGoalWeight] = useState("");
  const [deficitLevel, setDeficitLevel] = useState("moderate");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(4);
  const [trainingStyle, setTrainingStyle] = useState("gym");
  const [preferredSplit, setPreferredSplit] = useState("ppl");
  const [runningDaysPerWeek, setRunningDaysPerWeek] = useState(0);
  const [fastingType, setFastingType] = useState("16_8");
  const [lunchTime, setLunchTime] = useState("12:00");
  const [dinnerTime, setDinnerTime] = useState("19:00");
  const [baselineWeight, setBaselineWeight] = useState(profile?.currentWeight?.toString() || "");
  const [baselinePhoto, setBaselinePhoto] = useState<string | null>(null);
  const [typicalSteps, setTypicalSteps] = useState("");
  const [reflectionDay, setReflectionDay] = useState("Sunday");
  const [reflectionTime, setReflectionTime] = useState("20:30");

  const startDate = formatDate(getUpcomingMonday());
  const unit = profile?.weightUnit || "lbs";

  const tdee = useMemo(() => {
    if (!profile?.currentWeight || !profile?.heightValue || !profile?.age || !profile?.sex) return 0;
    const weightKg = unit === "kg" ? profile.currentWeight : profile.currentWeight * 0.453592;
    const heightCm = profile.heightUnit === "cm" ? profile.heightValue : profile.heightValue * 2.54;
    return calculateTDEE(weightKg, heightCm, profile.age, profile.sex, activityLevel);
  }, [profile, activityLevel, unit]);

  const targetCalories = useMemo(() => {
    const deficit = DEFICIT_LEVELS.find(d => d.id === deficitLevel);
    return calculateCalorieTarget(tdee, deficit?.lossPerWeek || 1);
  }, [tdee, deficitLevel]);

  const eatingWindow = useMemo(() => {
    const fasting = FASTING_TYPES.find(f => f.id === fastingType);
    if (!fasting || fastingType === "none") return null;
    const [lunchHour] = lunchTime.split(":").map(Number);
    const startHour = lunchHour;
    const endHour = (startHour + fasting.eatHours) % 24;
    const formatHour = (h: number) => {
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      return `${hour12}:00 ${period}`;
    };
    return {
      start: `${String(startHour).padStart(2, "0")}:00`,
      end: `${String(endHour).padStart(2, "0")}:00`,
      display: `${formatHour(startHour)} - ${formatHour(endHour)}`,
    };
  }, [fastingType, lunchTime]);

  const handleTakePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Web Limitation", "Camera is not available on web. Please use Expo Go on your device.");
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      if (permission.status === "denied" && !permission.canAskAgain) {
        Alert.alert("Camera Permission Required", "Please enable camera access in your device settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => { try { Linking.openSettings(); } catch {} } },
        ]);
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

  const handleComplete = async () => {
    if (!profile) return;
    setIsLoading(true);

    try {
      const challengeData = {
        status: "PRE_CHALLENGE",
        startDate,
        startWeight: parseFloat(baselineWeight) || profile.currentWeight || 0,
        goalWeight: goalWeight ? parseFloat(goalWeight) : null,
        unit,
        stepGoal: typicalSteps ? parseInt(typicalSteps) + 2000 : 10000,
        sleepGoal: 8,
        reminderTimes: {
          nutrition: "20:30",
          workout: "18:00",
          photo: "10:00",
          weighIn: "10:15",
          habits: "21:00",
        },
        smartReminders: true,
        activityLevel,
        targetCalories,
        targetWeeklyLoss: DEFICIT_LEVELS.find(d => d.id === deficitLevel)?.lossPerWeek || 1,
        deficitLevel,
        workoutsPerWeek,
        trainingStyle,
        preferredSplit,
        runningDaysPerWeek: trainingStyle === "running" || trainingStyle === "mixed" ? runningDaysPerWeek : 0,
        fastingType: fastingType !== "none" ? fastingType : null,
        eatingStartTime: eatingWindow?.start || null,
        eatingEndTime: eatingWindow?.end || null,
        reflectionReminderDay: reflectionDay,
        reflectionReminderTime: reflectionTime,
      };

      const challenge = await createChallenge.mutateAsync(challengeData);

      await createBaseline.mutateAsync({
        challengeId: challenge.id,
        baselineWeight: parseFloat(baselineWeight) || profile.currentWeight || 0,
        baselinePhotoUri: baselinePhoto,
        typicalSteps: typicalSteps ? parseInt(typicalSteps) : null,
        workoutsPerWeek,
      });

      await updateProfile.mutateAsync({
        id: profile.id,
        data: { onboardingComplete: true },
      });
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      Alert.alert("Error", "Failed to save your plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1: return !!goalWeight;
      case 2: return !!deficitLevel;
      case 3: return !!activityLevel;
      case 4: return workoutsPerWeek >= 0;
      case 5: return !!fastingType;
      case 6: return !!baselineWeight;
      case 7: return !!reflectionDay;
      case 8: return true;
      default: return false;
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: theme.primary }]} />
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>What's your goal weight?</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
              This helps us calculate your daily targets
            </ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.flexInput, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder={`Goal weight in ${unit}`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={goalWeight}
                onChangeText={setGoalWeight}
                autoFocus
              />
              <View style={[styles.unitBadge, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText>{unit}</ThemedText>
              </View>
            </View>
            {profile?.currentWeight && goalWeight ? (
              <Card style={styles.infoCard}>
                <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                  That's {Math.abs(profile.currentWeight - parseFloat(goalWeight)).toFixed(1)} {unit} to {parseFloat(goalWeight) < profile.currentWeight ? "lose" : "gain"}
                </ThemedText>
              </Card>
            ) : null}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>How aggressive?</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
              Choose your weekly weight loss pace
            </ThemedText>
            {DEFICIT_LEVELS.map(level => (
              <Pressable
                key={level.id}
                style={[styles.optionCard, { backgroundColor: theme.backgroundDefault, borderColor: deficitLevel === level.id ? theme.primary : theme.border }]}
                onPress={() => setDeficitLevel(level.id)}
              >
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionLabel}>{level.label}</ThemedText>
                  <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>{level.desc}</ThemedText>
                </View>
                {deficitLevel === level.id ? (
                  <Feather name="check-circle" size={24} color={theme.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Activity Level</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
              How active are you in daily life?
            </ThemedText>
            {ACTIVITY_LEVELS.map(level => (
              <Pressable
                key={level.id}
                style={[styles.optionCard, { backgroundColor: theme.backgroundDefault, borderColor: activityLevel === level.id ? theme.primary : theme.border }]}
                onPress={() => setActivityLevel(level.id)}
              >
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionLabel}>{level.label}</ThemedText>
                  <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>{level.desc}</ThemedText>
                </View>
                {activityLevel === level.id ? (
                  <Feather name="check-circle" size={24} color={theme.primary} />
                ) : null}
              </Pressable>
            ))}
            {tdee > 0 ? (
              <Card style={styles.tdeeCard}>
                <View style={styles.tdeeRow}>
                  <ThemedText style={[styles.tdeeLabel, { color: theme.textSecondary }]}>Your TDEE</ThemedText>
                  <ThemedText style={styles.tdeeValue}>{tdee.toFixed(0)} kcal/day</ThemedText>
                </View>
                <View style={styles.tdeeRow}>
                  <ThemedText style={[styles.tdeeLabel, { color: theme.textSecondary }]}>Target Calories</ThemedText>
                  <ThemedText style={[styles.tdeeValue, { color: theme.primary }]}>{targetCalories} kcal/day</ThemedText>
                </View>
              </Card>
            ) : null}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Workout Preferences</ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Workouts per week</ThemedText>
              <View style={styles.numberRow}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                  <Pressable
                    key={n}
                    style={[styles.numberButton, { backgroundColor: workoutsPerWeek === n ? theme.primary : theme.backgroundDefault }]}
                    onPress={() => setWorkoutsPerWeek(n)}
                  >
                    <ThemedText style={{ color: workoutsPerWeek === n ? "#FFF" : theme.text }}>{n}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Training style</ThemedText>
              <View style={styles.styleRow}>
                {TRAINING_STYLES.map(style => (
                  <Pressable
                    key={style.id}
                    style={[styles.styleButton, { backgroundColor: trainingStyle === style.id ? theme.primary : theme.backgroundDefault }]}
                    onPress={() => setTrainingStyle(style.id)}
                  >
                    <Feather name={style.icon} size={20} color={trainingStyle === style.id ? "#FFF" : theme.text} />
                    <ThemedText style={{ color: trainingStyle === style.id ? "#FFF" : theme.text, fontSize: 12 }}>{style.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
            {trainingStyle !== "running" && trainingStyle !== "cardio" ? (
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Split preference</ThemedText>
                <View style={styles.splitGrid}>
                  {SPLIT_OPTIONS.map(split => (
                    <Pressable
                      key={split.id}
                      style={[styles.splitButton, { backgroundColor: preferredSplit === split.id ? theme.primary : theme.backgroundDefault }]}
                      onPress={() => setPreferredSplit(split.id)}
                    >
                      <ThemedText style={{ color: preferredSplit === split.id ? "#FFF" : theme.text, fontSize: 13 }}>{split.label}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            {(trainingStyle === "running" || trainingStyle === "mixed") ? (
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Running days per week</ThemedText>
                <View style={styles.numberRow}>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                    <Pressable
                      key={n}
                      style={[styles.numberButton, { backgroundColor: runningDaysPerWeek === n ? theme.primary : theme.backgroundDefault }]}
                      onPress={() => setRunningDaysPerWeek(n)}
                    >
                      <ThemedText style={{ color: runningDaysPerWeek === n ? "#FFF" : theme.text }}>{n}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Fasting Preferences</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
              Optional: Set up intermittent fasting
            </ThemedText>
            <View style={styles.fastingGrid}>
              {FASTING_TYPES.map(type => (
                <Pressable
                  key={type.id}
                  style={[styles.fastingButton, { backgroundColor: fastingType === type.id ? theme.primary : theme.backgroundDefault, borderColor: theme.border }]}
                  onPress={() => setFastingType(type.id)}
                >
                  <ThemedText style={[styles.fastingLabel, { color: fastingType === type.id ? "#FFF" : theme.text }]}>{type.label}</ThemedText>
                  {type.id !== "none" ? (
                    <ThemedText style={{ color: fastingType === type.id ? "rgba(255,255,255,0.7)" : theme.textSecondary, fontSize: 11 }}>
                      {type.eatHours}hr eating
                    </ThemedText>
                  ) : null}
                </Pressable>
              ))}
            </View>
            {fastingType !== "none" ? (
              <>
                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>What time do you usually have lunch?</ThemedText>
                  <View style={styles.timeRow}>
                    {["11:00", "12:00", "13:00", "14:00"].map(time => (
                      <Pressable
                        key={time}
                        style={[styles.timeButton, { backgroundColor: lunchTime === time ? theme.primary : theme.backgroundDefault }]}
                        onPress={() => setLunchTime(time)}
                      >
                        <ThemedText style={{ color: lunchTime === time ? "#FFF" : theme.text }}>{time}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {eatingWindow ? (
                  <Card style={styles.windowCard}>
                    <ThemedText style={[styles.windowLabel, { color: theme.textSecondary }]}>Your eating window</ThemedText>
                    <ThemedText style={styles.windowValue}>{eatingWindow.display}</ThemedText>
                  </Card>
                ) : null}
              </>
            ) : null}
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Baseline Snapshot</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
              Capture your Week 0 starting point
            </ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Baseline weight</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder={`Weight in ${unit}`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={baselineWeight}
                onChangeText={setBaselineWeight}
              />
            </View>
            <Pressable
              style={[styles.photoButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
              onPress={handleTakePhoto}
            >
              {baselinePhoto ? (
                <ExpoImage source={{ uri: baselinePhoto }} style={styles.photoPreview} contentFit="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Feather name="camera" size={32} color={theme.textSecondary} />
                  <ThemedText style={[styles.photoText, { color: theme.textSecondary }]}>Take Baseline Photo (optional)</ThemedText>
                </View>
              )}
            </Pressable>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Typical daily steps (optional)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g., 5000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={typicalSteps}
                onChangeText={setTypicalSteps}
              />
            </View>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Weekly Reflection</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
              When should we remind you to reflect on your week?
            </ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Day</ThemedText>
              <View style={styles.dayGrid}>
                {DAYS_OF_WEEK.map(day => (
                  <Pressable
                    key={day}
                    style={[styles.dayButton, { backgroundColor: reflectionDay === day ? theme.primary : theme.backgroundDefault }]}
                    onPress={() => setReflectionDay(day)}
                  >
                    <ThemedText style={{ color: reflectionDay === day ? "#FFF" : theme.text, fontSize: 12 }}>{day.slice(0, 3)}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Time</ThemedText>
              <View style={styles.timeRow}>
                {["19:00", "20:00", "20:30", "21:00"].map(time => (
                  <Pressable
                    key={time}
                    style={[styles.timeButton, { backgroundColor: reflectionTime === time ? theme.primary : theme.backgroundDefault }]}
                    onPress={() => setReflectionTime(time)}
                  >
                    <ThemedText style={{ color: reflectionTime === time ? "#FFF" : theme.text }}>{time}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        );

      case 8:
        return (
          <View style={styles.stepContent}>
            <View style={styles.summaryHeader}>
              <Feather name="check-circle" size={48} color={theme.success} />
              <ThemedText style={styles.summaryTitle}>All Set for Monday!</ThemedText>
              <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
                Your challenge begins {new Date(startDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </ThemedText>
            </View>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Goal Weight</ThemedText>
                <ThemedText style={styles.summaryValue}>{goalWeight} {unit}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Daily Calories</ThemedText>
                <ThemedText style={styles.summaryValue}>{targetCalories} kcal</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Workouts/Week</ThemedText>
                <ThemedText style={styles.summaryValue}>{workoutsPerWeek}</ThemedText>
              </View>
              {fastingType !== "none" && eatingWindow ? (
                <View style={styles.summaryRow}>
                  <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Fasting</ThemedText>
                  <ThemedText style={styles.summaryValue}>{fastingType.replace("_", ":")} ({eatingWindow.display})</ThemedText>
                </View>
              ) : null}
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Weekly Pace</ThemedText>
                <ThemedText style={styles.summaryValue}>{DEFICIT_LEVELS.find(d => d.id === deficitLevel)?.lossPerWeek} {unit}/week</ThemedText>
              </View>
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing["3xl"] + Spacing["2xl"] }]}
    >
      <View style={styles.header}>
        <ThemedText style={[styles.stepIndicator, { color: theme.textSecondary }]}>Step {step} of {TOTAL_STEPS}</ThemedText>
        {renderProgressBar()}
      </View>

      {renderStep()}

      <View style={styles.buttonRow}>
        {step > 1 ? (
          <Pressable style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Feather name="chevron-left" size={20} color={theme.primary} />
            <ThemedText style={{ color: theme.primary }}>Back</ThemedText>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        {step < TOTAL_STEPS ? (
          <Button onPress={() => setStep(step + 1)} disabled={!canContinue()} style={styles.nextButton}>
            Continue
          </Button>
        ) : (
          <Button onPress={handleComplete} disabled={isLoading} style={styles.nextButton}>
            {isLoading ? "Saving..." : "Start Challenge"}
          </Button>
        )}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  stepIndicator: {
    ...Typography.footnote,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(128,128,128,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    gap: Spacing.lg,
  },
  stepTitle: {
    ...Typography.title2,
    textAlign: "center",
  },
  stepDesc: {
    ...Typography.body,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  flexInput: {
    flex: 1,
  },
  unitBadge: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
  },
  infoCard: {
    padding: Spacing.md,
    alignItems: "center",
  },
  infoText: {
    ...Typography.footnote,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    ...Typography.headline,
    marginBottom: Spacing.xs,
  },
  optionDesc: {
    ...Typography.footnote,
  },
  tdeeCard: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  tdeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  tdeeLabel: {
    ...Typography.subheadline,
  },
  tdeeValue: {
    ...Typography.headline,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  inputLabel: {
    ...Typography.subheadline,
  },
  numberRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  numberButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  styleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  styleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.xs,
  },
  splitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  splitButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  fastingGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  fastingButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
  },
  fastingLabel: {
    ...Typography.headline,
  },
  timeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  timeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  windowCard: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  windowLabel: {
    ...Typography.footnote,
    marginBottom: Spacing.xs,
  },
  windowValue: {
    ...Typography.title3,
  },
  photoButton: {
    height: 160,
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
  dayGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  dayButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  summaryHeader: {
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.title1,
  },
  summaryCard: {
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    minWidth: 80,
  },
  nextButton: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
});
