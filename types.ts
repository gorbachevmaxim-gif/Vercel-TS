export interface CityCoordinates {
  lat: number;
  lon: number;
}

export interface CityMap {
  [key: string]: CityCoordinates;
}

export interface WeatherDayStats {
  dateObj: Date;
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Суббота / Воскресенье
  isDry: boolean;
  precipSum: number;
  rainHours: string | null;
  tempRange: string; // "min..max"
  feelsRange: string;
  windRange: string;
  windMax: number;
  windDir: string;
  sunSeconds: number;
  sunStr: string;
  accuracy: 'High' | 'Medium' | 'Low'; // Derived from model spread (simplified here or future proofing)
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