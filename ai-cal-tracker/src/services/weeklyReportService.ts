import { db } from "../config/firebase";

export interface WeeklyReportData {
  startDate: string;
  endDate: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalWaterMl: number;
  totalWorkouts: number;
  dailyData: {
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    waterMl: number;
    workouts: number;
  }[];
}

export async function getWeeklyReportData(userId: string): Promise<WeeklyReportData> {
  try {
    const { collection, getDocs, query, where, orderBy } = await import("firebase/firestore");
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    
    const dailyLogsRef = collection(db, "users", userId, "dailyLogs");
    const q = query(
      dailyLogsRef,
      where("date", ">=", startDateStr),
      where("date", "<=", endDateStr),
      orderBy("date")
    );
    const snap = await getDocs(q);
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalWaterMl = 0;
    let totalWorkouts = 0;
    const dailyData: WeeklyReportData["dailyData"] = [];
    
    snap.forEach((doc) => {
      const data = doc.data();
      const dayData = {
        date: data.date,
        calories: data.consumedCalories || 0,
        protein: data.consumedProtein || 0,
        carbs: data.consumedCarbs || 0,
        fats: data.consumedFats || 0,
        waterMl: data.consumedWater || 0,
        workouts: (data.workouts || []).length,
      };
      
      totalCalories += dayData.calories;
      totalProtein += dayData.protein;
      totalCarbs += dayData.carbs;
      totalFats += dayData.fats;
      totalWaterMl += dayData.waterMl;
      totalWorkouts += dayData.workouts;
      
      dailyData.push(dayData);
    });
    
    return {
      startDate: startDateStr,
      endDate: endDateStr,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      totalWaterMl,
      totalWorkouts,
      dailyData,
    };
  } catch (error) {
    console.error("[Weekly Report] Error fetching report data:", error);
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    return {
      startDate: weekAgo.toISOString().split("T")[0],
      endDate: today,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      totalWaterMl: 0,
      totalWorkouts: 0,
      dailyData: [],
    };
  }
}

// Generate HTML that can be converted to PDF or viewed directly
export function generateReportHTML(reportData: WeeklyReportData, userName: string = "User") {
  const weekNumber = Math.ceil(
    (new Date(reportData.endDate).getDate() +
      6 -
      new Date(reportData.endDate).getDay()) /
      7
  );
  
  let dailyRows = "";
  reportData.dailyData.forEach((day) => {
    dailyRows += `
      <tr>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${day.date}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0; text-align: right;">${day.calories}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0; text-align: right;">${day.protein}g</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0; text-align: right;">${day.carbs}g</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0; text-align: right;">${day.fats}g</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0; text-align: right;">${(day.waterMl / 1000).toFixed(1)}L</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0; text-align: right;">${day.workouts}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Weekly Nutrition Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #2e7d32; margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 16px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .summary-card { background: #f5f5f5; padding: 20px; border-radius: 12px; text-align: center; }
        .summary-value { font-size: 28px; font-weight: bold; color: #2e7d32; margin-bottom: 5px; }
        .summary-label { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #2e7d32; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Weekly Nutrition Report</h1>
      <p class="subtitle">${userName} • ${reportData.startDate} to ${reportData.endDate}</p>
      
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value">${reportData.totalCalories}</div>
          <div class="summary-label">Total Calories</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${(reportData.totalWaterMl / 1000).toFixed(1)}L</div>
          <div class="summary-label">Total Water</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${reportData.totalWorkouts}</div>
          <div class="summary-label">Total Workouts</div>
        </div>
      </div>

      <h2 style="margin-top: 40px; color: #333;">Daily Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Calories</th>
            <th>Protein</th>
            <th>Carbs</th>
            <th>Fats</th>
            <th>Water</th>
            <th>Workouts</th>
          </tr>
        </thead>
        <tbody>
          ${dailyRows}
        </tbody>
      </table>
      
      <div class="footer">
        Generated by AI Calorie Tracker
      </div>
    </body>
    </html>
  `;
}
