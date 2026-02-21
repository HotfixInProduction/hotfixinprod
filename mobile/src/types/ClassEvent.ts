export interface ClassEvent {
  id: string;
  title: string;
  location: string;
  building: string;
  room: string;
  startTime: Date;
  endTime: Date;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  color: string;
}
