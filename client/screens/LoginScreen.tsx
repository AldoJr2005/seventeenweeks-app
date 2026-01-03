import React, { useState } from "react";
import { View, StyleSheet, TextInput, Image, ActivityIndicator, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { hashPassword, setSessionUnlocked } from "@/lib/auth";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { profile, unlock, resetApp, startNewAccount, refreshAuth } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<"recovery" | "reset">("recovery");
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccountConfirmText, setNewAccountConfirmText] = useState("");

  const hasLocalProfile = !!profile;

  const handleUnlock = async () => {
    if (!password) return;
    
    setIsLoading(true);
    setError("");

    const success = await unlock(password);
    
    if (!success) {
      setError("Incorrect PIN");
      setPassword("");
    }
    
    setIsLoading(false);
  };

  const handleLogin = async () => {
    if (!username || !password) return;

    setIsLoading(true);
    setError("");

    try {
      const passwordHash = await hashPassword(password);
      const result = await api.profile.login(username, passwordHash);

      if (result.success) {
        await setSessionUnlocked(true);
        refreshAuth();
      } else {
        setError(result.message || "Invalid username or PIN");
        setPassword("");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (resetConfirmText.toLowerCase() !== "reset") return;
    
    await resetApp();
    setShowForgotModal(false);
    setForgotStep("recovery");
    setResetConfirmText("");
  };

  const openForgotModal = () => {
    setForgotStep(profile?.email || profile?.phone ? "recovery" : "reset");
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep("recovery");
    setResetConfirmText("");
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const masked = local.length > 2 ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1] : local;
    return `${masked}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 4) return phone;
    return "*".repeat(digits.length - 4) + digits.slice(-4);
  };

  const handleNewAccount = async () => {
    if (newAccountConfirmText.toLowerCase() !== "confirm") return;
    
    startNewAccount();
    setShowNewAccountModal(false);
    setNewAccountConfirmText("");
  };

  const userName = profile?.name || "there";
  const userUsername = profile?.username;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <Image source={require("../../assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
      
      {hasLocalProfile ? (
        <>
          <ThemedText style={styles.greeting}>Hi, {userName}</ThemedText>
          {userUsername ? (
            <ThemedText style={[styles.usernameText, { color: theme.textSecondary }]}>@{userUsername}</ThemedText>
          ) : null}
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

            <Pressable style={styles.forgotButton} onPress={openForgotModal}>
              <ThemedText style={[styles.forgotText, { color: theme.textSecondary }]}>
                Forgot PIN?
              </ThemedText>
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>or</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <Pressable style={styles.newAccountButton} onPress={() => startNewAccount()}>
              <ThemedText style={[styles.newAccountText, { color: theme.primary }]}>
                Create New Account
              </ThemedText>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <ThemedText style={styles.greeting}>Welcome Back</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter your username and PIN to login
          </ThemedText>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Username</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                placeholder="Your username"
                placeholderTextColor={theme.textSecondary}
                value={username}
                onChangeText={(t) => { setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, "")); setError(""); }}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>PIN</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: error ? "#FF3B30" : theme.border }]}
                placeholder="Your PIN"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                value={password}
                onChangeText={(t) => { setPassword(t.replace(/[^0-9]/g, "")); setError(""); }}
                onSubmitEditing={handleLogin}
              />
            </View>
            
            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

            <Button onPress={handleLogin} disabled={!username || !password || isLoading} style={styles.unlockButton}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : "Login"}
            </Button>

            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>or</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <Pressable style={styles.newAccountButton} onPress={() => startNewAccount()}>
              <ThemedText style={[styles.newAccountText, { color: theme.primary }]}>
                Create New Account
              </ThemedText>
            </Pressable>
          </View>
        </>
      )}

      <Modal visible={showForgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            {forgotStep === "recovery" && (profile?.email || profile?.phone) ? (
              <>
                <ThemedText style={styles.modalTitle}>Forgot PIN?</ThemedText>
                <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>
                  Contact recovery information on file:
                </ThemedText>
                
                {profile.email ? (
                  <View style={styles.recoveryItem}>
                    <Feather name="mail" size={18} color={theme.textSecondary} />
                    <ThemedText style={[styles.recoveryValue, { color: theme.text }]}>
                      {maskEmail(profile.email)}
                    </ThemedText>
                  </View>
                ) : null}
                
                {profile.phone ? (
                  <View style={styles.recoveryItem}>
                    <Feather name="phone" size={18} color={theme.textSecondary} />
                    <ThemedText style={[styles.recoveryValue, { color: theme.text }]}>
                      {maskPhone(profile.phone)}
                    </ThemedText>
                  </View>
                ) : null}
                
                <ThemedText style={[styles.modalText, { color: theme.textSecondary, marginTop: Spacing.md }]}>
                  Use one of these to verify your identity and reset your PIN on a trusted device.
                </ThemedText>
                
                <View style={styles.modalButtons}>
                  <Pressable style={styles.cancelButton} onPress={closeForgotModal}>
                    <ThemedText style={{ color: theme.primary }}>Close</ThemedText>
                  </Pressable>
                  <Pressable style={styles.resetLinkButton} onPress={() => setForgotStep("reset")}>
                    <ThemedText style={[styles.resetLinkText, { color: "#FF3B30" }]}>
                      Reset App Instead
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
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
                  <Pressable style={styles.cancelButton} onPress={closeForgotModal}>
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
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showNewAccountModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Create New Account?</ThemedText>
            <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>
              This will start the setup process for a new account.
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

      <View style={styles.signatureContainer}>
        <Image
          source={require("../../assets/images/signature.png")}
          style={[styles.signature, { opacity: isDark ? 0.5 : 0.3, tintColor: isDark ? "#FFFFFF" : "#000000" }]}
          resizeMode="contain"
        />
      </View>
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
  usernameText: {
    ...Typography.footnote,
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
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    ...Typography.footnote,
    marginLeft: Spacing.xs,
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
  recoveryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  recoveryValue: {
    ...Typography.body,
    fontFamily: "monospace",
  },
  resetLinkButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  resetLinkText: {
    ...Typography.footnote,
    fontWeight: "500",
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
  signatureContainer: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  signature: {
    width: 350,
    height: 110,
  },
});
