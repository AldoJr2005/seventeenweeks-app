import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import WeeklyCheckInScreen from "@/screens/WeeklyCheckInScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

export type HomeStackParamList = {
  Home: undefined;
  WeeklyCheckIn: { weekNumber: number };
  Onboarding: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="17-Week Challenge" />,
        }}
      />
      <Stack.Screen
        name="WeeklyCheckIn"
        component={WeeklyCheckInScreen}
        options={{
          headerTitle: "Weekly Check-In",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
    </Stack.Navigator>
  );
}
