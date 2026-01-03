import React, { useState, useRef, useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView, Dimensions, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

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

const MEAL_ICONS: Record<MealType, keyof typeof Feather.glyphMap> = {
  Breakfast: "sunrise",
  Lunch: "sun",
  Dinner: "moon",
  Snacks: "coffee",
};

export default function NutritionLogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const scrollRef = useRef<ScrollView>(null);

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

  const totals = useMemo(() => {
    if (!foodEntries) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return (foodEntries as FoodEntry[]).reduce((acc, entry) => ({
      calories: acc.calories + Math.round(entry.caloriesPerServing * entry.servingsCount),
      protein: acc.protein + Math.round((entry.proteinPerServing || 0) * entry.servingsCount),
      carbs: acc.carbs + Math.round((entry.carbsPerServing || 0) * entry.servingsCount),
      fat: acc.fat + Math.round((entry.fatPerServing || 0) * entry.servingsCount),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
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

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    if (index !== cardIndex) {
      setCardIndex(index);
      Haptics.selectionAsync();
    }
  };

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

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.cardsContainer}
        snapToInterval={CARD_WIDTH + Spacing.md}
        decelerationRate="fast"
      >
        <Card style={{ ...styles.dashboardCard, width: CARD_WIDTH }}>
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

        <Card style={{ ...styles.dashboardCard, width: CARD_WIDTH }}>
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
      </ScrollView>

      <View style={styles.dotsContainer}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === cardIndex ? theme.primary : theme.backgroundTertiary }
            ]}
          />
        ))}
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
    gap: Spacing.md,
  },
  dashboardCard: {
    padding: Spacing.xl,
    alignItems: "center",
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
