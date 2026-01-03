import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Pressable, Switch, Alert, Modal, TextInput } from "react-native";
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
import { Button } from "@/components/Button";
import { useChallenge, useUpdateChallenge } from "@/hooks/useChallenge";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useProfile";
import { changePasswordOnServer } from "@/lib/auth";
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
  const { profile, lock, logout, refreshAuth } = useAuth();
  const updateProfile = useUpdateProfile();

  const [smartReminders, setSmartReminders] = useState(
    (challenge as Challenge | undefined)?.smartReminders ?? true
  );
  const [requirePassword, setRequirePassword] = useState(profile?.requirePasswordOnOpen ?? true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  const handleToggleRequirePassword = async () => {
    if (!profile) return;
    const newValue = !requirePassword;
    setRequirePassword(newValue);
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        data: { requirePasswordOnOpen: newValue },
      });
      refreshAuth();
    } catch (error) {
      setRequirePassword(!newValue);
      Alert.alert("Error", "Failed to update settings");
    }
  };

  const handleChangePassword = async () => {
    if (!profile) return;
    
    if (newPassword.length < 4) {
      setPasswordError("Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    try {
      const result = await changePasswordOnServer(oldPassword, newPassword);
      if (!result.success) {
        setPasswordError(result.error || "Failed to change password");
        return;
      }
      
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordError("");
      Alert.alert("Success", "Password updated successfully");
      refreshAuth();
    } catch (error) {
      setPasswordError("Failed to update password");
    }
  };

  const handleLockApp = async () => {
    await lock();
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "You'll need to enter your password to log back in. Your data will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: async () => { await logout(); } },
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
      <ThemedText style={styles.sectionHeader}>Profile</ThemedText>
      <Card style={styles.section}>
        <SettingsRow
          icon="user"
          label="Name"
          value={profile?.name || "Not set"}
          theme={theme}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="maximize-2"
          label="Height"
          value={profile ? (profile.heightUnit === "ft" 
            ? `${Math.floor(profile.heightValue / 12)}' ${Math.round(profile.heightValue % 12)}"` 
            : `${profile.heightValue} cm`) : "Not set"}
          theme={theme}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="activity"
          label="Weight Unit"
          value={profile?.weightUnit?.toUpperCase() || "LBS"}
          theme={theme}
        />
      </Card>

      <ThemedText style={styles.sectionHeader}>Security</ThemedText>
      <Card style={styles.section}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Feather name="lock" size={20} color={theme.textSecondary} />
            <View>
              <ThemedText style={styles.settingsLabel}>Require Password</ThemedText>
              <ThemedText style={[styles.settingsHint, { color: theme.textSecondary }]}>
                Lock app on open
              </ThemedText>
            </View>
          </View>
          <Switch
            value={requirePassword}
            onValueChange={handleToggleRequirePassword}
            trackColor={{ false: theme.border, true: theme.success }}
            thumbColor="#FFF"
          />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable style={styles.settingsRow} onPress={() => setShowPasswordModal(true)}>
          <View style={styles.settingsRowLeft}>
            <Feather name="key" size={20} color={theme.textSecondary} />
            <ThemedText style={styles.settingsLabel}>Change Password</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable style={styles.settingsRow} onPress={handleLockApp}>
          <View style={styles.settingsRowLeft}>
            <Feather name="log-out" size={20} color={theme.primary} />
            <ThemedText style={[styles.settingsLabel, { color: theme.primary }]}>Lock App Now</ThemedText>
          </View>
        </Pressable>
      </Card>

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

      <ThemedText style={styles.sectionHeader}>Plan</ThemedText>
      <Card style={styles.section}>
        <Pressable
          style={styles.settingsRow}
          onPress={() => navigation.navigate("TDEECalculator")}
        >
          <View style={styles.settingsRowLeft}>
            <Feather name="target" size={20} color={theme.textSecondary} />
            <View>
              <ThemedText style={styles.settingsLabel}>Calories</ThemedText>
              <ThemedText style={[styles.settingsHint, { color: theme.textSecondary }]}>
                {(challenge as Challenge | undefined)?.targetCalories 
                  ? `${(challenge as Challenge).targetCalories} cal/day`
                  : "Not set"}
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable
          style={styles.settingsRow}
          onPress={() => navigation.navigate("TDEECalculator")}
        >
          <View style={styles.settingsRowLeft}>
            <Feather name="pie-chart" size={20} color={theme.textSecondary} />
            <View>
              <ThemedText style={styles.settingsLabel}>Macros</ThemedText>
              <ThemedText style={[styles.settingsHint, { color: theme.textSecondary }]}>
                {(challenge as Challenge | undefined)?.targetProteinGrams 
                  ? `P${(challenge as Challenge).targetProteinGrams}g / C${(challenge as Challenge).targetCarbsGrams}g / F${(challenge as Challenge).targetFatGrams}g`
                  : "Not set"}
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable
          style={styles.settingsRow}
          onPress={() => navigation.navigate("WorkoutPreferences")}
        >
          <View style={styles.settingsRowLeft}>
            <Feather name="zap" size={20} color={theme.textSecondary} />
            <View>
              <ThemedText style={styles.settingsLabel}>Workout</ThemedText>
              <ThemedText style={[styles.settingsHint, { color: theme.textSecondary }]}>
                {(challenge as Challenge | undefined)?.workoutsPerWeek 
                  ? `${(challenge as Challenge).workoutsPerWeek} days/week`
                  : "Not set"}
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable
          style={styles.settingsRow}
          onPress={() => navigation.navigate("FastingSettings")}
        >
          <View style={styles.settingsRowLeft}>
            <Feather name="clock" size={20} color={theme.textSecondary} />
            <View>
              <ThemedText style={styles.settingsLabel}>Fasting</ThemedText>
              <ThemedText style={[styles.settingsHint, { color: theme.textSecondary }]}>
                {(challenge as Challenge | undefined)?.fastingType && (challenge as Challenge).fastingType !== "none"
                  ? `${(challenge as Challenge).fastingType}`
                  : "Not enabled"}
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="navigation"
          label="Steps"
          value={`${((challenge as Challenge | undefined)?.stepGoal || 10000).toLocaleString()}/day`}
          theme={theme}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="moon"
          label="Sleep"
          value={`${(challenge as Challenge | undefined)?.sleepGoal || 8}h/night`}
          theme={theme}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable
          style={styles.settingsRow}
          onPress={() => {
            Alert.alert(
              "Reset Plan",
              "This will re-run the setup wizard to update your goals. Your logged data will be preserved.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Reset Plan", onPress: () => navigation.getParent()?.navigate("HomeTab", { screen: "Onboarding" }) },
              ]
            );
          }}
        >
          <View style={styles.settingsRowLeft}>
            <Feather name="refresh-cw" size={20} color={theme.primary} />
            <ThemedText style={[styles.settingsLabel, { color: theme.primary }]}>Reset Plan</ThemedText>
          </View>
        </Pressable>
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

      <ThemedText style={styles.sectionHeader}>Account</ThemedText>
      <Card style={styles.section}>
        <Pressable style={styles.settingsRow} onPress={handleLogout}>
          <View style={styles.settingsRowLeft}>
            <Feather name="log-out" size={20} color="#FF3B30" />
            <ThemedText style={[styles.settingsLabel, { color: "#FF3B30" }]}>Log Out</ThemedText>
          </View>
        </Pressable>
      </Card>

      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Change Password</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Current password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={oldPassword}
              onChangeText={(t) => { setOldPassword(t); setPasswordError(""); }}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="New password (min 4 characters)"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={(t) => { setNewPassword(t); setPasswordError(""); }}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Confirm new password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={(t) => { setConfirmNewPassword(t); setPasswordError(""); }}
            />
            {passwordError ? <ThemedText style={styles.errorText}>{passwordError}</ThemedText> : null}
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                  setPasswordError("");
                }}
              >
                <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
              </Pressable>
              <Button
                onPress={handleChangePassword}
                disabled={!oldPassword || !newPassword || !confirmNewPassword}
                style={styles.saveButton}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    ...Typography.title3,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    ...Typography.footnote,
  },
});
