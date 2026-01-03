import React, { useState } from "react";
import { View, StyleSheet, TextInput, Image, ActivityIndicator, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { profile, unlock, resetApp, startNewAccount } = useAuth();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccountConfirmText, setNewAccountConfirmText] = useState("");

  const handleUnlock = async () => {
    if (!password) return;
    
    setIsLoading(true);
    setError("");

    const success = await unlock(password);
    
    if (!success) {
      setError("Incorrect password");
      setPassword("");
    }
    
    setIsLoading(false);
  };

  const handleReset = async () => {
    if (resetConfirmText.toLowerCase() !== "reset") return;
    
    await resetApp();
    setShowResetModal(false);
    setResetConfirmText("");
  };

  const handleNewAccount = async () => {
    if (newAccountConfirmText.toLowerCase() !== "confirm") return;
    
    await resetApp();
    setShowNewAccountModal(false);
    setNewAccountConfirmText("");
  };

  const userName = profile?.name || "there";

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl }]}
    >
      <Image source={require("../../assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
      
      <ThemedText style={styles.greeting}>Hi, {userName}</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Enter your PIN to continue
      </ThemedText>

      <View style={styles.formContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: error ? "#FF3B30" : theme.border }]}
          placeholder="PIN"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          value={password}
          onChangeText={(t) => { setPassword(t.replace(/[^0-9]/g, "")); setError(""); }}
          onSubmitEditing={handleUnlock}
          autoFocus
        />
        
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <Button onPress={handleUnlock} disabled={!password || isLoading} style={styles.unlockButton}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : "Unlock"}
        </Button>

        <Pressable style={styles.forgotButton} onPress={() => setShowResetModal(true)}>
          <ThemedText style={[styles.forgotText, { color: theme.textSecondary }]}>
            Forgot password?
          </ThemedText>
        </Pressable>

        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>or</ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <Pressable style={styles.newAccountButton} onPress={() => setShowNewAccountModal(true)}>
          <ThemedText style={[styles.newAccountText, { color: theme.primary }]}>
            Create New Account
          </ThemedText>
        </Pressable>
      </View>

      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Reset App?</ThemedText>
            <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>
              This will delete all your data including your profile, challenge progress, photos, and logs. This cannot be undone.
            </ThemedText>
            <ThemedText style={[styles.modalText, { color: theme.textSecondary, marginTop: Spacing.md }]}>
              Type "reset" to confirm:
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Type 'reset'"
              placeholderTextColor={theme.textSecondary}
              value={resetConfirmText}
              onChangeText={setResetConfirmText}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => { setShowResetModal(false); setResetConfirmText(""); }}>
                <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
              </Pressable>
              <Button
                onPress={handleReset}
                disabled={resetConfirmText.toLowerCase() !== "reset"}
                style={[styles.resetButton, { backgroundColor: "#FF3B30" }]}
              >
                Reset Everything
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showNewAccountModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Create New Account?</ThemedText>
            <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>
              This will permanently delete your current profile, challenge progress, photos, and all logged data to create a fresh account.
            </ThemedText>
            <ThemedText style={[styles.modalText, { color: theme.textSecondary, marginTop: Spacing.md }]}>
              Type "confirm" to proceed:
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Type 'confirm'"
              placeholderTextColor={theme.textSecondary}
              value={newAccountConfirmText}
              onChangeText={setNewAccountConfirmText}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => { setShowNewAccountModal(false); setNewAccountConfirmText(""); }}>
                <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
              </Pressable>
              <Button
                onPress={handleNewAccount}
                disabled={newAccountConfirmText.toLowerCase() !== "confirm"}
                style={styles.newAccountConfirmButton}
              >
                Create New Account
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.largeTitle,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing["2xl"],
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    gap: Spacing.lg,
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
  },
  unlockButton: {
    marginTop: Spacing.sm,
  },
  forgotButton: {
    alignSelf: "center",
    paddingVertical: Spacing.md,
  },
  forgotText: {
    ...Typography.footnote,
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    ...Typography.footnote,
    marginTop: -Spacing.sm,
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
  },
  modalText: {
    ...Typography.body,
    textAlign: "center",
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
  resetButton: {
    flex: 1,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    ...Typography.footnote,
  },
  newAccountButton: {
    alignSelf: "center",
    paddingVertical: Spacing.md,
  },
  newAccountText: {
    ...Typography.callout,
    fontWeight: "600",
  },
  newAccountConfirmButton: {
    flex: 1,
  },
});
