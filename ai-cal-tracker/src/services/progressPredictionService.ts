export interface WeightHistory {
  date: string;
  weight: number;
}

export interface ProgressPrediction {
  currentWeight: number;
  averageWeightChangePerWeek: number;
  projectedWeightIn4Weeks: number;
  projectedWeightIn8Weeks: number;
  projectedWeightIn12Weeks: number;
  trend: "losing" | "gaining" | "stable";
  confidence: "low" | "medium" | "high";
}

export function predictProgress(
  weightHistory: WeightHistory[],
  dailyCaloriesLog: { date: string; deficit: number }[]
): ProgressPrediction {
  if (weightHistory.length < 2) {
    return {
      currentWeight: weightHistory.length > 0 ? weightHistory[0].weight : 0,
      averageWeightChangePerWeek: 0,
      projectedWeightIn4Weeks: weightHistory.length > 0 ? weightHistory[0].weight : 0,
      projectedWeightIn8Weeks: weightHistory.length > 0 ? weightHistory[0].weight : 0,
      projectedWeightIn12Weeks: weightHistory.length > 0 ? weightHistory[0].weight : 0,
      trend: "stable",
      confidence: "low",
    };
  }

  // Sort history by date
  const sortedHistory = [...weightHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstRecord = sortedHistory[0];
  const lastRecord = sortedHistory[sortedHistory.length - 1];
  const daysBetween =
    (new Date(lastRecord.date).getTime() - new Date(firstRecord.date).getTime()) /
    (1000 * 60 * 60 * 24);

  const totalWeightChange = lastRecord.weight - firstRecord.weight;
  const weeklyChange = (totalWeightChange / daysBetween) * 7;

  // Determine confidence
  let confidence: "low" | "medium" | "high" = "low";
  if (sortedHistory.length >= 14) confidence = "high";
  else if (sortedHistory.length >= 7) confidence = "medium";

  // Determine trend
  let trend: "losing" | "gaining" | "stable" = "stable";
  if (weeklyChange < -0.1) trend = "losing";
  else if (weeklyChange > 0.1) trend = "gaining";

  // Project future weights
  const currentWeight = lastRecord.weight;
  const projectedWeightIn4Weeks = currentWeight + weeklyChange * 4;
  const projectedWeightIn8Weeks = currentWeight + weeklyChange * 8;
  const projectedWeightIn12Weeks = currentWeight + weeklyChange * 12;

  return {
    currentWeight,
    averageWeightChangePerWeek: weeklyChange,
    projectedWeightIn4Weeks,
    projectedWeightIn8Weeks,
    projectedWeightIn12Weeks,
    trend,
    confidence,
  };
}
