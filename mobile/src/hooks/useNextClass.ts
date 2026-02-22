import { useEffect, useState } from 'react';
import { ClassEvent } from '../types/calendar';

export function useNextClass(events: ClassEvent[], currentTime: Date): ClassEvent | null {
  const [nextClass, setNextClass] = useState<ClassEvent | null>(null);

  useEffect(() => {
    const now = new Date();
    const upcoming = events
      .filter(cls => cls.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    setNextClass(upcoming[0] ?? null);
  }, [currentTime, events]);

  return nextClass;
}
