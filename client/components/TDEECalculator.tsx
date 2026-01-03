import React, { useState, useMemo } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

interface TDEEResult {
  bmr: number;
  tdee: number;
  mildDeficit: number;
  moderateDeficit: number;
  aggressiveDeficit: number;
}

interface TDEECalculatorProps {
  initialWeight?: number;
  initialHeight?: number;
  initialAge?: number;
  initialGender?: Gender;
  onCalorieGoalSet?: (calories: number) => void;
}

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; multiplier: number; description: string }[] = [
  { value: "sedentary", label: "Sedentary", multiplier: 1.2, description: "Little or no exercise" },
  { value: "light", label: "Light", multiplier: 1.375, description: "Exercise 1-3 days/week" },
  { value: "moderate", label: "Moderate", multiplier: 1.55, description: "Exercise 3-5 days/week" },
  { value: "active", label: "Active", multiplier: 1.725, description: "Exercise 6-7 days/week" },
  { value: "very_active", label: "Very Active", multiplier: 1.9, description: "Intense daily exercise" },
];

export function TDEECalculator({ 
  initialWeight, 
  initialHeight, 
  initialAge, 
  initialGender,
  onCalorieGoalSet 
}: TDEECalculatorProps) {
  const { theme } = useTheme();
  
  const [gender, setGender] = useState<Gender>(initialGender || "male");
  const [age, setAge] = useState(initialAge?.toString() || "");
  const [heightFeet, setHeightFeet] = useState(initialHeight ? Math.floor(initialHeight / 12).toString() : "");
  const [heightInches, setHeightInches] = useState(initialHeight ? (initialHeight % 12).toString() : "");
  const [weight, setWeight] = useState(initialWeight?.toString() || "");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [showResults, setShowResults] = useState(false);

  const calculateTDEE = useMemo((): TDEEResult | null => {
    const ageNum = parseInt(age);
    const heightNum = (parseInt(heightFeet || "0") * 12) + parseInt(heightInches || "0");
    const weightNum = parseFloat(weight);

    if (!ageNum || !heightNum || !weightNum) return null;

    const heightCm = heightNum * 2.54;
    const weightKg = weightNum * 0.453592;

    let bmr: number;
    if (gender === "male") {
      bmr = 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageNum);
    } else {
      bmr = 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageNum);
    }

    const multiplier = ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.multiplier || 1.55;
    const tdee = Math.round(bmr * multiplier);

    return {
      bmr: Math.round(bmr),
      tdee,
      mildDeficit: Math.round(tdee - 250),
      moderateDeficit: Math.round(tdee - 500),
      aggressiveDeficit: Math.round(tdee - 750),
    };
  }, [gender, age, heightFeet, heightInches, weight, activityLevel]);

  const handleCalculate = () => {
    if (calculateTDEE) {
      setShowResults(true);
    }
  };

  const handleSelectCalories = (calories: number) => {
    onCalorieGoalSet?.(calories);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Calculate Your Calories</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Find your daily calorie target based on your body and activity level
      </ThemedText>

      <Card style={styles.formCard}>
        <View style={styles.genderRow}>
          <Pressable
            style={[
              styles.genderButton,
              { borderColor: theme.border },
              gender === "male" && { backgroundColor: theme.link, borderColor: theme.link },
            ]}
            onPress={() => setGender("male")}
          >
            <Feather 
              name="user" 
              size={20} 
              color={gender === "male" ? "#FFFFFF" : theme.text} 
            />
            <ThemedText style={[styles.genderText, gender === "male" && { color: "#FFFFFF" }]}>
              Male
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.genderButton,
              { borderColor: theme.border },
              gender === "female" && { backgroundColor: theme.link, borderColor: theme.link },
            ]}
            onPress={() => setGender("female")}
          >
            <Feather 
              name="user" 
              size={20} 
              color={gender === "female" ? "#FFFFFF" : theme.text} 
            />
            <ThemedText style={[styles.genderText, gender === "female" && { color: "#FFFFFF" }]}>
              Female
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Age</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text }]}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="Years"
              placeholderTextColor={theme.neutral}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Height</ThemedText>
            <View style={styles.heightRow}>
              <TextInput
                style={[styles.input, styles.heightInput, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text }]}
                value={heightFeet}
                onChangeText={setHeightFeet}
                keyboardType="numeric"
                placeholder="Ft"
                placeholderTextColor={theme.neutral}
              />
              <TextInput
                style={[styles.input, styles.heightInput, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text }]}
                value={heightInches}
                onChangeText={setHeightInches}
                keyboardType="numeric"
                placeholder="In"
                placeholderTextColor={theme.neutral}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Current Weight (lbs)</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text }]}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="Enter weight"
            placeholderTextColor={theme.neutral}
          />
        </View>

        <View style={styles.activitySection}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Activity Level</ThemedText>
          {ACTIVITY_LEVELS.map((level) => (
            <Pressable
              key={level.value}
              style={[
                styles.activityOption,
                { borderColor: theme.border },
                activityLevel === level.value && { borderColor: theme.link, backgroundColor: theme.link + "10" },
              ]}
              onPress={() => setActivityLevel(level.value)}
            >
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityLabel}>{level.label}</ThemedText>
                <ThemedText style={[styles.activityDesc, { color: theme.textSecondary }]}>
                  {level.description}
                </ThemedText>
              </View>
              {activityLevel === level.value && (
                <Feather name="check-circle" size={20} color={theme.link} />
              )}
            </Pressable>
          ))}
        </View>

        <Button onPress={handleCalculate} style={styles.calculateButton}>Calculate</Button>
      </Card>

      {showResults && calculateTDEE && (
        <Card style={styles.resultsCard}>
          <ThemedText style={styles.resultsTitle}>Your Results</ThemedText>
          
          <View style={styles.resultRow}>
            <View>
              <ThemedText style={[styles.resultLabel, { color: theme.textSecondary }]}>
                Base Metabolic Rate
              </ThemedText>
              <ThemedText style={styles.resultValue}>{calculateTDEE.bmr} cal/day</ThemedText>
            </View>
          </View>

          <View style={[styles.resultRow, styles.highlightRow, { backgroundColor: theme.link + "15" }]}>
            <View>
              <ThemedText style={[styles.resultLabel, { color: theme.textSecondary }]}>
                Maintenance Calories (TDEE)
              </ThemedText>
              <ThemedText style={[styles.resultValue, { color: theme.link }]}>
                {calculateTDEE.tdee} cal/day
              </ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.deficitTitle, { marginTop: Spacing.lg }]}>
            Weight Loss Targets
          </ThemedText>
          
          <Pressable 
            style={[styles.deficitOption, { borderColor: theme.border }]}
            onPress={() => handleSelectCalories(calculateTDEE.mildDeficit)}
          >
            <View>
              <ThemedText style={styles.deficitLabel}>Mild (0.5 lb/week)</ThemedText>
              <ThemedText style={[styles.deficitDesc, { color: theme.textSecondary }]}>
                250 cal deficit
              </ThemedText>
            </View>
            <ThemedText style={styles.deficitValue}>{calculateTDEE.mildDeficit}</ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.deficitOption, { borderColor: theme.link, backgroundColor: theme.link + "10" }]}
            onPress={() => handleSelectCalories(calculateTDEE.moderateDeficit)}
          >
            <View>
              <ThemedText style={styles.deficitLabel}>Moderate (1 lb/week)</ThemedText>
              <ThemedText style={[styles.deficitDesc, { color: theme.textSecondary }]}>
                500 cal deficit - Recommended
              </ThemedText>
            </View>
            <ThemedText style={[styles.deficitValue, { color: theme.link }]}>
              {calculateTDEE.moderateDeficit}
            </ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.deficitOption, { borderColor: theme.border }]}
            onPress={() => handleSelectCalories(calculateTDEE.aggressiveDeficit)}
          >
            <View>
              <ThemedText style={styles.deficitLabel}>Aggressive (1.5 lb/week)</ThemedText>
              <ThemedText style={[styles.deficitDesc, { color: theme.textSecondary }]}>
                750 cal deficit
              </ThemedText>
            </View>
            <ThemedText style={styles.deficitValue}>{calculateTDEE.aggressiveDeficit}</ThemedText>
          </Pressable>

          <ThemedText style={[styles.disclaimer, { color: theme.neutral }]}>
            Tap a target to set it as your daily calorie goal
          </ThemedText>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  title: {
    ...Typography.title2,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  formCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  genderRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  genderText: {
    ...Typography.callout,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  inputGroup: {
    flex: 1,
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
  heightRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  heightInput: {
    flex: 1,
  },
  activitySection: {
    gap: Spacing.sm,
  },
  activityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    ...Typography.callout,
  },
  activityDesc: {
    ...Typography.footnote,
  },
  calculateButton: {
    marginTop: Spacing.sm,
  },
  resultsCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  resultsTitle: {
    ...Typography.headline,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  resultRow: {
    paddingVertical: Spacing.sm,
  },
  highlightRow: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  resultLabel: {
    ...Typography.footnote,
  },
  resultValue: {
    ...Typography.title3,
  },
  deficitTitle: {
    ...Typography.headline,
  },
  deficitOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  deficitLabel: {
    ...Typography.callout,
  },
  deficitDesc: {
    ...Typography.footnote,
  },
  deficitValue: {
    ...Typography.title3,
  },
  disclaimer: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
