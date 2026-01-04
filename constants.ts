import { CityMap } from './types';

export const CITIES: CityMap = {
    "Москва": { lat: 55.75, lon: 37.61 },
    "Истра": { lat: 55.91, lon: 36.85 },
    "Кубинка": { lat: 55.59, lon: 36.72 },
    "Можайск": { lat: 55.50, lon: 36.03 },
    "Волоколамск": { lat: 56.04, lon: 35.96 },
    "Солнечногорск": { lat: 56.18, lon: 36.98 },
    "Завидово": { lat: 56.52, lon: 36.52 },
    "Дубна": { lat: 56.73, lon: 37.16 },
    "Яхрома": { lat: 56.29, lon: 37.48 },
    "Сергиев Посад": { lat: 56.30, lon: 38.13 },
    "Александров": { lat: 56.39, lon: 38.71 },
    "Павловский Посад": { lat: 55.78, lon: 38.65 },
    "Воскресенск": { lat: 55.32, lon: 38.68 },
    "Коломна": { lat: 55.08, lon: 38.78 },
    "Ступино": { lat: 54.89, lon: 38.08 },
    "Серпухов": { lat: 54.91, lon: 37.41 },
    "Калуга": { lat: 54.51, lon: 36.26 },
    "Обнинск": { lat: 55.11, lon: 36.61 },
    "Наро-Фоминск": { lat: 55.39, lon: 36.73 },
    "Жуковский": { lat: 55.60, lon: 38.12 },
    "Рязань": { lat: 54.62, lon: 39.73 },
    "Одинцово": { lat: 55.67, lon: 37.28 },
    "Зеленоград": { lat: 55.99, lon: 37.21 },
    "Подольск": { lat: 55.43, lon: 37.55 },
    "Тула": { lat: 54.19, lon: 37.61 },
    "Пушкино": { lat: 56.01, lon: 37.85 },
    "Фетхие": { lat: 36.62, lon: 29.12 },
    "Кемер": { lat: 36.60, lon: 30.56 },
    "Звенигород": { lat: 55.73, lon: 36.86 }
};

// Map Cyrillic City Name -> Latin Filename prefix
// If a city is missing here, it will default to the Cyrillic name.
export const CITY_FILENAMES: Record<string, string> = {
    "Можайск": "Mozhaysk",
    "Жуковский": "Zhukovskyi",
    "Москва": "Moscow",
    "Истра": "Istra",
    "Кубинка": "Kubinka",
    "Волоколамск": "Volokolamsk",
    "Солнечногорск": "Solnechnogorsk",
    "Завидово": "Zavidovo",
    "Дубна": "Dubna",
    "Яхрома": "Yakhroma",
    "Сергиев Посад": "SergievPosad",
    "Александров": "Alexandrov",
    "Павловский Посад": "PavlovskyPosad",
    "Воскресенск": "Voskresensk",
    "Коломна": "Kolomna",
    "Ступино": "Stupino",
    "Серпухов": "Serpukhov",
    "Калуга": "Kaluga",
    "Обнинск": "Obninsk",
    "Наро-Фоминск": "NaroFominsk",
    "Рязань": "Ryazan",
    "Одинцово": "Odintsovo",
    "Зеленоград": "Zelenograd",
    "Подольск": "Podolsk",
    "Тула": "Tula",
    "Пушкино": "Pushkino",
    "Звенигород": "Zvenigorod"
};

export const FLIGHT_CITIES = ["Фетхие", "Кемер"];

// Map City Name -> Komoot Tour ID
// You can find the ID in the URL of the planned route: https://www.komoot.com/tour/{ID}
export const KOMOOT_ROUTE_IDS: Record<string, string> = {
    // Пример заполнения:
    // "Коломна": "123456789",
};

export const API_URL = "https://api.open-meteo.com/v1/forecast";