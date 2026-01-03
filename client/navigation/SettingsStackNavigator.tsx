import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "@/screens/SettingsScreen";
import RemindersScreen from "@/screens/RemindersScreen";
import ExportScreen from "@/screens/ExportScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SettingsStackParamList = {
  Settings: undefined;
  Reminders: undefined;
  Export: undefined;
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
    </Stack.Navigator>
  );
}
