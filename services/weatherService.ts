import { API_URL } from '../constants';
import { CityCoordinates, CityAnalysisResult, WeatherDayStats } from '../types';

const MOUNTAIN_CITIES: string[] = [];

function degToCompass(num: number | null): string {
    if (num === null) return "";
    const val = Math.floor((num / 22.5) + 0.5);
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
    cityName: string
): string[] {
    const hints: string[] = [];
    const isMountain = MOUNTAIN_CITIES.includes(cityName);

    // 1. Temperature Check: Do not recommend if min temp < 5 during active hours
    if (tMin < 5) return [];

    // 2. Precipitation Check: Do not recommend if rain > 0.5mm during active hours (09:00 - 18:00)
    if (activeRainSum > 0.5) return [];

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
    // Если днем холодно (макс < 14), нужны длинные. Иначе - летние.
    if (tMax < 14) {
        hints.push("Длинные бибы");
    } else {
        hints.push("Летние бибы");
    }

    // Утепление для ног (Ногова)
    // Если летние бибы, но еще не жара (14-19 градусов)
    if (tMax >= 14 && tMax <= 19) {
        hints.push("Ногова");
    }
    // Наколенники на переходный период
    if (tMax > 19 && tMax <= 22) {
        hints.push("Наколенники");
    }

    // --- ВЕРХ ---
    let jersey = "";
    if (tMax < 15) {
        jersey = "Теплая джерси (лонгслив)";
    } else if (tMax >= 15 && tMax <= 22) {
        jersey = "Летний лонгслив";
    } else {
        jersey = "Летняя джерси"; // > 22
    }

    // If Arm Warmers are recommended, ensure we pair them with Summer Jersey, not Long Sleeve
    if (useArmWarmers && jersey === "Летний лонгслив") {
        jersey = "Летняя джерси";
    }

    // --- ВЕРХНЯЯ ОДЕЖДА (Ветровка / Жилетка) ---
    let outerLayer = "";
    
    // Conditions to add an outer layer:
    // 1. Cold start (<12)
    // 2. Strong wind (>15)
    // 3. Comfort range (10-20) where a vest is useful
    const needsProtection = tMin < 12 || wMax > 15 || (tMax > 10 && tMax <= 20);

    if (needsProtection) {
        // "Ветровка рекомендуем при сильном ветре (>=15) или в городе, где рядом горы"
        // "при ветре ниже 15 км/ч предпочтение отдаем только Жилетка"
        if (wMax >= 15 || isMountain) {
            outerLayer = "Ветровка";
        } else {
            // Calm and flat -> Vest
            outerLayer = "Жилетка";
        }
    }

    // --- JACKET OVERRIDE ---
    // "Давай предлагать Куртка только в случае, если максимальная температура не превышает +8 градусов"
    if (tMax <= 8) {
        hints.push("Куртка");
        // Jacket replaces Jersey and Outer Layer in very cold weather
    } else {
        if (jersey) hints.push(jersey);
        if (outerLayer) hints.push(outerLayer);
    }

    // --- АКСЕССУАРЫ (Руки/Ноги/Голова) ---
    
    // Рукава
    if (useArmWarmers) {
        hints.push("Рукава");
    }

    // Ноги (обувь)
    if (tMin <= 8) {
        hints.push("Oversocks"); // Replaced "Бахилы"
    } else if (tMin <= 14) {
        hints.push("Toe covers");
    }

    // Шея (Buff) - applied only for +5...+8 (implicit via tMin < 5 return and tMin <= 8 check)
    if (tMin <= 8) {
        hints.push("Buff");
    }

    return [...new Set(hints)];
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
        hourly: "precipitation,temperature_2m,wind_speed_10m,apparent_temperature,wind_direction_10m,sunshine_duration",
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

        targetDates.forEach((targetDate, index) => {
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
            const windDirSlice = hourly.wind_direction_10m.slice(actStart, actEnd) as number[];
            
            // Calculate Rain during Active Hours (09:00 - 18:00) for Clothing Logic
            const pActiveSlice = hourly.precipitation.slice(actStart, actEnd) as number[];
            const activeRainSum = pActiveSlice.reduce((a, b) => a + (b || 0), 0);

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

            const temps09_11 = hourly.temperature_2m.slice(sIdx + 9, sIdx + 12) as number[];
            const temps11_18 = hourly.temperature_2m.slice(sIdx + 11, sIdx + 19) as number[];
            const temps09_12 = hourly.temperature_2m.slice(sIdx + 9, sIdx + 13) as number[];
            const temps12_18 = hourly.temperature_2m.slice(sIdx + 12, sIdx + 19) as number[];

            const clothingHints = getClothingRecommendations(
                tMin, tMax, wMax, activeRainSum,
                temps09_11, temps11_18, temps09_12, temps12_18,
                cityName
            );

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
                accuracy: 'High',
                clothingHints
            };

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