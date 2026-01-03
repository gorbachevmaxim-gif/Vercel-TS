import { API_URL } from '../constants';
import { CityCoordinates, CityAnalysisResult, WeatherDayStats } from '../types';

// Helper: Get Compass Direction
function degToCompass(num: number | null): string {
    if (num === null) return "";
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ["С ⬇️", "СВ ↙️", "В ⬅️", "ЮВ ↖️", "Ю ⬆️", "ЮЗ ↗️", "З ➡️", "СЗ ↘️"];
    return arr[(val % 8)];
}

// Helper: Format Seconds to Sun Time
function formatSunTime(seconds: number): string {
    if (seconds <= 0) return "0 мин";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}ч ${minutes}мин`;
    return `${minutes}мин`;
}

// Helper: Format Rain Hours (Group by consecutive hours)
function formatRainHours(hours: number[]): string | null {
    if (!hours || hours.length === 0) return null;
    
    // Sort just in case
    hours.sort((a, b) => a - b);

    const groups: number[][] = [];
    let currentGroup: number[] = [hours[0]];

    for (let i = 1; i < hours.length; i++) {
        if (hours[i] === hours[i - 1] + 1) {
            currentGroup.push(hours[i]);
        } else {
            groups.push(currentGroup);
            currentGroup = [hours[i]];
        }
    }
    groups.push(currentGroup);

    const parts = groups.map(g => {
        const start = g[0];
        const end = g[g.length - 1];
        // Python code displayed end+1 for range readability
        if (start === end) return `${start.toString().padStart(2, '0')}:00`;
        return `${start.toString().padStart(2, '0')}:00–${(end + 1).toString().padStart(2, '0')}:00`;
    });

    return parts.join(", ");
}

// Helper: Calculate Target Dates
export function getWeekendDates(): Date[] {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon... 6=Sat

    let sat1: Date;
    
    if (dayOfWeek === 6) { // It is Saturday
        sat1 = new Date(today);
    } else {
        // JS getDay(): Sun=0, Mon=1...Sat=6
        // If today is Sunday(0), days until Sat(6) is 6.
        // If today is Friday(5), days until Sat(6) is 1.
        // Formula: (6 - dayOfWeek + 7) % 7
        // Correction: If today is Sunday (0), we usually look for *next* Saturday? 
        // The python code: `days_until_sat = (5 - today.weekday() + 7) % 7` where Mon=0.
        // Let's stick to standard logic: Next upcoming Saturday.
        const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7; // If today is Sat, logic above might handle it, but usually we want next. Python code handled "If Sat, sat1=today".
        
        sat1 = new Date(today);
        sat1.setDate(today.getDate() + (dayOfWeek === 6 ? 0 : daysUntilSat));
    }

    const sun1 = new Date(sat1); sun1.setDate(sat1.getDate() + 1);
    const sat2 = new Date(sat1); sat2.setDate(sat1.getDate() + 7);
    const sun2 = new Date(sat2); sun2.setDate(sat2.getDate() + 1);

    return [sat1, sun1, sat2, sun2];
}

// Core Analysis Function
export async function analyzeCity(
    cityName: string, 
    coords: CityCoordinates, 
    targetDates: Date[]
): Promise<CityAnalysisResult | null> {
    const startStr = targetDates[0].toISOString().split('T')[0];
    const endStr = targetDates[targetDates.length - 1].toISOString().split('T')[0];

    const params = new URLSearchParams({
        latitude: coords.lat.toString(),
        longitude: coords.lon.toString(),
        start_date: startStr,
        end_date: endStr,
        hourly: ["precipitation", "temperature_2m", "wind_speed_10m", "apparent_temperature", "wind_direction_10m", "sunshine_duration"].join(','),
        timezone: "Europe/Moscow"
    });

    try {
        const response = await fetch(`${API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();

        const hourly = data.hourly;
        const result: CityAnalysisResult = {
            cityName,
            weekend1: { saturday: null, sunday: null },
            weekend2: { saturday: null, sunday: null }
        };

        const startDateObj = new Date(startStr); // Base for index calculation

        targetDates.forEach((targetDate, index) => {
            // Calculate day offset to find index in hourly arrays
            // Note: We need to be careful with timezones. Best is to compare date strings.
            const tStr = targetDate.toISOString().split('T')[0];
            const baseTStr = startDateObj.toISOString().split('T')[0];
            
            const diffTime = new Date(tStr).getTime() - new Date(baseTStr).getTime();
            const dayOffset = diffTime / (1000 * 3600 * 24);
            
            const sIdx = dayOffset * 24;
            const eIdx = sIdx + 24;

            if (!hourly.precipitation || hourly.precipitation.length < eIdx) return;

            // --- Logic ported from Python ---
            
            // Precip (From 04:00 to 24:00) -> indices sIdx+4 to eIdx
            const pSlice = hourly.precipitation.slice(sIdx + 4, eIdx) as number[];
            const totalRain = pSlice.reduce((a, b) => a + (b || 0), 0);
            
            // Find wet hours (relative to 00:00, so adding 4 to index)
            const wetHours = pSlice
                .map((val, i) => (val > 0.1 ? i + 4 : -1))
                .filter(h => h !== -1);

            // Active Hours (09:00 - 18:00) -> indices sIdx+9 to sIdx+19 (exclusive of 19)
            // Python slice s_idx+9 : s_idx+19 includes 9 up to 18.
            const actStart = sIdx + 9;
            const actEnd = sIdx + 19;

            const sunSlice = hourly.sunshine_duration.slice(actStart, actEnd) as number[];
            const sunVal = sunSlice.reduce((a, b) => a + (b || 0), 0);

            const tempSlice = hourly.temperature_2m.slice(actStart, actEnd) as number[];
            const feelsSlice = hourly.apparent_temperature.slice(actStart, actEnd) as number[];
            const windSlice = hourly.wind_speed_10m.slice(actStart, actEnd) as number[];
            const windDirSlice = hourly.wind_direction_10m.slice(actStart, actEnd) as number[];

            const tMin = tempSlice.length ? Math.min(...tempSlice) : 0;
            const tMax = tempSlice.length ? Math.max(...tempSlice) : 0;
            const fMin = feelsSlice.length ? Math.min(...feelsSlice) : 0;
            const fMax = feelsSlice.length ? Math.max(...feelsSlice) : 0;

            const wMin = windSlice.length ? Math.min(...windSlice) : 0;
            const wMax = windSlice.length ? Math.max(...windSlice) : 0;
            
            let windDirStr = "";
            if (windSlice.length > 0) {
                const maxWindIdx = windSlice.indexOf(wMax);
                windDirStr = degToCompass(windDirSlice[maxWindIdx]);
            }

            const dayStats: WeatherDayStats = {
                dateObj: targetDate,
                dateStr: tStr,
                dayName: targetDate.getDay() === 6 ? "Суббота" : "Воскресенье",
                isDry: totalRain <= 0.2,
                precipSum: totalRain,
                rainHours: formatRainHours(wetHours),
                tempRange: `${Math.round(tMin)}..${Math.round(tMax)}`,
                feelsRange: `${Math.round(fMin)}..${Math.round(fMax)}`,
                windRange: `${Math.round(wMin)}..${Math.round(wMax)}`,
                windMax: wMax,
                windDir: windDirStr,
                sunSeconds: sunVal,
                sunStr: formatSunTime(sunVal),
                accuracy: 'High' // Mocking accuracy for now to save a 2nd API call per city
            };

            // Assign to result structure
            if (index === 0) result.weekend1.saturday = dayStats;
            if (index === 1) result.weekend1.sunday = dayStats;
            if (index === 2) result.weekend2.saturday = dayStats;
            if (index === 3) result.weekend2.sunday = dayStats;
        });

        return result;

    } catch (e) {
        console.error(`Failed to fetch for ${cityName}`, e);
        return null;
    }
}