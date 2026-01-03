import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, Pressable, LayoutChangeEvent } from "react-native";
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { WeeklyCheckIn } from "@shared/schema";

interface WeightChartProps {
  checkIns: WeeklyCheckIn[];
  startWeight: number;
  goalWeight: number | null;
  unit: string;
}

const CHART_HEIGHT = 180;
const CHART_PADDING_LEFT = 45;
const CHART_PADDING_RIGHT = 16;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_BOTTOM = 30;

export function WeightChart({ checkIns, startWeight, goalWeight, unit }: WeightChartProps) {
  const { theme } = useTheme();
  const [selectedPoint, setSelectedPoint] = useState<WeeklyCheckIn | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setChartWidth(width);
  }, []);

  const sortedCheckIns = useMemo(() => 
    [...checkIns].sort((a, b) => a.weekNumber - b.weekNumber),
    [checkIns]
  );

  const hasEnoughData = sortedCheckIns.length >= 3;

  const { minWeight, maxWeight, yScale, xScale, pathData, pacePathData, areaData } = useMemo(() => {
    if (sortedCheckIns.length === 0 || chartWidth === 0) {
      return { minWeight: 0, maxWeight: 0, yScale: () => 0, xScale: () => 0, pathData: "", pacePathData: "", areaData: "" };
    }

    const weights = sortedCheckIns.map(c => c.weight || startWeight);
    const allWeights = [...weights, startWeight];
    if (goalWeight) allWeights.push(goalWeight);

    const min = Math.floor(Math.min(...allWeights) - 5);
    const max = Math.ceil(Math.max(...allWeights) + 5);
    const range = max - min;

    const innerWidth = chartWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
    const innerHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

    const yScaleFn = (weight: number) => {
      return CHART_PADDING_TOP + ((max - weight) / range) * innerHeight;
    };

    const xScaleFn = (week: number) => {
      return CHART_PADDING_LEFT + ((week - 1) / 16) * innerWidth;
    };

    let path = "";
    let area = "";
    
    if (sortedCheckIns.length > 0) {
      const points = sortedCheckIns.map(c => ({
        x: xScaleFn(c.weekNumber),
        y: yScaleFn(c.weight || startWeight)
      }));

      if (points.length === 1) {
        path = "";
      } else if (points.length === 2) {
        path = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
      } else {
        path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const cpx = (prev.x + curr.x) / 2;
          path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
        }

        const bottomY = CHART_HEIGHT - CHART_PADDING_BOTTOM;
        area = path + ` L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
      }
    }

    let pacePath = "";
    if (goalWeight && startWeight) {
      const pacePoints = [
        { x: xScaleFn(1), y: yScaleFn(startWeight) },
        { x: xScaleFn(17), y: yScaleFn(goalWeight) }
      ];
      pacePath = `M ${pacePoints[0].x} ${pacePoints[0].y} L ${pacePoints[1].x} ${pacePoints[1].y}`;
    }

    return { 
      minWeight: min, 
      maxWeight: max, 
      yScale: yScaleFn, 
      xScale: xScaleFn, 
      pathData: path,
      pacePathData: pacePath,
      areaData: area
    };
  }, [sortedCheckIns, startWeight, goalWeight, chartWidth]);

  const weekMarkers = [1, 5, 9, 13, 17];
  const yAxisLabels = useMemo(() => {
    if (maxWeight === 0) return [];
    const range = maxWeight - minWeight;
    const step = Math.ceil(range / 4 / 5) * 5;
    const labels: number[] = [];
    for (let w = Math.ceil(minWeight / step) * step; w <= maxWeight; w += step) {
      labels.push(w);
    }
    return labels;
  }, [minWeight, maxWeight]);

  if (!hasEnoughData) {
    return (
      <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          Add a few weigh-ins to see your trend
        </ThemedText>
        <ThemedText style={[styles.emptySubtext, { color: theme.neutral }]}>
          {sortedCheckIns.length} of 3 minimum check-ins recorded
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {selectedPoint ? (
        <Animated.View 
          entering={FadeIn.duration(150)} 
          exiting={FadeOut.duration(150)}
          style={[styles.tooltip, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
        >
          <ThemedText style={styles.tooltipWeek}>Week {selectedPoint.weekNumber}</ThemedText>
          <ThemedText style={[styles.tooltipWeight, { color: theme.primary }]}>
            {selectedPoint.weight} {unit}
          </ThemedText>
        </Animated.View>
      ) : null}

      {chartWidth > 0 ? (
        <>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={theme.primary} stopOpacity={0.3} />
                <Stop offset="100%" stopColor={theme.primary} stopOpacity={0.05} />
              </LinearGradient>
            </Defs>

            {yAxisLabels.map((label) => (
              <Line
                key={label}
                x1={CHART_PADDING_LEFT}
                y1={yScale(label)}
                x2={chartWidth - CHART_PADDING_RIGHT}
                y2={yScale(label)}
                stroke={theme.border}
                strokeWidth={0.5}
                strokeDasharray="4,4"
                opacity={0.5}
              />
            ))}

            {yAxisLabels.map((label) => (
              <SvgText
                key={`label-${label}`}
                x={CHART_PADDING_LEFT - 8}
                y={yScale(label) + 4}
                fontSize={10}
                fill={theme.neutral}
                textAnchor="end"
              >
                {label}
              </SvgText>
            ))}

            {weekMarkers.map((week) => (
              <SvgText
                key={`week-${week}`}
                x={xScale(week)}
                y={CHART_HEIGHT - 8}
                fontSize={10}
                fill={theme.neutral}
                textAnchor="middle"
              >
                {week}
              </SvgText>
            ))}

            {goalWeight ? (
              <Line
                x1={CHART_PADDING_LEFT}
                y1={yScale(goalWeight)}
                x2={chartWidth - CHART_PADDING_RIGHT}
                y2={yScale(goalWeight)}
                stroke={theme.success}
                strokeWidth={1.5}
                strokeDasharray="6,4"
                opacity={0.8}
              />
            ) : null}

            {pacePathData ? (
              <Path
                d={pacePathData}
                stroke={theme.neutral}
                strokeWidth={1}
                strokeDasharray="4,4"
                fill="none"
                opacity={0.4}
              />
            ) : null}

            {areaData ? (
              <Path
                d={areaData}
                fill="url(#areaGradient)"
              />
            ) : null}

            {pathData ? (
              <Path
                d={pathData}
                stroke={theme.primary}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {sortedCheckIns.map((checkIn) => (
              <Circle
                key={checkIn.id}
                cx={xScale(checkIn.weekNumber)}
                cy={yScale(checkIn.weight || startWeight)}
                r={selectedPoint?.id === checkIn.id ? 7 : 5}
                fill={selectedPoint?.id === checkIn.id ? theme.primary : theme.backgroundRoot}
                stroke={theme.primary}
                strokeWidth={2.5}
              />
            ))}
          </Svg>

          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {sortedCheckIns.map((checkIn) => {
              const cx = xScale(checkIn.weekNumber);
              const cy = yScale(checkIn.weight || startWeight);
              return (
                <Pressable
                  key={`touch-${checkIn.id}`}
                  style={[
                    styles.touchTarget,
                    {
                      left: cx - 20,
                      top: cy - 20,
                    }
                  ]}
                  onPress={() => setSelectedPoint(selectedPoint?.id === checkIn.id ? null : checkIn)}
                />
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.legend}>
        {goalWeight ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { backgroundColor: theme.success }]} />
            <ThemedText style={[styles.legendText, { color: theme.neutral }]}>
              Goal ({goalWeight} {unit})
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: theme.neutral, opacity: 0.4 }]} />
          <ThemedText style={[styles.legendText, { color: theme.neutral }]}>Target pace</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    minHeight: CHART_HEIGHT,
  },
  emptyState: {
    height: CHART_HEIGHT,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  emptyText: {
    ...Typography.subheadline,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.footnote,
    textAlign: "center",
  },
  tooltip: {
    position: "absolute",
    top: -8,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    zIndex: 10,
  },
  tooltipWeek: {
    ...Typography.caption,
    fontWeight: "500",
  },
  tooltipWeight: {
    ...Typography.headline,
    fontWeight: "600",
  },
  touchTarget: {
    position: "absolute",
    width: 40,
    height: 40,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDash: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    ...Typography.caption,
  },
});
