import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useChallenge } from "@/hooks/useChallenge";
import { useWeeklyPhotos, useWeeklyCheckIns, useCreateWeeklyPhoto, useCreateWeeklyCheckIn, useUpdateWeeklyCheckIn, useUpdateWeeklyPhoto } from "@/hooks/useWeeklyData";
import { getMondayDateForWeek, isMonday, getToday } from "@/lib/date-utils";
import { savePhotoToPermanentStorage, getPhotoInfo, PhotoStatus } from "@/lib/photo-storage";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import type { WeeklyPhoto, WeeklyCheckIn } from "@shared/schema";

type RouteParams = RouteProp<HomeStackParamList, "WeeklyCheckIn">;

export default function WeeklyCheckInScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const weekNumber = route.params?.weekNumber || 1;

  const { data: challenge } = useChallenge();
  const { data: weeklyPhotos } = useWeeklyPhotos(challenge?.id);
  const { data: weeklyCheckIns } = useWeeklyCheckIns(challenge?.id);
  const createPhoto = useCreateWeeklyPhoto();
  const createCheckIn = useCreateWeeklyCheckIn();
  const updateCheckIn = useUpdateWeeklyCheckIn();

  const existingPhoto = (weeklyPhotos as WeeklyPhoto[] | undefined)?.find(p => p.weekNumber === weekNumber);
  const existingCheckIn = (weeklyCheckIns as WeeklyCheckIn[] | undefined)?.find(c => c.weekNumber === weekNumber);
  const updatePhoto = useUpdateWeeklyPhoto();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<PhotoStatus>("none");
  const [isNewPhoto, setIsNewPhoto] = useState(false);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [chest, setChest] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const checkExistingPhoto = async () => {
      if (existingPhoto) {
        const info = await getPhotoInfo(existingPhoto.imageUri);
        setPhotoStatus(info.status);
        if (info.status === "available") {
          setPhotoUri(existingPhoto.imageUri);
        } else {
          setPhotoUri(null);
        }
        setIsNewPhoto(false);
      } else {
        setPhotoStatus("none");
        setPhotoUri(null);
        setIsNewPhoto(false);
      }
    };
    checkExistingPhoto();
    
    if (existingCheckIn) {
      setWeight(existingCheckIn.weight?.toString() || "");
      setWaist(existingCheckIn.waist?.toString() || "");
      setHips(existingCheckIn.hips?.toString() || "");
      setChest(existingCheckIn.chest?.toString() || "");
      setNotes(existingCheckIn.notes || "");
    }
  }, [existingPhoto, existingCheckIn]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setIsNewPhoto(true);
      setPhotoStatus("available");
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setIsNewPhoto(true);
      setPhotoStatus("available");
    }
  };

  const handleSave = async () => {
    if (!challenge) return;

    const mondayDate = getMondayDateForWeek(challenge.startDate, weekNumber);
    const isLate = !isMonday() && getToday() !== mondayDate;

    try {
      if (photoUri && isNewPhoto) {
        const permanentUri = await savePhotoToPermanentStorage(
          photoUri,
          challenge.id,
          weekNumber,
          true
        );
        
        if (existingPhoto) {
          await updatePhoto.mutateAsync({
            id: existingPhoto.id,
            data: { imageUri: permanentUri, isLate },
          });
        } else {
          await createPhoto.mutateAsync({
            challengeId: challenge.id,
            weekNumber,
            mondayDate,
            imageUri: permanentUri,
            isLate,
          });
        }
      }

      const checkInData = {
        challengeId: challenge.id,
        weekNumber,
        weight: weight ? parseFloat(weight) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        chest: chest ? parseFloat(chest) : null,
        notes: notes || null,
      };

      if (existingCheckIn) {
        await updateCheckIn.mutateAsync({ id: existingCheckIn.id, data: checkInData });
      } else if (weight) {
        await createCheckIn.mutateAsync(checkInData);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save check-in");
    }
  };

  const isSaving = createPhoto.isPending || createCheckIn.isPending || updateCheckIn.isPending || updatePhoto.isPending;
  const unit = challenge?.unit || "lbs";

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }
      ]}
    >
      <ThemedText style={styles.weekTitle}>Week {weekNumber} Check-In</ThemedText>

      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Progress Photo</ThemedText>
        
        {photoStatus === "missing" && existingPhoto ? (
          <View style={[styles.missingPhotoContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={[styles.missingPhotoIcon, { backgroundColor: theme.warningBackground || theme.backgroundSecondary }]}>
              <Feather name="alert-triangle" size={32} color={theme.warning} />
            </View>
            <ThemedText style={[styles.missingPhotoText, { color: theme.textSecondary }]}>
              This photo is no longer available on this device
            </ThemedText>
            <View style={styles.reuploadButtons}>
              <Pressable
                style={[styles.reuploadButton, { backgroundColor: theme.primary }]}
                onPress={handleTakePhoto}
              >
                <Feather name="camera" size={20} color="#FFF" />
                <ThemedText style={styles.reuploadButtonText}>Re-take</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.reuploadButton, { backgroundColor: theme.primary }]}
                onPress={handlePickImage}
              >
                <Feather name="image" size={20} color="#FFF" />
                <ThemedText style={styles.reuploadButtonText}>Re-upload</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : photoUri ? (
          <Pressable onPress={handlePickImage} style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <View style={[styles.photoOverlay, { backgroundColor: "rgba(0,0,0,0.3)" }]}>
              <Feather name="camera" size={24} color="#FFF" />
              <ThemedText style={styles.changePhotoText}>Change Photo</ThemedText>
            </View>
            {existingPhoto?.isLate ? (
              <View style={[styles.lateBadge, { backgroundColor: theme.warning }]}>
                <ThemedText style={styles.lateBadgeText}>Late</ThemedText>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <View style={styles.photoButtons}>
            <Pressable
              style={[styles.photoButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={handleTakePhoto}
            >
              <Feather name="camera" size={32} color={theme.primary} />
              <ThemedText style={{ color: theme.text }}>Take Photo</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.photoButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={handlePickImage}
            >
              <Feather name="image" size={32} color={theme.primary} />
              <ThemedText style={{ color: theme.text }}>Choose Photo</ThemedText>
            </Pressable>
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Weigh-In</ThemedText>
        
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Weight ({unit})
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.weightInput,
              { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            placeholder="0.0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Measurements (optional)</ThemedText>
        
        <View style={styles.measurementsRow}>
          <View style={styles.measurementInput}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Waist
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="in"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={waist}
              onChangeText={setWaist}
            />
          </View>
          <View style={styles.measurementInput}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Hips
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="in"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={hips}
              onChangeText={setHips}
            />
          </View>
          <View style={styles.measurementInput}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Chest
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="in"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={chest}
              onChangeText={setChest}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Notes
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            placeholder="How are you feeling this week?"
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>
      </Card>

      <Button
        onPress={handleSave}
        disabled={isSaving}
        style={styles.saveButton}
      >
        {isSaving ? "Saving..." : "Save Check-In"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  weekTitle: {
    ...Typography.title2,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.lg,
  },
  photoButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  photoButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  photoPreview: {
    position: "relative",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  changePhotoText: {
    color: "#FFF",
    fontWeight: "600",
  },
  lateBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  lateBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  missingPhotoContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  missingPhotoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  missingPhotoText: {
    ...Typography.body,
    textAlign: "center",
  },
  reuploadButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  reuploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  reuploadButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.footnote,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  weightInput: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  measurementsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  measurementInput: {
    flex: 1,
  },
  notesInput: {
    height: 80,
    paddingTop: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});
