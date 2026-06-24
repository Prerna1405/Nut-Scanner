import { db } from "../config/firebase";

export interface AdminStats {
  totalUsers: number;
  activeUsers7Days: number;
  totalMealsLogged: number;
  totalWorkoutsLogged: number;
  totalWaterLogged: number;
  averageDailyCalories: number;
  appUsageLast7Days: { date: string; users: number }[];
}

export async function getAdminAnalytics(): Promise<AdminStats> {
  try {
    const { collection, getDocs, query, where, orderBy } = await import("firebase/firestore");
    
    // Get total users
    const usersCollection = collection(db, "users");
    const usersSnap = await getDocs(usersCollection);
    const totalUsers = usersSnap.size;
    
    // Get 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
    
    let totalMeals = 0;
    let totalWorkouts = 0;
    let totalWaterMl = 0;
    let totalCalories = 0;
    let usersWithLogs = 0;
    const activeUsers = new Set<string>();
    const usageByDate: Record<string, number> = {};

    // Iterate over all users to aggregate data
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      
      // Get user's daily logs from last 7 days
      const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore");
      const dailyLogsRef = collection(db, "users", userId, "dailyLogs");
      const logsQuery = query(dailyLogsRef, orderBy("date", "desc"), limit(30));
      const logsSnap = await getDocs(logsQuery);
      
      let userActive = false;
      let userCalories = 0;
      let userLogCount = 0;

      for (const logDoc of logsSnap.docs) {
        const logData = logDoc.data();
        const logDate = logData.date;
        
        // Check if log is in last 7 days
        if (logDate >= sevenDaysAgoStr) {
          userActive = true;
          activeUsers.add(userId);
          
          // Update usage by date
          if (!usageByDate[logDate]) usageByDate[logDate] = 0;
          usageByDate[logDate]++;
          
          // Aggregate meals
          if (logData.meals && Array.isArray(logData.meals)) {
            totalMeals += logData.meals.length;
          }
          
          // Aggregate workouts
          if (logData.workouts && Array.isArray(logData.workouts)) {
            totalWorkouts += logData.workouts.length;
          }
          
          // Aggregate water
          if (typeof logData.consumedWater === "number") {
            totalWaterMl += logData.consumedWater;
          }
          
          // Aggregate calories
          if (typeof logData.consumedCalories === "number") {
            userCalories += logData.consumedCalories;
            userLogCount++;
          }
        }
      }
      
      if (userLogCount > 0) {
        totalCalories += userCalories / userLogCount;
        usersWithLogs++;
      }
    }

    // Build app usage last 7 days array
    const appUsageLast7Days = Object.keys(usageByDate)
      .sort()
      .map((date) => ({
        date,
        users: usageByDate[date],
      }));

    return {
      totalUsers,
      activeUsers7Days: activeUsers.size,
      totalMealsLogged: totalMeals,
      totalWorkoutsLogged: totalWorkouts,
      totalWaterLogged: totalWaterMl,
      averageDailyCalories: usersWithLogs > 0 ? Math.round(totalCalories / usersWithLogs) : 0,
      appUsageLast7Days,
    };
  } catch (error) {
    console.error("[Admin Analytics] Error fetching analytics:", error);
    return {
      totalUsers: 0,
      activeUsers7Days: 0,
      totalMealsLogged: 0,
      totalWorkoutsLogged: 0,
      totalWaterLogged: 0,
      averageDailyCalories: 0,
      appUsageLast7Days: [],
    };
  }
}
