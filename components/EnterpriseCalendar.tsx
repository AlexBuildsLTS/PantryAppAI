import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ThemeColors {
  primary: string;
  surface: string;
  border: string;
  text: string;
}

interface EnterpriseCalendarProps {
  colors: ThemeColors;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

/**
 * EnterpriseCalendar
 * A visual month grid for picking expiry dates without manual typing.
 */
const EnterpriseCalendar: React.FC<EnterpriseCalendarProps> = ({
  colors,
  selectedDate,
  onDateChange,
}) => {
  const [viewDate, setViewDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Padding for month start
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const headerLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateChange(date.toISOString());
  };

  return (
    <View style={[styles.calContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.calMonthText, { color: colors.text }]}>{headerLabel.toUpperCase()}</Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <Feather name="chevron-right" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.calGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <View key={d} style={styles.calDayHeader}>
            <Text style={styles.calDayHeaderText}>{d}</Text>
          </View>
        ))}
        {daysInMonth.map((date, i) => {
          if (!date) return <View key={`p-${i}`} style={styles.calDayCell} />;
          const isSelected = date.toISOString().split('T')[0] === selectedDate.split('T')[0];
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleDateSelect(date)}
              style={[styles.calDayCell, isSelected && { backgroundColor: colors.primary, borderRadius: 12 }]}
            >
              <Text style={[styles.calDayText, { color: isSelected ? 'white' : colors.text }]}>{date.getDate()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calContainer: { marginHorizontal: 24, borderRadius: 32, padding: 20, borderWidth: 1 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calMonthText: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayHeader: { width: (Dimensions.get('window').width - 88) / 7, height: 30, alignItems: 'center', justifyContent: 'center' },
  calDayHeaderText: { color: 'rgba(0,0,0,0.3)', fontWeight: '800', fontSize: 12 },
  calDayCell: { width: (Dimensions.get('window').width - 88) / 7, height: 45, alignItems: 'center', justifyContent: 'center' },
  calDayText: { fontSize: 15, fontWeight: '600' },
});

export default EnterpriseCalendar;