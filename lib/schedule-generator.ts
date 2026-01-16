function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function format(date: Date, formatStr: string): string {
  // Only supports 'h:mm a' format for this use case
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

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