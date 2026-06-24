import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, shadows } from '../constants/Colors';
import { 
  useMealPlanner, 
  DAYS, 
  MEAL_TYPES, 
  UserProfile 
} from '../hooks/useMealPlanner';

export default function MealPlannerScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();

  const {
    loading,
    userProfile,
    mealPlan,
    mealLogs,
    saveProfile,
    generateWeekPlan,
    replaceMeal,
    logMeal,
    toggleFavorite,
    getDailyNutrition
  } = useMealPlanner();

  const [expandedDay, setExpandedDay] = useState<string>('Monday');
  const [mealPrepMode, setMealPrepMode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const weeklyStats = useMemo(() => {
    let totalCals = 0, totalProtein = 0;
    DAYS.forEach(day => {
      const nut = getDailyNutrition(day);
      totalCals += nut.cals;
      totalProtein += nut.protein;
    });
    return { 
      avgCals: Math.round(totalCals / 7), 
      avgProtein: Math.round(totalProtein / 7) 
    };
  }, [mealPlan]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const currentDayNutrition = getDailyNutrition(expandedDay);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Meal Planner',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
        }} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.headerTitle}>
                <Text style={{ color: '#16a34a' }}>AI</Text> Meal Planner
              </Text>
              <Text style={styles.headerSubtitle}>Your Personal Nutrition Coach</Text>
            </View>
            <TouchableOpacity style={styles.profileBtn} onPress={() => setShowProfileModal(true)}>
              <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.profileBtnText, { color: colors.textPrimary }]}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <StatCard icon="📊" label="Adherence" value="89%" color="green" />
          <StatCard icon="🔥" label="Avg Cals" value={weeklyStats.avgCals} color="orange" />
          <StatCard icon="🥩" label="Avg Protein" value={`${weeklyStats.avgProtein}g`} color="red" />
          <StatCard icon="🥗" label="Pantry Usage" value="72%" color="teal" />
          <StatCard icon="🎯" label="Goal" value={userProfile.goal.replace('-', ' ')} color="purple" isCapitalize />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => generateWeekPlan(mealPrepMode)}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.actionBtnPrimaryText}>Generate Week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtnOutline, mealPrepMode && styles.actionBtnOutlineActive]} 
            onPress={() => setMealPrepMode(!mealPrepMode)}
          >
            <Ionicons name="restaurant-outline" size={18} color={mealPrepMode ? '#7e22ce' : colors.textPrimary} />
            <Text style={[styles.actionBtnOutlineText, { color: mealPrepMode ? '#7e22ce' : colors.textPrimary }]}>
              {mealPrepMode ? 'Meal Prep: ON' : 'Meal Prep: OFF'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionBtnSecondary} 
            onPress={() => router.push('/recipe-shopping-list')}
          >
            <Ionicons name="cart-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnSecondaryText}>Shopping List</Text>
          </TouchableOpacity>
        </View>

        {/* Days Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS.map(day => {
            const nut = getDailyNutrition(day);
            const isSelected = expandedDay === day;
            const progress = Math.min(100, (nut.cals / userProfile.dailyCalories) * 100);

            return (
              <TouchableOpacity
                key={day}
                onPress={() => setExpandedDay(day)}
                style={[styles.dayCard, isSelected ? styles.dayCardActive : { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.dayName, isSelected ? styles.dayNameActive : { color: colors.textPrimary }]}>
                  {day.slice(0, 3)}
                </Text>
                <Text style={[styles.dayNut, isSelected ? styles.dayNutActive : { color: colors.textSecondary }]}>
                  {nut.cals} cal • {nut.protein}g pro
                </Text>
                <View style={styles.dayProgressBg}>
                  <View style={[styles.dayProgressFill, { width: `${progress}%`, backgroundColor: isSelected ? '#fff' : '#16a34a' }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Daily Plan Header */}
        <View style={styles.dailyPlanContainer}>
          <View style={styles.dailyPlanHeader}>
            <View>
              <Text style={styles.dailyPlanTitle}>
                <Ionicons name="calendar-outline" size={20} /> {expandedDay}
              </Text>
              <Text style={styles.dailyPlanSubtitle}>Your meal plan for the day</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.dailyPlanSubtitle}>Daily Target</Text>
              <Text style={styles.dailyPlanTarget}>
                {userProfile.dailyCalories} cal • {userProfile.proteinTarget}g pro
              </Text>
            </View>
          </View>

          {/* Daily Macros */}
          <View style={styles.macrosGrid}>
            <MacroCard label="Calories" current={currentDayNutrition.cals} target={userProfile.dailyCalories} unit="" color="orange" />
            <MacroCard label="Protein" current={currentDayNutrition.protein} target={userProfile.proteinTarget} unit="g" color="red" />
            <MacroCard label="Carbs" current={currentDayNutrition.carbs} target={userProfile.carbsTarget} unit="g" color="yellow" />
            <MacroCard label="Fat" current={currentDayNutrition.fat} target={userProfile.fatTarget} unit="g" color="blue" />
          </View>

          {/* Meals */}
          <View style={styles.mealsContainer}>
            {MEAL_TYPES.map(mealType => {
              const meal = mealPlan[expandedDay]?.[mealType];
              const log = mealLogs.find(l => l.id === `${expandedDay}-${mealType}`);
              const isAte = log?.status === 'ate';
              
              return (
                <View key={mealType} style={[styles.mealCard, { backgroundColor: isAte ? '#f0fdf4' : colors.surface, borderColor: isAte ? '#bbf7d0' : colors.border }]}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealType}>
                      <Ionicons name="time-outline" size={16} /> {mealType}
                    </Text>
                    {meal && (
                      <View style={styles.mealActions}>
                        <TouchableOpacity onPress={() => logMeal(expandedDay, mealType, 'ate')} style={[styles.iconBtn, isAte && styles.iconBtnActiveGreen]}>
                          <Ionicons name="checkmark-circle" size={20} color={isAte ? '#fff' : '#16a34a'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => logMeal(expandedDay, mealType, 'skipped')} style={[styles.iconBtn, log?.status === 'skipped' && styles.iconBtnActiveRed]}>
                          <Ionicons name="close-circle" size={20} color={log?.status === 'skipped' ? '#fff' : '#ef4444'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleFavorite(expandedDay, mealType)} style={[styles.iconBtn, log?.favorite && styles.iconBtnActivePink]}>
                          <Ionicons name={log?.favorite ? "heart" : "heart-outline"} size={20} color={log?.favorite ? '#fff' : '#db2777'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => replaceMeal(expandedDay, mealType)} style={styles.iconBtn}>
                          <Ionicons name="refresh" size={20} color="#2563eb" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {meal ? (
                    <View style={styles.mealContent}>
                      <Text style={styles.mealIcon}>{meal.icon}</Text>
                      <View style={styles.mealDetails}>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        <Text style={styles.mealDesc}>{meal.description}</Text>
                        <View style={styles.mealMeta}>
                          <Text style={styles.mealMetaCal}>{meal.nutrition.calories} cal</Text>
                          <Text style={styles.mealMetaPro}>{meal.nutrition.protein} protein</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.addMealBtn} onPress={() => replaceMeal(expandedDay, mealType)}>
                      <Ionicons name="add-circle-outline" size={32} color={colors.textSecondary} />
                      <Text style={[styles.addMealText, { color: colors.textSecondary }]}>Add Meal</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* Profile Modal */}
      <ProfileModal 
        profile={userProfile} 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        onSave={saveProfile} 
        colors={colors}
      />
    </View>
  );
}

function StatCard({ icon, label, value, color, isCapitalize }: any) {
  const getColors = () => {
    switch(color) {
      case 'green': return { bg: '#f0fdf4', border: '#dcfce7', text: '#15803d' };
      case 'orange': return { bg: '#fff7ed', border: '#ffedd5', text: '#c2410c' };
      case 'red': return { bg: '#fef2f2', border: '#fee2e2', text: '#b91c1c' };
      case 'teal': return { bg: '#f0fdfa', border: '#ccfbf1', text: '#0f766e' };
      case 'purple': return { bg: '#faf5ff', border: '#f3e8ff', text: '#7e22ce' };
      default: return { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563' };
    }
  };
  const theme = getColors();

  return (
    <View style={[{ backgroundColor: theme.bg, borderColor: theme.border }, stylesCard.card]}>
      <Text style={stylesCard.icon}>{icon}</Text>
      <Text style={[{ color: theme.text }, stylesCard.value, isCapitalize && { textTransform: 'capitalize' }]}>{value}</Text>
      <Text style={[stylesCard.label, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

const stylesCard = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: borderRadius.xl, borderWidth: 1, marginRight: spacing.sm, minWidth: 110 },
  icon: { fontSize: 24, marginBottom: 4 },
  value: { fontSize: 22, fontWeight: 'bold' },
  label: { fontSize: 12, marginTop: 2, opacity: 0.8 },
});

function MacroCard({ label, current, target, unit, color }: any) {
  const getColors = () => {
    switch(color) {
      case 'orange': return { bg: '#fff7ed', text: '#c2410c', fill: '#f97316' };
      case 'red': return { bg: '#fef2f2', text: '#b91c1c', fill: '#ef4444' };
      case 'yellow': return { bg: '#fefce8', text: '#a16207', fill: '#eab308' };
      case 'blue': return { bg: '#eff6ff', text: '#1d4ed8', fill: '#3b82f6' };
      default: return { bg: '#f3f4f6', text: '#4b5563', fill: '#9ca3af' };
    }
  };
  const theme = getColors();
  const progress = Math.min(100, (current / target) * 100) || 0;

  return (
    <View style={[stylesMacro.card, { backgroundColor: theme.bg }]}>
      <Text style={stylesMacro.label}>{label}</Text>
      <Text style={[stylesMacro.value, { color: theme.text }]}>{current} / {target}{unit}</Text>
      <View style={stylesMacro.barBg}>
        <View style={[stylesMacro.barFill, { width: `${progress}%`, backgroundColor: theme.fill }]} />
      </View>
    </View>
  );
}

const stylesMacro = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, flex: 1, minWidth: '45%' },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  value: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  barBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3 },
  barFill: { height: '100%', borderRadius: 3 },
});

function ProfileModal({ profile, isOpen, onClose, onSave, colors }: any) {
  const [goal, setGoal] = useState(profile.goal);
  const [dailyCalories, setDailyCalories] = useState(profile.dailyCalories.toString());

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={stylesModal.overlay}>
        <View style={[stylesModal.content, { backgroundColor: colors.surface }]}>
          <View style={stylesModal.header}>
            <Text style={[stylesModal.title, { color: colors.textPrimary }]}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Daily Calories Target</Text>
            <TextInput 
              style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} 
              value={dailyCalories} 
              onChangeText={setDailyCalories} 
              keyboardType="numeric" 
            />

            <Text style={[stylesModal.label, { color: colors.textSecondary }]}>Goal</Text>
            <TextInput 
              style={[stylesModal.input, { color: colors.textPrimary, borderColor: colors.border }]} 
              value={goal} 
              onChangeText={setGoal} 
              placeholder="e.g. weight-loss, maintenance"
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity 
              style={stylesModal.saveBtn} 
              onPress={() => {
                onSave({ ...profile, goal, dailyCalories: Number(dailyCalories) || 2000 });
                onClose();
              }}
            >
              <Text style={stylesModal.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const stylesModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  content: { borderRadius: 24, padding: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15 },
  saveBtn: { backgroundColor: '#16a34a', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
  headerSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  profileBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: 6 },
  profileBtnText: { fontWeight: '500' },
  statsScroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  actionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  actionBtnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  actionBtnPrimaryText: { color: '#fff', fontWeight: 'bold' },
  actionBtnOutline: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  actionBtnOutlineActive: { backgroundColor: '#f3e8ff', borderColor: '#d8b4fe' },
  actionBtnOutlineText: { fontWeight: '500' },
  actionBtnSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  actionBtnSecondaryText: { color: '#fff', fontWeight: 'bold' },
  daysScroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: 10 },
  dayCard: { padding: 16, borderRadius: 16, borderWidth: 1, width: 120 },
  dayCardActive: { backgroundColor: '#16a34a', borderColor: '#15803d', ...shadows.md },
  dayName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  dayNameActive: { color: '#fff' },
  dayNut: { fontSize: 12, marginBottom: 12 },
  dayNutActive: { color: '#dcfce7' },
  dayProgressBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3 },
  dayProgressFill: { height: '100%', borderRadius: 3 },
  dailyPlanContainer: { marginHorizontal: spacing.xl, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.xl },
  dailyPlanHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#f8fafc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dailyPlanTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  dailyPlanSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  dailyPlanTarget: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginTop: 2 },
  macrosGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 12 },
  mealsContainer: { padding: 20, paddingTop: 0, gap: 16 },
  mealCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealType: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' },
  mealActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 6, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  iconBtnActiveGreen: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  iconBtnActiveRed: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  iconBtnActivePink: { backgroundColor: '#db2777', borderColor: '#db2777' },
  mealContent: { flexDirection: 'row', gap: 12 },
  mealIcon: { fontSize: 32 },
  mealDetails: { flex: 1 },
  mealName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  mealDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  mealMeta: { flexDirection: 'row', gap: 12 },
  mealMetaCal: { fontSize: 13, fontWeight: '600', color: '#ea580c' },
  mealMetaPro: { fontSize: 13, fontWeight: '600', color: '#dc2626' },
  addMealBtn: { paddingVertical: 24, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: colors.border, borderRadius: 12 },
  addMealText: { marginTop: 8, fontWeight: '500' }
});
