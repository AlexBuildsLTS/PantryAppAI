import { addMinutes, format, startOfDay } from 'date-fns';

interface ScheduleSlot {
  time: string;
  activity: string;
  type: 'SLEEP' | 'FEED' | 'PLAY';
}

export const generateDailySchedule = (firstWakeTime: Date, ageInMonths: number): ScheduleSlot[] => {
  // Wake window settings based on age (in minutes)
  const window = ageInMonths < 4 ? 90 : ageInMonths < 7 ? 120 : 180;
  
  const schedule: ScheduleSlot[] = [];
  let currentTime = firstWakeTime;

  // Generate 4 cycles for the day
  for (let i = 0; i < 4; i++) {
    const nextNap = addMinutes(currentTime, window);
    schedule.push({
      time: format(nextNap, 'h:mm a'),
      activity: `Nap ${i + 1}`,
      type: 'SLEEP'
    });
    // Assume 1 hour nap
    currentTime = addMinutes(nextNap, 60);
  }

  return schedule;
};