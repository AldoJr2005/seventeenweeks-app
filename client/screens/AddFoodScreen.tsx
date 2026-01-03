import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Card } from "@/components/Card";
import { useChallenge } from "@/hooks/useChallenge";
import { useFoodEntries, useCreateFoodEntry, useUpdateFoodEntry, useDeleteFoodEntry } from "@/hooks/useFoodEntries";
import type { LogStackParamList } from "@/navigation/LogStackNavigator";
import type { MealType, FoodEntry } from "@shared/schema";

type RouteParams = RouteProp<LogStackParamList, "AddFood">;

export default function AddFoodScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();

  const { date, mealType, editId } = route.params;
  const { data: challenge } = useChallenge();
  const { data: foodEntries, isLoading: isLoadingEntries } = useFoodEntries(challenge?.id, date);
  const createFoodEntry = useCreateFoodEntry();
  const updateFoodEntry = useUpdateFoodEntry();
  const deleteFoodEntry = useDeleteFoodEntry();

  const [foodName, setFoodName] = useState("");
  const [brand, setBrand] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingLabel, setServingLabel] = useState("");
  const [servingsCount, setServingsCount] = useState("1");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(!editId);

  const existingEntry = editId && foodEntries?.find((e: FoodEntry) => e.id === editId);

  useEffect(() => {
    if (existingEntry && !isInitialized) {
      const entry = existingEntry as FoodEntry;
      setFoodName(entry.foodName);
      setBrand(entry.brand || "");
      setCalories(entry.caloriesPerServing.toString());
      setProtein(entry.proteinPerServing?.toString() || "");
      setCarbs(entry.carbsPerServing?.toString() || "");
      setFat(entry.fatPerServing?.toString() || "");
      setServingLabel(entry.servingLabel || "");
      setServingsCount(entry.servingsCount.toString());
      setIsInitialized(true);
    }
  }, [existingEntry, isInitialized]);

  const servingsNum = parseFloat(servingsCount) || 1;
  const totalCalories = Math.round((parseFloat(calories) || 0) * servingsNum);
  const totalProtein = Math.round((parseFloat(protein) || 0) * servingsNum);
  const totalCarbs = Math.round((parseFloat(carbs) || 0) * servingsNum);
  const totalFat = Math.round((parseFloat(fat) || 0) * servingsNum);

  const handleSave = async () => {
    if (!challenge || !foodName || !calories) return;

    const data = {
      challengeId: challenge.id,
      date,
      mealType,
      foodName,
      brand: brand || null,
      caloriesPerServing: parseInt(calories),
      proteinPerServing: protein ? parseFloat(protein) : 0,
      carbsPerServing: carbs ? parseFloat(carbs) : 0,
      fatPerServing: fat ? parseFloat(fat) : 0,
      servingLabel: servingLabel || null,
      servingsCount: servingsNum,
    };

    try {
      if (editId) {
        await updateFoodEntry.mutateAsync({ id: editId, data });
      } else {
        await createFoodEntry.mutateAsync(data);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowConfirmation(true);
      setTimeout(() => navigation.goBack(), 800);
    } catch (error) {
      Alert.alert("Error", "Failed to save food entry");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Food",
      "Are you sure you want to delete this food entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (editId) {
              await deleteFoodEntry.mutateAsync(editId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleScanBarcode = () => {
    (navigation as any).navigate("BarcodeScanner", { date, mealType });
  };

  const isSaving = createFoodEntry.isPending || updateFoodEntry.isPending;
  const isValid = foodName && calories;
  const isLoadingEdit = editId && !isInitialized && isLoadingEntries;

  if (isLoadingEdit) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.backgroundRoot, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
          Loading food entry...
        </ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
      ]}
    >
      <View style={styles.mealHeader}>
        <Feather 
          name={mealType === "Breakfast" ? "sunrise" : mealType === "Lunch" ? "sun" : mealType === "Dinner" ? "moon" : "coffee"} 
          size={20} 
          color={theme.primary} 
        />
        <ThemedText style={[styles.mealLabel, { color: theme.primary }]}>
          {mealType}
        </ThemedText>
      </View>

      <Pressable
        style={[styles.scanButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        onPress={handleScanBarcode}
      >
        <Feather name="camera" size={24} color={theme.primary} />
        <ThemedText style={{ color: theme.primary }}>Scan Barcode</ThemedText>
      </Pressable>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
          Food Name *
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
          placeholder="e.g., Chicken Breast"
          placeholderTextColor={theme.textSecondary}
          value={foodName}
          onChangeText={setFoodName}
          autoFocus={!editId}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
          Brand (optional)
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
          placeholder="e.g., Tyson"
          placeholderTextColor={theme.textSecondary}
          value={brand}
          onChangeText={setBrand}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroupHalf}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Serving Size
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="e.g., 1 cup"
            placeholderTextColor={theme.textSecondary}
            value={servingLabel}
            onChangeText={setServingLabel}
          />
        </View>
        <View style={styles.inputGroupHalf}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Servings
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="1"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={servingsCount}
            onChangeText={setServingsCount}
          />
        </View>
      </View>

      <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
        Nutrition per Serving
      </ThemedText>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
          Calories *
        </ThemedText>
        <TextInput
          style={[styles.input, styles.largeInput, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={calories}
          onChangeText={setCalories}
        />
      </View>

      <View style={styles.macrosRow}>
        <View style={styles.macroInput}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Protein (g)
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={protein}
            onChangeText={setProtein}
          />
        </View>
        <View style={styles.macroInput}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Carbs (g)
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={carbs}
            onChangeText={setCarbs}
          />
        </View>
        <View style={styles.macroInput}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Fat (g)
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={fat}
            onChangeText={setFat}
          />
        </View>
      </View>

      {servingsNum > 1 ? (
        <Card style={styles.totalsCard}>
          <ThemedText style={[styles.totalsTitle, { color: theme.textSecondary }]}>
            Total for {servingsNum} servings
          </ThemedText>
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <ThemedText style={styles.totalValue}>{totalCalories}</ThemedText>
              <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>cal</ThemedText>
            </View>
            <View style={styles.totalItem}>
              <ThemedText style={styles.totalValue}>{totalProtein}g</ThemedText>
              <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>protein</ThemedText>
            </View>
            <View style={styles.totalItem}>
              <ThemedText style={styles.totalValue}>{totalCarbs}g</ThemedText>
              <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>carbs</ThemedText>
            </View>
            <View style={styles.totalItem}>
              <ThemedText style={styles.totalValue}>{totalFat}g</ThemedText>
              <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>fat</ThemedText>
            </View>
          </View>
        </Card>
      ) : null}

      {showConfirmation ? (
        <View style={[styles.confirmationContainer, { backgroundColor: theme.success + "15" }]}>
          <Feather name="check-circle" size={24} color={theme.success} />
          <ThemedText style={[styles.confirmationText, { color: theme.success }]}>
            Food saved!
          </ThemedText>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          {editId ? (
            <Pressable
              style={[styles.deleteButton, { borderColor: theme.warning }]}
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={20} color={theme.warning} />
            </Pressable>
          ) : null}
          <Button
            onPress={handleSave}
            disabled={!isValid || isSaving}
            style={styles.saveButton}
          >
            {isSaving ? "Saving..." : editId ? "Update" : "Add Food"}
          </Button>
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  mealLabel: {
    ...Typography.headline,
    fontWeight: "600",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputLabel: {
    ...Typography.subheadline,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  largeInput: {
    height: 64,
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  macrosRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  macroInput: {
    flex: 1,
  },
  totalsCard: {
    marginBottom: Spacing.xl,
  },
  totalsTitle: {
    ...Typography.footnote,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  totalItem: {
    alignItems: "center",
  },
  totalValue: {
    ...Typography.headline,
    fontWeight: "700",
  },
  totalLabel: {
    ...Typography.caption,
  },
  confirmationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: "auto",
  },
  confirmationText: {
    ...Typography.headline,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: "auto",
    paddingTop: Spacing.xl,
  },
  deleteButton: {
    width: 48,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
  },
});
