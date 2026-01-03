import React, { useState, useRef, useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView, Dimensions, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { ProgressRing } from "@/components/ProgressRing";
import { useChallenge } from "@/hooks/useChallenge";
import { useFoodEntries, useDeleteFoodEntry } from "@/hooks/useFoodEntries";
import { getToday, formatLongDate, addDays } from "@/lib/date-utils";
import type { LogStackParamList } from "@/navigation/LogStackNavigator";
import type { Challenge, FoodEntry, MealType } from "@shared/schema";
import { MEAL_TYPES } from "@shared/schema";

type RouteParams = RouteProp<LogStackParamList, "NutritionLog">;
type NavigationProp = NativeStackNavigationProp<LogStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
const CARD_MARGIN = Spacing.md;

const MEAL_ICONS: Record<MealType, keyof typeof Feather.glyphMap> = {
  Breakfast: "sunrise",
  Lunch: "sun",
  Dinner: "moon",
  Snacks: "coffee",
};

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

const DASHBOARD_CARDS = ["Calories", "Macros", "Heart Healthy", "Low Carb"] as const;

export default function NutritionLogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const pagerRef = useRef<FlatList>(null);

  const date = route.params?.date || getToday();
  const { data: challenge } = useChallenge();
  const challengeData = challenge as Challenge | undefined;
  const { data: foodEntries } = useFoodEntries(challengeData?.id, date);
  const deleteFoodEntry = useDeleteFoodEntry();

  const [cardIndex, setCardIndex] = useState(0);

  const targetCalories = challengeData?.targetCalories || 2000;
  const targetProtein = challengeData?.targetProteinGrams || 150;
  const targetCarbs = challengeData?.targetCarbsGrams || 200;
  const targetFat = challengeData?.targetFatGrams || 65;
  const targetFiber = 25;
  const targetSugar = 50;
  const targetSodium = 2300;
  const targetCholesterol = 300;

  const totals = useMemo((): NutritionTotals => {
    if (!foodEntries) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 };
    return (foodEntries as FoodEntry[]).reduce((acc, entry) => ({
      calories: acc.calories + Math.round(entry.caloriesPerServing * entry.servingsCount),
      protein: acc.protein + Math.round((entry.proteinPerServing || 0) * entry.servingsCount),
      carbs: acc.carbs + Math.round((entry.carbsPerServing || 0) * entry.servingsCount),
      fat: acc.fat + Math.round((entry.fatPerServing || 0) * entry.servingsCount),
      fiber: acc.fiber + Math.round((entry.fiberPerServing || 0) * entry.servingsCount),
      sugar: acc.sugar + Math.round((entry.sugarPerServing || 0) * entry.servingsCount),
      sodium: acc.sodium + Math.round((entry.sodiumPerServing || 0) * entry.servingsCount),
      cholesterol: acc.cholesterol + Math.round((entry.cholesterolPerServing || 0) * entry.servingsCount),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 });
  }, [foodEntries]);

  const mealGroups = useMemo((): Partial<Record<MealType, FoodEntry[]>> => {
    if (!foodEntries) return {};
    return (foodEntries as FoodEntry[]).reduce((acc, entry) => {
      const meal = entry.mealType as MealType;
      if (!acc[meal]) acc[meal] = [];
      acc[meal]!.push(entry);
      return acc;
    }, {} as Partial<Record<MealType, FoodEntry[]>>);
  }, [foodEntries]);

  const getMealTotals = (entries: FoodEntry[] | undefined) => {
    if (!entries) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return entries.reduce((acc, entry) => ({
      calories: acc.calories + Math.round(entry.caloriesPerServing * entry.servingsCount),
      protein: acc.protein + Math.round((entry.proteinPerServing || 0) * entry.servingsCount),
      carbs: acc.carbs + Math.round((entry.carbsPerServing || 0) * entry.servingsCount),
      fat: acc.fat + Math.round((entry.fatPerServing || 0) * entry.servingsCount),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const remainingCalories = targetCalories - totals.calories;
  const netCarbs = Math.max(0, totals.carbs - totals.fiber);

  const handleAddFood = (mealType: MealType) => {
    navigation.navigate("AddFood", { date, mealType });
  };

  const handleEditFood = (entry: FoodEntry) => {
    navigation.navigate("AddFood", { date, mealType: entry.mealType as MealType, editId: entry.id });
  };

  const navigateDate = (offset: number) => {
    const newDate = addDays(date, offset);
    navigation.setParams({ date: newDate });
    Haptics.selectionAsync();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== cardIndex) {
        setCardIndex(newIndex);
        Haptics.selectionAsync();
      }
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderProgressBar = (label: string, value: number, target: number, color: string, unit: string = "g") => {
    const progress = Math.min(value / target, 1);
    const remaining = Math.max(0, target - value);
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarHeader}>
          <ThemedText style={styles.progressLabel}>{label}</ThemedText>
          <ThemedText style={[styles.progressValue, { color: theme.textSecondary }]}>
            {value}{unit} / {target}{unit}
          </ThemedText>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: theme.backgroundTertiary }]}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
        <ThemedText style={[styles.progressRemaining, { color: theme.textSecondary }]}>
          {remaining}{unit} remaining
        </ThemedText>
      </View>
    );
  };

  const renderDashboardCard = ({ item, index }: { item: typeof DASHBOARD_CARDS[number]; index: number }) => {
    switch (item) {
      case "Calories":
        return (
          <Card style={[styles.dashboardCard, { width: CARD_WIDTH }]}>
            <ThemedText style={styles.cardLabel}>Remaining</ThemedText>
            <ThemedText style={[styles.bigNumber, { color: remainingCalories >= 0 ? theme.success : theme.warning }]}>
              {remainingCalories}
            </ThemedText>
            <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]}>
              calories
            </ThemedText>
            
            <View style={styles.formulaRow}>
              <View style={styles.formulaItem}>
                <ThemedText style={[styles.formulaValue, { color: theme.textSecondary }]}>{targetCalories}</ThemedText>
                <ThemedText style={[styles.formulaLabel, { color: theme.textSecondary }]}>Goal</ThemedText>
              </View>
              <ThemedText style={[styles.formulaOperator, { color: theme.textSecondary }]}>-</ThemedText>
              <View style={styles.formulaItem}>
                <ThemedText style={[styles.formulaValue, { color: theme.textSecondary }]}>{totals.calories}</ThemedText>
                <ThemedText style={[styles.formulaLabel, { color: theme.textSecondary }]}>Food</ThemedText>
              </View>
              <ThemedText style={[styles.formulaOperator, { color: theme.textSecondary }]}>=</ThemedText>
              <View style={styles.formulaItem}>
                <ThemedText style={[styles.formulaValue, { color: remainingCalories >= 0 ? theme.success : theme.warning }]}>{remainingCalories}</ThemedText>
                <ThemedText style={[styles.formulaLabel, { color: theme.textSecondary }]}>Left</ThemedText>
              </View>
            </View>
          </Card>
        );

      case "Macros":
        return (
          <Card style={[styles.dashboardCard, { width: CARD_WIDTH }]}>
            <ThemedText style={styles.cardLabel}>Macros</ThemedText>
            <View style={styles.macrosRings}>
              <ProgressRing
                progress={totals.carbs / targetCarbs}
                color="#FF9500"
                size={70}
                strokeWidth={7}
                label="Carbs"
                value={`${totals.carbs}/${targetCarbs}`}
              />
              <ProgressRing
                progress={totals.fat / targetFat}
                color="#FF3B30"
                size={70}
                strokeWidth={7}
                label="Fat"
                value={`${totals.fat}/${targetFat}`}
              />
              <ProgressRing
                progress={totals.protein / targetProtein}
                color="#34C759"
                size={70}
                strokeWidth={7}
                label="Protein"
                value={`${totals.protein}/${targetProtein}`}
              />
            </View>
          </Card>
        );

      case "Heart Healthy":
        return (
          <Card style={[styles.dashboardCard, { width: CARD_WIDTH }]}>
            <ThemedText style={styles.cardLabel}>Heart Healthy</ThemedText>
            <View style={styles.progressBarsContainer}>
              {renderProgressBar("Total Fat", totals.fat, targetFat, "#FF3B30")}
              {renderProgressBar("Sodium", totals.sodium, targetSodium, "#FF9500", "mg")}
              {renderProgressBar("Cholesterol", totals.cholesterol, targetCholesterol, "#AF52DE", "mg")}
            </View>
          </Card>
        );

      case "Low Carb":
        return (
          <Card style={[styles.dashboardCard, { width: CARD_WIDTH }]}>
            <ThemedText style={styles.cardLabel}>Low Carb</ThemedText>
            <View style={styles.progressBarsContainer}>
              {renderProgressBar("Net Carbs", netCarbs, 50, "#007AFF")}
              {renderProgressBar("Sugar", totals.sugar, targetSugar, "#FF2D55")}
              {renderProgressBar("Fiber", totals.fiber, targetFiber, "#34C759")}
            </View>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.dateNav}>
        <Pressable onPress={() => navigateDate(-1)} style={styles.dateArrow}>
          <Feather name="chevron-left" size={24} color={theme.primary} />
        </Pressable>
        <ThemedText style={styles.dateText}>{formatLongDate(date)}</ThemedText>
        <Pressable onPress={() => navigateDate(1)} style={styles.dateArrow}>
          <Feather name="chevron-right" size={24} color={theme.primary} />
        </Pressable>
      </View>

      <FlatList
        ref={pagerRef}
        data={DASHBOARD_CARDS}
        renderItem={renderDashboardCard}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.cardsContainer}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + CARD_MARGIN,
          offset: (CARD_WIDTH + CARD_MARGIN) * index,
          index,
        })}
      />

      <View style={styles.dotsContainer}>
        {DASHBOARD_CARDS.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => {
              pagerRef.current?.scrollToIndex({ index: i, animated: true });
            }}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: i === cardIndex ? theme.primary : theme.backgroundTertiary }
              ]}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate("AddFood", { date, mealType: "Snacks" })}
        >
          <Feather name="plus" size={18} color="#fff" />
          <ThemedText style={styles.actionButtonText}>Log Food</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => navigation.navigate("BarcodeScanner", { date, mealType: "Snacks" })}
        >
          <Feather name="maximize" size={18} color={theme.text} />
          <ThemedText style={[styles.actionButtonText, { color: theme.text }]}>Scan Barcode</ThemedText>
        </Pressable>
      </View>

      <View style={styles.mealsContainer}>
        {MEAL_TYPES.map((mealType) => {
          const mealEntries = mealGroups[mealType] || [];
          const mealTotals = getMealTotals(mealEntries);

          return (
            <Card key={mealType} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleRow}>
                  <Feather name={MEAL_ICONS[mealType]} size={20} color={theme.primary} />
                  <ThemedText style={styles.mealTitle}>{mealType}</ThemedText>
                </View>
                {mealEntries.length > 0 ? (
                  <ThemedText style={[styles.mealCalories, { color: theme.textSecondary }]}>
                    {mealTotals.calories} cal
                  </ThemedText>
                ) : null}
              </View>

              {mealEntries.map((entry: FoodEntry) => (
                <Pressable
                  key={entry.id}
                  style={styles.foodEntry}
                  onPress={() => handleEditFood(entry)}
                >
                  <View style={styles.foodInfo}>
                    <ThemedText style={styles.foodName} numberOfLines={1}>
                      {entry.foodName}
                    </ThemedText>
                    <ThemedText style={[styles.foodDetails, { color: theme.textSecondary }]}>
                      {entry.servingsCount > 1 ? `${entry.servingsCount} x ` : ""}
                      {entry.servingLabel || "serving"} - {Math.round(entry.caloriesPerServing * entry.servingsCount)} cal
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={16} color={theme.textSecondary} />
                </Pressable>
              ))}

              <Pressable
                style={[styles.addFoodButton, { borderColor: theme.border }]}
                onPress={() => handleAddFood(mealType)}
              >
                <Feather name="plus" size={16} color={theme.primary} />
                <ThemedText style={{ color: theme.primary }}>Add Food</ThemedText>
              </Pressable>
            </Card>
          );
        })}
      </View>

      <Card style={{ ...styles.totalsCard, marginHorizontal: Spacing.lg }}>
        <ThemedText style={styles.totalsTitle}>Daily Totals</ThemedText>
        <View style={styles.totalsGrid}>
          <View style={styles.totalItem}>
            <ThemedText style={styles.totalValue}>{totals.calories}</ThemedText>
            <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>/ {targetCalories} cal</ThemedText>
          </View>
          <View style={styles.totalItem}>
            <ThemedText style={styles.totalValue}>{totals.protein}g</ThemedText>
            <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>/ {targetProtein}g protein</ThemedText>
          </View>
          <View style={styles.totalItem}>
            <ThemedText style={styles.totalValue}>{totals.carbs}g</ThemedText>
            <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>/ {targetCarbs}g carbs</ThemedText>
          </View>
          <View style={styles.totalItem}>
            <ThemedText style={styles.totalValue}>{totals.fat}g</ThemedText>
            <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>/ {targetFat}g fat</ThemedText>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  dateArrow: {
    padding: Spacing.sm,
  },
  dateText: {
    ...Typography.headline,
    fontWeight: "600",
    marginHorizontal: Spacing.lg,
  },
  cardsContainer: {
    paddingHorizontal: Spacing.lg,
  },
  dashboardCard: {
    padding: Spacing.xl,
    alignItems: "center",
    marginRight: Spacing.md,
    minHeight: 200,
  },
  cardLabel: {
    ...Typography.subheadline,
    marginBottom: Spacing.xs,
  },
  bigNumber: {
    fontSize: 64,
    fontWeight: "700",
    lineHeight: 72,
  },
  formulaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  formulaItem: {
    alignItems: "center",
  },
  formulaValue: {
    ...Typography.headline,
    fontWeight: "600",
  },
  formulaLabel: {
    ...Typography.caption,
  },
  formulaOperator: {
    ...Typography.headline,
    fontWeight: "400",
  },
  macrosRings: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: Spacing.lg,
  },
  progressBarsContainer: {
    width: "100%",
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  progressBarContainer: {
    width: "100%",
  },
  progressBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    ...Typography.subheadline,
    fontWeight: "500",
  },
  progressValue: {
    ...Typography.caption,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressRemaining: {
    ...Typography.caption,
    marginTop: 2,
    textAlign: "right",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    ...Typography.subheadline,
    fontWeight: "600",
    color: "#fff",
  },
  mealsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  mealCard: {
    padding: Spacing.lg,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  mealTitle: {
    ...Typography.headline,
    fontWeight: "600",
  },
  mealCalories: {
    ...Typography.subheadline,
  },
  foodEntry: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...Typography.body,
  },
  foodDetails: {
    ...Typography.caption,
    marginTop: 2,
  },
  addFoodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  totalsCard: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  totalsTitle: {
    ...Typography.headline,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  totalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  totalItem: {
    width: "48%",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  totalValue: {
    ...Typography.title3,
    fontWeight: "700",
  },
  totalLabel: {
    ...Typography.caption,
  },
});
