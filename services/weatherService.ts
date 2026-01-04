import { API_URL, CITY_FILENAMES } from '../constants';
import { CityCoordinates, CityAnalysisResult, WeatherDayStats } from '../types';

const MOUNTAIN_CITIES: string[] = [];

// Map degrees to 8 cardinal directions for file naming (0/360=N, 45=NE, etc)
export const getCardinal = (angle: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
};

function degToCompass(num: number | null): string {
    if (num === null) return "";
    // Normalize to 0-360
    const angle = (num % 360 + 360) % 360;
    // Divide by 45 degrees for 8 sectors, round to nearest index
    const val = Math.round(angle / 45);
    const arr = ["С ⬇️", "СВ ↙️", "В ⬅️", "ЮВ ↖️", "Ю ⬆️", "ЮЗ ↗️", "З ➡️", "СЗ ↘️"];
    return arr[(val % 8)];
}

function formatSunTime(seconds: number): string {
    if (seconds <= 0) return "0 мин";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}ч ${minutes}мин`;
    return `${minutes}мин`;
}

function formatRainHours(hours: number[]): string | null {
    if (!hours || hours.length === 0) return null;
    
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
        if (start === end) return `${start.toString().padStart(2, '0')}:00`;
        return `${start.toString().padStart(2, '0')}:00–${(end + 1).toString().padStart(2, '0')}:00`;
    });

    return parts.join(", ");
}

export function getWeekendDates(): Date[] {
    const today = new Date();
    const dayOfWeek = today.getDay();

    let sat1: Date;
    
    if (dayOfWeek === 6) { 
        sat1 = new Date(today);
    } else {
        const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
        sat1 = new Date(today);
        sat1.setDate(today.getDate() + (dayOfWeek === 6 ? 0 : daysUntilSat));
    }

    const sun1 = new Date(sat1); sun1.setDate(sat1.getDate() + 1);
    const sat2 = new Date(sat1); sat2.setDate(sat1.getDate() + 7);
    const sun2 = new Date(sat2); sun2.setDate(sat2.getDate() + 1);

    return [sat1, sun1, sat2, sun2];
}

function getClothingRecommendations(
    tMin: number,
    tMax: number,
    wMax: number,
    activeRainSum: number,
    temps09_11: number[],
    temps11_18: number[],
    temps09_12: number[],
    temps12_18: number[],
    cityName: string,
    isMorningRideSuitable: boolean
): string[] {
    const hints: string[] = [];
    const isMountain = MOUNTAIN_CITIES.includes(cityName);

    // 1. Temperature Check: 
    if (tMax < 5) return [];

    // 2. Precipitation Check: 
    if (activeRainSum > 0.5 && !isMorningRideSuitable) return [];

    // Check Arm Warmers condition early (Temp rises from <16 to >19)
    let useArmWarmers = false;
    if (temps09_11.length && temps11_18.length) {
        const minStart = Math.min(...temps09_11);
        const maxEnd = Math.max(...temps11_18);
        if (minStart < 16 && maxEnd > 19) {
             useArmWarmers = true;
        }
    }

    // --- НИЗ (Бибы) ---
    if (tMax < 14) {
        hints.push("Bib Tights");
    } else {
        hints.push("Bib Shorts");
    }

    // Утепление для ног (Ногова)
    if (tMax >= 14 && tMax <= 19) {
        hints.push("Leg or Knee Warmers");
    }
    // Наколенники на переходный период
    if (tMax > 19 && tMax <= 22) {
        hints.push("Наколенники");
    }

    // --- ВЕРХ ---
    let jersey = "";
    if (tMax < 15) {
        jersey = "Long Sleeve Jersey Cold";
    } else if (tMax >= 15 && tMax <= 22) {
        jersey = "Long Sleeve Jersey Hot";
    } else {
        jersey = "Летняя джерси"; // > 22
    }

    if (useArmWarmers && jersey === "Long Sleeve Jersey Hot") {
        jersey = "Летняя джерси";
    }

    // --- ВЕРХНЯЯ ОДЕЖДА (Ветровка / Жилетка) ---
    let outerLayer = "";
    const needsProtection = tMin < 12 || wMax > 15 || (tMax > 10 && tMax <= 20);

    if (needsProtection) {
        if (wMax >= 15 || isMountain) {
            outerLayer = "Jacket";
        } else {
            outerLayer = "Vest";
        }
    }

    // --- JACKET OVERRIDE ---
    if (tMax <= 8) {
        hints.push("Winter Jacket");
    } else {
        if (jersey) hints.push(jersey);
        if (outerLayer) hints.push(outerLayer);
    }

    // --- АКСЕССУАРЫ (Руки/Ноги/Голова) ---
    if (useArmWarmers) {
        hints.push("Arm Warmers");
    }

    if (tMin <= 8) {
        hints.push("Oversocks"); 
    } else if (tMin <= 14) {
        hints.push("Toe covers");
    }

    if (tMin <= 8) {
        hints.push("Buff");
    }

    return [...new Set(hints)];
}

// Checks if any route file exists for the given city and wind direction
async function checkRouteAvailability(cityName: string, windDeg: number): Promise<boolean> {
    const fileCityName = CITY_FILENAMES[cityName] || cityName;
    const windDirCode = getCardinal(windDeg);
    const baseName = `routes/${fileCityName}_${windDirCode}`;
    
    const candidates = [
        `${baseName}.gpx`,
        `${baseName}_1.gpx`,
        `${baseName}_2.gpx`,
        `${baseName}_3.gpx`
    ];

    // Check matches in parallel
    // We use a simple fetch HEAD or GET. 
    // Since we are likely on a static host, we'll try to fetch.
    const checks = candidates.map(async (url) => {
        try {
            const res = await fetch(url, { method: 'GET' }); // Some static servers reject HEAD
            // If OK and content-type looks like xml or text, valid.
            // Just checking OK status is usually enough for static files.
            if (res.ok) {
                 // Optimization: Abort body download if possible, but for small GPX usually fine.
                 return true;
            }
            return false;
        } catch {
            return false;
        }
    });

    const results = await Promise.all(checks);
    return results.some(r => r === true);
}

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
        hourly: "precipitation,temperature_2m,wind_speed_10m,wind_gusts_10m,apparent_temperature,wind_direction_10m,sunshine_duration",
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

        const startDateObj = new Date(startStr); 

        // Use Promise.all to handle async route checks correctly within the iteration
        const promises = targetDates.map(async (targetDate, index) => {
            const tStr = targetDate.toISOString().split('T')[0];
            const baseTStr = startDateObj.toISOString().split('T')[0];
            
            const diffTime = new Date(tStr).getTime() - new Date(baseTStr).getTime();
            const dayOffset = diffTime / (1000 * 3600 * 24);
            
            const sIdx = dayOffset * 24;
            const eIdx = sIdx + 24;

            if (!hourly.precipitation || hourly.precipitation.length < eIdx) return;

            // Total daily rain for summary (04:00 - 24:00)
            const pSlice = hourly.precipitation.slice(sIdx + 4, eIdx) as number[];
            const totalRain = pSlice.reduce((a, b) => a + (b || 0), 0);
            
            const wetHours = pSlice
                .map((val, i) => (val > 0.1 ? i + 4 : -1))
                .filter(h => h !== -1);

            // Active hours indices (09:00 - 18:00)
            const actStart = sIdx + 9;
            const actEnd = sIdx + 19; 

            const sunSlice = hourly.sunshine_duration.slice(actStart, actEnd) as number[];
            const sunVal = sunSlice.reduce((a, b) => a + (b || 0), 0);

            const tempSlice = hourly.temperature_2m.slice(actStart, actEnd) as number[];
            const feelsSlice = hourly.apparent_temperature.slice(actStart, actEnd) as number[];
            const windSlice = hourly.wind_speed_10m.slice(actStart, actEnd) as number[];
            const windGustSlice = hourly.wind_gusts_10m.slice(actStart, actEnd) as number[];
            const windDirSlice = hourly.wind_direction_10m.slice(actStart, actEnd) as number[];
            
            // Calculate Rain during Active Hours (09:00 - 18:00)
            const pActiveSlice = hourly.precipitation.slice(actStart, actEnd) as number[];
            const activeRainSum = pActiveSlice.reduce((a, b) => a + (b || 0), 0);

            const pMorningSlice = hourly.precipitation.slice(sIdx + 9, sIdx + 12) as number[];
            const morningRainSum = pMorningSlice.reduce((a, b) => a + (b || 0), 0);
            const isMorningRideSuitable = morningRainSum <= 0.1;

            const tMin = tempSlice.length ? Math.min(...tempSlice) : 0;
            const tMax = tempSlice.length ? Math.max(...tempSlice) : 0;
            const fMin = feelsSlice.length ? Math.min(...feelsSlice) : 0;
            const fMax = feelsSlice.length ? Math.max(...feelsSlice) : 0;

            const wMin = windSlice.length ? Math.min(...windSlice) : 0;
            const wMax = windSlice.length ? Math.max(...windSlice) : 0;
            const gMax = windGustSlice.length ? Math.max(...windGustSlice) : 0;
            
            let windDirStr = "";
            let windDeg = 0;
            if (windSlice.length > 0) {
                const maxWindIdx = windSlice.indexOf(wMax);
                windDeg = windDirSlice[maxWindIdx] || 0;
                windDirStr = degToCompass(windDeg);
            }

            const temps09_11 = hourly.temperature_2m.slice(sIdx + 9, sIdx + 12) as number[];
            const temps11_18 = hourly.temperature_2m.slice(sIdx + 11, sIdx + 19) as number[];
            const temps09_12 = hourly.temperature_2m.slice(sIdx + 9, sIdx + 13) as number[];
            const temps12_18 = hourly.temperature_2m.slice(sIdx + 12, sIdx + 19) as number[];

            const clothingHints = getClothingRecommendations(
                tMin, tMax, wMax, activeRainSum,
                temps09_11, temps11_18, temps09_12, temps12_18,
                cityName,
                isMorningRideSuitable
            );

            const isDry = activeRainSum <= 0.5;

            // Check if route exists only if the weather is good enough to ride
            let hasRoute = false;
            if (isDry) {
                hasRoute = await checkRouteAvailability(cityName, windDeg);
            }

            const dayStats: WeatherDayStats = {
                dateObj: targetDate,
                dateStr: tStr,
                dayName: targetDate.getDay() === 6 ? "Суббота" : "Воскресенье",
                isDry: isDry,
                isMorningRideSuitable: isMorningRideSuitable,
                hasRoute: hasRoute,
                precipSum: totalRain,
                rainHours: formatRainHours(wetHours),
                tempRange: `${Math.round(tMin)}..${Math.round(tMax)}`,
                feelsRange: `${Math.round(fMin)}..${Math.round(fMax)}`,
                windRange: `${Math.round(wMin)}..${Math.round(wMax)}`,
                windGusts: Math.round(gMax),
                windDir: windDirStr,
                windDeg: windDeg,
                sunSeconds: sunVal,
                sunStr: formatSunTime(sunVal),
                accuracy: 'High',
                clothingHints
            };

            if (index === 0) result.weekend1.saturday = dayStats;
            if (index === 1) result.weekend1.sunday = dayStats;
            if (index === 2) result.weekend2.saturday = dayStats;
            if (index === 3) result.weekend2.sunday = dayStats;
        });

        await Promise.all(promises);
        return result;

    } catch (e) {
        console.error(`Failed to fetch for ${cityName}`, e);
        return null;
    }
}