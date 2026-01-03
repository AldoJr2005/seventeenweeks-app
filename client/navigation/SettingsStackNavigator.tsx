import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "@/screens/SettingsScreen";
import RemindersScreen from "@/screens/RemindersScreen";
import ExportScreen from "@/screens/ExportScreen";
import TDEECalculatorScreen from "@/screens/settings/TDEECalculatorScreen";
import WorkoutPreferencesScreen from "@/screens/settings/WorkoutPreferencesScreen";
import FastingSettingsScreen from "@/screens/settings/FastingSettingsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SettingsStackParamList = {
  Settings: undefined;
  Reminders: undefined;
  Export: undefined;
  TDEECalculator: undefined;
  WorkoutPreferences: undefined;
  FastingSettings: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: "Settings" }}
      />
      <Stack.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{ headerTitle: "Reminders" }}
      />
      <Stack.Screen
        name="Export"
        component={ExportScreen}
        options={{ headerTitle: "Export Data" }}
      />
      <Stack.Screen
        name="TDEECalculator"
        component={TDEECalculatorScreen}
        options={{ headerTitle: "Calorie Calculator" }}
      />
      <Stack.Screen
        name="WorkoutPreferences"
        component={WorkoutPreferencesScreen}
        options={{ headerTitle: "Workout Preferences" }}
      />
      <Stack.Screen
        name="FastingSettings"
        component={FastingSettingsScreen}
        options={{ headerTitle: "Fasting Schedule" }}
      />
    </Stack.Navigator>
  );
}
