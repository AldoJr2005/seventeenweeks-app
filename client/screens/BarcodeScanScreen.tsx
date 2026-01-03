import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { CameraView, Camera, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useChallenge } from "@/hooks/useChallenge";
import { useCreateFoodEntry } from "@/hooks/useFoodEntries";
import type { LogStackParamList } from "@/navigation/LogStackNavigator";

type RouteParams = RouteProp<LogStackParamList, "BarcodeScanner">;

interface ProductData {
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  barcode: string;
}

export default function BarcodeScanScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { date, mealType } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [servingsCount, setServingsCount] = useState(1);
  
  const { data: challenge } = useChallenge();
  const createFoodEntry = useCreateFoodEntry();

  const lookupBarcode = async (barcode: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};
        
        setProductData({
          name: product.product_name || "Unknown Product",
          brand: product.brands || undefined,
          calories: Math.round(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0),
          protein: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10,
          carbs: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10,
          fat: Math.round((nutriments.fat_100g || nutriments.fat || 0) * 10) / 10,
          servingSize: product.serving_size || "100g",
          barcode,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError("Product not found");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError("Failed to look up product");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    lookupBarcode(data);
  };

  const handleAddFood = async () => {
    if (!challenge || !productData) return;

    try {
      await createFoodEntry.mutateAsync({
        challengeId: challenge.id,
        date,
        mealType,
        foodName: productData.name,
        brand: productData.brand || null,
        barcode: productData.barcode,
        caloriesPerServing: productData.calories,
        proteinPerServing: productData.protein,
        carbsPerServing: productData.carbs,
        fatPerServing: productData.fat,
        servingLabel: productData.servingSize || null,
        servingsCount,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      (navigation as any).navigate("NutritionLog", { date });
    } catch (error) {
      setError("Failed to add food");
    }
  };

  const handleManualEntry = () => {
    navigation.goBack();
  };

  const handleScanAgain = () => {
    setScanned(false);
    setProductData(null);
    setError(null);
    setServingsCount(1);
  };

  if (Platform.OS === "web") {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.webFallback}>
          <Feather name="camera-off" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.webFallbackText, { color: theme.textSecondary }]}>
            Barcode scanning is available in Expo Go
          </ThemedText>
          <Button onPress={() => navigation.goBack()}>
            Enter Manually
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.permissionContainer}>
          <Feather name="camera" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
            Camera access is required to scan barcodes
          </ThemedText>
          <Button onPress={requestPermission}>
            Enable Camera
          </Button>
          <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}>
            <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {!scanned ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
          }}
        />
      ) : null}

      <Pressable
        style={[styles.closeButton, { top: insets.top + Spacing.md }]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="x" size={24} color="#fff" />
      </Pressable>

      {!scanned ? (
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <ThemedText style={styles.scanHint}>
            Position barcode within the frame
          </ThemedText>
        </View>
      ) : null}

      {loading ? (
        <View style={[styles.resultContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Card style={styles.resultCard}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
              Looking up nutrition...
            </ThemedText>
          </Card>
        </View>
      ) : null}

      {productData ? (
        <View style={[styles.resultContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Card style={styles.resultCard}>
            <ThemedText style={styles.productName}>{productData.name}</ThemedText>
            {productData.brand ? (
              <ThemedText style={[styles.productBrand, { color: theme.textSecondary }]}>
                {productData.brand}
              </ThemedText>
            ) : null}
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <ThemedText style={styles.nutritionValue}>{productData.calories}</ThemedText>
                <ThemedText style={[styles.nutritionLabel, { color: theme.textSecondary }]}>cal</ThemedText>
              </View>
              <View style={styles.nutritionItem}>
                <ThemedText style={styles.nutritionValue}>{productData.protein}g</ThemedText>
                <ThemedText style={[styles.nutritionLabel, { color: theme.textSecondary }]}>protein</ThemedText>
              </View>
              <View style={styles.nutritionItem}>
                <ThemedText style={styles.nutritionValue}>{productData.carbs}g</ThemedText>
                <ThemedText style={[styles.nutritionLabel, { color: theme.textSecondary }]}>carbs</ThemedText>
              </View>
              <View style={styles.nutritionItem}>
                <ThemedText style={styles.nutritionValue}>{productData.fat}g</ThemedText>
                <ThemedText style={[styles.nutritionLabel, { color: theme.textSecondary }]}>fat</ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.servingInfo, { color: theme.textSecondary }]}>
              Per {productData.servingSize}
            </ThemedText>

            <View style={styles.servingsRow}>
              <ThemedText>Servings:</ThemedText>
              <View style={styles.servingControls}>
                <Pressable
                  style={[styles.servingButton, { backgroundColor: theme.backgroundTertiary }]}
                  onPress={() => setServingsCount(Math.max(0.5, servingsCount - 0.5))}
                >
                  <Feather name="minus" size={16} color={theme.text} />
                </Pressable>
                <ThemedText style={styles.servingCount}>{servingsCount}</ThemedText>
                <Pressable
                  style={[styles.servingButton, { backgroundColor: theme.backgroundTertiary }]}
                  onPress={() => setServingsCount(servingsCount + 0.5)}
                >
                  <Feather name="plus" size={16} color={theme.text} />
                </Pressable>
              </View>
            </View>

            <View style={styles.resultButtons}>
              <Pressable
                style={[styles.scanAgainButton, { borderColor: theme.border }]}
                onPress={handleScanAgain}
              >
                <Feather name="refresh-cw" size={16} color={theme.textSecondary} />
                <ThemedText style={{ color: theme.textSecondary }}>Scan Again</ThemedText>
              </Pressable>
              <Button onPress={handleAddFood} style={styles.addButton}>
                Add to {mealType}
              </Button>
            </View>
          </Card>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.resultContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Card style={styles.resultCard}>
            <Feather name="alert-circle" size={32} color={theme.warning} />
            <ThemedText style={[styles.errorText, { color: theme.warning }]}>
              {error}
            </ThemedText>
            <View style={styles.resultButtons}>
              <Pressable
                style={[styles.scanAgainButton, { borderColor: theme.border }]}
                onPress={handleScanAgain}
              >
                <Feather name="refresh-cw" size={16} color={theme.textSecondary} />
                <ThemedText style={{ color: theme.textSecondary }}>Try Again</ThemedText>
              </Pressable>
              <Button onPress={handleManualEntry} style={styles.addButton}>
                Enter Manually
              </Button>
            </View>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeButton: {
    position: "absolute",
    left: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 280,
    height: 180,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#fff",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    color: "#fff",
    ...Typography.subheadline,
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  resultContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  resultCard: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  loadingText: {
    ...Typography.subheadline,
    marginTop: Spacing.md,
  },
  productName: {
    ...Typography.headline,
    fontWeight: "600",
    textAlign: "center",
  },
  productBrand: {
    ...Typography.subheadline,
    marginTop: Spacing.xs,
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: Spacing.lg,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    ...Typography.headline,
    fontWeight: "700",
  },
  nutritionLabel: {
    ...Typography.caption,
  },
  servingInfo: {
    ...Typography.footnote,
    marginBottom: Spacing.md,
  },
  servingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: Spacing.lg,
  },
  servingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  servingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  servingCount: {
    ...Typography.headline,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
  resultButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  scanAgainButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  addButton: {
    flex: 2,
  },
  errorText: {
    ...Typography.headline,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  permissionText: {
    ...Typography.subheadline,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: Spacing.md,
  },
  webFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  webFallbackText: {
    ...Typography.subheadline,
    textAlign: "center",
  },
});
