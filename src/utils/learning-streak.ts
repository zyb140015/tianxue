import type { MockInterviewRecord, RecentViewedQuestionRecord } from '@/types';

type LearningActivity = Pick<MockInterviewRecord, 'startedAt'> | Pick<RecentViewedQuestionRecord, 'viewedAt'>;

function toLocalDayKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function shiftDayKey(dayKey: string, diffDays: number) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + diffDays);
  return toLocalDayKey(date.toISOString());
}

export function calculateLearningStreakDays(
  input: {
    recentRecords?: Array<Pick<MockInterviewRecord, 'startedAt'>>;
    recentViewed?: Array<Pick<RecentViewedQuestionRecord, 'viewedAt'>>;
  },
  now = new Date(),
) {
  const todayKey = toLocalDayKey(now.toISOString());

  if (!todayKey) {
    return 0;
  }

  const activityDayKeys = new Set(
    [...(input.recentRecords ?? []), ...(input.recentViewed ?? [])]
      .map((item: LearningActivity) => ('startedAt' in item ? item.startedAt : item.viewedAt))
      .map(toLocalDayKey)
      .filter((dayKey): dayKey is string => Boolean(dayKey)),
  );

  if (!activityDayKeys.size) {
    return 0;
  }

  let streak = 0;
  let cursor = todayKey;

  while (activityDayKeys.has(cursor)) {
    streak += 1;
    const previousDay = shiftDayKey(cursor, -1);

    if (!previousDay) {
      break;
    }

    cursor = previousDay;
  }

  return streak;
}
