# Поиск идеальных выходных (Weekend Weather Planner)

Веб-приложение для поиска городов с хорошей погодой для велосипедных выездов в выходные дни. Анализирует прогноз погоды, ветер и осадки, помогая выбрать лучшее место для поездки.

## Функциональность

- 🌤 **Анализ погоды**: Проверка прогноза на ближайшие и следующие выходные.
- 🚴 **Рекомендации по одежде**: Подсказки, что надеть в зависимости от температуры и ветра.
- 🗺 **Карта**: Встроенная карта OpenStreetMap для просмотра локации.
- 📱 **Адаптивность**: Полная поддержка мобильных устройств.

## Установка и запуск

1. **Установка зависимостей**
   ```bash
   npm install
   ```

2. **Запуск в режиме разработки**
   ```bash
   npm run dev
   ```

3. **Сборка для продакшена**
   ```bash
   npm run build
   ```
   После сборки файлы будут находиться в папке `dist`.

## Деплой на GitHub Pages

1. Соберите проект:
   ```bash
   npm run build
   ```
2. Загрузите содержимое папки `dist` в ваш репозиторий (или настройте GitHub Actions для автоматической сборки).
3. В настройках репозитория (Settings -> Pages) выберите источник для GitHub Pages.

## Технологии

- React
- TypeScript
- Vite
- Tailwind CSS (через CDN)
- Open-Meteo API (погодные данные)




The project is a React.js application written in TypeScript named "Weekend Weather Planner," designed to help users find rain-free weekend getaways in Central Russia by analyzing weather forecasts for popular destinations.
The application uses Vite as its build tool, Tailwind CSS for styling, and Leaflet for mapping functionalities.
Key directories include components (UI elements), public/routes (containing numerous .gpx files, suggesting geographical data or routes), and services (for placesService.ts and weatherService.ts).
The application leverages external APIs: Open-Meteo for detailed hourly weather data and the Overpass API (OpenStreetMap) for discovering nearby points of interest (gastronomy).
weatherService.ts is central to the application, fetching weather data, calculating weekend weather statistics, generating clothing recommendations, and checking for the availability of GPX routes.
placesService.ts queries for cafes, restaurants, bars, and fast food establishments, filters for standalone venues (excluding shopping centers/food courts), and generates Yandex Maps URLs. It employs a client-side cache for efficiency.
constants.ts centralizes static data, including a list of target CITIES with their coordinates, CITY_FILENAMES for GPX route referencing, and manually curated CITY_PLACES (gastronomy recommendations).
App.tsx acts as the main orchestrator, managing application state (e.g., loading status, selectedCity), orchestrating data flow, and conditionally rendering UI components like a LoadingScreen, SummaryView, or CityDetail.
