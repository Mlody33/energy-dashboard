import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, ChartData } from 'chart.js';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';

interface MetricCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface EnergyData {
  date: string;
  value: number;
  day: string;
}

interface MeterEnergyData {
  date: string;
  day: string;
  exportMain: number;      // total_negative_energy_kwh_ - Export energy for whole home (all phases)
  exportTariff2: number;   // total_negative_energy_2_kwh_ - Export energy for single-phase devices
  importMain: number;      // total_positive_energy_kwh_ - Import energy for whole home (all phases)
  importTariff2: number;   // total_positive_energy_2_kwh_ - Import energy for single-phase devices
}

interface PlantData {
  date: string;
  day: string;
  totalProduction: number;  // Total plant production
  totalConsumption: number; // Total plant consumption  
  gridFeed: number;        // Grid feed-in
  gridConsumption: number; // Grid consumption
  selfConsumption: number; // Self consumption
  selfSufficiency: number; // Self sufficiency percentage
}

interface DeviceResponse {
  deviceName: string;
  summary: Array<{
    date: string;
    paramsSummary: any;
  }>;
  uuid: string;
}


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, BaseChartDirective, DatePickerModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  // Loading and API state
  isLoading: boolean = false;
  isInverterLoading: boolean = false;
  isMeterLoading: boolean = false;
  isPlantLoading: boolean = false;
  errorMessage: string = '';
  
  // Month switch reminder
  showRefreshReminder: boolean = false;
  
  // Token management
  private authToken: string = '';
  private readonly TOKEN_STORAGE_KEY = 'global-home-token';
  
  // Date settings
  currentMonth: string = '09';
  currentYear: string = '2025';
  selectedDate: Date = new Date(2025, 8); // September 2025 (month is 0-indexed)
  private readonly MONTH_STORAGE_KEY = 'global-home-month';
  private readonly YEAR_STORAGE_KEY = 'global-home-year';

  // Data storage keys
  private readonly INVERTER_DATA_KEY = 'global-home-inverter-data';
  private readonly METER_DATA_KEY = 'global-home-meter-data';
  private readonly PLANT_DATA_KEY = 'global-home-plant-data';
  
  // API configuration - Direct calls (CORS will be handled by server)
  private readonly API_BASE = 'http://192.168.1.180:7070/metrics/device';
  
  metricCards: MetricCard[] = [
    {
      title: 'Total Production',
      value: '393.49 kWh',
      icon: 'pi pi-bolt',
      color: 'white',
      bgColor: 'linear-gradient(45deg, #10b981, #059669)'
    },
    {
      title: 'Average Daily', 
      value: '30.27 kWh',
      icon: 'pi pi-chart-line',
      color: 'white',
      bgColor: 'linear-gradient(45deg, #6b7280, #4b5563)'
    },
    {
      title: 'Peak Day',
      value: '49.28 kWh', 
      icon: 'pi pi-arrow-up',
      color: 'white',
      bgColor: 'linear-gradient(45deg, #374151, #1f2937)'
    },
    {
      title: 'Days Active',
      value: '13',
      icon: 'pi pi-calendar',
      color: 'white', 
      bgColor: 'linear-gradient(45deg, #f59e0b, #d97706)'
    }
  ];

  // Sample inverter data (from the JSON file)
  inverterData: EnergyData[] = [
    { date: '2025-09-01', value: 30.74, day: '01' },
    { date: '2025-09-02', value: 40.32, day: '02' },
    { date: '2025-09-03', value: 28.73, day: '03' },
    { date: '2025-09-04', value: 40.27, day: '04' },
    { date: '2025-09-05', value: 28.65, day: '05' },
    { date: '2025-09-06', value: 9.01, day: '06' },
    { date: '2025-09-07', value: 17.19, day: '07' },
    { date: '2025-09-08', value: 24.79, day: '08' },
    { date: '2025-09-09', value: 49.28, day: '09' },
    { date: '2025-09-10', value: 40.93, day: '10' },
    { date: '2025-09-11', value: 23.37, day: '11' },
    { date: '2025-09-12', value: 45.44, day: '12' },
    { date: '2025-09-13', value: 34.57, day: '13' }
  ];

  // Complete meter data with all 4 energy types
  // Note: exportTariff2 set to all zeros to demonstrate filtering
  meterData: MeterEnergyData[] = [
    { date: '2025-09-01', day: '01', exportMain: 26.0, exportTariff2: 0.0, importMain: 7.28, importTariff2: 7.74 },
    { date: '2025-09-02', day: '02', exportMain: 36.73, exportTariff2: 0.0, importMain: 5.37, importTariff2: 5.7 },
    { date: '2025-09-03', day: '03', exportMain: 24.05, exportTariff2: 0.0, importMain: 8.47, importTariff2: 7.52 },
    { date: '2025-09-04', day: '04', exportMain: 36.0, exportTariff2: 0.0, importMain: 7.49, importTariff2: 7.64 },
    { date: '2025-09-05', day: '05', exportMain: 27.16, exportTariff2: 0.0, importMain: 8.53, importTariff2: 6.17 },
    { date: '2025-09-06', day: '06', exportMain: 3.43, exportTariff2: 0.0, importMain: 15.51, importTariff2: 14.36 },
    { date: '2025-09-07', day: '07', exportMain: 9.96, exportTariff2: 0.0, importMain: 10.85, importTariff2: 11.09 },
    { date: '2025-09-08', day: '08', exportMain: 21.01, exportTariff2: 0.0, importMain: 9.48, importTariff2: 9.87 },
    { date: '2025-09-09', day: '09', exportMain: 45.92, exportTariff2: 0.0, importMain: 7.5, importTariff2: 6.83 },
    { date: '2025-09-10', day: '10', exportMain: 35.35, exportTariff2: 0.0, importMain: 8.42, importTariff2: 10.7 },
    { date: '2025-09-11', day: '11', exportMain: 18.85, exportTariff2: 0.0, importMain: 10.06, importTariff2: 7.78 },
    { date: '2025-09-12', day: '12', exportMain: 41.63, exportTariff2: 0.0, importMain: 5.4, importTariff2: 5.58 },
    { date: '2025-09-13', day: '13', exportMain: 25.78, exportTariff2: 0.0, importMain: 8.22, importTariff2: 9.77 }
  ];

  // Plant data - starts empty, populated from server or storage
  plantData: PlantData[] = [];

  // Chart configuration
  public chartType = 'line' as const;
  
  // Inverter Chart Data
  public inverterChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public inverterChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Solar Production'
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

  // Meter Chart Data
  public meterChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public meterChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Grid Energy Flow'
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

  // Plant Chart Data
  public plantChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public plantChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Plant Energy Overview'
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

  get chartUnit() {
    return 'kWh';
  }

  private getDaysInMonth(month: string, year: string): number {
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  }

  private fillMissingDays<T extends { date: string; day: string }>(
    data: T[], 
    month: string, 
    year: string,
    createEmptyEntry: (day: number, dateStr: string) => T
  ): T[] {
    const daysInMonth = this.getDaysInMonth(month, year);
    const result: T[] = [];
    
    // Create a map of existing data by day number
    const existingData = new Map<number, T>();
    data.forEach(item => {
      const dayNum = parseInt(item.day);
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        existingData.set(dayNum, item);
      }
    });
    
    // Fill all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      if (existingData.has(day)) {
        result.push(existingData.get(day)!);
      } else {
        const dayStr = day.toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        result.push(createEmptyEntry(day, dateStr));
      }
    }
    
    console.log(`📅 Filled missing days: ${data.length} server days → ${result.length} total days (${daysInMonth} in ${month}/${year})`);
    return result;
  }

  // Line chart data point generators
  getInverterLinePoints(): string {
    return this.inverterData
      .map((data, index) => {
        const x = (index * 800 / (this.inverterData.length - 1));
        const y = 320 - (data.value * 6); // Flip Y coordinate for SVG
        return `${x},${y}`;
      })
      .join(' ');
  }

  getExportMainLinePoints(): string {
    return this.meterData
      .map((data, index) => {
        const x = (index * 800 / (this.meterData.length - 1));
        const y = 320 - (data.exportMain * 6);
        return `${x},${y}`;
      })
      .join(' ');
  }

  getExportTariff2LinePoints(): string {
    return this.meterData
      .map((data, index) => {
        const x = (index * 800 / (this.meterData.length - 1));
        const y = 320 - (data.exportTariff2 * 6);
        return `${x},${y}`;
      })
      .join(' ');
  }

  getImportMainLinePoints(): string {
    return this.meterData
      .map((data, index) => {
        const x = (index * 800 / (this.meterData.length - 1));
        const y = 320 - (data.importMain * 6);
        return `${x},${y}`;
      })
      .join(' ');
  }

  getImportTariff2LinePoints(): string {
    return this.meterData
      .map((data, index) => {
        const x = (index * 800 / (this.meterData.length - 1));
        const y = 320 - (data.importTariff2 * 6);
        return `${x},${y}`;
      })
      .join(' ');
  }

  // Area fill polygon generators (for filled areas beneath lines)
  getInverterAreaPoints(): string {
    const linePoints = this.inverterData
      .map((data, index) => {
        const x = (index * 800 / (this.inverterData.length - 1));
        const y = 320 - (data.value * 6);
        return `${x},${y}`;
      });
    
    // Create polygon: start at bottom-left, follow line, end at bottom-right, close polygon
    const startPoint = `0,320`;
    const endPoint = `800,320`;
    return [startPoint, ...linePoints, endPoint].join(' ');
  }

  getExportMainAreaPoints(): string {
    const linePoints = this.meterData
      .map((data, index) => {
        const x = (index * 800 / (this.meterData.length - 1));
        const y = 320 - (data.exportMain * 6);
        return `${x},${y}`;
      });
    
    const startPoint = `0,320`;
    const endPoint = `800,320`;
    return [startPoint, ...linePoints, endPoint].join(' ');
  }

  getExportTariff2AreaPoints(): string {
    const linePoints = this.meterData
      .map((data, index) => {
        const x = (index * 800 / (this.meterData.length - 1));
        const y = 320 - (data.exportTariff2 * 6);
        return `${x},${y}`;
      });
    
    const startPoint = `0,320`;
    const endPoint = `800,320`;
    return [startPoint, ...linePoints, endPoint].join(' ');
  }

  getImportMainAreaPoints(): string {
    const linePoints = this.meterData
      .map((data, index) => {
        const x = (index * 800 / (this.meterData.length - 1));
        const y = 320 - (data.importMain * 6);
        return `${x},${y}`;
      });
    
    const startPoint = `0,320`;
    const endPoint = `800,320`;
    return [startPoint, ...linePoints, endPoint].join(' ');
  }

  getImportTariff2AreaPoints(): string {
    const linePoints = this.meterData
      .map((data, index) => {
        const x = (index * 800 / (this.meterData.length - 1));
        const y = 320 - (data.importTariff2 * 6);
        return `${x},${y}`;
      });
    
    const startPoint = `0,320`;
    const endPoint = `800,320`;
    return [startPoint, ...linePoints, endPoint].join(' ');
  }

  ngOnInit() {
    console.log('🔧 Dashboard ngOnInit started');
    
    this.loadTokenFromStorage();
    this.loadDateSettingsFromStorage();
    
    // Try to load stored data first
    const hasStoredInverterData = this.loadInverterDataFromStorage();
    const hasStoredMeterData = this.loadMeterDataFromStorage();
    const hasStoredPlantData = this.loadPlantDataFromStorage();
    
    if (!hasStoredInverterData || !hasStoredMeterData || !hasStoredPlantData) {
      console.log('📁 No stored data found or data is outdated, using fallback data');
      
      // Fill dummy data to complete month
      if (!hasStoredInverterData) {
        console.log('📊 Using dummy inverter data as fallback - filling to complete month');
        this.inverterData = this.fillMissingDays(
          this.inverterData,
          this.currentMonth,
          this.currentYear,
          (day: number, dateStr: string) => ({
            date: dateStr,
            value: 0,
            day: day.toString().padStart(2, '0')
          })
        );
      }
      if (!hasStoredMeterData) {
        console.log('📊 Using dummy meter data as fallback - filling to complete month');
        this.meterData = this.fillMissingDays(
          this.meterData,
          this.currentMonth,
          this.currentYear,
          (day: number, dateStr: string) => ({
            date: dateStr,
            day: day.toString().padStart(2, '0'),
            exportMain: 0,
            exportTariff2: 0,
            importMain: 0,
            importTariff2: 0
          })
        );
      }
      if (!hasStoredPlantData) {
        console.log('📊 No stored plant data, creating empty data structure');
        this.plantData = this.fillMissingDays(
          [],
          this.currentMonth,
          this.currentYear,
          (day: number, dateStr: string) => ({
            date: dateStr,
            day: day.toString().padStart(2, '0'),
            totalProduction: 0,
            totalConsumption: 0,
            gridFeed: 0,
            gridConsumption: 0,
            selfConsumption: 0,
            selfSufficiency: 0
          })
        );
      }
    }
    
    console.log('🔧 Data loaded:', {
      inverter: this.inverterData.length,
      meter: this.meterData.length,
      plant: this.plantData.length,
      fromStorage: hasStoredInverterData && hasStoredMeterData && hasStoredPlantData
    });
    
    // Initialize all charts with loaded data
    console.log('📊 Initializing chart data...');
    this.updateAllCharts();
    this.updateMetricCards();
    
    // Force a second update after a delay
    setTimeout(() => {
      console.log('📊 Force updating chart data again...');
      this.updateAllCharts();
    }, 500);
  }

  ngAfterViewInit() {
    console.log('🔧 Dashboard AfterViewInit - Chart reference:', this.chart);
    
    // Force chart update after view is initialized
    setTimeout(() => {
      console.log('🔧 Force updating charts after view init...');
      this.updateAllCharts();
      if (this.chart) {
        this.chart.update();
        console.log('✅ Chart update called');
      } else {
        console.warn('⚠️ Chart reference not found');
      }
    }, 100);
  }

  private loadTokenFromStorage() {
    const savedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    console.log('🔍 Loading token from storage:', savedToken ? `Found token: ${savedToken.substring(0, 50)}...` : 'No saved token');
    
    if (savedToken) {
      this.authToken = savedToken;
      console.log('✅ Token loaded from storage');
    } else {
      // Set the working token if none is stored
      this.authToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiIwX3phcGFydG1Ab3V0bG9vay5jb21fMiIsIm1vZGlmeV9wYXNzd29yZCI6MSwic2NvcGUiOlsiYWxsIl0sImRldGFpbCI6eyJvcmdhbml6YXRpb25JZCI6MCwidG9wR3JvdXBJZCI6bnVsbCwiZ3JvdXBJZCI6bnVsbCwicm9sZUlkIjotMSwidXNlcklkIjo3NzQzMTAsInZlcnNpb24iOjEwMDAsImlkZW50aWZpZXIiOiJ6YXBhcnRtQG91dGxvb2suY29tIiwiaWRlbnRpdHlUeXBlIjoyLCJtZGMiOiJGT1JFSUdOXzEiLCJhcHBJZCI6bnVsbH0sImV4cCI6MTc2Mjk3MzY1NCwibWRjIjoiRk9SRUlHTl8xIiwiYXV0aG9yaXRpZXMiOlsiYWxsIl0sImp0aSI6Ijk1YTIyMTE2LWI2NTktNDI2OS04ZDZkLTRlYTMxMjljODI0YSIsImNsaWVudF9pZCI6InRlc3QifQ.X5iYdIm8n9pf0wHaEVbBhc5VPOwIfLskber417iq62JJGDpr6BsR7vLlSoRgBpxIqfkTXRevlPhPDOx6svCnVlK7y66aLbCu2KaGd6jG5Sk-9TyCwHoenDpRMZLAEw29VcZkFeobiUC3urZkJet1NgJRSArfFXGM5jbgAh8tO0eiTalQZ5-GD2pIoofNQfShH6cq66jl9XkDqoGAADTo0UuVb3z2EfQStpeJhKgz2SWU0dQfK4sMHODuJfFCtHGBD66qWJVKQjWwSY4oSt2qTk4d45uznfOs-436ixeq5zpVPp2vQT9sbkqQy27Aoi2ZGsyN-bEyjyju_N5Dr09IcA';
      console.log('🔧 Using default token');
      this.saveTokenToStorage(this.authToken);
    }
    
    console.log('🔑 Final authToken set:', this.authToken ? `${this.authToken.substring(0, 50)}...` : 'NO TOKEN');
  }

  private saveTokenToStorage(token: string) {
    localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
    this.authToken = token;
  }

  private loadDateSettingsFromStorage() {
    const savedMonth = localStorage.getItem(this.MONTH_STORAGE_KEY);
    const savedYear = localStorage.getItem(this.YEAR_STORAGE_KEY);
    
    if (savedMonth) {
      this.currentMonth = savedMonth;
    }
    if (savedYear) {
      this.currentYear = savedYear;
    }
    
    // Sync the selectedDate with the loaded month/year
    this.syncSelectedDateWithMonthYear();
  }

  private syncSelectedDateWithMonthYear() {
    const month = parseInt(this.currentMonth, 10) - 1; // Convert to 0-indexed month
    const year = parseInt(this.currentYear, 10);
    this.selectedDate = new Date(year, month);
  }

  private saveDateSettingsToStorage(month: string, year: string) {
    localStorage.setItem(this.MONTH_STORAGE_KEY, month);
    localStorage.setItem(this.YEAR_STORAGE_KEY, year);
    this.currentMonth = month;
    this.currentYear = year;
  }

  private saveInverterDataToStorage() {
    try {
      const dataToStore = {
        data: this.inverterData,
        timestamp: Date.now()
      };
      localStorage.setItem(this.INVERTER_DATA_KEY, JSON.stringify(dataToStore));
      console.log('💾 Inverter data saved to storage:', dataToStore.data.length, 'items');
    } catch (error) {
      console.error('❌ Failed to save inverter data to storage:', error);
    }
  }

  private saveMeterDataToStorage() {
    try {
      const dataToStore = {
        data: this.meterData,
        timestamp: Date.now()
      };
      localStorage.setItem(this.METER_DATA_KEY, JSON.stringify(dataToStore));
      console.log('💾 Meter data saved to storage:', dataToStore.data.length, 'items');
    } catch (error) {
      console.error('❌ Failed to save meter data to storage:', error);
    }
  }

  private savePlantDataToStorage() {
    try {
      const dataToStore = {
        data: this.plantData,
        timestamp: Date.now()
      };
      localStorage.setItem(this.PLANT_DATA_KEY, JSON.stringify(dataToStore));
      console.log('💾 Plant data saved to storage:', dataToStore.data.length, 'items');
    } catch (error) {
      console.error('❌ Failed to save plant data to storage:', error);
    }
  }

  private loadInverterDataFromStorage(): boolean {
    try {
      const storedData = localStorage.getItem(this.INVERTER_DATA_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        this.inverterData = parsedData.data;
        console.log('📁 Loaded inverter data from storage:', this.inverterData.length, 'items');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to load inverter data from storage:', error);
      return false;
    }
  }

  private loadMeterDataFromStorage(): boolean {
    try {
      const storedData = localStorage.getItem(this.METER_DATA_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        this.meterData = parsedData.data;
        console.log('📁 Loaded meter data from storage:', this.meterData.length, 'items');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to load meter data from storage:', error);
      return false;
    }
  }

  private loadPlantDataFromStorage(): boolean {
    try {
      const storedData = localStorage.getItem(this.PLANT_DATA_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        this.plantData = parsedData.data;
        console.log('📁 Loaded plant data from storage:', this.plantData.length, 'items');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to load plant data from storage:', error);
      return false;
    }
  }

  private async promptForToken(): Promise<string> {
    return new Promise((resolve) => {
      const token = prompt(
        'Please enter your Global Home API Token (X-Global-Home-Token):',
        this.authToken
      );
      
      if (token !== null && token.trim() !== '') {
        const trimmedToken = token.trim();
        this.saveTokenToStorage(trimmedToken);
        resolve(trimmedToken);
      } else {
        resolve(this.authToken);
      }
    });
  }

  async changeToken() {
    await this.promptForToken();
    // Token changed - user can manually refresh data if needed
  }


  onMonthChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newMonth = target.value;
    this.currentMonth = newMonth;
    this.saveDateSettingsToStorage(newMonth, this.currentYear);
    
    // Show reminder to refresh charts when month is switched
    this.showRefreshReminder = true;
    
    // Try to load stored data for the new month/year
    const hasStoredInverterData = this.loadInverterDataFromStorage();
    const hasStoredMeterData = this.loadMeterDataFromStorage();
    const hasStoredPlantData = this.loadPlantDataFromStorage();
    
    // If no stored data, reset to dummy data and fill missing days
    if (!hasStoredInverterData) {
      // Reset to original dummy data and fill for new month
      this.inverterData = [
        { date: '2025-09-01', value: 30.74, day: '01' },
        { date: '2025-09-02', value: 40.32, day: '02' },
        { date: '2025-09-03', value: 28.73, day: '03' },
        { date: '2025-09-04', value: 40.27, day: '04' },
        { date: '2025-09-05', value: 28.65, day: '05' },
        { date: '2025-09-06', value: 9.01, day: '06' },
        { date: '2025-09-07', value: 17.19, day: '07' },
        { date: '2025-09-08', value: 24.79, day: '08' },
        { date: '2025-09-09', value: 49.28, day: '09' },
        { date: '2025-09-10', value: 40.93, day: '10' },
        { date: '2025-09-11', value: 23.37, day: '11' },
        { date: '2025-09-12', value: 45.44, day: '12' },
        { date: '2025-09-13', value: 34.57, day: '13' }
      ];
      this.inverterData = this.fillMissingDays(
        this.inverterData,
        this.currentMonth,
        this.currentYear,
        (day: number, dateStr: string) => ({
          date: dateStr,
          value: 0,
          day: day.toString().padStart(2, '0')
        })
      );
    }
    
    if (!hasStoredMeterData) {
      // Reset to original dummy data and fill for new month
      this.meterData = [
        { date: '2025-09-01', day: '01', exportMain: 26.0, exportTariff2: 0.0, importMain: 7.28, importTariff2: 7.74 },
        { date: '2025-09-02', day: '02', exportMain: 36.73, exportTariff2: 0.0, importMain: 5.37, importTariff2: 5.7 },
        { date: '2025-09-03', day: '03', exportMain: 24.05, exportTariff2: 0.0, importMain: 8.47, importTariff2: 7.52 },
        { date: '2025-09-04', day: '04', exportMain: 36.0, exportTariff2: 0.0, importMain: 7.49, importTariff2: 7.64 },
        { date: '2025-09-05', day: '05', exportMain: 27.16, exportTariff2: 0.0, importMain: 8.53, importTariff2: 6.17 },
        { date: '2025-09-06', day: '06', exportMain: 3.43, exportTariff2: 0.0, importMain: 15.51, importTariff2: 14.36 },
        { date: '2025-09-07', day: '07', exportMain: 9.96, exportTariff2: 0.0, importMain: 10.85, importTariff2: 11.09 },
        { date: '2025-09-08', day: '08', exportMain: 21.01, exportTariff2: 0.0, importMain: 9.48, importTariff2: 9.87 },
        { date: '2025-09-09', day: '09', exportMain: 45.92, exportTariff2: 0.0, importMain: 7.5, importTariff2: 6.83 },
        { date: '2025-09-10', day: '10', exportMain: 35.35, exportTariff2: 0.0, importMain: 8.42, importTariff2: 10.7 },
        { date: '2025-09-11', day: '11', exportMain: 18.85, exportTariff2: 0.0, importMain: 10.06, importTariff2: 7.78 },
        { date: '2025-09-12', day: '12', exportMain: 41.63, exportTariff2: 0.0, importMain: 5.4, importTariff2: 5.58 },
        { date: '2025-09-13', day: '13', exportMain: 25.78, exportTariff2: 0.0, importMain: 8.22, importTariff2: 9.77 }
      ];
      this.meterData = this.fillMissingDays(
        this.meterData,
        this.currentMonth,
        this.currentYear,
        (day: number, dateStr: string) => ({
          date: dateStr,
          day: day.toString().padStart(2, '0'),
          exportMain: 0,
          exportTariff2: 0,
          importMain: 0,
          importTariff2: 0
        })
        );
    }
    
    if (!hasStoredPlantData) {
      // Create empty data structure, same as other charts
      this.plantData = this.fillMissingDays(
        [],
        this.currentMonth,
        this.currentYear,
        (day: number, dateStr: string) => ({
          date: dateStr,
          day: day.toString().padStart(2, '0'),
          totalProduction: 0,
          totalConsumption: 0,
          gridFeed: 0,
          gridConsumption: 0,
          selfConsumption: 0,
          selfSufficiency: 0
        })
      );
    }
    
    this.updateAllCharts();
    this.updateMetricCards();
    console.log('📅 Month changed to:', this.currentMonth, '- Stored data available:', hasStoredInverterData && hasStoredMeterData && hasStoredPlantData);
  }

  onYearChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newYear = target.value;
    this.currentYear = newYear;
    this.saveDateSettingsToStorage(this.currentMonth, newYear);
    
    // Show reminder to refresh charts when year is switched
    this.showRefreshReminder = true;
    
    // Try to load stored data for the new month/year
    const hasStoredInverterData = this.loadInverterDataFromStorage();
    const hasStoredMeterData = this.loadMeterDataFromStorage();
    const hasStoredPlantData = this.loadPlantDataFromStorage();
    
    // If no stored data, reset to dummy data and fill missing days
    if (!hasStoredInverterData) {
      // Reset to original dummy data and fill for new year
      this.inverterData = [
        { date: '2025-09-01', value: 30.74, day: '01' },
        { date: '2025-09-02', value: 40.32, day: '02' },
        { date: '2025-09-03', value: 28.73, day: '03' },
        { date: '2025-09-04', value: 40.27, day: '04' },
        { date: '2025-09-05', value: 28.65, day: '05' },
        { date: '2025-09-06', value: 9.01, day: '06' },
        { date: '2025-09-07', value: 17.19, day: '07' },
        { date: '2025-09-08', value: 24.79, day: '08' },
        { date: '2025-09-09', value: 49.28, day: '09' },
        { date: '2025-09-10', value: 40.93, day: '10' },
        { date: '2025-09-11', value: 23.37, day: '11' },
        { date: '2025-09-12', value: 45.44, day: '12' },
        { date: '2025-09-13', value: 34.57, day: '13' }
      ];
      this.inverterData = this.fillMissingDays(
        this.inverterData,
        this.currentMonth,
        this.currentYear,
        (day: number, dateStr: string) => ({
          date: dateStr,
          value: 0,
          day: day.toString().padStart(2, '0')
        })
      );
    }
    
    if (!hasStoredMeterData) {
      // Reset to original dummy data and fill for new year
      this.meterData = [
        { date: '2025-09-01', day: '01', exportMain: 26.0, exportTariff2: 0.0, importMain: 7.28, importTariff2: 7.74 },
        { date: '2025-09-02', day: '02', exportMain: 36.73, exportTariff2: 0.0, importMain: 5.37, importTariff2: 5.7 },
        { date: '2025-09-03', day: '03', exportMain: 24.05, exportTariff2: 0.0, importMain: 8.47, importTariff2: 7.52 },
        { date: '2025-09-04', day: '04', exportMain: 36.0, exportTariff2: 0.0, importMain: 7.49, importTariff2: 7.64 },
        { date: '2025-09-05', day: '05', exportMain: 27.16, exportTariff2: 0.0, importMain: 8.53, importTariff2: 6.17 },
        { date: '2025-09-06', day: '06', exportMain: 3.43, exportTariff2: 0.0, importMain: 15.51, importTariff2: 14.36 },
        { date: '2025-09-07', day: '07', exportMain: 9.96, exportTariff2: 0.0, importMain: 10.85, importTariff2: 11.09 },
        { date: '2025-09-08', day: '08', exportMain: 21.01, exportTariff2: 0.0, importMain: 9.48, importTariff2: 9.87 },
        { date: '2025-09-09', day: '09', exportMain: 45.92, exportTariff2: 0.0, importMain: 7.5, importTariff2: 6.83 },
        { date: '2025-09-10', day: '10', exportMain: 35.35, exportTariff2: 0.0, importMain: 8.42, importTariff2: 10.7 },
        { date: '2025-09-11', day: '11', exportMain: 18.85, exportTariff2: 0.0, importMain: 10.06, importTariff2: 7.78 },
        { date: '2025-09-12', day: '12', exportMain: 41.63, exportTariff2: 0.0, importMain: 5.4, importTariff2: 5.58 },
        { date: '2025-09-13', day: '13', exportMain: 25.78, exportTariff2: 0.0, importMain: 8.22, importTariff2: 9.77 }
      ];
      this.meterData = this.fillMissingDays(
        this.meterData,
        this.currentMonth,
        this.currentYear,
        (day: number, dateStr: string) => ({
          date: dateStr,
          day: day.toString().padStart(2, '0'),
          exportMain: 0,
          exportTariff2: 0,
          importMain: 0,
          importTariff2: 0
        })
        );
    }
    
    if (!hasStoredPlantData) {
      // Create empty data structure, same as other charts
      this.plantData = this.fillMissingDays(
        [],
        this.currentMonth,
        this.currentYear,
        (day: number, dateStr: string) => ({
          date: dateStr,
          day: day.toString().padStart(2, '0'),
          totalProduction: 0,
          totalConsumption: 0,
          gridFeed: 0,
          gridConsumption: 0,
          selfConsumption: 0,
          selfSufficiency: 0
        })
      );
    }
    
    this.updateAllCharts();
    this.updateMetricCards();
    console.log('📅 Year changed to:', this.currentYear, '- Stored data available:', hasStoredInverterData && hasStoredMeterData && hasStoredPlantData);
  }


  get currentDateDisplayText(): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(this.currentMonth, 10) - 1;
    return `${monthNames[monthIndex]} ${this.currentYear}`;
  }

  onDatePickerChange(selectedDate: Date | null) {
    if (selectedDate) {
      this.selectedDate = selectedDate;
      // Update the existing string properties to maintain compatibility
      this.currentMonth = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      this.currentYear = selectedDate.getFullYear().toString();
      
      // Show reminder to refresh charts when date is switched
      this.showRefreshReminder = true;
      
      // Save to storage
      this.saveDateSettingsToStorage(this.currentMonth, this.currentYear);
      
      // Try to load stored data for the new month/year
      this.loadDataForNewDate();
    }
  }

  private loadDataForNewDate() {
    const hasStoredInverterData = this.loadInverterDataFromStorage();
    const hasStoredMeterData = this.loadMeterDataFromStorage();
    const hasStoredPlantData = this.loadPlantDataFromStorage();
    
    // If no stored data, reset to fallback data and fill missing days
    if (!hasStoredInverterData || !hasStoredMeterData || !hasStoredPlantData) {
      this.loadFallbackDataForDate();
    }
    
    this.updateAllCharts();
    this.updateMetricCards();
    console.log('📅 Date changed to:', this.currentDateDisplayText, '- Stored data available:', hasStoredInverterData && hasStoredMeterData && hasStoredPlantData);
  }

  private getOriginalInverterData(): EnergyData[] {
    return [
      { date: '2025-09-01', value: 30.74, day: '01' },
      { date: '2025-09-02', value: 40.32, day: '02' },
      { date: '2025-09-03', value: 28.73, day: '03' },
      { date: '2025-09-04', value: 40.27, day: '04' },
      { date: '2025-09-05', value: 28.65, day: '05' },
      { date: '2025-09-06', value: 9.01, day: '06' },
      { date: '2025-09-07', value: 17.19, day: '07' },
      { date: '2025-09-08', value: 24.79, day: '08' },
      { date: '2025-09-09', value: 49.28, day: '09' },
      { date: '2025-09-10', value: 40.93, day: '10' },
      { date: '2025-09-11', value: 23.37, day: '11' },
      { date: '2025-09-12', value: 45.44, day: '12' },
      { date: '2025-09-13', value: 34.57, day: '13' }
    ];
  }

  private getOriginalMeterData(): MeterEnergyData[] {
    return [
      { date: '2025-09-01', day: '01', exportMain: 26.0, exportTariff2: 0.0, importMain: 7.28, importTariff2: 7.74 },
      { date: '2025-09-02', day: '02', exportMain: 36.73, exportTariff2: 0.0, importMain: 5.37, importTariff2: 5.7 },
      { date: '2025-09-03', day: '03', exportMain: 24.05, exportTariff2: 0.0, importMain: 8.47, importTariff2: 7.52 },
      { date: '2025-09-04', day: '04', exportMain: 36.0, exportTariff2: 0.0, importMain: 7.49, importTariff2: 7.64 },
      { date: '2025-09-05', day: '05', exportMain: 27.16, exportTariff2: 0.0, importMain: 8.53, importTariff2: 6.17 },
      { date: '2025-09-06', day: '06', exportMain: 3.43, exportTariff2: 0.0, importMain: 15.51, importTariff2: 14.36 },
      { date: '2025-09-07', day: '07', exportMain: 9.96, exportTariff2: 0.0, importMain: 10.85, importTariff2: 11.09 },
      { date: '2025-09-08', day: '08', exportMain: 21.01, exportTariff2: 0.0, importMain: 9.48, importTariff2: 9.87 },
      { date: '2025-09-09', day: '09', exportMain: 45.92, exportTariff2: 0.0, importMain: 7.5, importTariff2: 6.83 },
      { date: '2025-09-10', day: '10', exportMain: 35.35, exportTariff2: 0.0, importMain: 8.42, importTariff2: 10.7 },
      { date: '2025-09-11', day: '11', exportMain: 18.85, exportTariff2: 0.0, importMain: 10.06, importTariff2: 7.78 },
      { date: '2025-09-12', day: '12', exportMain: 41.63, exportTariff2: 0.0, importMain: 5.4, importTariff2: 5.58 },
      { date: '2025-09-13', day: '13', exportMain: 25.78, exportTariff2: 0.0, importMain: 8.22, importTariff2: 9.77 }
    ];
  }


  private loadFallbackDataForDate() {
    // Reset to empty data structures for all charts if no stored data
    
    if (!this.loadInverterDataFromStorage()) {
      this.inverterData = this.fillMissingDays(
        [],
        this.currentMonth,
        this.currentYear,
        (day: number, dateStr: string) => ({
          date: dateStr,
          value: 0,
          day: day.toString().padStart(2, '0')
        })
      );
    }
    
    if (!this.loadMeterDataFromStorage()) {
      this.meterData = this.fillMissingDays(
        [],
        this.currentMonth,
        this.currentYear,
        (day: number, dateStr: string) => ({
          date: dateStr,
          day: day.toString().padStart(2, '0'),
          exportMain: 0,
          exportTariff2: 0,
          importMain: 0,
          importTariff2: 0
        })
      );
    }
    
    if (!this.loadPlantDataFromStorage()) {
      this.plantData = this.fillMissingDays(
        [],
        this.currentMonth,
        this.currentYear,
        (day: number, dateStr: string) => ({
          date: dateStr,
          day: day.toString().padStart(2, '0'),
          totalProduction: 0,
          totalConsumption: 0,
          gridFeed: 0,
          gridConsumption: 0,
          selfConsumption: 0,
          selfSufficiency: 0
        })
      );
    }
  }


  get hasValidToken(): boolean {
    return this.authToken.trim() !== '';
  }

  private getHttpHeaders(): HttpHeaders {
    console.log('🔑 Creating headers with token:', this.authToken ? `${this.authToken.substring(0, 50)}...` : 'NO TOKEN');
    const headers = new HttpHeaders({
      'X-Global-Home-Token': this.authToken,
      'Content-Type': 'application/json'
    });
    console.log('📋 Headers created:', headers.keys().map(key => `${key}: ${headers.get(key)?.substring(0, 50)}...`));
    return headers;
  }

  async refreshData() {
    console.log('🚀 Starting data refresh...');
    console.log('🔑 Token available:', this.hasValidToken);
    console.log('🌐 API Base URL:', this.API_BASE);
    
    // Check if we have a valid token, if not prompt for it
    if (!this.hasValidToken) {
      console.log('❌ No valid token, prompting user...');
      await this.promptForToken();
    }
    
    // If still no valid token, don't proceed
    if (!this.hasValidToken) {
      this.errorMessage = 'API token is required to fetch data.';
      console.log('❌ Still no token after prompt, aborting...');
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    console.log('⏳ Starting API calls...');
    
    try {
      await Promise.all([
        this.fetchInverterData(),
        this.fetchMeterData(),
        this.fetchPlantData()
      ]);
      
      // Save fetched data to localStorage
      this.saveInverterDataToStorage();
      this.saveMeterDataToStorage();
      this.savePlantDataToStorage();
      
      // Clear refresh reminder after successful data refresh
      this.showRefreshReminder = false;
      
      this.updateMetricCards();
      this.updateAllCharts();
      console.log('✅ Data refresh completed successfully!');
    } catch (error: any) {
      console.log('❌ Data refresh failed:', error);
      
      if (error.status === 0) {
        this.errorMessage = 'CORS Error: Cannot connect to server. Check if CORS is properly configured on the server.';
      } else if (error.status === 401 || error.status === 403) {
        this.errorMessage = 'Authentication failed. Please check your API token.';
      } else {
        this.errorMessage = `Failed to fetch data. Server returned: ${error.status} - ${error.statusText}`;
      }
      console.error('Error fetching data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async refreshInverterData() {
    console.log('🚀 Starting inverter data refresh...');
    console.log('🔑 Token available:', this.hasValidToken);
    
    // Check if we have a valid token, if not prompt for it
    if (!this.hasValidToken) {
      console.log('❌ No valid token, prompting user...');
      await this.promptForToken();
    }
    
    // If still no valid token, don't proceed
    if (!this.hasValidToken) {
      this.errorMessage = 'API token is required to fetch data.';
      console.log('❌ Still no token after prompt, aborting...');
      return;
    }
    
    this.isInverterLoading = true;
    this.errorMessage = '';
    console.log('⏳ Starting inverter API call...');
    
    try {
      await this.fetchInverterData();
      
      // Save fetched data to localStorage
      this.saveInverterDataToStorage();
      
      // Clear refresh reminder after successful data refresh
      this.showRefreshReminder = false;
      
      this.updateMetricCards();
      this.updateAllCharts();
      console.log('✅ Inverter data refresh completed successfully!');
    } catch (error: any) {
      console.log('❌ Inverter data refresh failed:', error);
      
      if (error.status === 0) {
        this.errorMessage = 'CORS Error: Cannot connect to server. Check if CORS is properly configured on the server.';
      } else if (error.status === 401 || error.status === 403) {
        this.errorMessage = 'Authentication failed. Please check your API token.';
      } else {
        this.errorMessage = `Failed to fetch inverter data. Server returned: ${error.status} - ${error.statusText}`;
      }
      console.error('Error fetching inverter data:', error);
    } finally {
      this.isInverterLoading = false;
    }
  }

  async refreshMeterData() {
    console.log('🚀 Starting meter data refresh...');
    console.log('🔑 Token available:', this.hasValidToken);
    
    // Check if we have a valid token, if not prompt for it
    if (!this.hasValidToken) {
      console.log('❌ No valid token, prompting user...');
      await this.promptForToken();
    }
    
    // If still no valid token, don't proceed
    if (!this.hasValidToken) {
      this.errorMessage = 'API token is required to fetch data.';
      console.log('❌ Still no token after prompt, aborting...');
      return;
    }
    
    this.isMeterLoading = true;
    this.errorMessage = '';
    console.log('⏳ Starting meter API call...');
    
    try {
      await this.fetchMeterData();
      
      // Save fetched data to localStorage
      this.saveMeterDataToStorage();
      
      // Clear refresh reminder after successful data refresh
      this.showRefreshReminder = false;
      
      this.updateMetricCards();
      this.updateAllCharts();
      console.log('✅ Meter data refresh completed successfully!');
    } catch (error: any) {
      console.log('❌ Meter data refresh failed:', error);
      
      if (error.status === 0) {
        this.errorMessage = 'CORS Error: Cannot connect to server. Check if CORS is properly configured on the server.';
      } else if (error.status === 401 || error.status === 403) {
        this.errorMessage = 'Authentication failed. Please check your API token.';
      } else {
        this.errorMessage = `Failed to fetch meter data. Server returned: ${error.status} - ${error.statusText}`;
      }
      console.error('Error fetching meter data:', error);
    } finally {
      this.isMeterLoading = false;
    }
  }

  async refreshPlantData() {
    console.log('🚀 Starting plant data refresh...');
    console.log('🔑 Token available:', this.hasValidToken);
    console.log('📅 Current month/year:', this.currentMonth, this.currentYear);
    
    // Check if we have a valid token, if not prompt for it
    if (!this.hasValidToken) {
      console.log('❌ No valid token, prompting user...');
      await this.promptForToken();
    }
    
    // If still no valid token, don't proceed
    if (!this.hasValidToken) {
      this.errorMessage = 'API token is required to fetch data.';
      console.log('❌ Still no token after prompt, aborting...');
      return;
    }
    
    this.isPlantLoading = true;
    this.errorMessage = '';
    console.log('⏳ Starting plant API call...');
    
    try {
      await this.fetchPlantData();
      
      // Save fetched data to localStorage
      this.savePlantDataToStorage();
      
      // Clear refresh reminder after successful data refresh
      this.showRefreshReminder = false;
      
      this.updateMetricCards();
      this.updateAllCharts();
      console.log('✅ Plant data refresh completed successfully!');
    } catch (error: any) {
      console.log('❌ Plant data refresh failed:', error);
      
      if (error.status === 0) {
        this.errorMessage = 'CORS Error: Cannot connect to server. Check if CORS is properly configured on the server.';
      } else if (error.status === 401 || error.status === 403) {
        this.errorMessage = 'Authentication failed. Please check your API token.';
      } else {
        this.errorMessage = `Failed to fetch plant data. Server returned: ${error.status} - ${error.statusText}`;
      }
      console.error('Error fetching plant data:', error);
    } finally {
      this.isPlantLoading = false;
    }
  }

  private async fetchInverterData() {
    try {
      const url = `${this.API_BASE}/INVERTER/daily?month=${this.currentMonth}&year=${this.currentYear}`;
      console.log('🔄 Fetching INVERTER data from:', url);
      console.log('🔑 Current authToken:', this.authToken ? `${this.authToken.substring(0, 50)}...` : 'NO TOKEN');
      
      console.log('📤 Using fetch() instead of HttpClient to bypass CORS preflight');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Global-Home-Token': this.authToken
        },
        mode: 'cors'
      });
      
      console.log('📥 INVERTER response status:', response.status);
      console.log('📥 INVERTER response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ INVERTER response body:', data);
      
      if (data && data.summary) {
        this.inverterData = this.transformInverterData(data);
        console.log('📊 INVERTER data transformed:', this.inverterData);
      }
    } catch (error: any) {
      console.error('❌ Error fetching inverter data:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', error);
      throw error;
    }
  }

  private async fetchMeterData() {
    try {
      const url = `${this.API_BASE}/METER/daily?month=${this.currentMonth}&year=${this.currentYear}`;
      console.log('🔄 Fetching METER data from:', url);
      console.log('🔑 Current authToken:', this.authToken ? `${this.authToken.substring(0, 50)}...` : 'NO TOKEN');
      
      console.log('📤 Using fetch() instead of HttpClient to bypass CORS preflight');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Global-Home-Token': this.authToken
        },
        mode: 'cors'
      });
      
      console.log('📥 METER response status:', response.status);
      console.log('📥 METER response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ METER response body:', data);
      
      if (data && data.summary) {
        this.meterData = this.transformMeterData(data);
        console.log('📊 METER data transformed:', this.meterData);
      }
    } catch (error: any) {
      console.error('❌ Error fetching meter data:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', error);
      throw error;
    }
  }

  private async fetchPlantData() {
    try {
      const url = `http://192.168.1.180:7070/metrics/plant/daily?month=${this.currentMonth}&year=${this.currentYear}`;
      console.log('🔄 Fetching PLANT data from:', url);
      console.log('🔑 Current authToken:', this.authToken ? `${this.authToken.substring(0, 50)}...` : 'NO TOKEN');
      
      console.log('📤 Using fetch() instead of HttpClient to bypass CORS preflight');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Global-Home-Token': this.authToken
        },
        mode: 'cors'
      });
      
      console.log('📥 PLANT response status:', response.status);
      console.log('📥 PLANT response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ PLANT response body:', data);
      
      if (data && data.summary) {
        this.plantData = this.transformPlantData(data);
        console.log('📊 PLANT data transformed:', this.plantData);
      }
    } catch (error: any) {
      console.error('❌ Error fetching plant data:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', error);
      throw error;
    }
  }

  private transformInverterData(response: DeviceResponse): EnergyData[] {
    const serverData = response.summary.map(item => {
      const date = new Date(item.date);
      const dayNumber = date.getDate().toString().padStart(2, '0');
      
      // Use the correct property name from the actual API response
      const energyValue = item.paramsSummary?.production_kwh_ || 0;
      
      return {
        date: item.date,
        value: energyValue,
        day: dayNumber
      };
    });

    // Fill missing days with zero values
    return this.fillMissingDays(
      serverData,
      this.currentMonth,
      this.currentYear,
      (day: number, dateStr: string) => ({
        date: dateStr,
        value: 0,
        day: day.toString().padStart(2, '0')
      })
    );
  }

  private transformMeterData(response: DeviceResponse): MeterEnergyData[] {
    const serverData = response.summary.map(item => {
      const date = new Date(item.date);
      const dayNumber = date.getDate().toString().padStart(2, '0');
      
      // Transform API response to match MeterEnergyData interface
      return {
        date: item.date,
        day: dayNumber,
        exportMain: item.paramsSummary?.total_negative_energy_kwh_ || 0,       // Whole home export (all phases)
        exportTariff2: item.paramsSummary?.total_negative_energy_2_kwh_ || 0,  // Single-phase export
        importMain: item.paramsSummary?.total_positive_energy_kwh_ || 0,       // Whole home import (all phases)
        importTariff2: item.paramsSummary?.total_positive_energy_2_kwh_ || 0   // Single-phase import
      };
    });

    // Fill missing days with zero values
    return this.fillMissingDays(
      serverData,
      this.currentMonth,
      this.currentYear,
      (day: number, dateStr: string) => ({
        date: dateStr,
        day: day.toString().padStart(2, '0'),
        exportMain: 0,
        exportTariff2: 0,
        importMain: 0,
        importTariff2: 0
      })
    );
  }

  private transformPlantData(response: DeviceResponse): PlantData[] {
    console.log('🔍 PLANT API Response structure:', JSON.stringify(response, null, 2));
    console.log('🔍 First summary item:', JSON.stringify(response.summary[0], null, 2));
    console.log('🔍 First paramsSummary keys:', Object.keys(response.summary[0].paramsSummary || {}));
    
    const serverData = response.summary.map(item => {
      const date = new Date(item.date);
      const dayNumber = date.getDate().toString().padStart(2, '0');
      
      console.log(`🔍 Day ${dayNumber} paramsSummary:`, item.paramsSummary);
      
      // Transform API response using the CORRECT property names from your server
      const params = item.paramsSummary || {};
      
      const totalProduction = params.production_kwh_ || 0;
      const totalConsumption = params.consumption_kwh_ || 0;
      const gridFeed = params.grid_feed_in_kwh_ || 0;
      const gridConsumption = params.energy_purchased_kwh_ || 0;
      
      // Calculate self consumption: production that was consumed locally (not fed into grid)
      const selfConsumption = Math.max(0, totalProduction - gridFeed);
      
      // Calculate self sufficiency percentage: how much of consumption was met by own production
      const selfSufficiency = totalConsumption > 0 ? (selfConsumption / totalConsumption) * 100 : 0;
      
      console.log(`🔍 Day ${dayNumber} calculated values:`, {
        totalProduction,
        totalConsumption,
        gridFeed,
        gridConsumption,
        selfConsumption,
        selfSufficiency
      });
      
      return {
        date: item.date,
        day: dayNumber,
        totalProduction,
        totalConsumption,
        gridFeed,
        gridConsumption,
        selfConsumption,
        selfSufficiency
      };
    });

    // Fill missing days with zero values
    return this.fillMissingDays(
      serverData,
      this.currentMonth,
      this.currentYear,
      (day: number, dateStr: string) => ({
        date: dateStr,
        day: day.toString().padStart(2, '0'),
        totalProduction: 0,
        totalConsumption: 0,
        gridFeed: 0,
        gridConsumption: 0,
        selfConsumption: 0,
        selfSufficiency: 0
      })
    );
  }

  updateMetricCards() {
    // Calculate combined metrics from both inverter and meter data
    const inverterTotal = this.inverterData.reduce((sum, item) => sum + item.value, 0);
    const meterExportTotal = this.meterData.reduce((sum, item) => sum + item.exportMain, 0);
    const meterImportTotal = this.meterData.reduce((sum, item) => sum + item.importMain + item.importTariff2, 0);
    const homeUsage = this.meterData.reduce((sum, item) => sum + item.importTariff2, 0);

    this.metricCards = [
      {
        title: 'Solar Production',
        value: `${inverterTotal.toFixed(2)} kWh`,
        icon: 'pi pi-sun',
        color: 'white',
        bgColor: 'linear-gradient(45deg,rgb(34, 99, 197),rgb(30, 103, 192))'
      },
      {
        title: 'Grid Export', 
        value: `${meterExportTotal.toFixed(2)} kWh`,
        icon: 'pi pi-upload',
        color: 'white',
        bgColor: 'linear-gradient(45deg, #059669, #047857)'
      },
      {
        title: 'Grid Import',
        value: `${meterImportTotal.toFixed(2)} kWh`, 
        icon: 'pi pi-download',
        color: 'white',
        bgColor: 'linear-gradient(45deg, #ef4444, #dc2626)'
      },
      {
        title: 'Home Usage',
        value: `${homeUsage.toFixed(2)} kWh`,
        icon: 'pi pi-home',
        color: 'white', 
        bgColor: 'linear-gradient(45deg, #8b5cf6, #7c3aed)'
      }
    ];
  }

  updateAllCharts() {
    console.log('📊 Updating all charts...');
    this.updateInverterChart();
    this.updateMeterChart();
    this.updatePlantChart();
    
    // Force chart update if available
    setTimeout(() => {
      if (this.chart) {
        console.log('🔄 Forcing chart update...');
        this.chart.update();
      }
    }, 10);
  }

  private updateInverterChart() {
    console.log('🔧 Updating inverter chart with data:', this.inverterData);
    
    const labels = this.inverterData.map(item => item.day);
    const values = this.inverterData.map(item => item.value);
    
    console.log('📊 Inverter chart labels:', labels);
    console.log('📊 Inverter chart values:', values);

    this.inverterChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Solar Production',
          data: values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: 'rgb(59, 130, 246)',
          pointHoverBackgroundColor: 'rgb(37, 99, 235)',
          pointHoverBorderColor: 'rgb(37, 99, 235)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3
        }
      ]
    };

    this.inverterChartOptions.plugins!.title!.text = `Solar Production - ${this.currentDateDisplayText}`;
    console.log('✅ Inverter chart data updated:', this.inverterChartData);
  }

  private updateMeterChart() {
    console.log('🔧 Updating meter chart with data:', this.meterData);
    
    const labels = this.meterData.map(item => item.day);
    console.log('📊 Meter chart labels:', labels);

    // Helper function to check if dataset has meaningful data (not all zeros)
    const hasData = (values: number[]) => values.some(value => value > 0);

    // Prepare all possible datasets
    const potentialDatasets = [
      {
        condition: hasData(this.meterData.map(item => item.exportMain)),
        dataset: {
          label: 'Export Whole Home (All Phases)',
          data: this.meterData.map(item => item.exportMain),
          borderColor: 'rgb(34, 197, 94)', // Green for export
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
      },
      {
        condition: hasData(this.meterData.map(item => item.exportTariff2)),
        dataset: {
          label: 'Export Single Phase',
          data: this.meterData.map(item => item.exportTariff2),
          borderColor: 'rgb(132, 204, 22)', // Light green for single phase export
          backgroundColor: 'rgba(132, 204, 22, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(132, 204, 22)',
          pointBorderColor: 'rgb(132, 204, 22)',
          pointHoverBackgroundColor: 'rgb(101, 163, 13)',
          pointHoverBorderColor: 'rgb(101, 163, 13)',
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 3,
          borderDash: [5, 5] // Dashed line for single phase
        }
      },
      {
        condition: hasData(this.meterData.map(item => item.importMain)),
        dataset: {
          label: 'Import Whole Home (All Phases)',
          data: this.meterData.map(item => item.importMain),
          borderColor: 'rgb(239, 68, 68)', // Red for import
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
        condition: hasData(this.meterData.map(item => item.importTariff2)),
        dataset: {
          label: 'Import Single Phase',
          data: this.meterData.map(item => item.importTariff2),
          borderColor: 'rgb(249, 115, 22)', // Orange for single phase import
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
          borderDash: [5, 5] // Dashed line for single phase
        }
      }
    ];

    // Filter datasets to only include those with meaningful data
    const validDatasets = potentialDatasets
      .filter(item => item.condition)
      .map(item => item.dataset);

    console.log('📊 Filtered datasets (excluding all-zero data):', validDatasets.length, 'out of', potentialDatasets.length);

    this.meterChartData = {
      labels: labels,
      datasets: validDatasets
    };

    this.meterChartOptions.plugins!.title!.text = `Grid Energy Flow - ${this.currentDateDisplayText}`;
    console.log('✅ Meter chart data updated with meaningful data only:', this.meterChartData);
  }

  private updatePlantChart() {
    console.log('🔧 Updating plant chart with data:', this.plantData);
    console.log('🔍 Plant data sample values:', {
      totalProduction: this.plantData.slice(0, 3).map(d => d.totalProduction),
      totalConsumption: this.plantData.slice(0, 3).map(d => d.totalConsumption),
      selfConsumption: this.plantData.slice(0, 3).map(d => d.selfConsumption),
      gridFeed: this.plantData.slice(0, 3).map(d => d.gridFeed)
    });
    
    const labels = this.plantData.map(item => item.day);
    console.log('📊 Plant chart labels:', labels);

    // TEMPORARILY DISABLED: Show ALL datasets regardless of data to debug
    // Helper function to check if dataset has meaningful data (not all zeros)
    // const hasData = (values: number[]) => values.some(value => value > 0);

    // Prepare all possible datasets for plant metrics - ALWAYS SHOW ALL
    const allDatasets = [
      {
        label: 'Total Production',
        data: this.plantData.map(item => item.totalProduction),
        borderColor: 'rgb(59, 130, 246)', // Blue for production
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'rgb(59, 130, 246)',
        pointHoverBackgroundColor: 'rgb(37, 99, 235)',
        pointHoverBorderColor: 'rgb(37, 99, 235)',
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 3
      },
      {
        label: 'Total Consumption',
        data: this.plantData.map(item => item.totalConsumption),
        borderColor: 'rgb(239, 68, 68)', // Red for consumption
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
      },
      {
        label: 'Self Consumption',
        data: this.plantData.map(item => item.selfConsumption),
        borderColor: 'rgb(139, 92, 246)', // Purple for self consumption
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: 'rgb(139, 92, 246)',
        pointHoverBackgroundColor: 'rgb(124, 58, 237)',
        pointHoverBorderColor: 'rgb(124, 58, 237)',
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 3
      },
      {
        label: 'Grid Feed',
        data: this.plantData.map(item => item.gridFeed),
        borderColor: 'rgb(16, 185, 129)', // Teal for grid feed
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
    ];

    console.log('📊 Plant chart datasets (SHOWING ALL FOR DEBUG):', allDatasets.length);
    console.log('📊 First dataset data sample:', allDatasets[0].data.slice(0, 5));
    
    this.plantChartData = {
      labels: labels,
      datasets: allDatasets
    };

    this.plantChartOptions.plugins!.title!.text = `Plant Energy Overview - ${this.currentDateDisplayText}`;
    console.log('✅ Plant chart data updated with meaningful data only:', this.plantChartData);
    const finalDatasetCount = this.plantChartData.datasets?.length || 0;
    console.log('🔍 Final chart datasets count:', finalDatasetCount);
    console.log('🔍 Chart data structure:', {
      hasLabels: this.plantChartData.labels && this.plantChartData.labels.length > 0,
      hasDatasets: this.plantChartData.datasets && this.plantChartData.datasets.length > 0,
      datasetCount: finalDatasetCount
    });
    
    if (finalDatasetCount === 0) {
      console.warn('⚠️ No datasets in plant chart! Chart will show "Plant data is being prepared..."');
    } else {
      console.log('✅ Plant chart should render with', finalDatasetCount, 'datasets');
    }
  }
}
