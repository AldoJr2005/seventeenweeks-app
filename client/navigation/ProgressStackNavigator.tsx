import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProgressScreen from "@/screens/ProgressScreen";
import PhotosScreen from "@/screens/PhotosScreen";
import PhotoCompareScreen from "@/screens/PhotoCompareScreen";
import WeeklyReflectionScreen from "@/screens/progress/WeeklyReflectionScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProgressStackParamList = {
  Progress: undefined;
  Photos: undefined;
  PhotoCompare: { week1?: number; week2?: number };
  WeeklyReflection: { weekNumber: number };
};

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export default function ProgressStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ headerTitle: "Progress" }}
      />
      <Stack.Screen
        name="Photos"
        component={PhotosScreen}
        options={{ headerTitle: "Photos" }}
      />
      <Stack.Screen
        name="PhotoCompare"
        component={PhotoCompareScreen}
        options={{ 
          headerTitle: "Compare",
          presentation: "modal"
        }}
      />
      <Stack.Screen
        name="WeeklyReflection"
        component={WeeklyReflectionScreen}
        options={{ headerTitle: "Weekly Reflection" }}
      />
    </Stack.Navigator>
  );
}
