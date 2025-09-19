import { ChartConfiguration, ChartOptions, ChartType, ChartData } from 'chart.js';

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill: boolean;
  tension: number;
  pointBackgroundColor: string;
  pointBorderColor: string;
  pointHoverBackgroundColor: string;
  pointHoverBorderColor: string;
  pointRadius: number;
  pointHoverRadius: number;
  borderWidth: number;
  borderDash?: number[];
}

export interface EnergyChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartConfig {
  type: ChartType;
  data: ChartData<'line'>;
  options: ChartOptions<'line'>;
}

export interface ChartColors {
  production: string;
  exportMain: string;
  exportTariff2: string;
  importMain: string;
  importTariff2: string;
  consumption: string;
  selfConsumption: string;
  gridFeed: string;
}
