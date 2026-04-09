import { describe, expect, it } from 'vitest';

import { calculateLearningStreakDays } from './learning-streak';

describe('calculateLearningStreakDays', () => {
  it('counts consecutive days ending today across viewed and interview records', () => {
    expect(
      calculateLearningStreakDays(
        {
          recentRecords: [{ startedAt: '2026-04-09T08:00:00+08:00' }, { startedAt: '2026-04-07T11:00:00+08:00' }],
          recentViewed: [{ viewedAt: '2026-04-08T21:00:00+08:00' }],
        },
        new Date('2026-04-09T12:00:00+08:00'),
      ),
    ).toBe(3);
  });

  it('returns zero when there is no activity today', () => {
    expect(
      calculateLearningStreakDays(
        {
          recentRecords: [{ startedAt: '2026-04-08T08:00:00+08:00' }],
        },
        new Date('2026-04-09T12:00:00+08:00'),
      ),
    ).toBe(0);
  });

  it('deduplicates multiple records on the same day', () => {
    expect(
      calculateLearningStreakDays(
        {
          recentRecords: [
            { startedAt: '2026-04-09T08:00:00+08:00' },
            { startedAt: '2026-04-09T09:00:00+08:00' },
          ],
          recentViewed: [{ viewedAt: '2026-04-08T21:00:00+08:00' }],
        },
        new Date('2026-04-09T12:00:00+08:00'),
      ),
    ).toBe(2);
  });
});
