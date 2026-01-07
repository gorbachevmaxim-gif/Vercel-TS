import { useMemo } from 'react';
import { CityAnalysisResult } from '../types';

interface UseSummaryFilteringProps {
  data: CityAnalysisResult[];
  isSecondWeekend?: boolean;
}

export const useSummaryFiltering = ({ data, isSecondWeekend = false }: UseSummaryFilteringProps) => {
  const filteredData = useMemo(() => {
    return data.map(city => {
      const weekendStats = isSecondWeekend ? city.weekend2 : city.weekend1;
      const isDrySat = weekendStats.saturday?.isDry && weekendStats.saturday?.isMorningRideSuitable;
      const isDrySun = weekendStats.sunday?.isDry && weekendStats.sunday?.isMorningRideSuitable;
      const hasRouteSat = weekendStats.saturday?.hasRoute;
      const hasRouteSun = weekendStats.sunday?.hasRoute;

      let totalScore = 0;
      if (isDrySat) totalScore++;
      if (isDrySun) totalScore++;

      let routeScore = 0;
      if (hasRouteSat) routeScore++;
      if (hasRouteSun) routeScore++;

      let tempAdjustedScore = 0;
      if (weekendStats.saturday?.tempRange) {
        const [minTempSat, maxTempSat] = weekendStats.saturday.tempRange.split('..').map(Number);
        if (maxTempSat >= 10 && maxTempSat <= 25) tempAdjustedScore += 0.5;
      }
      if (weekendStats.sunday?.tempRange) {
        const [minTempSun, maxTempSun] = weekendStats.sunday.tempRange.split('..').map(Number);
        if (maxTempSun >= 10 && maxTempSun <= 25) tempAdjustedScore += 0.5;
      }

      let windAdjustedScore = 0;
      if (weekendStats.saturday?.windRange) {
        const [, maxWindSat] = weekendStats.saturday.windRange.split('..').map(Number);
        if (maxWindSat <= 10) windAdjustedScore += 0.5;
      }
      if (weekendStats.sunday?.windRange) {
        const [, maxWindSun] = weekendStats.sunday.windRange.split('..').map(Number);
        if (maxWindSun <= 10) windAdjustedScore += 0.5;
      }
      
      const hasDryAndRoute = (isDrySat && hasRouteSat) || (isDrySun && hasRouteSun);

      return {
        ...city,
        totalScore,
        routeScore,
        tempAdjustedScore,
        windAdjustedScore,
        hasDryAndRoute
      };
    })
    .sort((a, b) => {
      if (a.hasDryAndRoute && !b.hasDryAndRoute) return -1;
      if (!a.hasDryAndRoute && b.hasDryAndRoute) return 1;

      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      
      if (b.routeScore !== a.routeScore) return b.routeScore - a.routeScore;

      if (b.tempAdjustedScore !== a.tempAdjustedScore) return b.tempAdjustedScore - a.tempAdjustedScore;

      if (b.windAdjustedScore !== a.windAdjustedScore) return b.windAdjustedScore - a.windAdjustedScore;

      return a.cityName.localeCompare(b.cityName);
    });
  }, [data, isSecondWeekend]);

  return filteredData;
};