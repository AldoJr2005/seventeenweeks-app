import React, { useState, useMemo } from "react";
import { View, StyleSheet, TextInput, Image, ActivityIndicator, Pressable, Platform, Alert, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useCreateProfile } from "@/hooks/useProfile";
import { useCreateChallenge } from "@/hooks/useChallenge";
import { useCreateBaselineSnapshot } from "@/hooks/useBaseline";
import { useAuth } from "@/contexts/AuthContext";
import { hashPassword, setSessionUnlocked } from "@/lib/auth";
import { api } from "@/lib/api";
import { getUpcomingMonday, formatDate } from "@/lib/date-utils";
import { calculateTDEE, calculateCalorieTarget } from "@/lib/tdee-utils";

const TOTAL_STEPS = 10;

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little to no exercise", multiplier: 1.2 },
  { id: "light", label: "Light", desc: "Light exercise 1-3 days/week", multiplier: 1.375 },
  { id: "moderate", label: "Moderate", desc: "Moderate exercise 3-5 days/week", multiplier: 1.55 },
  { id: "active", label: "Very Active", desc: "Hard exercise 6-7 days/week", multiplier: 1.725 },
];

const DEFICIT_LEVELS = [
  { id: "conservative", lossPerWeek: 0.5, label: "Conservative", desc: "0.5 lb/week - Sustainable" },
  { id: "moderate", lossPerWeek: 1.0, label: "Moderate", desc: "1 lb/week - Recommended" },
  { id: "aggressive", lossPerWeek: 1.5, label: "Aggressive", desc: "1.5 lb/week - Challenging" },
];

const SPLIT_OPTIONS = [
  { id: "ppl", label: "Push/Pull/Legs" },
  { id: "upper_lower", label: "Upper/Lower" },
  { id: "full_body", label: "Full Body" },
  { id: "cardio", label: "Cardio-focused" },
];

const STEP_GOALS = [
  { value: 6000, label: "6,000" },
  { value: 8000, label: "8,000" },
  { value: 10000, label: "10,000" },
];

const FASTING_TYPES = [
  { id: "16_8", label: "16:8", fastHours: 16, eatHours: 8 },
  { id: "18_6", label: "18:6", fastHours: 18, eatHours: 6 },
  { id: "20_4", label: "20:4", fastHours: 20, eatHours: 4 },
  { id: "none", label: "No Fasting", fastHours: 0, eatHours: 24 },
];

const REMINDER_INTENSITIES = [
  { id: "GENTLE", label: "Gentle", desc: "Fewer reminders, softer language" },
  { id: "NORMAL", label: "Normal", desc: "Standard reminders with one follow-up" },
  { id: "STRICT", label: "Strict", desc: "Firm wording, follow-up if incomplete" },
];

const MACRO_PRESETS = [
  { id: "BALANCED", label: "Balanced", protein: 0.30, carbs: 0.40, fat: 0.30, desc: "30% protein, 40% carbs, 30% fat" },
  { id: "HIGH_PROTEIN", label: "Higher Protein", protein: 0.40, carbs: 0.30, fat: 0.30, desc: "40% protein, 30% carbs, 30% fat" },
  { id: "LOW_CARB", label: "Lower Carb", protein: 0.35, carbs: 0.25, fat: 0.40, desc: "35% protein, 25% carbs, 40% fat" },
];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const createProfile = useCreateProfile();
  const createChallenge = useCreateChallenge();
  const createBaseline = useCreateBaselineSnapshot();
  const { goToLogin, refreshAuth, profile } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightUnit, setHeightUnit] = useState<"ft" | "cm">("ft");
  const [currentWeight, setCurrentWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [goalWeight, setGoalWeight] = useState("");
  const [deficitLevel, setDeficitLevel] = useState("moderate");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(4);
  const [doesRun, setDoesRun] = useState(false);
  const [runningDaysPerWeek, setRunningDaysPerWeek] = useState(0);
  const [preferredSplit, setPreferredSplit] = useState("ppl");
  const [stepGoal, setStepGoal] = useState(8000);
  const [customStepGoal, setCustomStepGoal] = useState("");
  const [useCustomSteps, setUseCustomSteps] = useState(false);
  const [fastingType, setFastingType] = useState("16_8");
  const [lunchTime, setLunchTime] = useState("12:00");
  const [reminderIntensity, setReminderIntensity] = useState("NORMAL");
  const [baselinePhoto, setBaselinePhoto] = useState<string | null>(null);
  const [macroPreset, setMacroPreset] = useState("BALANCED");

  const startDate = getUpcomingMonday();
  const startDateFormatted = formatDate(startDate);

  const getHeightValue = (): number => {
    if (heightUnit === "ft") {
      const feet = parseFloat(heightFeet) || 0;
      const inches = parseFloat(heightInches) || 0;
      return feet * 12 + inches;
    }
    return parseFloat(heightCm) || 0;
  };

  const getHeightInCm = (): number => {
    if (heightUnit === "ft") {
      const totalInches = getHeightValue();
      return totalInches * 2.54;
    }
    return parseFloat(heightCm) || 0;
  };

  const getWeightInKg = (): number => {
    const weight = parseFloat(currentWeight) || 0;
    return weightUnit === "kg" ? weight : weight * 0.453592;
  };

  const tdee = useMemo(() => {
    const weightKg = getWeightInKg();
    const heightCmVal = getHeightInCm();
    const ageNum = parseInt(age) || 0;
    if (!weightKg || !heightCmVal || !ageNum || !sex) return 0;
    return calculateTDEE(weightKg, heightCmVal, ageNum, sex, activityLevel);
  }, [currentWeight, weightUnit, heightUnit, heightFeet, heightInches, heightCm, age, sex, activityLevel]);

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

  const finalStepGoal = useCustomSteps ? (parseInt(customStepGoal) || 8000) : stepGoal;

  const macros = useMemo(() => {
    if (!targetCalories || targetCalories <= 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }
    const preset = MACRO_PRESETS.find(p => p.id === macroPreset) || MACRO_PRESETS[0];
    const protein = Math.round((targetCalories * preset.protein) / 4);
    const carbs = Math.round((targetCalories * preset.carbs) / 4);
    const fat = Math.round((targetCalories * preset.fat) / 9);
    return { protein, carbs, fat };
  }, [targetCalories, macroPreset]);

  const isStep1Valid = username.trim().length >= 3 && name.trim().length > 0 && age.trim().length > 0 && sex !== "" &&
    !!(heightUnit === "ft" ? (heightFeet || heightInches) : heightCm) &&
    currentWeight.trim().length > 0 && password.length >= 4 && password === confirmPassword;
  const isStep2Valid = goalWeight.trim().length > 0;
  const isStep3Valid = activityLevel !== "" && deficitLevel !== "" && targetCalories > 0;
  const isStep4Valid = macroPreset !== "" && targetCalories > 0;
  const isStep5Valid = workoutsPerWeek >= 0 && preferredSplit !== "";
  const isStep6Valid = finalStepGoal >= 1000;
  const isStep7Valid = fastingType !== "";
  const isStep8Valid = reminderIntensity !== "";

  const canContinue = (): boolean => {
    switch (step) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      case 5: return isStep5Valid;
      case 6: return isStep6Valid;
      case 7: return isStep7Valid;
      case 8: return isStep8Valid;
      case 9: return true;
      case 10: return true;
      default: return false;
    }
  };

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
    if (password !== confirmPassword) {
      setError("PINs don't match");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const passwordHash = await hashPassword(password);
      const heightValue = getHeightValue();
      const weightValue = parseFloat(currentWeight);

      const profile = await createProfile.mutateAsync({
        username: username.trim().toLowerCase(),
        name: name.trim(),
        heightValue,
        heightUnit,
        weightUnit,
        currentWeight: weightValue,
        age: parseInt(age),
        sex,
        passwordHash,
        requirePasswordOnOpen: true,
        autoLockMinutes: 5,
        onboardingComplete: false,
      });

      const challenge = await createChallenge.mutateAsync({
        status: "PRE_CHALLENGE",
        startDate: startDateFormatted,
        startWeight: weightValue,
        goalWeight: parseFloat(goalWeight),
        unit: weightUnit,
        stepGoal: finalStepGoal,
        sleepGoal: 8,
        activityLevel,
        tdeeEstimate: tdee,
        targetCalories,
        targetWeeklyLoss: DEFICIT_LEVELS.find(d => d.id === deficitLevel)?.lossPerWeek || 1,
        deficitLevel,
        workoutsPerWeek,
        preferredSplit,
        doesRun,
        runningDaysPerWeek: doesRun ? runningDaysPerWeek : 0,
        fastingType: fastingType !== "none" ? fastingType : null,
        lunchTime: fastingType !== "none" ? lunchTime : null,
        eatingStartTime: eatingWindow?.start || null,
        eatingEndTime: eatingWindow?.end || null,
        reminderIntensity,
        smartReminders: true,
        targetProteinGrams: macros.protein,
        targetCarbsGrams: macros.carbs,
        targetFatGrams: macros.fat,
        macroPreset,
      });

      try {
        await createBaseline.mutateAsync({
          challengeId: challenge.id,
          baselineWeight: weightValue,
          baselinePhotoUri: baselinePhoto,
          typicalSteps: finalStepGoal - 2000,
          workoutsPerWeek,
        });
      } catch (baselineErr) {
        console.warn("Baseline snapshot creation failed (non-critical):", baselineErr);
      }

      await api.profile.update(profile.id, { onboardingComplete: true });
      await setSessionUnlocked(true);
      refreshAuth();
    } catch (err: any) {
      console.error("Setup error:", err);
      setError(err.message || "Failed to create your plan");
    } finally {
      setIsLoading(false);
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
            <ThemedText style={styles.stepTitle}>Let's get started</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>Tell us about yourself</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Username</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="Choose a username (min 3 characters)"
                placeholderTextColor={theme.textSecondary}
                value={username}
                onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="Your name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Age</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="Age"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Sex</ThemedText>
                <View style={styles.segmentedControl}>
                  <Pressable
                    style={[styles.segment, { backgroundColor: sex === "male" ? theme.primary : theme.backgroundDefault }]}
                    onPress={() => setSex("male")}
                  >
                    <ThemedText style={{ color: sex === "male" ? "#FFF" : theme.text }}>Male</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.segment, { backgroundColor: sex === "female" ? theme.primary : theme.backgroundDefault }]}
                    onPress={() => setSex("female")}
                  >
                    <ThemedText style={{ color: sex === "female" ? "#FFF" : theme.text }}>Female</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Height</ThemedText>
                <View style={styles.unitToggle}>
                  <Pressable style={[styles.unitBtn, { backgroundColor: heightUnit === "ft" ? theme.primary : theme.backgroundDefault }]} onPress={() => setHeightUnit("ft")}>
                    <ThemedText style={{ color: heightUnit === "ft" ? "#FFF" : theme.text, fontSize: 12 }}>ft/in</ThemedText>
                  </Pressable>
                  <Pressable style={[styles.unitBtn, { backgroundColor: heightUnit === "cm" ? theme.primary : theme.backgroundDefault }]} onPress={() => setHeightUnit("cm")}>
                    <ThemedText style={{ color: heightUnit === "cm" ? "#FFF" : theme.text, fontSize: 12 }}>cm</ThemedText>
                  </Pressable>
                </View>
              </View>
              {heightUnit === "ft" ? (
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                    placeholder="Feet"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                    placeholder="Inches"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={heightInches}
                    onChangeText={setHeightInches}
                  />
                </View>
              ) : (
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="Height in cm"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={heightCm}
                  onChangeText={setHeightCm}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Current Weight</ThemedText>
                <View style={styles.unitToggle}>
                  <Pressable style={[styles.unitBtn, { backgroundColor: weightUnit === "lbs" ? theme.primary : theme.backgroundDefault }]} onPress={() => setWeightUnit("lbs")}>
                    <ThemedText style={{ color: weightUnit === "lbs" ? "#FFF" : theme.text, fontSize: 12 }}>lbs</ThemedText>
                  </Pressable>
                  <Pressable style={[styles.unitBtn, { backgroundColor: weightUnit === "kg" ? theme.primary : theme.backgroundDefault }]} onPress={() => setWeightUnit("kg")}>
                    <ThemedText style={{ color: weightUnit === "kg" ? "#FFF" : theme.text, fontSize: 12 }}>kg</ThemedText>
                  </Pressable>
                </View>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder={`Weight in ${weightUnit}`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={currentWeight}
                onChangeText={setCurrentWeight}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Create a PIN</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="PIN (min 4 digits)"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                value={password}
                onChangeText={(t) => { setPassword(t.replace(/[^0-9]/g, "")); setError(""); }}
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="Confirm PIN"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t.replace(/[^0-9]/g, "")); setError(""); }}
              />
            </View>

            {profile ? (
              <Pressable style={styles.loginLink} onPress={goToLogin}>
                <ThemedText style={[styles.loginLinkText, { color: theme.textSecondary }]}>
                  Already have an account?{" "}
                </ThemedText>
                <ThemedText style={[styles.loginLinkText, { color: theme.primary }]}>
                  Login
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>What's your goal?</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>Set your target weight for this 17-week challenge</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Goal Weight ({weightUnit})</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder={`Goal weight in ${weightUnit}`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={goalWeight}
                onChangeText={setGoalWeight}
              />
            </View>

            {currentWeight && goalWeight ? (
              <Card style={styles.infoCard}>
                <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                  That's {Math.abs(parseFloat(currentWeight) - parseFloat(goalWeight)).toFixed(1)} {weightUnit} to {parseFloat(goalWeight) < parseFloat(currentWeight) ? "lose" : "gain"} over 17 weeks
                </ThemedText>
              </Card>
            ) : null}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Calorie Plan</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>We'll calculate your daily target</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Weekly Weight Loss Pace</ThemedText>
              {DEFICIT_LEVELS.map(level => (
                <Pressable
                  key={level.id}
                  style={[styles.optionCard, { backgroundColor: theme.backgroundDefault, borderColor: deficitLevel === level.id ? theme.primary : theme.border }]}
                  onPress={() => setDeficitLevel(level.id)}
                >
                  <View style={styles.optionHeader}>
                    <ThemedText style={styles.optionLabel}>{level.label}</ThemedText>
                    {deficitLevel === level.id ? <Feather name="check-circle" size={20} color={theme.primary} /> : null}
                  </View>
                  <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>{level.desc}</ThemedText>
                </Pressable>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Activity Level</ThemedText>
              {ACTIVITY_LEVELS.map(level => (
                <Pressable
                  key={level.id}
                  style={[styles.optionCard, { backgroundColor: theme.backgroundDefault, borderColor: activityLevel === level.id ? theme.primary : theme.border }]}
                  onPress={() => setActivityLevel(level.id)}
                >
                  <View style={styles.optionHeader}>
                    <ThemedText style={styles.optionLabel}>{level.label}</ThemedText>
                    {activityLevel === level.id ? <Feather name="check-circle" size={20} color={theme.primary} /> : null}
                  </View>
                  <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>{level.desc}</ThemedText>
                </Pressable>
              ))}
            </View>

            {tdee > 0 ? (
              <Card style={styles.tdeeCard}>
                <View style={styles.tdeeRow}>
                  <ThemedText style={[styles.tdeeLabel, { color: theme.textSecondary }]}>Estimated TDEE</ThemedText>
                  <ThemedText style={styles.tdeeValue}>{tdee} cal</ThemedText>
                </View>
                <View style={styles.tdeeRow}>
                  <ThemedText style={[styles.tdeeLabel, { color: theme.textSecondary }]}>Daily Target</ThemedText>
                  <ThemedText style={[styles.tdeeValue, { color: theme.primary }]}>{targetCalories} cal</ThemedText>
                </View>
                <View style={styles.tdeeRow}>
                  <ThemedText style={[styles.tdeeLabel, { color: theme.textSecondary }]}>Approach</ThemedText>
                  <ThemedText style={styles.tdeeValue}>{DEFICIT_LEVELS.find(d => d.id === deficitLevel)?.label}</ThemedText>
                </View>
                {targetCalories < 1200 ? (
                  <ThemedText style={[styles.warningText, { color: theme.warning }]}>
                    Target is below 1200 cal. Consider a less aggressive approach.
                  </ThemedText>
                ) : null}
              </Card>
            ) : null}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Macro Targets</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>Set your daily protein, carbs, and fat goals</ThemedText>

            <Card style={styles.tdeeCard}>
              <View style={styles.tdeeRow}>
                <ThemedText style={[styles.tdeeLabel, { color: theme.textSecondary }]}>Daily Calories</ThemedText>
                <ThemedText style={[styles.tdeeValue, { color: theme.primary }]}>{targetCalories} cal</ThemedText>
              </View>
            </Card>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Macro Style</ThemedText>
              {MACRO_PRESETS.map(preset => (
                <Pressable
                  key={preset.id}
                  style={[styles.optionCard, { backgroundColor: theme.backgroundDefault, borderColor: macroPreset === preset.id ? theme.primary : theme.border }]}
                  onPress={() => setMacroPreset(preset.id)}
                >
                  <View style={styles.optionHeader}>
                    <ThemedText style={styles.optionLabel}>{preset.label}</ThemedText>
                    {macroPreset === preset.id ? <Feather name="check-circle" size={20} color={theme.primary} /> : null}
                  </View>
                  <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>{preset.desc}</ThemedText>
                </Pressable>
              ))}
            </View>

            {macros.protein > 0 ? (
              <Card style={styles.macroCard}>
                <ThemedText style={[styles.macroTitle, { color: theme.text }]}>Your Daily Targets</ThemedText>
                <View style={styles.macroGrid}>
                  <View style={styles.macroItem}>
                    <ThemedText style={[styles.macroValue, { color: theme.primary }]}>{macros.protein}g</ThemedText>
                    <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Protein</ThemedText>
                  </View>
                  <View style={styles.macroItem}>
                    <ThemedText style={[styles.macroValue, { color: theme.success }]}>{macros.carbs}g</ThemedText>
                    <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Carbs</ThemedText>
                  </View>
                  <View style={styles.macroItem}>
                    <ThemedText style={[styles.macroValue, { color: theme.warning }]}>{macros.fat}g</ThemedText>
                    <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Fat</ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.macroCalc, { color: theme.textSecondary }]}>
                  = {macros.protein * 4 + macros.carbs * 4 + macros.fat * 9} cal
                </ThemedText>
              </Card>
            ) : null}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Workout Plan</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>How do you like to train?</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Workouts per week</ThemedText>
              <View style={styles.numberRow}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(num => (
                  <Pressable
                    key={num}
                    style={[styles.numberBtn, { backgroundColor: workoutsPerWeek === num ? theme.primary : theme.backgroundDefault }]}
                    onPress={() => setWorkoutsPerWeek(num)}
                  >
                    <ThemedText style={{ color: workoutsPerWeek === num ? "#FFF" : theme.text }}>{num}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Do you run?</ThemedText>
              <View style={styles.segmentedControl}>
                <Pressable
                  style={[styles.segment, { backgroundColor: doesRun ? theme.primary : theme.backgroundDefault }]}
                  onPress={() => setDoesRun(true)}
                >
                  <ThemedText style={{ color: doesRun ? "#FFF" : theme.text }}>Yes</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.segment, { backgroundColor: !doesRun ? theme.primary : theme.backgroundDefault }]}
                  onPress={() => { setDoesRun(false); setRunningDaysPerWeek(0); }}
                >
                  <ThemedText style={{ color: !doesRun ? "#FFF" : theme.text }}>No</ThemedText>
                </Pressable>
              </View>
            </View>

            {doesRun ? (
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Running days per week</ThemedText>
                <View style={styles.numberRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <Pressable
                      key={num}
                      style={[styles.numberBtn, { backgroundColor: runningDaysPerWeek === num ? theme.primary : theme.backgroundDefault }]}
                      onPress={() => setRunningDaysPerWeek(num)}
                    >
                      <ThemedText style={{ color: runningDaysPerWeek === num ? "#FFF" : theme.text }}>{num}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Preferred split</ThemedText>
              <View style={styles.splitGrid}>
                {SPLIT_OPTIONS.map(split => (
                  <Pressable
                    key={split.id}
                    style={[styles.splitBtn, { backgroundColor: preferredSplit === split.id ? theme.primary : theme.backgroundDefault, borderColor: theme.border }]}
                    onPress={() => setPreferredSplit(split.id)}
                  >
                    <ThemedText style={{ color: preferredSplit === split.id ? "#FFF" : theme.text, fontSize: 13 }}>{split.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Daily Step Goal</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>How many steps per day do you want to aim for?</ThemedText>

            {STEP_GOALS.map(goal => (
              <Pressable
                key={goal.value}
                style={[styles.optionCard, { backgroundColor: theme.backgroundDefault, borderColor: !useCustomSteps && stepGoal === goal.value ? theme.primary : theme.border }]}
                onPress={() => { setStepGoal(goal.value); setUseCustomSteps(false); }}
              >
                <View style={styles.optionHeader}>
                  <ThemedText style={styles.optionLabel}>{goal.label} steps</ThemedText>
                  {!useCustomSteps && stepGoal === goal.value ? <Feather name="check-circle" size={20} color={theme.primary} /> : null}
                </View>
              </Pressable>
            ))}

            <Pressable
              style={[styles.optionCard, { backgroundColor: theme.backgroundDefault, borderColor: useCustomSteps ? theme.primary : theme.border }]}
              onPress={() => setUseCustomSteps(true)}
            >
              <View style={styles.optionHeader}>
                <ThemedText style={styles.optionLabel}>Custom</ThemedText>
                {useCustomSteps ? <Feather name="check-circle" size={20} color={theme.primary} /> : null}
              </View>
              {useCustomSteps ? (
                <TextInput
                  style={[styles.input, { marginTop: Spacing.sm, backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter steps"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  value={customStepGoal}
                  onChangeText={setCustomStepGoal}
                  autoFocus
                />
              ) : null}
            </Pressable>

            <ThemedText style={[styles.helperText, { color: theme.textSecondary }]}>
              This helps track daily movement consistency
            </ThemedText>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Fasting Setup</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>Optional intermittent fasting schedule</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Fasting Type</ThemedText>
              <View style={styles.fastingGrid}>
                {FASTING_TYPES.map(type => (
                  <Pressable
                    key={type.id}
                    style={[styles.fastingBtn, { backgroundColor: fastingType === type.id ? theme.primary : theme.backgroundDefault, borderColor: theme.border }]}
                    onPress={() => setFastingType(type.id)}
                  >
                    <ThemedText style={[styles.fastingLabel, { color: fastingType === type.id ? "#FFF" : theme.text }]}>{type.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {fastingType !== "none" ? (
              <>
                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Typical Lunch Time</ThemedText>
                  <View style={styles.timeRow}>
                    {["11:00", "12:00", "13:00", "14:00"].map(time => (
                      <Pressable
                        key={time}
                        style={[styles.timeBtn, { backgroundColor: lunchTime === time ? theme.primary : theme.backgroundDefault }]}
                        onPress={() => setLunchTime(time)}
                      >
                        <ThemedText style={{ color: lunchTime === time ? "#FFF" : theme.text, fontSize: 13 }}>
                          {parseInt(time) > 12 ? `${parseInt(time) - 12}PM` : `${parseInt(time)}${parseInt(time) === 12 ? "PM" : "AM"}`}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {eatingWindow ? (
                  <Card style={styles.windowCard}>
                    <ThemedText style={[styles.windowLabel, { color: theme.textSecondary }]}>Your Eating Window</ThemedText>
                    <ThemedText style={styles.windowValue}>{eatingWindow.display}</ThemedText>
                  </Card>
                ) : null}
              </>
            ) : null}
          </View>
        );

      case 8:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Reminder Style</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>How strict should reminders be?</ThemedText>

            {REMINDER_INTENSITIES.map(intensity => (
              <Pressable
                key={intensity.id}
                style={[styles.optionCard, { backgroundColor: theme.backgroundDefault, borderColor: reminderIntensity === intensity.id ? theme.primary : theme.border }]}
                onPress={() => setReminderIntensity(intensity.id)}
              >
                <View style={styles.optionHeader}>
                  <ThemedText style={styles.optionLabel}>{intensity.label}</ThemedText>
                  {reminderIntensity === intensity.id ? <Feather name="check-circle" size={20} color={theme.primary} /> : null}
                </View>
                <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>{intensity.desc}</ThemedText>
              </Pressable>
            ))}
          </View>
        );

      case 9:
        return (
          <View style={styles.stepContent}>
            <ThemedText style={styles.stepTitle}>Baseline Photo</ThemedText>
            <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>Take a starting photo to track your progress (optional)</ThemedText>

            <Pressable style={[styles.photoButton, { borderColor: theme.border }]} onPress={handleTakePhoto}>
              {baselinePhoto ? (
                <Image source={{ uri: baselinePhoto }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Feather name="camera" size={32} color={theme.textSecondary} />
                  <ThemedText style={[styles.photoText, { color: theme.textSecondary }]}>Tap to take photo</ThemedText>
                </View>
              )}
            </Pressable>

            <ThemedText style={[styles.helperText, { color: theme.textSecondary }]}>
              You can skip this and add it later
            </ThemedText>
          </View>
        );

      case 10:
        return (
          <View style={styles.stepContent}>
            <View style={styles.summaryHeader}>
              <Feather name="check-circle" size={48} color={theme.success} />
              <ThemedText style={styles.summaryTitle}>Your Plan</ThemedText>
              <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
                Challenge begins {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </ThemedText>
            </View>

            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Current Weight</ThemedText>
                <ThemedText style={styles.summaryValue}>{currentWeight} {weightUnit}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Goal Weight</ThemedText>
                <ThemedText style={styles.summaryValue}>{goalWeight} {weightUnit}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Daily Calories</ThemedText>
                <ThemedText style={[styles.summaryValue, { color: theme.primary }]}>{targetCalories} cal</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Macros</ThemedText>
                <ThemedText style={styles.summaryValue}>P:{macros.protein}g C:{macros.carbs}g F:{macros.fat}g</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Weekly Pace</ThemedText>
                <ThemedText style={styles.summaryValue}>{DEFICIT_LEVELS.find(d => d.id === deficitLevel)?.lossPerWeek} {weightUnit}/week</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Workouts/Week</ThemedText>
                <ThemedText style={styles.summaryValue}>{workoutsPerWeek} ({SPLIT_OPTIONS.find(s => s.id === preferredSplit)?.label})</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Step Goal</ThemedText>
                <ThemedText style={styles.summaryValue}>{finalStepGoal.toLocaleString()}/day</ThemedText>
              </View>
              {fastingType !== "none" && eatingWindow ? (
                <View style={styles.summaryRow}>
                  <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Fasting</ThemedText>
                  <ThemedText style={styles.summaryValue}>{fastingType.replace("_", ":")} ({eatingWindow.display})</ThemedText>
                </View>
              ) : null}
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Reminders</ThemedText>
                <ThemedText style={styles.summaryValue}>{REMINDER_INTENSITIES.find(r => r.id === reminderIntensity)?.label}</ThemedText>
              </View>
            </Card>

            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <ThemedText style={[styles.stepIndicator, { color: theme.textSecondary }]}>Step {step} of {TOTAL_STEPS}</ThemedText>
        {renderProgressBar()}
      </View>

      {renderStep()}

      <View style={[styles.buttonRow, step === 1 ? styles.buttonRowCentered : null]}>
        {step > 1 ? (
          <Pressable style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Feather name="chevron-left" size={20} color={theme.primary} />
            <ThemedText style={{ color: theme.primary }}>Back</ThemedText>
          </Pressable>
        ) : null}
        {step < TOTAL_STEPS ? (
          <Button onPress={() => setStep(step + 1)} disabled={!canContinue()} style={step === 1 ? styles.fullWidthButton : styles.nextButton}>
            Continue
          </Button>
        ) : (
          <Button onPress={handleComplete} disabled={isLoading} style={styles.nextButton}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : "Finish Setup"}
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
  inputGroup: {
    gap: Spacing.sm,
  },
  inputLabel: {
    ...Typography.subheadline,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  unitToggle: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  unitBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  segmentedControl: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  segment: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  optionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionLabel: {
    ...Typography.headline,
  },
  optionDesc: {
    ...Typography.footnote,
    marginTop: Spacing.xs,
  },
  infoCard: {
    padding: Spacing.md,
    alignItems: "center",
  },
  infoText: {
    ...Typography.footnote,
  },
  tdeeCard: {
    padding: Spacing.lg,
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
  warningText: {
    ...Typography.footnote,
    marginTop: Spacing.sm,
  },
  numberRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  numberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  splitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  splitBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  fastingGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  fastingBtn: {
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
  timeBtn: {
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
  helperText: {
    ...Typography.footnote,
    textAlign: "center",
  },
  photoButton: {
    height: 200,
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
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    ...Typography.footnote,
  },
  macroCard: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  macroTitle: {
    ...Typography.headline,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  macroGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  macroItem: {
    alignItems: "center",
  },
  macroValue: {
    ...Typography.title2,
    fontWeight: "700",
  },
  macroLabel: {
    ...Typography.footnote,
    marginTop: Spacing.xs,
  },
  macroCalc: {
    ...Typography.footnote,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  loginLinkText: {
    ...Typography.body,
  },
  buttonRowCentered: {
    justifyContent: "center",
  },
  fullWidthButton: {
    width: "100%",
  },
});
