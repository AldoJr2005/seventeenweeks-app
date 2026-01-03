import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useProfile, useVerifyPassword, useDeleteProfile } from "@/hooks/useProfile";
import { hashPassword, setSessionUnlocked, isSessionUnlocked, clearSession } from "@/lib/auth";
import type { UserProfile } from "@shared/schema";

interface AuthContextType {
  profile: UserProfile | null | undefined;
  isLoading: boolean;
  isUnlocked: boolean;
  needsSetup: boolean;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<void>;
  resetApp: () => Promise<void>;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: profile, isLoading: profileLoading, refetch } = useProfile();
  const verifyPassword = useVerifyPassword();
  const deleteProfile = useDeleteProfile();
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const checkSession = useCallback(async () => {
    if (profile) {
      const autoLock = profile.autoLockMinutes;
      const requirePassword = profile.requirePasswordOnOpen;
      
      if (!requirePassword) {
        setIsUnlocked(true);
        setCheckingSession(false);
        return;
      }
      
      const unlocked = await isSessionUnlocked(autoLock);
      setIsUnlocked(unlocked);
    }
    setCheckingSession(false);
  }, [profile]);

  useEffect(() => {
    if (!profileLoading) {
      checkSession();
    }
  }, [profileLoading, checkSession]);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    if (!profile) return false;
    
    try {
      const passwordHash = await hashPassword(password);
      const result = await verifyPassword.mutateAsync(passwordHash);
      
      if (result.valid) {
        await setSessionUnlocked(true);
        setIsUnlocked(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Unlock error:", error);
      return false;
    }
  }, [profile, verifyPassword]);

  const lock = useCallback(async () => {
    await clearSession();
    setIsUnlocked(false);
  }, []);

  const resetApp = useCallback(async () => {
    if (profile) {
      await deleteProfile.mutateAsync(profile.id);
      await clearSession();
      setIsUnlocked(false);
      refetch();
    }
  }, [profile, deleteProfile, refetch]);

  const refreshAuth = useCallback(() => {
    refetch();
  }, [refetch]);

  const isLoading = profileLoading || checkingSession;
  const needsSetup = !profileLoading && !profile;

  return (
    <AuthContext.Provider
      value={{
        profile: profile as UserProfile | null | undefined,
        isLoading,
        isUnlocked,
        needsSetup,
        unlock,
        lock,
        resetApp,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
