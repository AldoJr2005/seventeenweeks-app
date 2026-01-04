import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { getApiUrl } from "./query-client";

const SESSION_KEY = "app_session_unlocked";
const SESSION_TIMESTAMP_KEY = "app_session_timestamp";
const ACTIVE_PROFILE_ID_KEY = "active_profile_id";

export async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return digest;
}

export async function setSessionUnlocked(unlocked: boolean): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof sessionStorage !== "undefined") {
      if (unlocked) {
        sessionStorage.setItem(SESSION_KEY, "true");
        sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
      }
    }
    return;
  }
  
  try {
    if (unlocked) {
      await SecureStore.setItemAsync(SESSION_KEY, "true");
      await SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, Date.now().toString());
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      await SecureStore.deleteItemAsync(SESSION_TIMESTAMP_KEY);
    }
  } catch (error) {
    console.error("SecureStore error:", error);
  }
}

export async function isSessionUnlocked(autoLockMinutes: number | null): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof sessionStorage !== "undefined") {
      const unlocked = sessionStorage.getItem(SESSION_KEY) === "true";
      if (!unlocked) return false;
      
      if (autoLockMinutes && autoLockMinutes > 0) {
        const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
        if (timestamp) {
          const elapsed = Date.now() - parseInt(timestamp, 10);
          const maxMs = autoLockMinutes * 60 * 1000;
          if (elapsed > maxMs) {
            sessionStorage.removeItem(SESSION_KEY);
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }
  
  try {
    const unlocked = await SecureStore.getItemAsync(SESSION_KEY);
    if (unlocked !== "true") return false;
    
    if (autoLockMinutes && autoLockMinutes > 0) {
      const timestamp = await SecureStore.getItemAsync(SESSION_TIMESTAMP_KEY);
      if (timestamp) {
        const elapsed = Date.now() - parseInt(timestamp, 10);
        const maxMs = autoLockMinutes * 60 * 1000;
        if (elapsed > maxMs) {
          await SecureStore.deleteItemAsync(SESSION_KEY);
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error("SecureStore error:", error);
    return false;
  }
}

export async function clearSession(): Promise<void> {
  await setSessionUnlocked(false);
}

export async function getActiveProfileId(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
    }
    return null;
  }
  
  try {
    return await SecureStore.getItemAsync(ACTIVE_PROFILE_ID_KEY);
  } catch (error) {
    console.error("SecureStore error:", error);
    return null;
  }
}

export async function setActiveProfileId(profileId: string | null): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      if (profileId) {
        localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
      } else {
        localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
      }
    }
    return;
  }
  
  try {
    if (profileId) {
      await SecureStore.setItemAsync(ACTIVE_PROFILE_ID_KEY, profileId);
    } else {
      await SecureStore.deleteItemAsync(ACTIVE_PROFILE_ID_KEY);
    }
  } catch (error) {
    console.error("SecureStore error:", error);
  }
}

export async function verifyPasswordOnServer(password: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(password);
    const baseUrl = getApiUrl();
    const response = await fetch(new URL("/api/profile/verify-password", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordHash: hashedPassword }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

export async function changePasswordOnServer(
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const oldHash = await hashPassword(oldPassword);
    const newHash = await hashPassword(newPassword);
    const baseUrl = getApiUrl();
    const response = await fetch(new URL("/api/profile/change-password", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPasswordHash: oldHash, newPasswordHash: newHash }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to change password" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
