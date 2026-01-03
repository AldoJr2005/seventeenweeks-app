import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

interface WeeklyReflectionData {
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

interface WeeklyReflectionProps {
  weekNumber: number;
  challengeId: string;
  existingReflection?: WeeklyReflectionData;
  onSave: (data: WeeklyReflectionData) => void;
  isLoading?: boolean;
}

const REFLECTION_PROMPTS = [
  { key: "wentWell", label: "What went well this week?", icon: "thumbs-up", placeholder: "Describe your wins, no matter how small..." },
  { key: "wasHard", label: "What challenges did you face?", icon: "alert-circle", placeholder: "What obstacles did you encounter..." },
  { key: "learned", label: "What did you learn?", icon: "book-open", placeholder: "Any insights or realizations..." },
  { key: "nextWeekFocus", label: "What will you focus on next week?", icon: "target", placeholder: "Your main priority for the coming week..." },
];

const MOOD_ICONS: { rating: number; icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { rating: 1, icon: "frown", label: "Struggling" },
  { rating: 2, icon: "meh", label: "Tough" },
  { rating: 3, icon: "minus", label: "Okay" },
  { rating: 4, icon: "smile", label: "Good" },
  { rating: 5, icon: "award", label: "Great" },
];

export function WeeklyReflection({
  weekNumber,
  challengeId,
  existingReflection,
  onSave,
  isLoading,
}: WeeklyReflectionProps) {
  const { theme } = useTheme();
  
  const [wentWell, setWentWell] = useState(existingReflection?.wentWell || "");
  const [wasHard, setWasHard] = useState(existingReflection?.wasHard || "");
  const [learned, setLearned] = useState(existingReflection?.learned || "");
  const [nextWeekFocus, setNextWeekFocus] = useState(existingReflection?.nextWeekFocus || "");
  const [moodRating, setMoodRating] = useState(existingReflection?.moodRating || 3);
  const [energyRating, setEnergyRating] = useState(existingReflection?.energyRating || 3);
  const [overallRating, setOverallRating] = useState(existingReflection?.overallRating || 3);

  useEffect(() => {
    if (existingReflection) {
      setWentWell(existingReflection.wentWell || "");
      setWasHard(existingReflection.wasHard || "");
      setLearned(existingReflection.learned || "");
      setNextWeekFocus(existingReflection.nextWeekFocus || "");
      setMoodRating(existingReflection.moodRating || 3);
      setEnergyRating(existingReflection.energyRating || 3);
      setOverallRating(existingReflection.overallRating || 3);
    }
  }, [existingReflection]);

  const handleSave = () => {
    onSave({
      weekNumber,
      challengeId,
      wentWell,
      wasHard,
      learned,
      nextWeekFocus,
      moodRating,
      energyRating,
      overallRating,
    });
  };

  const renderRatingSelector = (
    label: string,
    value: number,
    onChange: (rating: number) => void,
    icon: string
  ) => (
    <View style={styles.ratingSection}>
      <View style={styles.ratingHeader}>
        <Feather name={icon as any} size={16} color={theme.textSecondary} />
        <ThemedText style={[styles.ratingLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
      </View>
      <View style={styles.ratingRow}>
        {MOOD_ICONS.map((mood) => (
          <Pressable
            key={mood.rating}
            style={[
              styles.ratingButton,
              { borderColor: theme.border },
              value === mood.rating && { 
                borderColor: theme.link, 
                backgroundColor: theme.link + "10" 
              },
            ]}
            onPress={() => onChange(mood.rating)}
          >
            <Feather 
              name={mood.icon} 
              size={24} 
              color={value === mood.rating ? theme.link : theme.textSecondary} 
            />
          </Pressable>
        ))}
      </View>
      <ThemedText style={[styles.ratingSelected, { color: theme.link }]}>
        {MOOD_ICONS.find(m => m.rating === value)?.label}
      </ThemedText>
    </View>
  );

  const getFieldValue = (key: string) => {
    switch (key) {
      case "wentWell": return wentWell;
      case "wasHard": return wasHard;
      case "learned": return learned;
      case "nextWeekFocus": return nextWeekFocus;
      default: return "";
    }
  };

  const setFieldValue = (key: string, value: string) => {
    switch (key) {
      case "wentWell": setWentWell(value); break;
      case "wasHard": setWasHard(value); break;
      case "learned": setLearned(value); break;
      case "nextWeekFocus": setNextWeekFocus(value); break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Week {weekNumber} Reflection</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Take a moment to reflect on your progress
        </ThemedText>
      </View>

      <Card style={styles.card}>
        <ThemedText style={styles.sectionTitle}>How are you feeling?</ThemedText>
        
        {renderRatingSelector("Overall Mood", moodRating, setMoodRating, "smile")}
        {renderRatingSelector("Energy Level", energyRating, setEnergyRating, "zap")}
        {renderRatingSelector("Week Rating", overallRating, setOverallRating, "star")}
      </Card>

      {REFLECTION_PROMPTS.map((prompt) => (
        <Card key={prompt.key} style={styles.card}>
          <View style={styles.promptHeader}>
            <Feather name={prompt.icon as any} size={20} color={theme.link} />
            <ThemedText style={styles.promptLabel}>{prompt.label}</ThemedText>
          </View>
          <TextInput
            style={[
              styles.textInput,
              { 
                backgroundColor: theme.backgroundDefault, 
                borderColor: theme.border, 
                color: theme.text 
              },
            ]}
            value={getFieldValue(prompt.key)}
            onChangeText={(value) => setFieldValue(prompt.key, value)}
            placeholder={prompt.placeholder}
            placeholderTextColor={theme.neutral}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>
      ))}

      <Button onPress={handleSave} style={styles.saveButton} disabled={isLoading}>
        {isLoading ? "Saving..." : existingReflection ? "Update Reflection" : "Save Reflection"}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.title2,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  card: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.lg,
  },
  ratingSection: {
    marginBottom: Spacing.lg,
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ratingLabel: {
    ...Typography.footnote,
  },
  ratingRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  ratingButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingSelected: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontWeight: "600",
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  promptLabel: {
    ...Typography.headline,
  },
  textInput: {
    minHeight: 100,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    ...Typography.body,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
});
