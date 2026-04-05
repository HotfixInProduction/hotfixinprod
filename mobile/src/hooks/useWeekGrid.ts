import { useState, useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { ClassEvent } from '../types/calendar';

export const START_HOUR = 7;
export const END_HOUR = 21;
export const TOTAL_HOURS = END_HOUR - START_HOUR;
export const TIME_COL_WIDTH = 40;
export const DAY_HEADER_HEIGHT = 52;
export const WEEK_DAY_INDICES = [1, 2, 3, 4, 5];

export function useWeekGrid() {
  const { width } = useWindowDimensions();
  const [gridHeight, setGridHeight] = useState(0);

  const hourHeight = gridHeight > 0 ? gridHeight / TOTAL_HOURS : 0;
  // Account for columns on both sides in the header (Time column/Left Arrow and Right Arrow)
  const dayColWidth = (width - 2 * TIME_COL_WIDTH) / 5;

  const getMondayOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEventStyle = useCallback(
    (cls: ClassEvent): { top: number; height: number } => {
      if (hourHeight === 0) return { top: 0, height: 0 };
      const startMins = cls.startTime.getHours() * 60 + cls.startTime.getMinutes();
      const endMins = cls.endTime.getHours() * 60 + cls.endTime.getMinutes();
      return {
        top: ((startMins - START_HOUR * 60) / 60) * hourHeight,
        height: Math.max(((endMins - startMins) / 60) * hourHeight, hourHeight * 0.4),
      };
    },
    [hourHeight]
  );

  return { hourHeight, dayColWidth, setGridHeight, getMondayOfWeek, getEventStyle };
}
