import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { colors, spacing, borderRadius } from "../constants/Colors";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateDates(daysBack = 30, daysForward = 0) {
  const dates = [];
  const today = new Date();
  for (let i = -daysBack; i <= daysForward; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function DateSelector({ onDateSelect }: { onDateSelect?: (date: Date) => void }) {
  const dates = useRef(generateDates()).current;
  const today = new Date();

  // Normalize date comparison string (YYYY-MM-DD)
  const toDateString = (d: Date) => {
    const offset = d.getTimezoneOffset()
    d = new Date(d.getTime() - (offset * 60 * 1000))
    return d.toISOString().split('T')[0]
  };

  const todayStr = toDateString(today);
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  const todayIndex = dates.findIndex((d) => toDateString(d) === todayStr);

  const handleSelect = (d: Date) => {
    setSelectedDateStr(toDateString(d));
    if (onDateSelect) onDateSelect(d);
  };

  const renderItem = ({ item }: { item: Date }) => {
    const dateStr = toDateString(item);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDateStr;

    return (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
          isToday && !isSelected && styles.dateItemToday
        ]}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayText,
          isSelected && styles.textSelected,
          isToday && !isSelected && styles.textToday
        ]}>
          {DAYS[item.getDay()]}
        </Text>
        <View style={[
          styles.dateCircle,
          isSelected && styles.circleSelected,
          isToday && !isSelected && styles.circleToday
        ]}>
          <Text style={[
            styles.dateNum,
            isSelected && styles.textSelected,
            isToday && !isSelected && styles.textToday
          ]}>
            {item.getDate()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={dates}
        keyExtractor={(item) => toDateString(item)}
        renderItem={renderItem}
        initialScrollIndex={Math.max(0, todayIndex - 3)}
        getItemLayout={(data, index) => (
          { length: 64, offset: 64 * index, index } // Width + margin roughly
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  dateItem: {
    width: 52,
    alignItems: "center",
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: "transparent",
  },
  dateItemSelected: {
    backgroundColor: "rgba(41, 143, 80, 0.08)", // Slight primary tint background
  },
  dateItemToday: {
    // Normal style for today until it's selected
  },
  dayText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  circleSelected: {
    backgroundColor: colors.primary,
  },
  circleToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dateNum: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  textSelected: {
    color: colors.white,
  },
  textToday: {
    color: colors.primary,
  },
});
