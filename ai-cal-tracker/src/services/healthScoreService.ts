export interface HealthScore {
  total: number;
  calories: number;
  hydration: number;
  exercise: number;
  nutrition: number;
  recommendations: string[];
}

export interface DailyData {
  caloriesConsumed: number;
  caloriesGoal: number;
  waterMl: number;
  waterGoal: number;
  exerciseMinutes: number;
  proteinConsumed: number;
  proteinGoal: number;
  carbsConsumed: number;
  carbsGoal: number;
  fatsConsumed: number;
  fatsGoal: number;
}

export function calculateHealthScore(data: DailyData): HealthScore {
  // Calculate each component (0-100)
  let calorieScore = 100;
  if (data.caloriesGoal > 0) {
    const ratio = data.caloriesConsumed / data.caloriesGoal;
    if (ratio < 0.8) {
      calorieScore = 80 + ratio * 20 / 0.8;
    } else if (ratio <= 1.2) {
      calorieScore = 100 - Math.abs(ratio - 1) * 50;
    } else {
      calorieScore = 100 - (ratio - 1.2) * 50;
    }
    calorieScore = Math.max(0, Math.min(100, calorieScore));
  }

  let hydrationScore = 100;
  if (data.waterGoal > 0) {
    hydrationScore = Math.min(100, (data.waterMl / data.waterGoal) * 100);
  }

  let exerciseScore = 0;
  if (data.exerciseMinutes >= 30) {
    exerciseScore = 100;
  } else if (data.exerciseMinutes > 0) {
    exerciseScore = (data.exerciseMinutes / 30) * 100;
  }

  let nutritionScore = 0;
  let hasGoals = false;
  let macroCount = 0;
  let totalMacroScore = 0;

  if (data.proteinGoal > 0) {
    hasGoals = true;
    macroCount++;
    const proteinRatio = Math.min(1.5, data.proteinConsumed / data.proteinGoal);
    totalMacroScore += 100 - Math.abs(proteinRatio - 1) * 60;
  }
  if (data.carbsGoal > 0) {
    hasGoals = true;
    macroCount++;
    const carbsRatio = Math.min(1.5, data.carbsConsumed / data.carbsGoal);
    totalMacroScore += 100 - Math.abs(carbsRatio - 1) * 60;
  }
  if (data.fatsGoal > 0) {
    hasGoals = true;
    macroCount++;
    const fatsRatio = Math.min(1.5, data.fatsConsumed / data.fatsGoal);
    totalMacroScore += 100 - Math.abs(fatsRatio - 1) * 60;
  }

  nutritionScore = hasGoals ? Math.max(0, Math.min(100, totalMacroScore / macroCount)) : 70;

  // Calculate total score with weights
  const total = Math.round(
    calorieScore * 0.3 +
    hydrationScore * 0.25 +
    exerciseScore * 0.25 +
    nutritionScore * 0.2
  );

  // Generate recommendations
  const recommendations: string[] = [];
  if (hydrationScore < 70) {
    recommendations.push("Drink more water! Aim for your daily hydration goal.");
  }
  if (exerciseScore < 50) {
    recommendations.push("Try to get at least 30 minutes of physical activity today.");
  }
  if (calorieScore < 70) {
    const calorieDiff = data.caloriesConsumed - data.caloriesGoal;
    if (calorieDiff < 0) {
      recommendations.push("You're below your calorie goal. Consider adding a healthy snack.");
    } else {
      recommendations.push("You've exceeded your calorie goal. Be mindful of portions for the rest of the day.");
    }
  }
  if (nutritionScore < 70) {
    recommendations.push("Focus on balancing your protein, carbs, and fats for better nutrition.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Great job! You're on track with your health goals today.");
  }

  return {
    total: Math.max(0, Math.min(100, total)),
    calories: Math.round(calorieScore),
    hydration: Math.round(hydrationScore),
    exercise: Math.round(exerciseScore),
    nutrition: Math.round(nutritionScore),
    recommendations,
  };
}
