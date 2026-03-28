export const INITIAL_REGION = {
  latitude: 45.497,
  longitude: -73.579,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

export const CAMPUSES = {
  downtown: {
    name: 'Downtown',
    latitude: 45.4972,
    longitude: -73.5789,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  },
  loyola: {
    name: 'Loyola',
    latitude: 45.4582,
    longitude: -73.6402,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  },
} as const;

export type CampusKey = keyof typeof CAMPUSES;

type ShuttleTerminal = { latitude: number; longitude: number };
type Coordinate = { latitude: number; longitude: number };

export type PlaceWithLocation = {
  location: {
    lat: number;
    lng: number;
  };
  name?: string;
  id?: string;
} | null;

type ShuttleDataParams = {
  now: Date;
  startCampus: CampusKey;
  destinationCampus: CampusKey;
};

type ShuttleRouteSegmentsParams = {
  start: NonNullable<PlaceWithLocation>;
  destination: NonNullable<PlaceWithLocation>;
  startCampus: CampusKey;
  destinationCampus: CampusKey;
};

export type ShuttleData = {
  directionLabel: string;
  loyScheduleLabels: string[];
  sgwScheduleLabels: string[];
  nextDepartureInMinutes: number;
  nextDepartureTimeLabel: string;
  totalDurationMinutes: number;
  serviceResumesNextWeekday: boolean;
};

export type ShuttleRouteSegments = {
  originTerminal: ShuttleTerminal;
  destinationTerminal: ShuttleTerminal;
  startWalking: Coordinate[] | null;
  destinationWalking: Coordinate[] | null;
};

const LOY_DEPARTURE_MINUTES = [
  9 * 60 + 15, 9 * 60 + 45, 10 * 60 + 15, 11 * 60 + 15, 11 * 60 + 45,
  12 * 60 + 15, 12 * 60 + 45, 13 * 60 + 15, 13 * 60 + 45, 14 * 60 + 15,
  14 * 60 + 45, 15 * 60 + 15, 15 * 60 + 45, 16 * 60 + 15, 16 * 60 + 45,
  17 * 60 + 45, 18 * 60 + 15, 18 * 60 + 45,
];

const SGW_DEPARTURE_MINUTES = [
  9 * 60 + 15, 9 * 60 + 45, 10 * 60 + 15, 10 * 60 + 45, 11 * 60 + 45,
  12 * 60 + 15, 12 * 60 + 45, 13 * 60 + 15, 13 * 60 + 45, 14 * 60 + 15,
  14 * 60 + 45, 15 * 60 + 15, 15 * 60 + 45, 16 * 60 + 15, 17 * 60 + 15,
  17 * 60 + 45, 18 * 60 + 15, 18 * 60 + 45,
];

const SHUTTLE_RIDE_MINUTES = 22;
export const SHUTTLE_DISTANCE_KM = 6.8;
const CAMPUS_MATCH_THRESHOLD_METERS = 2200;
const WALK_SEGMENT_VISIBILITY_THRESHOLD_METERS = 40;

const SHUTTLE_TERMINALS: Record<CampusKey, ShuttleTerminal> = {
  downtown: {
    latitude: 45.497105,
    longitude: -73.578501,
  },
  loyola: {
    latitude: 45.4579,
    longitude: -73.6395,
  },
};

export const SHUTTLE_SHERBROOKE_WAYPOINTS = [
  { latitude: 45.4822, longitude: -73.5997 },
  { latitude: 45.4726, longitude: -73.6119 },
];

const getDistanceInMeters = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) => {
  const earthRadiusMeters = 6371e3;
  const latitude1InRadians = latitude1 * Math.PI / 180;
  const latitude2InRadians = latitude2 * Math.PI / 180;
  const deltaLatitude = (latitude2 - latitude1) * Math.PI / 180;
  const deltaLongitude = (longitude2 - longitude1) * Math.PI / 180;
  const a = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(latitude1InRadians) * Math.cos(latitude2InRadians) *
    Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
};

const isShuttleWeekday = (date: Date) => date.getDay() >= 1 && date.getDay() <= 4;

const createShuttleDeparturesForDate = (date: Date, minutesList: number[]) =>
  minutesList.map((minutes) => {
    const departure = new Date(date);
    departure.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return departure;
  });

const getNextShuttleDeparture = (now: Date, minutesList: number[]) => {
  if (isShuttleWeekday(now)) {
    const todayDepartures = createShuttleDeparturesForDate(now, minutesList);
    const nextToday = todayDepartures.find((d) => d.getTime() >= now.getTime());
    if (nextToday) {
      return { nextDeparture: nextToday, serviceResumesNextWeekday: false };
    }
  }

  const nextDay = new Date(now);
  do {
    nextDay.setDate(nextDay.getDate() + 1);
  } while (!isShuttleWeekday(nextDay));

  const nextDayDepartures = createShuttleDeparturesForDate(nextDay, minutesList);
  return { nextDeparture: nextDayDepartures[0], serviceResumesNextWeekday: true };
};

const formatTimeLabel = (value: Date) =>
  value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const getCoordinates = (place: PlaceWithLocation): Coordinate | undefined => {
  if (!place) return undefined;
  return {
    latitude: place.location.lat,
    longitude: place.location.lng,
  };
};

export const getPlaceName = (place: PlaceWithLocation): string => {
  if (!place) return '';
  return place.name || place.id || '';
};

export const resolveCampusForPlace = (place: PlaceWithLocation): CampusKey | null => {
  if (!place) return null;

  const entries = Object.entries(CAMPUSES) as [CampusKey, (typeof CAMPUSES)[CampusKey]][];
  let bestMatch: CampusKey | null = null;
  let minDistance = Number.MAX_SAFE_INTEGER;

  entries.forEach(([campusKey, campus]) => {
    const distance = getDistanceInMeters(
      place.location.lat,
      place.location.lng,
      campus.latitude,
      campus.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = campusKey;
    }
  });

  if (minDistance > CAMPUS_MATCH_THRESHOLD_METERS) {
    return null;
  }

  return bestMatch;
};

export const buildShuttleData = ({
  now,
  startCampus,
  destinationCampus,
}: ShuttleDataParams): ShuttleData => {
  const departureMins = startCampus === 'loyola' ? LOY_DEPARTURE_MINUTES : SGW_DEPARTURE_MINUTES;
  const { nextDeparture, serviceResumesNextWeekday } = getNextShuttleDeparture(now, departureMins);
  const nextDepartureInMinutes = Math.max(
    0,
    Math.ceil((nextDeparture.getTime() - now.getTime()) / 60000)
  );

  const scheduleDate = isShuttleWeekday(now) ? now : null;
  const loyScheduleLabels = scheduleDate
    ? createShuttleDeparturesForDate(scheduleDate, LOY_DEPARTURE_MINUTES).map(formatTimeLabel)
    : [];
  const sgwScheduleLabels = scheduleDate
    ? createShuttleDeparturesForDate(scheduleDate, SGW_DEPARTURE_MINUTES).map(formatTimeLabel)
    : [];

  return {
    directionLabel: `${CAMPUSES[startCampus].name} → ${CAMPUSES[destinationCampus].name}`,
    loyScheduleLabels,
    sgwScheduleLabels,
    nextDepartureInMinutes,
    nextDepartureTimeLabel: formatTimeLabel(nextDeparture),
    totalDurationMinutes: SHUTTLE_RIDE_MINUTES + nextDepartureInMinutes,
    serviceResumesNextWeekday,
  };
};

export const buildShuttleRouteSegments = ({
  start,
  destination,
  startCampus,
  destinationCampus,
}: ShuttleRouteSegmentsParams): ShuttleRouteSegments => {
  const startCoordinates = getCoordinates(start)!;
  const destinationCoordinates = getCoordinates(destination)!;
  const originTerminal = SHUTTLE_TERMINALS[startCampus];
  const destinationTerminal = SHUTTLE_TERMINALS[destinationCampus];

  const shouldDrawStartWalkingSegment =
    getDistanceInMeters(
      startCoordinates.latitude,
      startCoordinates.longitude,
      originTerminal.latitude,
      originTerminal.longitude
    ) > WALK_SEGMENT_VISIBILITY_THRESHOLD_METERS;

  const shouldDrawDestinationWalkingSegment =
    getDistanceInMeters(
      destinationTerminal.latitude,
      destinationTerminal.longitude,
      destinationCoordinates.latitude,
      destinationCoordinates.longitude
    ) > WALK_SEGMENT_VISIBILITY_THRESHOLD_METERS;

  return {
    originTerminal,
    destinationTerminal,
    startWalking: shouldDrawStartWalkingSegment ? [startCoordinates, originTerminal] : null,
    destinationWalking: shouldDrawDestinationWalkingSegment ? [destinationTerminal, destinationCoordinates] : null,
  };
};
