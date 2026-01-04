import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Image, ActivityIndicator, Modal, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { hashPassword, setSessionUnlocked, setActiveProfileId, getActiveProfileId } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { profile, unlock, resetApp, startNewAccount, refreshAuth, isLoggedOut, logout } = useAuth();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<"chooseMethod" | "verifyContact" | "newPin">("chooseMethod");
  const [resetMethod, setResetMethod] = useState<"email" | "phone" | null>(null);
  const [resetContact, setResetContact] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [resetError, setResetError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccountConfirmText, setNewAccountConfirmText] = useState("");
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const hasLocalProfile = !!profile && !isLoggedOut;

  const loadAllProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const profiles = await api.profile.getAll();
      setAllProfiles(profiles || []);
      setShowAccountSelection((profiles || []).length > 0);
    } catch (err) {
      console.error("Failed to load profiles:", err);
      setAllProfiles([]);
      setShowAccountSelection(false);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    // Don't auto-load profiles when logged out - user should enter username/PIN manually
  }, [isLoggedOut]);

  const handleSelectAccount = async (selectedProfile: any) => {
    setUsername(selectedProfile.username || "");
    setShowAccountSelection(false);
  };

  const handleLoginWithDifferentAccount = async () => {
    await setActiveProfileId(null); // Clear the active profile
    await logout(); // This clears the session and shows the username/PIN login form
    setShowAccountSelection(false); // Don't show account selection
  };

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

      if (result.success && result.profileId) {
        await setActiveProfileId(result.profileId);
        await setSessionUnlocked(true);
        refreshAuth(); // This will refetch profile and unlock the app
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


  const handleContinueToVerify = () => {
    if (!resetMethod) {
      setResetError("Please select a method");
      return;
    }
    setResetError("");
    setResetContact("");
    setForgotStep("verifyContact");
  };

  const handleVerifyContact = async () => {
    if (!resetContact || !resetMethod) {
      setResetError(`Please enter your ${resetMethod === "email" ? "email address" : "phone number"}`);
      return;
    }
    
    // Use profile username if available, otherwise use username from state
    const usernameToUse = (hasLocalProfile && profile?.username) ? profile.username : username;
    if (!usernameToUse) {
      setResetError("Username is required");
      return;
    }
    
    setIsVerifying(true);
    setResetError("");
    
    try {
      const email = resetMethod === "email" ? resetContact.trim() : undefined;
      const phone = resetMethod === "phone" ? resetContact.trim() : undefined;
      
      const result = await api.profile.verifyResetContact(usernameToUse, email, phone);
      if (result.success && result.resetToken) {
        setResetToken(result.resetToken);
        setForgotStep("newPin");
      } else {
        setResetError(result.error || "Contact information does not match");
      }
    } catch (err: any) {
      console.error("Verify contact error:", err);
      setResetError(err.message || "Contact information does not match. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPin = async () => {
    if (!newPin || newPin.length < 4) {
      setResetError("PIN must be at least 4 digits");
      return;
    }
    if (newPin !== confirmNewPin) {
      setResetError("PINs do not match");
      return;
    }
    if (!resetToken) {
      setResetError("Reset token missing. Please start over.");
      return;
    }
    
    setIsResetting(true);
    setResetError("");
    
    try {
      const newPasswordHash = await hashPassword(newPin);
      const result = await api.profile.resetPassword(resetToken, newPasswordHash);
      
      if (result.success) {
        // PIN reset successful - close modal and refresh profile
        setShowForgotModal(false);
        setForgotStep("chooseMethod");
        setResetMethod(null);
        setResetContact("");
        setResetToken(null);
        setNewPin("");
        setConfirmNewPin("");
        setResetError("");
        
        // Invalidate profile cache and refetch to get the updated PIN hash
        await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        await queryClient.refetchQueries({ queryKey: ["/api/profile"] });
        
        // Refresh the auth state
        refreshAuth();
        
        Alert.alert("Success", "Your PIN has been reset. You can now unlock with your new PIN.");
      } else {
        setResetError(result.error || "Failed to reset PIN");
      }
    } catch (err: any) {
      console.error("Reset PIN error:", err);
      setResetError(err.message || "Failed to reset PIN. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const openForgotModal = () => {
    setForgotStep("chooseMethod");
    setShowForgotModal(true);
    setResetError("");
    setResetMethod(null);
    setResetContact("");
    setResetToken(null);
    setNewPin("");
    setConfirmNewPin("");
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep("chooseMethod");
    setResetError("");
    setResetMethod(null);
    setResetContact("");
    setResetToken(null);
    setNewPin("");
    setConfirmNewPin("");
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
      
      {showAccountSelection && allProfiles.length > 0 ? (
        <>
          <ThemedText style={styles.greeting}>Select Account</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose an account to login
          </ThemedText>
          
          <View style={styles.formContainer}>
            {loadingProfiles ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <>
                {allProfiles.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.accountCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
                    onPress={() => handleSelectAccount(p)}
                  >
                    <View style={styles.accountInfo}>
                      <ThemedText style={styles.accountName}>{p.name}</ThemedText>
                      {p.username ? (
                        <ThemedText style={[styles.accountUsername, { color: theme.textSecondary }]}>@{p.username}</ThemedText>
                      ) : null}
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  </Pressable>
                ))}
                
                <View style={styles.dividerContainer}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                  <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>or</ThemedText>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                </View>

                <Pressable style={styles.newAccountButton} onPress={() => { setShowAccountSelection(false); startNewAccount(); }}>
                  <ThemedText style={[styles.newAccountText, { color: theme.primary }]}>
                    Create New Account
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </>
      ) : hasLocalProfile ? (
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

            <Pressable style={styles.newAccountButton} onPress={handleLoginWithDifferentAccount}>
              <ThemedText style={[styles.newAccountText, { color: theme.primary }]}>
                Login with Different Account
              </ThemedText>
            </Pressable>

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
      )}

      <Modal visible={showForgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            {forgotStep === "chooseMethod" ? (
              <>
                <ThemedText style={styles.modalTitle}>Forgot PIN?</ThemedText>
                <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>
                  Where do you want us to send a verification code?
                </ThemedText>
                
                {(!hasLocalProfile || !profile) && (
                  <ThemedText style={[styles.modalText, { color: theme.textSecondary, marginTop: Spacing.md }]}>
                    You'll need to enter your username to receive a code.
                  </ThemedText>
                )}
                
                {(hasLocalProfile && profile?.email) || (!hasLocalProfile) ? (
                  <Pressable
                    style={[styles.methodButton, { backgroundColor: resetMethod === "email" ? theme.primary : theme.backgroundSecondary, borderColor: theme.border }]}
                    onPress={() => setResetMethod("email")}
                  >
                    <Feather name="mail" size={20} color={resetMethod === "email" ? theme.buttonText : theme.text} />
                    <ThemedText style={[styles.methodButtonText, { color: resetMethod === "email" ? theme.buttonText : theme.text }]}>
                      {hasLocalProfile && profile?.email ? `Email: ${maskEmail(profile.email)}` : "Email"}
                    </ThemedText>
                    {resetMethod === "email" && <Feather name="check-circle" size={20} color={theme.buttonText} />}
                  </Pressable>
                ) : null}
                
                {(hasLocalProfile && profile?.phone) || (!hasLocalProfile) ? (
                  <Pressable
                    style={[styles.methodButton, { backgroundColor: resetMethod === "phone" ? theme.primary : theme.backgroundSecondary, borderColor: theme.border }]}
                    onPress={() => setResetMethod("phone")}
                  >
                    <Feather name="phone" size={20} color={resetMethod === "phone" ? theme.buttonText : theme.text} />
                    <ThemedText style={[styles.methodButtonText, { color: resetMethod === "phone" ? theme.buttonText : theme.text }]}>
                      {hasLocalProfile && profile?.phone ? `Phone: ${maskPhone(profile.phone)}` : "Phone"}
                    </ThemedText>
                    {resetMethod === "phone" && <Feather name="check-circle" size={20} color={theme.buttonText} />}
                  </Pressable>
                ) : null}
                
                {resetError ? <ThemedText style={styles.errorText}>{resetError}</ThemedText> : null}
                
                <View style={styles.modalButtons}>
                  <Pressable style={styles.cancelButton} onPress={closeForgotModal}>
                    <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
                  </Pressable>
                  <Button
                    onPress={handleContinueToVerify}
                    disabled={!resetMethod}
                    style={styles.resetPinButton}
                  >
                    Continue
                  </Button>
                </View>
              </>
            ) : forgotStep === "verifyContact" ? (
              <>
                <ThemedText style={styles.modalTitle}>Verify Your {resetMethod === "email" ? "Email" : "Phone"}</ThemedText>
                <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>
                  Enter your {resetMethod === "email" ? "email address" : "phone number"} to verify your account.
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: resetError ? "#FF3B30" : theme.border }]}
                  placeholder={resetMethod === "email" ? "Enter your email address" : "Enter your phone number"}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType={resetMethod === "email" ? "email-address" : "phone-pad"}
                  autoCapitalize={resetMethod === "email" ? "none" : undefined}
                  value={resetContact}
                  onChangeText={(t) => { setResetContact(t); setResetError(""); }}
                  autoFocus
                />
                {resetError ? <ThemedText style={styles.errorText}>{resetError}</ThemedText> : null}
                <View style={styles.modalButtons}>
                  <Pressable style={styles.cancelButton} onPress={() => { setForgotStep("chooseMethod"); setResetContact(""); setResetError(""); }}>
                    <ThemedText style={{ color: theme.primary }}>Back</ThemedText>
                  </Pressable>
                  <Button
                    onPress={handleVerifyContact}
                    disabled={!resetContact || isVerifying}
                    style={styles.resetPinButton}
                  >
                    {isVerifying ? <ActivityIndicator color="#FFF" /> : "Verify"}
                  </Button>
                </View>
              </>
            ) : forgotStep === "newPin" ? (
              <>
                <ThemedText style={styles.modalTitle}>Set New PIN</ThemedText>
                <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>
                  Enter and confirm your new PIN (4-6 digits).
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: resetError && (newPin.length > 0 && newPin.length < 4) ? "#FF3B30" : theme.border }]}
                  placeholder="New PIN"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={6}
                  value={newPin}
                  onChangeText={(t) => { setNewPin(t.replace(/[^0-9]/g, "")); setResetError(""); }}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: resetError && (newPin !== confirmNewPin) ? "#FF3B30" : theme.border }]}
                  placeholder="Confirm New PIN"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={6}
                  value={confirmNewPin}
                  onChangeText={(t) => { setConfirmNewPin(t.replace(/[^0-9]/g, "")); setResetError(""); }}
                />
                {resetError ? <ThemedText style={styles.errorText}>{resetError}</ThemedText> : null}
                <View style={styles.modalButtons}>
                  <Pressable style={styles.cancelButton} onPress={closeForgotModal}>
                    <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
                  </Pressable>
                  <Button
                    onPress={handleResetPin}
                    disabled={isResetting || !newPin || !confirmNewPin || newPin.length < 4 || newPin !== confirmNewPin}
                    style={styles.resetPinButton}
                  >
                    {isResetting ? <ActivityIndicator color="#FFF" /> : "Reset PIN"}
                  </Button>
                </View>
              </>
            ) : null}
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
          style={[styles.signature, { tintColor: isDark ? "#FFFFFF" : "#000000" }]}
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
  methodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  methodButtonText: {
    ...Typography.body,
    flex: 1,
  },
  resetLinkButton: {
    alignSelf: "center",
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  resetLinkText: {
    ...Typography.footnote,
    fontWeight: "500",
  },
  resetPinButton: {
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
  signatureContainer: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  signature: {
    width: 350,
    height: 110,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...Typography.headline,
    marginBottom: Spacing.xs / 2,
  },
  accountUsername: {
    ...Typography.footnote,
  },
});
