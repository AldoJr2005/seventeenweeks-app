import React, { useState } from "react";
import { View, StyleSheet, Image, Pressable, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useChallenge } from "@/hooks/useChallenge";
import { useWeeklyPhotos } from "@/hooks/useWeeklyData";
import { getApiUrl } from "@/lib/query-client";
import type { ProgressStackParamList } from "@/navigation/ProgressStackNavigator";
import type { WeeklyPhoto } from "@shared/schema";

const getImageUri = (uri: string) => {
  if (uri.startsWith('/')) {
    return `${getApiUrl()}${uri}`;
  }
  return uri;
};

type RouteParams = RouteProp<ProgressStackParamList, "PhotoCompare">;

const SCREEN_WIDTH = Dimensions.get("window").width;
const PHOTO_WIDTH = (SCREEN_WIDTH - Spacing.lg * 3) / 2;

export default function PhotoCompareScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteParams>();

  const { data: challenge } = useChallenge();
  const { data: weeklyPhotos } = useWeeklyPhotos(challenge?.id);

  const photos = (weeklyPhotos as WeeklyPhoto[] | undefined) || [];
  const availableWeeks = photos.map(p => p.weekNumber).sort((a, b) => a - b);

  const [week1, setWeek1] = useState(route.params?.week1 || availableWeeks[0] || 1);
  const [week2, setWeek2] = useState(route.params?.week2 || availableWeeks[availableWeeks.length - 1] || 1);
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider">("side-by-side");

  const sliderPosition = useSharedValue(0.5);

  const photo1 = photos.find(p => p.weekNumber === week1);
  const photo2 = photos.find(p => p.weekNumber === week2);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newPosition = e.absoluteX / SCREEN_WIDTH;
      sliderPosition.value = Math.max(0.1, Math.min(0.9, newPosition));
    });

  const sliderStyle = useAnimatedStyle(() => ({
    left: `${sliderPosition.value * 100}%`,
  }));

  const leftImageStyle = useAnimatedStyle(() => ({
    width: `${sliderPosition.value * 100}%`,
  }));

  if (availableWeeks.length < 1) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
        <Feather name="camera-off" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { marginTop: Spacing.lg }]}>No Photos Yet</ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Take weekly photos to compare your progress
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}
    >
      <View style={styles.modeToggle}>
        <Pressable
          style={[
            styles.modeButton,
            { backgroundColor: viewMode === "side-by-side" ? theme.primary : theme.backgroundDefault }
          ]}
          onPress={() => setViewMode("side-by-side")}
        >
          <Feather name="columns" size={16} color={viewMode === "side-by-side" ? "#FFF" : theme.text} />
          <ThemedText style={{ color: viewMode === "side-by-side" ? "#FFF" : theme.text, fontSize: 13 }}>
            Side by Side
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.modeButton,
            { backgroundColor: viewMode === "slider" ? theme.primary : theme.backgroundDefault }
          ]}
          onPress={() => setViewMode("slider")}
        >
          <Feather name="sliders" size={16} color={viewMode === "slider" ? "#FFF" : theme.text} />
          <ThemedText style={{ color: viewMode === "slider" ? "#FFF" : theme.text, fontSize: 13 }}>
            Slider
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.weekSelectors}>
        <View style={styles.weekSelector}>
          <ThemedText style={[styles.selectorLabel, { color: theme.textSecondary }]}>Before</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekButtons}>
            {availableWeeks.map(week => (
              <Pressable
                key={week}
                style={[
                  styles.weekButton,
                  { backgroundColor: week === week1 ? theme.primary : theme.backgroundDefault }
                ]}
                onPress={() => setWeek1(week)}
              >
                <ThemedText style={{ color: week === week1 ? "#FFF" : theme.text, fontSize: 13 }}>
                  W{week}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.weekSelector}>
          <ThemedText style={[styles.selectorLabel, { color: theme.textSecondary }]}>After</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekButtons}>
            {availableWeeks.map(week => (
              <Pressable
                key={week}
                style={[
                  styles.weekButton,
                  { backgroundColor: week === week2 ? theme.primary : theme.backgroundDefault }
                ]}
                onPress={() => setWeek2(week)}
              >
                <ThemedText style={{ color: week === week2 ? "#FFF" : theme.text, fontSize: 13 }}>
                  W{week}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {viewMode === "side-by-side" ? (
        <View style={styles.sideBySide}>
          <View style={styles.photoColumn}>
            {photo1 ? (
              <Image source={{ uri: getImageUri(photo1.imageUri) }} style={styles.sidePhoto} />
            ) : (
              <View style={[styles.emptyPhoto, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText style={{ color: theme.textSecondary }}>No photo</ThemedText>
              </View>
            )}
            <ThemedText style={[styles.photoLabel, { color: theme.textSecondary }]}>
              Week {week1}
            </ThemedText>
          </View>
          <View style={styles.photoColumn}>
            {photo2 ? (
              <Image source={{ uri: getImageUri(photo2.imageUri) }} style={styles.sidePhoto} />
            ) : (
              <View style={[styles.emptyPhoto, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText style={{ color: theme.textSecondary }}>No photo</ThemedText>
              </View>
            )}
            <ThemedText style={[styles.photoLabel, { color: theme.textSecondary }]}>
              Week {week2}
            </ThemedText>
          </View>
        </View>
      ) : (
        <GestureDetector gesture={panGesture}>
          <View style={styles.sliderContainer}>
            {photo2 ? (
              <Image source={{ uri: getImageUri(photo2.imageUri) }} style={styles.sliderPhoto} />
            ) : null}
            
            <Animated.View style={[styles.leftPhotoContainer, leftImageStyle]}>
              {photo1 ? (
                <Image source={{ uri: getImageUri(photo1.imageUri) }} style={styles.sliderPhotoLeft} />
              ) : null}
            </Animated.View>
            
            <Animated.View style={[styles.sliderHandle, sliderStyle, { backgroundColor: theme.backgroundRoot }]}>
              <View style={[styles.sliderLine, { backgroundColor: theme.primary }]} />
              <View style={[styles.sliderKnob, { backgroundColor: theme.primary }]}>
                <Feather name="chevrons-left" size={12} color="#FFF" />
                <Feather name="chevrons-right" size={12} color="#FFF" />
              </View>
            </Animated.View>

            <View style={styles.sliderLabels}>
              <ThemedText style={[styles.sliderLabel, { color: "#FFF" }]}>Week {week1}</ThemedText>
              <ThemedText style={[styles.sliderLabel, { color: "#FFF" }]}>Week {week2}</ThemedText>
            </View>
          </View>
        </GestureDetector>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.headline,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  modeToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  weekSelectors: {
    marginBottom: Spacing.xl,
  },
  weekSelector: {
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    ...Typography.footnote,
    marginBottom: Spacing.sm,
  },
  weekButtons: {
    flexDirection: "row",
  },
  weekButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  sideBySide: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  photoColumn: {
    flex: 1,
  },
  sidePhoto: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
  },
  emptyPhoto: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  photoLabel: {
    ...Typography.footnote,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  sliderContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  sliderPhoto: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  leftPhotoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },
  sliderPhotoLeft: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    height: "100%",
    position: "absolute",
    left: 0,
  },
  sliderHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 4,
    transform: [{ translateX: -2 }],
    alignItems: "center",
  },
  sliderLine: {
    width: 2,
    flex: 1,
  },
  sliderKnob: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderLabels: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    ...Typography.footnote,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
