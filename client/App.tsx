import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useChallenge } from "@/hooks/useChallenge";
import { getChallengeStatus } from "@/lib/challenge-utils";
import SetupScreen from "@/screens/SetupScreen";
import LoginScreen from "@/screens/LoginScreen";
import PreChallengeScreen from "@/screens/PreChallengeScreen";
import type { Challenge } from "@shared/schema";

function AppContent() {
  const { isLoading, needsSetup, isUnlocked, isLoggedOut, profile } = useAuth();
  const { data: challenge, isLoading: challengeLoading } = useChallenge();
  const [forceUpdate, setForceUpdate] = React.useState(0);

  // TEMPORARY: Force re-render every second to check challenge status during countdown
  React.useEffect(() => {
    if (challenge) {
      const status = getChallengeStatus((challenge as Challenge).startDate);
      if (status === "PRE_CHALLENGE") {
        const interval = setInterval(() => {
          setForceUpdate((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [challenge, forceUpdate]);

  if (isLoading || challengeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show login screen when user clicks "Login" button
  if (isLoggedOut) {
    return <LoginScreen />;
  }

  if (needsSetup) {
    return <SetupScreen />;
  }

  if (profile?.requirePasswordOnOpen && !isUnlocked) {
    return <LoginScreen />;
  }

  if (challenge) {
    const status = getChallengeStatus((challenge as Challenge).startDate);
    if (status === "PRE_CHALLENGE") {
      return <PreChallengeScreen challenge={challenge as Challenge} />;
    }
  }

  return <RootStackNavigator />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <KeyboardProvider>
                <NavigationContainer>
                  <AuthProvider>
                    <AppContent />
                  </AuthProvider>
                </NavigationContainer>
                <StatusBar style="auto" />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
