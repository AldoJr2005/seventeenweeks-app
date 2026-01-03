import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LogScreen from "@/screens/LogScreen";
import NutritionLogScreen from "@/screens/NutritionLogScreen";
import WorkoutLogScreen from "@/screens/WorkoutLogScreen";
import HabitsLogScreen from "@/screens/HabitsLogScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type LogStackParamList = {
  Log: undefined;
  NutritionLog: { date?: string };
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
