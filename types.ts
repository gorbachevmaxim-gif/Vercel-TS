export interface CityCoordinates {
  lat: number;
  lon: number;
}

export interface CityMap {
  [key: string]: CityCoordinates;
}

export interface Place {
  name: string;
  type: string; // e.g. "Кафе", "Ресторан", "Кофейня"
  url?: string; // Link to Yandex Maps
  address?: string;
  rating?: string;
}

export interface WeatherDayStats {
  dateObj: Date;
  dateStr: string;
  dayName: string;
  isDry: boolean;
  isMorningRideSuitable: boolean;
  hasRoute: boolean; // New field to indicate if a GPX file exists
  precipSum: number;
  rainHours: string | null;
  tempRange: string;
  feelsRange: string;
  windRange: string;
  windGusts: number;
  windDir: string;
  windDirFull: string;
  windDeg: number;
  sunSeconds: number;
  sunStr: string;
  accuracy: 'High' | 'Medium' | 'Low';
  clothingHints: string[];

  rideDuration?: string;
  startTemperature?: number;
  endTemperature?: number;
}

export interface CityAnalysisResult {
  cityName: string;
  weekend1: {
    saturday: WeatherDayStats | null;
    sunday: WeatherDayStats | null;
  };
  weekend2: {
    saturday: WeatherDayStats | null;
    sunday: WeatherDayStats | null;
  };
}

export interface LoadingState {
  total: number;
  current: number;
  status: string;
}