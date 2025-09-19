import { Injectable } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { 
  EnergyData, 
  MeterEnergyData, 
  PlantData, 
  DetailedDeviceData, 
  DetailedMeterData,
  DetailedPlantData,
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
          label: '🔌 Grid Export',
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
          label: '🏠 Home Export',
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
          label: '🔌 Grid Import',
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
          label: '🏠 Home Import',
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
   * Create detailed meter summary chart data (main totals only)
   */
  createDetailedMeterSummaryChartData(data: DetailedMeterData[], title: string): ChartData<'line'> {
    const labels = data.map(item => item.day);

    const potentialDatasets = [
      {
        condition: this.hasData(data.map(item => item.exportMain)),
        dataset: {
          label: '🔌 Grid Export',
          data: data.map(item => item.exportMain),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: 'rgb(16, 185, 129)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.importMain)),
        dataset: {
          label: '🔌 Grid Import',
          data: data.map(item => item.importMain),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: 'rgb(239, 68, 68)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.importTariff2)),
        dataset: {
          label: '🏠 Home Import',
          data: data.map(item => item.importTariff2),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'rgb(168, 85, 247)',
          pointBorderColor: 'rgb(168, 85, 247)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      }
    ];

    const validDatasets = potentialDatasets
      .filter(item => item.condition)
      .map(item => item.dataset);

    console.log(`📈 Detailed meter summary chart: ${validDatasets.length} datasets with data`);

    return {
      labels,
      datasets: validDatasets
    };
  }

  /**
   * Create detailed meter CT breakdown chart data (all individual CT readings)
   */
  createDetailedMeterChartData(data: DetailedMeterData[], title: string): ChartData<'line'> {
    const labels = data.map(item => item.day);

    const potentialDatasets = [
      // === GRID EXPORT (CT1-3: Grid connection points by floor measuring export to grid) ===
      {
        condition: this.hasData(data.map(item => item.exportCT1)),
        dataset: {
          label: '🔌 Grid Export CT1 (1st Floor)',
          data: data.map(item => item.exportCT1),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.exportCT2)),
        dataset: {
          label: '🔌 Grid Export CT2 (2nd Floor)',
          data: data.map(item => item.exportCT2),
          borderColor: 'rgb(52, 211, 153)',
          backgroundColor: 'rgba(52, 211, 153, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.exportCT3)),
        dataset: {
          label: '🔌 Grid Export CT3 (Basement)',
          data: data.map(item => item.exportCT3),
          borderColor: 'rgb(20, 184, 166)',
          backgroundColor: 'rgba(20, 184, 166, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      // === GRID IMPORT (CT1-3: Grid connection points by floor measuring import from grid) ===
      {
        condition: this.hasData(data.map(item => item.importCT1)),
        dataset: {
          label: '🔌 Grid Import CT1 (1st Floor)',
          data: data.map(item => item.importCT1),
          borderColor: 'rgb(220, 38, 38)',
          backgroundColor: 'rgba(220, 38, 38, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.importCT2)),
        dataset: {
          label: '🔌 Grid Import CT2 (2nd Floor)',
          data: data.map(item => item.importCT2),
          borderColor: 'rgb(248, 113, 113)',
          backgroundColor: 'rgba(248, 113, 113, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.importCT3)),
        dataset: {
          label: '🔌 Grid Import CT3 (Basement)',
          data: data.map(item => item.importCT3),
          backgroundColor: 'rgba(252, 165, 165, 0.05)',
          borderColor: 'rgb(252, 165, 165)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      // === HOME CONSUMPTION (CT4-6: Home consumption by floor measuring actual home usage) ===
      {
        condition: this.hasData(data.map(item => item.importCT4)),
        dataset: {
          label: '🏠 1st Floor Consumption CT4',
          data: data.map(item => item.importCT4),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,  // Fill background for home usage
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3,  // Thin line
          borderDash: [6, 4]  // Dashed line for home usage
        }
      },
      {
        condition: this.hasData(data.map(item => item.importCT5)),
        dataset: {
          label: '🏠 2nd Floor Consumption CT5',
          data: data.map(item => item.importCT5),
          borderColor: 'rgb(220, 38, 127)',
          backgroundColor: 'rgba(220, 38, 127, 0.1)',
          fill: true,  // Fill background for home usage
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3,  // Thin line
          borderDash: [6, 4]  // Dashed line for home usage
        }
      },
      {
        condition: this.hasData(data.map(item => item.importCT6)),
        dataset: {
          label: '🏠 Basement Consumption CT6',
          data: data.map(item => item.importCT6),
          borderColor: 'rgb(185, 28, 28)',
          backgroundColor: 'rgba(185, 28, 28, 0.1)',
          fill: true,  // Fill background for home usage
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3,  // Thin line
          borderDash: [6, 4]  // Dashed line for home usage
        }
      },
      // === HOME EXPORT (CT4-6: Home export by floor - usually minimal export) ===
      {
        condition: this.hasData(data.map(item => item.exportCT4)),
        dataset: {
          label: '🏠 1st Floor Export CT4',
          data: data.map(item => item.exportCT4),
          borderColor: 'rgb(101, 163, 13)',
          backgroundColor: 'rgba(101, 163, 13, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.exportCT5)),
        dataset: {
          label: '🏠 2nd Floor Export CT5',
          data: data.map(item => item.exportCT5),
          borderColor: 'rgb(132, 204, 22)',
          backgroundColor: 'rgba(132, 204, 22, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      {
        condition: this.hasData(data.map(item => item.exportCT6)),
        dataset: {
          label: '🏠 Basement Export CT6',
          data: data.map(item => item.exportCT6),
          borderColor: 'rgb(163, 230, 53)',
          backgroundColor: 'rgba(163, 230, 53, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      },
      // Home Export (_2 suffix indicates home usage)
      {
        condition: this.hasData(data.map(item => item.exportTariff2)),
        dataset: {
          label: '🏠 Home Export',
          data: data.map(item => item.exportTariff2),
          borderColor: 'rgb(22, 163, 74)',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3,
          borderDash: [8, 4]
        }
      }
    ];

    const validDatasets = potentialDatasets
      .filter(item => item.condition)
      .map(item => item.dataset);

    console.log(`📈 Detailed meter CT breakdown chart: ${validDatasets.length} datasets with data`);

    return {
      labels,
      datasets: validDatasets
    };
  }

  /**
   * Create detailed plant chart data
   */
  createDetailedPlantChartData(data: DetailedPlantData[], title: string): ChartData<'polarArea'> {
    console.log('📊 Creating polar area chart with data:', data);
    
    // For polar area chart, use the most recent data point
    const latestData = data.length > 0 ? data[data.length - 1] : null;
    
    console.log('📊 Latest data point for polar area chart:', latestData);
    
    if (!latestData) {
      console.log('📊 No data available for polar area chart, creating test chart');
      // Return test data to ensure polar area chart renders
      return {
        labels: ['🌞 Test Production', '🏠 Test Consumption', '⚡ Test Export'],
        datasets: [{
          data: [365, 156, 305],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(16, 185, 129, 0.8)'
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(239, 68, 68)',
            'rgb(16, 185, 129)'
          ],
          borderWidth: 2
        }]
      };
    }

    // Create polar area chart segments
    const pieSegments = [
      {
        label: '🌞 Total Production',
        value: latestData.totalProduction,
        color: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)'
      },
      {
        label: '🏠 Total Consumption', 
        value: latestData.totalConsumption,
        color: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)'
      },
      {
        label: '🔋 Self Consumption',
        value: latestData.selfConsumption,
        color: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)'
      },
      {
        label: '⚡ Grid Feed-in',
        value: latestData.gridFeed,
        color: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)'
      },
      {
        label: '🔌 Grid Consumption',
        value: latestData.gridConsumption,
        color: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)'
      }
    ];

    // Filter out segments with zero, negative, or null values
    const validSegments = pieSegments.filter(segment => segment.value != null && segment.value > 0);

    console.log('📊 All polar area segments:', pieSegments);
    console.log('📊 Valid polar area segments (>0):', validSegments);

    const labels = validSegments.map(segment => segment.label);
    const values = validSegments.map(segment => segment.value);
    const backgroundColors = validSegments.map(segment => segment.color);
    const borderColors = validSegments.map(segment => segment.borderColor);

    console.log(`📊 Detailed plant polar area chart: ${validSegments.length} segments, date: ${latestData.date}`);
    console.log('📊 Final polar area data - labels:', labels);
    console.log('📊 Final polar area data - values:', values);

    // If no valid segments, create a fallback chart showing "No data"
    if (validSegments.length === 0) {
      console.log('📊 No valid segments, creating fallback polar area chart');
      return {
        labels: ['No Data Available'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(156, 163, 175, 0.5)'],
          borderColor: ['rgb(156, 163, 175)'],
          borderWidth: 3
        }]
      };
    }

    const chartData = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 3
      }]
    };

    console.log('📊 Final polar area chart data object:', chartData);
    return chartData;
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

  /**
   * Get chart options for detailed plant polar area chart
   */
  getDetailedPlantChartOptions(title: string): ChartOptions<'polarArea'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 18,
            weight: 'bold'
          },
          padding: {
            top: 15,
            bottom: 25
          }
        },
        legend: {
          display: true,
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = Number(context.raw || 0);
              const dataArray = context.dataset.data as number[];
              const total = dataArray.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${label}: ${value.toFixed(2)} kWh (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            display: true,
            font: {
              size: 12
            },
            callback: function(value: any) {
              return value + ' kWh';
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          angleLines: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    };
  }
}
