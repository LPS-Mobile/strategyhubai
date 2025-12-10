// lib/utils/mock-data.ts

interface DataPoint {
  value: number;
}

/**
 * Generates a simple mock equity curve data array for the sparkline component.
 * This should be replaced with real data fetching in a production environment.
 */
export const getMockSparklineData = (): DataPoint[] => {
  // A simple representation of an equity curve
  return [
    { value: 1000 },
    { value: 1250 },
    { value: 1100 },
    { value: 1400 },
    { value: 1300 },
    { value: 1650 },
    { value: 1550 },
    { value: 1800 },
    { value: 1950 },
    { value: 2200 },
  ];
};
