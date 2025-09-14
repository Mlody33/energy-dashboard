import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, ChartData } from 'chart.js';

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
  exportMain: number;      // total_negative_energy_kwh_
  exportTariff2: number;   // total_negative_energy_2_kwh_
  importMain: number;      // total_positive_energy_kwh_
  importTariff2: number;   // total_positive_energy_2_kwh_
}

interface DeviceResponse {
  deviceName: string;
  summary: Array<{
    date: string;
    paramsSummary: any;
  }>;
  uuid: string;
}

type DataType = 'inverter' | 'meter';
type MeterDataType = 'exportMain' | 'exportTariff2' | 'importMain' | 'importTariff2';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  selectedDataType: DataType = 'inverter';
  selectedMeterDataType: MeterDataType = 'exportMain';
  showAllMeterData: boolean = true;
  
  // Loading and API state
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Token management
  private authToken: string = '';
  private readonly TOKEN_STORAGE_KEY = 'global-home-token';
  
  // Date settings
  currentMonth: string = '09';
  currentYear: string = '2025';
  private readonly MONTH_STORAGE_KEY = 'global-home-month';
  private readonly YEAR_STORAGE_KEY = 'global-home-year';
  
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
  meterData: MeterEnergyData[] = [
    { date: '2025-09-01', day: '01', exportMain: 26.0, exportTariff2: 4.2, importMain: 7.28, importTariff2: 7.74 },
    { date: '2025-09-02', day: '02', exportMain: 36.73, exportTariff2: 5.8, importMain: 5.37, importTariff2: 5.7 },
    { date: '2025-09-03', day: '03', exportMain: 24.05, exportTariff2: 3.1, importMain: 8.47, importTariff2: 7.52 },
    { date: '2025-09-04', day: '04', exportMain: 36.0, exportTariff2: 6.2, importMain: 7.49, importTariff2: 7.64 },
    { date: '2025-09-05', day: '05', exportMain: 27.16, exportTariff2: 3.8, importMain: 8.53, importTariff2: 6.17 },
    { date: '2025-09-06', day: '06', exportMain: 3.43, exportTariff2: 0.5, importMain: 15.51, importTariff2: 14.36 },
    { date: '2025-09-07', day: '07', exportMain: 9.96, exportTariff2: 1.2, importMain: 10.85, importTariff2: 11.09 },
    { date: '2025-09-08', day: '08', exportMain: 21.01, exportTariff2: 2.9, importMain: 9.48, importTariff2: 9.87 },
    { date: '2025-09-09', day: '09', exportMain: 45.92, exportTariff2: 7.3, importMain: 7.5, importTariff2: 6.83 },
    { date: '2025-09-10', day: '10', exportMain: 35.35, exportTariff2: 4.9, importMain: 8.42, importTariff2: 10.7 },
    { date: '2025-09-11', day: '11', exportMain: 18.85, exportTariff2: 2.1, importMain: 10.06, importTariff2: 7.78 },
    { date: '2025-09-12', day: '12', exportMain: 41.63, exportTariff2: 6.7, importMain: 5.4, importTariff2: 5.58 },
    { date: '2025-09-13', day: '13', exportMain: 25.78, exportTariff2: 3.4, importMain: 8.22, importTariff2: 9.77 }
  ];

  // Chart configuration
  public chartType = 'line' as const;
  public chartData: ChartData<'line'> = {
    labels: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13'],
    datasets: [
      {
        label: 'Sample Data',
        data: [30, 40, 28, 40, 28, 9, 17, 24, 49, 40, 23, 45, 34],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  public chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Energy Data'
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

  get currentChartData() {
    return this.selectedDataType === 'inverter' ? this.inverterData : this.meterData;
  }

  get chartTitle() {
    return this.selectedDataType === 'inverter' ? 'Inverter Production' : 'Meter Energy Data';
  }

  get chartSubtitle() {
    return this.selectedDataType === 'inverter' 
      ? 'Daily energy production from solar inverter' 
      : 'Daily energy import/export from grid meter';
  }

  get chartUnit() {
    return 'kWh';
  }

  get totalEnergy() {
    if (this.selectedDataType === 'inverter') {
      return this.inverterData.reduce((sum, item) => sum + item.value, 0);
    } else {
      // For meter, sum all energy types
      return this.meterData.reduce((sum, item) => 
        sum + item.exportMain + item.exportTariff2 + item.importMain + item.importTariff2, 0);
    }
  }

  get averageEnergy() {
    return this.totalEnergy / this.currentChartData.length;
  }

  get peakEnergy() {
    if (this.selectedDataType === 'inverter') {
      return Math.max(...this.inverterData.map(item => item.value));
    } else {
      // For meter, find the peak across all energy types
      return Math.max(...this.meterData.map(item => 
        Math.max(item.exportMain, item.exportTariff2, item.importMain, item.importTariff2)));
    }
  }

  get minEnergy() {
    if (this.selectedDataType === 'inverter') {
      return Math.min(...this.inverterData.map(item => item.value));
    } else {
      // For meter, find the minimum across all energy types (excluding zeros)
      const allValues = this.meterData.flatMap(item => 
        [item.exportMain, item.exportTariff2, item.importMain, item.importTariff2]
      ).filter(val => val > 0);
      return Math.min(...allValues);
    }
  }

  get daysActive() {
    return this.currentChartData.length;
  }

  get totalExportMain() {
    return this.meterData.reduce((sum, item) => sum + item.exportMain, 0);
  }

  get totalImportMain() {
    return this.meterData.reduce((sum, item) => sum + item.importMain, 0);
  }

  get totalImportTariff2() {
    return this.meterData.reduce((sum, item) => sum + item.importTariff2, 0);
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
    console.log('🔧 Sample data available:', {
      inverter: this.inverterData.length,
      meter: this.meterData.length
    });
    
    this.loadTokenFromStorage();
    this.loadDateSettingsFromStorage();
    
    // Initialize chart with existing data
    console.log('📊 Initializing chart data...');
    this.updateChartData();
    console.log('📊 Chart data after initialization:', this.chartData);
    
    // Force a second update after a delay
    setTimeout(() => {
      console.log('📊 Force updating chart data again...');
      this.updateChartData();
      console.log('📊 Chart data after forced update:', this.chartData);
    }, 500);
    
    // Data will only be fetched when refresh button is clicked
  }

  ngAfterViewInit() {
    console.log('🔧 Dashboard AfterViewInit - Chart reference:', this.chart);
    
    // Force chart update after view is initialized
    setTimeout(() => {
      console.log('🔧 Force updating chart after view init...');
      this.updateChartData();
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
  }

  private saveDateSettingsToStorage(month: string, year: string) {
    localStorage.setItem(this.MONTH_STORAGE_KEY, month);
    localStorage.setItem(this.YEAR_STORAGE_KEY, year);
    this.currentMonth = month;
    this.currentYear = year;
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
    this.saveDateSettingsToStorage(newMonth, this.currentYear);
    // Month changed - user can manually refresh data if needed
  }

  onYearChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newYear = target.value;
    this.saveDateSettingsToStorage(this.currentMonth, newYear);
    // Year changed - user can manually refresh data if needed
  }


  get currentDateDisplayText(): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(this.currentMonth, 10) - 1;
    return `${monthNames[monthIndex]} ${this.currentYear}`;
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
        this.fetchMeterData()
      ]);
      this.updateMetricCards();
      this.updateChartData();
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

  private transformInverterData(response: DeviceResponse): EnergyData[] {
    return response.summary.map(item => {
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
  }

  private transformMeterData(response: DeviceResponse): MeterEnergyData[] {
    return response.summary.map(item => {
      const date = new Date(item.date);
      const dayNumber = date.getDate().toString().padStart(2, '0');
      
      // Transform API response to match MeterEnergyData interface
      // Adjust these property names based on actual API response structure
      return {
        date: item.date,
        day: dayNumber,
        exportMain: item.paramsSummary?.total_negative_energy_kwh_ || 0,
        exportTariff2: item.paramsSummary?.total_negative_energy_2_kwh_ || 0,
        importMain: item.paramsSummary?.total_positive_energy_kwh_ || 0,
        importTariff2: item.paramsSummary?.total_positive_energy_2_kwh_ || 0
      };
    });
  }

  onDataTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedDataType = target.value as DataType;
    this.updateMetricCards();
    this.updateChartData();
  }

  updateMetricCards() {
    if (this.selectedDataType === 'inverter') {
      const data = this.inverterData;
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const average = total / data.length;
      const peak = Math.max(...data.map(item => item.value));
        this.metricCards = [
          {
            title: 'Total Production',
            value: `${total.toFixed(2)} kWh`,
            icon: 'pi pi-bolt',
            color: 'white',
            bgColor: 'linear-gradient(45deg, #10b981, #059669)'
          },
          {
            title: 'Average Daily', 
            value: `${average.toFixed(2)} kWh`,
            icon: 'pi pi-chart-line',
            color: 'white',
            bgColor: 'linear-gradient(45deg, #6b7280, #4b5563)'
          },
          {
            title: 'Peak Day',
            value: `${peak.toFixed(2)} kWh`, 
            icon: 'pi pi-arrow-up',
            color: 'white',
            bgColor: 'linear-gradient(45deg, #374151, #1f2937)'
          },
          {
            title: 'Days Active',
            value: `${data.length}`,
            icon: 'pi pi-calendar',
            color: 'white', 
            bgColor: 'linear-gradient(45deg, #f59e0b, #d97706)'
          }
        ];
      } else {
        const data = this.meterData;
        const totalExport = data.reduce((sum, item) => sum + item.exportMain, 0);
        const totalImportMain = data.reduce((sum, item) => sum + item.importMain, 0);
        const totalImportT2 = data.reduce((sum, item) => sum + item.importTariff2, 0);
        const peakValue = Math.max(...data.map(item => 
          Math.max(item.exportMain, item.importMain, item.importTariff2)));
  
        this.metricCards = [
          {
            title: 'Total Exported',
            value: `${totalExport.toFixed(2)} kWh`,
            icon: 'pi pi-upload',
            color: 'white',
            bgColor: 'linear-gradient(45deg, #059669, #047857)'
          },
          {
            title: 'Total Import Main', 
            value: `${totalImportMain.toFixed(2)} kWh`,
            icon: 'pi pi-download',
            color: 'white',
            bgColor: 'linear-gradient(45deg, #ef4444, #dc2626)'
          },
          {
            title: 'Import Tariff 2',
            value: `${totalImportT2.toFixed(2)} kWh`, 
            icon: 'pi pi-clock',
            color: 'white',
            bgColor: 'linear-gradient(45deg, #f97316, #ea580c)'
          },
          {
            title: 'Days Active',
            value: `${data.length}`,
            icon: 'pi pi-calendar',
            color: 'white', 
            bgColor: 'linear-gradient(45deg, #6b7280, #4b5563)'
          }
        ];
      }
  }

  updateChartData() {
    console.log('📊 updateChartData called for:', this.selectedDataType);
    
    if (this.selectedDataType === 'inverter') {
      this.updateInverterChart();
    } else {
      this.updateMeterChart();
    }
    
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
    
    console.log('📊 Chart labels:', labels);
    console.log('📊 Chart values:', values);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Inverter Production',
          data: values,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: 'rgb(16, 185, 129)',
          pointHoverBackgroundColor: 'rgb(5, 150, 105)',
          pointHoverBorderColor: 'rgb(5, 150, 105)',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        }
      ]
    };

    this.chartOptions.plugins!.title!.text = `Inverter Production - ${this.currentDateDisplayText}`;
    console.log('✅ Chart data updated:', this.chartData);
  }

  private updateMeterChart() {
    console.log('🔧 Updating meter chart with data:', this.meterData);
    
    const labels = this.meterData.map(item => item.day);
    console.log('📊 Meter chart labels:', labels);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Export Main (Grid Feed-in)',
          data: this.meterData.map(item => item.exportMain),
          borderColor: 'rgb(34, 197, 94)', // Green for export
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: 'rgb(34, 197, 94)',
          pointHoverBackgroundColor: 'rgb(22, 163, 74)',
          pointHoverBorderColor: 'rgb(22, 163, 74)',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        },
        {
          label: 'Export Tariff 2 (Off-Peak Export)',
          data: this.meterData.map(item => item.exportTariff2),
          borderColor: 'rgb(132, 204, 22)', // Light green for export tariff 2
          backgroundColor: 'rgba(132, 204, 22, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(132, 204, 22)',
          pointBorderColor: 'rgb(132, 204, 22)',
          pointHoverBackgroundColor: 'rgb(101, 163, 13)',
          pointHoverBorderColor: 'rgb(101, 163, 13)',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        },
        {
          label: 'Import Main (Grid Consumption)',
          data: this.meterData.map(item => item.importMain),
          borderColor: 'rgb(239, 68, 68)', // Red for import
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: 'rgb(239, 68, 68)',
          pointHoverBackgroundColor: 'rgb(220, 38, 38)',
          pointHoverBorderColor: 'rgb(220, 38, 38)',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        },
        {
          label: 'Import Tariff 2 (Off-Peak Import)',
          data: this.meterData.map(item => item.importTariff2),
          borderColor: 'rgb(249, 115, 22)', // Orange for import tariff 2
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(249, 115, 22)',
          pointBorderColor: 'rgb(249, 115, 22)',
          pointHoverBackgroundColor: 'rgb(234, 88, 12)',
          pointHoverBorderColor: 'rgb(234, 88, 12)',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        }
      ]
    };

    this.chartOptions.plugins!.title!.text = `Meter Energy Data - ${this.currentDateDisplayText}`;
    console.log('✅ Meter chart data updated with all 4 data types:', this.chartData);
  }
}
