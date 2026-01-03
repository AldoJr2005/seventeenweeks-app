import React from "react";
import { View, StyleSheet, FlatList, Image, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useChallenge } from "@/hooks/useChallenge";
import { useWeeklyPhotos } from "@/hooks/useWeeklyData";
import type { ProgressStackParamList } from "@/navigation/ProgressStackNavigator";
import type { WeeklyPhoto } from "@shared/schema";

type NavigationProp = NativeStackNavigationProp<ProgressStackParamList>;

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_GAP = Spacing.sm;
const GRID_PADDING = Spacing.lg;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function PhotosScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { data: challenge, isLoading: challengeLoading } = useChallenge();
  const { data: weeklyPhotos, isLoading: photosLoading } = useWeeklyPhotos(challenge?.id);

  const weeks = Array.from({ length: 17 }, (_, i) => i + 1);
  const photos = weeklyPhotos as WeeklyPhoto[] | undefined;

  const getPhotoForWeek = (weekNumber: number) => {
    return photos?.find(p => p.weekNumber === weekNumber);
  };

  if (challengeLoading || photosLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderItem = ({ item: weekNumber }: { item: number }) => {
    const photo = getPhotoForWeek(weekNumber);
    
    return (
      <Pressable
        style={[styles.photoItem, { width: ITEM_WIDTH }]}
        onPress={() => {
          if (photo) {
            navigation.navigate("PhotoCompare", { week1: weekNumber });
          }
        }}
      >
        {photo ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photo.imageUri }} style={styles.photo} />
            {photo.isLate ? (
              <View style={[styles.lateBadge, { backgroundColor: theme.warning }]}>
                <ThemedText style={styles.lateBadgeText}>Late</ThemedText>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.emptyPhoto, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="camera" size={24} color={theme.textSecondary} />
          </View>
        )}
        <ThemedText style={[styles.weekLabel, { color: theme.textSecondary }]}>
          Week {weekNumber}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: GRID_PADDING,
      }}
      data={weeks}
      renderItem={renderItem}
      keyExtractor={(item) => item.toString()}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={styles.row}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Photo Timeline</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {photos?.length || 0} of 17 photos taken
          </ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    ...Typography.title2,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.subheadline,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  photoItem: {
    alignItems: "center",
  },
  photoContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  emptyPhoto: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  lateBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lateBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  weekLabel: {
    ...Typography.footnote,
    marginTop: Spacing.xs,
  },
});
