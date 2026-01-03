import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Pressable, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useChallenge, useUpdateChallenge } from "@/hooks/useChallenge";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";
import type { Challenge } from "@shared/schema";

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { data: challenge } = useChallenge();
  const updateChallenge = useUpdateChallenge();

  const [smartReminders, setSmartReminders] = useState(
    (challenge as Challenge | undefined)?.smartReminders ?? true
  );

  const handleToggleSmartReminders = async () => {
    if (!challenge) return;
    const newValue = !smartReminders;
    setSmartReminders(newValue);
    try {
      await updateChallenge.mutateAsync({
        id: (challenge as Challenge).id,
        data: { smartReminders: newValue },
      });
    } catch (error) {
      setSmartReminders(!newValue);
      Alert.alert("Error", "Failed to update settings");
    }
  };

  const handleExportJSON = () => {
    Alert.alert(
      "Export Data",
      "This will generate a JSON file with all your challenge data.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => navigation.navigate("Export") },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText style={styles.sectionHeader}>Challenge</ThemedText>
      <Card style={styles.section}>
        <SettingsRow
          icon="calendar"
          label="Start Date"
          value={(challenge as Challenge | undefined)?.startDate ? 
            new Date((challenge as Challenge).startDate).toLocaleDateString() : "Not set"}
          theme={theme}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="target"
          label="Goal Weight"
          value={(challenge as Challenge | undefined)?.goalWeight ? 
            `${(challenge as Challenge).goalWeight} ${(challenge as Challenge).unit}` : "Not set"}
          theme={theme}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="hash"
          label="Units"
          value={(challenge as Challenge | undefined)?.unit?.toUpperCase() || "LBS"}
          theme={theme}
        />
      </Card>

      <ThemedText style={styles.sectionHeader}>Reminders</ThemedText>
      <Card style={styles.section}>
        <Pressable
          style={styles.settingsRow}
          onPress={() => navigation.navigate("Reminders")}
        >
          <View style={styles.settingsRowLeft}>
            <Feather name="clock" size={20} color={theme.textSecondary} />
            <ThemedText style={styles.settingsLabel}>Reminder Times</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Feather name="zap" size={20} color={theme.textSecondary} />
            <View>
              <ThemedText style={styles.settingsLabel}>Smart Reminders</ThemedText>
              <ThemedText style={[styles.settingsHint, { color: theme.textSecondary }]}>
                Don't notify if already completed
              </ThemedText>
            </View>
          </View>
          <Switch
            value={smartReminders}
            onValueChange={handleToggleSmartReminders}
            trackColor={{ false: theme.border, true: theme.success }}
            thumbColor="#FFF"
          />
        </View>
      </Card>

      <ThemedText style={styles.sectionHeader}>Goals</ThemedText>
      <Card style={styles.section}>
        <SettingsRow
          icon="navigation"
          label="Daily Step Goal"
          value={`${((challenge as Challenge | undefined)?.stepGoal || 10000).toLocaleString()} steps`}
          theme={theme}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="moon"
          label="Sleep Goal"
          value={`${(challenge as Challenge | undefined)?.sleepGoal || 8} hours`}
          theme={theme}
        />
      </Card>

      <ThemedText style={styles.sectionHeader}>Data</ThemedText>
      <Card style={styles.section}>
        <Pressable
          style={styles.settingsRow}
          onPress={() => navigation.navigate("Export")}
        >
          <View style={styles.settingsRowLeft}>
            <Feather name="download" size={20} color={theme.textSecondary} />
            <ThemedText style={styles.settingsLabel}>Export Data</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable
          style={styles.settingsRow}
          onPress={() => navigation.navigate("Export")}
        >
          <View style={styles.settingsRowLeft}>
            <Feather name="share" size={20} color={theme.textSecondary} />
            <ThemedText style={styles.settingsLabel}>Generate Summary</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </Card>

      <ThemedText style={styles.sectionHeader}>About</ThemedText>
      <Card style={styles.section}>
        <SettingsRow
          icon="info"
          label="Version"
          value="1.0.0"
          theme={theme}
        />
      </Card>
    </ScrollView>
  );
}

function SettingsRow({ 
  icon, 
  label, 
  value, 
  theme 
}: { 
  icon: keyof typeof Feather.glyphMap; 
  label: string; 
  value: string; 
  theme: any;
}) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowLeft}>
        <Feather name={icon} size={20} color={theme.textSecondary} />
        <ThemedText style={styles.settingsLabel}>{label}</ThemedText>
      </View>
      <ThemedText style={[styles.settingsValue, { color: theme.textSecondary }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    ...Typography.footnote,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    opacity: 0.6,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  settingsLabel: {
    ...Typography.body,
  },
  settingsHint: {
    ...Typography.footnote,
    marginTop: 2,
  },
  settingsValue: {
    ...Typography.body,
  },
  divider: {
    height: 1,
    marginLeft: 44,
  },
});
