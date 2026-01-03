import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LogScreen from "@/screens/LogScreen";
import NutritionLogScreen from "@/screens/NutritionLogScreen";
import AddFoodScreen from "@/screens/AddFoodScreen";
import BarcodeScanScreen from "@/screens/BarcodeScanScreen";
import WorkoutLogScreen from "@/screens/WorkoutLogScreen";
import HabitsLogScreen from "@/screens/HabitsLogScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { MealType } from "@shared/schema";

export type LogStackParamList = {
  Log: undefined;
  NutritionLog: { date?: string };
  AddFood: { date: string; mealType: MealType; editId?: string };
  BarcodeScanner: { date: string; mealType: MealType };
  WorkoutLog: { date?: string };
  HabitsLog: { date?: string };
};

const Stack = createNativeStackNavigator<LogStackParamList>();

export default function LogStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Log"
        component={LogScreen}
        options={{ headerTitle: "Log" }}
      />
      <Stack.Screen
        name="NutritionLog"
        component={NutritionLogScreen}
        options={{ headerTitle: "Nutrition" }}
      />
      <Stack.Screen
        name="AddFood"
        component={AddFoodScreen}
        options={{ headerTitle: "Add Food" }}
      />
      <Stack.Screen
        name="BarcodeScanner"
        component={BarcodeScanScreen}
        options={{ headerTitle: "Scan Barcode", headerShown: false }}
      />
      <Stack.Screen
        name="WorkoutLog"
        component={WorkoutLogScreen}
        options={{ headerTitle: "Workout" }}
      />
      <Stack.Screen
        name="HabitsLog"
        component={HabitsLogScreen}
        options={{ headerTitle: "Habits" }}
      />
    </Stack.Navigator>
  );
}
