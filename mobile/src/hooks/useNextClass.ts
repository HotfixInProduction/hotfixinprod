import { useMemo } from 'react';
import { ClassEvent } from '../types/calendar';

export function useNextClass(events: ClassEvent[], currentTime: Date): ClassEvent | null {
  return useMemo(() => {
    const now = new Date();
    const upcoming = events
      .filter(cls => cls.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    return upcoming[0] ?? null;
  }, [events, currentTime.getTime()]);
}
