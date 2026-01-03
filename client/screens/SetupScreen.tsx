import React, { useState } from "react";
import { View, StyleSheet, TextInput, Image, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useCreateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { hashPassword, setSessionUnlocked } from "@/lib/auth";

const TOTAL_STEPS = 5;

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const createProfile = useCreateProfile();
  const { refreshAuth } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightUnit, setHeightUnit] = useState<"ft" | "cm">("ft");
  const [currentWeight, setCurrentWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getHeightValue = (): number => {
    if (heightUnit === "ft") {
      const feet = parseFloat(heightFeet) || 0;
      const inches = parseFloat(heightInches) || 0;
      return feet * 12 + inches;
    }
    return parseFloat(heightCm) || 0;
  };

  const isStep1Valid = name.trim().length > 0;
  const isStep2Valid = heightUnit === "ft" 
    ? (heightFeet || heightInches) 
    : heightCm;
  const isStep3Valid = currentWeight.trim().length > 0;
  const isStep4Valid = age.trim().length > 0 && sex !== "";
  const isStep5Valid = password.length >= 4 && password === confirmPassword;

  const handleComplete = async () => {
    if (password !== confirmPassword) {
      setError("PINs don't match");
      return;
    }
    if (password.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const passwordHash = await hashPassword(password);
      const heightValue = getHeightValue();

      await createProfile.mutateAsync({
        name: name.trim(),
        heightValue,
        heightUnit,
        weightUnit,
        currentWeight: parseFloat(currentWeight),
        age: parseInt(age),
        sex,
        passwordHash,
        requirePasswordOnOpen: true,
        autoLockMinutes: 5,
        onboardingComplete: false,
      });

      await setSessionUnlocked(true);
      refreshAuth();
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[styles.progressDot, { backgroundColor: i < step ? theme.primary : theme.backgroundTertiary }]}
        />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>What should we call you?</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
            />
            <Button onPress={() => setStep(2)} disabled={!isStep1Valid} style={styles.nextButton}>
              Continue
            </Button>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>What's your height?</ThemedText>
            <View style={styles.unitToggle}>
              <Pressable
                style={[styles.unitButton, { backgroundColor: heightUnit === "ft" ? theme.primary : theme.backgroundDefault }]}
                onPress={() => setHeightUnit("ft")}
              >
                <ThemedText style={{ color: heightUnit === "ft" ? "#FFF" : theme.text }}>ft/in</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.unitButton, { backgroundColor: heightUnit === "cm" ? theme.primary : theme.backgroundDefault }]}
                onPress={() => setHeightUnit("cm")}
              >
                <ThemedText style={{ color: heightUnit === "cm" ? "#FFF" : theme.text }}>cm</ThemedText>
              </Pressable>
            </View>
            {heightUnit === "ft" ? (
              <View style={styles.heightRow}>
                <TextInput
                  style={[styles.input, styles.heightInput, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="Feet"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                />
                <TextInput
                  style={[styles.input, styles.heightInput, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
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
            <View style={styles.buttonRow}>
              <Pressable style={styles.backButton} onPress={() => setStep(1)}>
                <ThemedText style={{ color: theme.primary }}>Back</ThemedText>
              </Pressable>
              <Button onPress={() => setStep(3)} disabled={!isStep2Valid} style={styles.flexButton}>
                Continue
              </Button>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>Current weight?</ThemedText>
            <View style={styles.unitToggle}>
              <Pressable
                style={[styles.unitButton, { backgroundColor: weightUnit === "lbs" ? theme.primary : theme.backgroundDefault }]}
                onPress={() => setWeightUnit("lbs")}
              >
                <ThemedText style={{ color: weightUnit === "lbs" ? "#FFF" : theme.text }}>lbs</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.unitButton, { backgroundColor: weightUnit === "kg" ? theme.primary : theme.backgroundDefault }]}
                onPress={() => setWeightUnit("kg")}
              >
                <ThemedText style={{ color: weightUnit === "kg" ? "#FFF" : theme.text }}>kg</ThemedText>
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder={`Weight in ${weightUnit}`}
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={currentWeight}
              onChangeText={setCurrentWeight}
            />
            <View style={styles.buttonRow}>
              <Pressable style={styles.backButton} onPress={() => setStep(2)}>
                <ThemedText style={{ color: theme.primary }}>Back</ThemedText>
              </Pressable>
              <Button onPress={() => setStep(4)} disabled={!isStep3Valid} style={styles.flexButton}>
                Continue
              </Button>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>A bit more about you</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              This helps us calculate your calorie target
            </ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Age</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="Your age"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Sex</ThemedText>
              <View style={styles.sexToggle}>
                <Pressable
                  style={[styles.sexButton, { backgroundColor: sex === "male" ? theme.primary : theme.backgroundDefault, borderColor: theme.border }]}
                  onPress={() => setSex("male")}
                >
                  <ThemedText style={{ color: sex === "male" ? "#FFF" : theme.text }}>Male</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.sexButton, { backgroundColor: sex === "female" ? theme.primary : theme.backgroundDefault, borderColor: theme.border }]}
                  onPress={() => setSex("female")}
                >
                  <ThemedText style={{ color: sex === "female" ? "#FFF" : theme.text }}>Female</ThemedText>
                </Pressable>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <Pressable style={styles.backButton} onPress={() => setStep(3)}>
                <ThemedText style={{ color: theme.primary }}>Back</ThemedText>
              </Pressable>
              <Button onPress={() => setStep(5)} disabled={!isStep4Valid} style={styles.flexButton}>
                Continue
              </Button>
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>Create a PIN</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              You'll need this to unlock the app
            </ThemedText>
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
            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
            <View style={styles.buttonRow}>
              <Pressable style={styles.backButton} onPress={() => setStep(4)}>
                <ThemedText style={{ color: theme.primary }}>Back</ThemedText>
              </Pressable>
              <Button onPress={handleComplete} disabled={!isStep5Valid || isLoading} style={styles.flexButton}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : "Create Account"}
              </Button>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl }]}
    >
      <Image source={require("../../assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
      <ThemedText style={styles.title}>Welcome</ThemedText>
      <ThemedText style={[styles.subtitleTop, { color: theme.textSecondary }]}>
        Let's create your account
      </ThemedText>
      {renderProgressDots()}
      {renderStep()}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.largeTitle,
    marginBottom: Spacing.xs,
  },
  subtitleTop: {
    ...Typography.body,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  progressContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    width: "100%",
    gap: Spacing.lg,
  },
  stepTitle: {
    ...Typography.title3,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  inputLabel: {
    ...Typography.subheadline,
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
  },
  unitToggle: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  unitButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  sexToggle: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  sexButton: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heightRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  heightInput: {
    flex: 1,
  },
  nextButton: {
    marginTop: Spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    ...Typography.footnote,
  },
});
