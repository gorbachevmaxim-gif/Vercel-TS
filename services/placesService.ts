
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 100): Promise<T | null> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            if (i < retries - 1) {
                console.warn(`Retry attempt ${i + 1}/${retries} failed. Retrying in ${delay}ms...`, error.message);
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw error; // Last attempt failed, re-throw the error
            }
        }
    }
    return null;
}

import { Place } from '../types';

// Simple cache to prevent spamming the API when switching tabs/routes
const cache: Record<string, Place[]> = {};

export async function fetchNearbyPlaces(lat: number, lon: number): Promise<Place[]> {

    try {
        const response = await retry(async () => {
            const res = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });
            if (!res.ok) {
                throw new Error(`Overpass API returned ${res.status}. Details: ${await res.text()}`);
            }
            return res;
        }, 3, 500); // 3 retries, 500ms delay

        if (!response) {
            console.error("Failed to fetch places from Overpass API after multiple retries.");
            return [];
        }

        const data = await response.json();
        const elements = data.elements || [];

        const places: Place[] = elements.map((el: any) => {
            const tags = el.tags || {};
            
            // Map OSM tags to our structure
            let type = "Кафе";
            if (tags.amenity === 'restaurant') type = "Ресторан";
            if (tags.amenity === 'bar') type = "Бар";
            if (tags.amenity === 'fast_food') type = "Фастфуд";
            if (tags.cuisine) type += ` (${tags.cuisine})`;

            return {
                name: tags.name || tags['name:ru'] || tags['name:en'] || 'Без названия',
                type: type,
                // Create a link to Yandex Maps using the name for better UX in Russia,
                // fallback to coords if no name
                url: tags.name 
                    ? `https://yandex.ru/maps/?text=${encodeURIComponent(tags.name)}` 
                    : `https://yandex.ru/maps/?ll=${el.lon},${el.lat}&z=17&pt=${el.lon},${el.lat}`,
                address: tags['addr:street'] ? `${tags['addr:street']}, ${tags['addr:housenumber'] || ''}` : undefined,
                rating: undefined // OSM doesn't have ratings usually
            };
        }).filter((p: Place) => {
            if (p.name === 'Без названия') return false;

            // --- FILTER LOGIC ---
            // Exclude places in Shopping Centers (Malls)
            const lowerName = p.name.toLowerCase();
            const lowerAddr = (p.address || '').toLowerCase();
            
            // Regex for common Russian mall abbreviations and keywords
            const mallRegex = /\b(тц|трц|трк|молл|mall|мега|ашан|лента|глобус)\b/i;
            const foodCourtRegex = /(фуд\s?корт|food\s?court)/i;

            if (mallRegex.test(lowerName) || mallRegex.test(lowerAddr)) return false;
            if (foodCourtRegex.test(lowerName)) return false;

            return true;
        });

        cache[key] = places;
        return places;
    } catch (e: any) {
        console.error(`Failed to fetch nearby places for ${lat},${lon}: ${e.message}`);
        return [];
    }}