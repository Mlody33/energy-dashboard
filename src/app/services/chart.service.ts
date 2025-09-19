import { Injectable } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { 
  EnergyData, 
  MeterEnergyData, 
  PlantData, 
  DetailedDeviceData, 
  DetailedMeterData,
  ChartColors 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  private readonly colors: ChartColors = {
    production: 'rgb(59, 130, 246)',
    exportMain: 'rgb(34, 197, 94)',
    exportTariff2: 'rgb(132, 204, 22)',
    importMain: 'rgb(239, 68, 68)',
    importTariff2: 'rgb(249, 115, 22)',
    consumption: 'rgb(239, 68, 68)',
    selfConsumption: 'rgb(139, 92, 246)',
    gridFeed: 'rgb(16, 185, 129)'
  };

  constructor() {}

  /**
   * Check if dataset has meaningful data (not all zeros)
   */
  private hasData(values: number[]): boolean {
    return values.some(value => value > 0);
  }

  /**
   * Create base chart options
   */
  private createBaseChartOptions(title: string): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false,
          text: title
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (context) => `Date: ${context[0].label}`,
            label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)} kWh`
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Day of Month'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Energy (kWh)'
          }
        }
      }
    };
  }

  /**
   * Create detailed chart options
   */
  private createDetailedChartOptions(title: string): ChartOptions<'line'> {
    const options = this.createBaseChartOptions(title);
    if (options.scales?.['x']?.title) {
      options.scales['x'].title.text = 'Date';
    }
    return options;
  }

  /**
   * Create inverter chart data
   */
  createInverterChartData(data: EnergyData[], title: string): ChartData<'line'> {
    const labels = data.map(item => item.day);
    const values = data.map(item => item.value);

    return {
      labels,
      datasets: [
        {
          label: 'Solar Production',
          data: values,
          borderColor: this.colors.production,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.colors.production,
          pointBorderColor: this.colors.production,
          pointHoverBackgroundColor: 'rgb(37, 99, 235)',
          pointHoverBorderColor: 'rgb(37, 99, 235)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      ]
    };
  }

  /**
   * Create meter chart data
   */
  createMeterChartData(data: MeterEnergyData[], title: string): ChartData<'line'> {
    const labels = data.map(item => item.day);

    const potentialDatasets = [
      {
        condition: this.hasData(data.map(item => item.exportMain)),
        dataset: {
          label: 'Export Whole Home (All Phases)',
          data: data.map(item => item.exportMain),
          borderColor: this.colors.exportMain,
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.colors.exportMain,
          pointBorderColor: this.colors.exportMain,
          pointHoverBackgroundColor: 'rgb(22, 163, 74)',
          pointHoverBorderColor: 'rgb(22, 163, 74)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.exportTariff2)),
        dataset: {
          label: 'Export Single Phase',
          data: data.map(item => item.exportTariff2),
          borderColor: this.colors.exportTariff2,
          backgroundColor: 'rgba(132, 204, 22, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.colors.exportTariff2,
          pointBorderColor: this.colors.exportTariff2,
          pointHoverBackgroundColor: 'rgb(101, 163, 13)',
          pointHoverBorderColor: 'rgb(101, 163, 13)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3,
          borderDash: [5, 5]
        }
      },
      {
        condition: this.hasData(data.map(item => item.importMain)),
        dataset: {
          label: 'Import Whole Home (All Phases)',
          data: data.map(item => item.importMain),
          borderColor: this.colors.importMain,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.colors.importMain,
          pointBorderColor: this.colors.importMain,
          pointHoverBackgroundColor: 'rgb(220, 38, 38)',
          pointHoverBorderColor: 'rgb(220, 38, 38)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.importTariff2)),
        dataset: {
          label: 'Import Single Phase',
          data: data.map(item => item.importTariff2),
          borderColor: this.colors.importTariff2,
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.colors.importTariff2,
          pointBorderColor: this.colors.importTariff2,
          pointHoverBackgroundColor: 'rgb(234, 88, 12)',
          pointHoverBorderColor: 'rgb(234, 88, 12)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3,
          borderDash: [5, 5]
        }
      }
    ];

    const validDatasets = potentialDatasets
      .filter(item => item.condition)
      .map(item => item.dataset);

    return {
      labels,
      datasets: validDatasets
    };
  }

  /**
   * Create plant chart data
   */
  createPlantChartData(data: PlantData[], title: string): ChartData<'line'> {
    const labels = data.map(item => item.day);

    const datasets = [
      {
        label: 'Total Production',
        data: data.map(item => item.totalProduction),
        borderColor: this.colors.production,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: this.colors.production,
        pointBorderColor: this.colors.production,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)',
        pointHoverBorderColor: 'rgb(37, 99, 235)',
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 3
      },
      {
        label: 'Total Consumption',
        data: data.map(item => item.totalConsumption),
        borderColor: this.colors.consumption,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: this.colors.consumption,
        pointBorderColor: this.colors.consumption,
        pointHoverBackgroundColor: 'rgb(220, 38, 38)',
        pointHoverBorderColor: 'rgb(220, 38, 38)',
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 3
      },
      {
        label: 'Self Consumption',
        data: data.map(item => item.selfConsumption),
        borderColor: this.colors.selfConsumption,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: this.colors.selfConsumption,
        pointBorderColor: this.colors.selfConsumption,
        pointHoverBackgroundColor: 'rgb(124, 58, 237)',
        pointHoverBorderColor: 'rgb(124, 58, 237)',
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 3
      },
      {
        label: 'Grid Feed',
        data: data.map(item => item.gridFeed),
        borderColor: this.colors.gridFeed,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: this.colors.gridFeed,
        pointBorderColor: this.colors.gridFeed,
        pointHoverBackgroundColor: 'rgb(5, 150, 105)',
        pointHoverBorderColor: 'rgb(5, 150, 105)',
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 3
      }
    ];

    return {
      labels,
      datasets
    };
  }

  /**
   * Create detailed inverter chart data
   */
  createDetailedInverterChartData(data: DetailedDeviceData[], title: string): ChartData<'line'> {
    const labels = data.map(item => item.day);
    const values = data.map(item => item.value);

    return {
      labels,
      datasets: [
        {
          label: 'Detailed Solar Production',
          data: values,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: 'rgb(34, 197, 94)',
          pointHoverBackgroundColor: 'rgb(22, 163, 74)',
          pointHoverBorderColor: 'rgb(22, 163, 74)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      ]
    };
  }

  /**
   * Create detailed meter chart data
   */
  createDetailedMeterChartData(data: DetailedMeterData[], title: string): ChartData<'line'> {
    const labels = data.map(item => item.day);

    const potentialDatasets = [
      {
        condition: this.hasData(data.map(item => item.exportMain)),
        dataset: {
          label: 'Export Whole Home (All Phases)',
          data: data.map(item => item.exportMain),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: 'rgb(16, 185, 129)',
          pointHoverBackgroundColor: 'rgb(5, 150, 105)',
          pointHoverBorderColor: 'rgb(5, 150, 105)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.exportTariff2)),
        dataset: {
          label: 'Export Single Phase',
          data: data.map(item => item.exportTariff2),
          borderColor: 'rgb(52, 211, 153)',
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(52, 211, 153)',
          pointBorderColor: 'rgb(52, 211, 153)',
          pointHoverBackgroundColor: 'rgb(20, 184, 166)',
          pointHoverBorderColor: 'rgb(20, 184, 166)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3,
          borderDash: [5, 5]
        }
      },
      {
        condition: this.hasData(data.map(item => item.importMain)),
        dataset: {
          label: 'Import Whole Home (All Phases)',
          data: data.map(item => item.importMain),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: 'rgb(239, 68, 68)',
          pointHoverBackgroundColor: 'rgb(220, 38, 38)',
          pointHoverBorderColor: 'rgb(220, 38, 38)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.importTariff2)),
        dataset: {
          label: 'Import Single Phase',
          data: data.map(item => item.importTariff2),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(249, 115, 22)',
          pointBorderColor: 'rgb(249, 115, 22)',
          pointHoverBackgroundColor: 'rgb(234, 88, 12)',
          pointHoverBorderColor: 'rgb(234, 88, 12)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3,
          borderDash: [5, 5]
        }
      }
    ];

    const validDatasets = potentialDatasets
      .filter(item => item.condition)
      .map(item => item.dataset);

    return {
      labels,
      datasets: validDatasets
    };
  }

  /**
   * Get inverter chart options
   */
  getInverterChartOptions(title: string): ChartOptions<'line'> {
    return this.createBaseChartOptions(title);
  }

  /**
   * Get meter chart options
   */
  getMeterChartOptions(title: string): ChartOptions<'line'> {
    return this.createBaseChartOptions(title);
  }

  /**
   * Get plant chart options
   */
  getPlantChartOptions(title: string): ChartOptions<'line'> {
    return this.createBaseChartOptions(title);
  }

  /**
   * Get detailed chart options
   */
  getDetailedChartOptions(title: string): ChartOptions<'line'> {
    return this.createDetailedChartOptions(title);
  }
}
