import { Injectable } from '@angular/core';
import { 
  EnergyData, 
  MeterEnergyData, 
  PlantData, 
  DetailedDeviceData, 
  DetailedMeterData,
  DetailedPlantData,
  StoredData 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // Storage Keys
  private readonly TOKEN_STORAGE_KEY = 'global-home-token';
  private readonly MONTH_STORAGE_KEY = 'global-home-month';
  private readonly YEAR_STORAGE_KEY = 'global-home-year';
  private readonly DETAILED_DATE_RANGE_KEY = 'global-home-detailed-date-range';
  private readonly DETAILED_PLANT_DATE_KEY = 'global-home-detailed-plant-date';
  private readonly INVERTER_DATA_KEY = 'global-home-inverter-data';
  private readonly METER_DATA_KEY = 'global-home-meter-data';
  private readonly PLANT_DATA_KEY = 'global-home-plant-data';
  private readonly DETAILED_INVERTER_DATA_KEY = 'global-home-detailed-inverter-data';
  private readonly DETAILED_METER_DATA_KEY = 'global-home-detailed-meter-data';
  private readonly DETAILED_PLANT_DATA_KEY = 'global-home-detailed-plant-data';

  constructor() {}

  // Token Management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_STORAGE_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
  }

  // Date Settings
  getMonth(): string | null {
    return localStorage.getItem(this.MONTH_STORAGE_KEY);
  }

  setMonth(month: string): void {
    localStorage.setItem(this.MONTH_STORAGE_KEY, month);
  }

  getYear(): string | null {
    return localStorage.getItem(this.YEAR_STORAGE_KEY);
  }

  setYear(year: string): void {
    localStorage.setItem(this.YEAR_STORAGE_KEY, year);
  }

  setDateSettings(month: string, year: string): void {
    this.setMonth(month);
    this.setYear(year);
  }

  // Detailed Date Range
  getDetailedDateRange(): Date[] | null {
    const storedRange = localStorage.getItem(this.DETAILED_DATE_RANGE_KEY);
    if (storedRange) {
      try {
        const parsed = JSON.parse(storedRange);
        if (Array.isArray(parsed) && parsed.length === 2) {
          return [new Date(parsed[0]), new Date(parsed[1])];
        }
      } catch (error) {
        console.error('Failed to parse stored date range:', error);
      }
    }
    return null;
  }

  setDetailedDateRange(dateRange: Date[]): void {
    if (dateRange && dateRange.length === 2) {
      const serialized = JSON.stringify([
        dateRange[0].toISOString(),
        dateRange[1].toISOString()
      ]);
      localStorage.setItem(this.DETAILED_DATE_RANGE_KEY, serialized);
    }
  }

  // Detailed Plant Date (single date)
  getDetailedPlantDate(): Date | null {
    const storedDate = localStorage.getItem(this.DETAILED_PLANT_DATE_KEY);
    if (storedDate) {
      try {
        return new Date(storedDate);
      } catch (error) {
        console.error('Failed to parse stored plant date:', error);
      }
    }
    return null;
  }

  setDetailedPlantDate(date: Date): void {
    if (date) {
      localStorage.setItem(this.DETAILED_PLANT_DATE_KEY, date.toISOString());
    }
  }

  // Generic Data Storage Methods
  private storeData<T>(key: string, data: T[], description: string): void {
    try {
      const dataToStore: StoredData<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(dataToStore));
      console.log(`💾 ${description} saved to storage:`, data.length, 'items');
    } catch (error) {
      console.error(`❌ Failed to save ${description} to storage:`, error);
    }
  }

  private loadData<T>(key: string, description: string): T[] | null {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: StoredData<T> = JSON.parse(stored);
        console.log(`📁 Loaded ${description} from storage:`, parsed.data.length, 'items');
        return parsed.data;
      }
    } catch (error) {
      console.error(`❌ Failed to load ${description} from storage:`, error);
    }
    return null;
  }

  // Inverter Data
  storeInverterData(data: EnergyData[]): void {
    this.storeData(this.INVERTER_DATA_KEY, data, 'inverter data');
  }

  loadInverterData(): EnergyData[] | null {
    return this.loadData<EnergyData>(this.INVERTER_DATA_KEY, 'inverter data');
  }

  // Meter Data
  storeMeterData(data: MeterEnergyData[]): void {
    this.storeData(this.METER_DATA_KEY, data, 'meter data');
  }

  loadMeterData(): MeterEnergyData[] | null {
    return this.loadData<MeterEnergyData>(this.METER_DATA_KEY, 'meter data');
  }

  // Plant Data
  storePlantData(data: PlantData[]): void {
    this.storeData(this.PLANT_DATA_KEY, data, 'plant data');
  }

  loadPlantData(): PlantData[] | null {
    return this.loadData<PlantData>(this.PLANT_DATA_KEY, 'plant data');
  }

  // Detailed Inverter Data
  storeDetailedInverterData(data: DetailedDeviceData[]): void {
    this.storeData(this.DETAILED_INVERTER_DATA_KEY, data, 'detailed inverter data');
  }

  loadDetailedInverterData(): DetailedDeviceData[] | null {
    return this.loadData<DetailedDeviceData>(this.DETAILED_INVERTER_DATA_KEY, 'detailed inverter data');
  }

  // Detailed Meter Data
  storeDetailedMeterData(data: DetailedMeterData[]): void {
    this.storeData(this.DETAILED_METER_DATA_KEY, data, 'detailed meter data');
  }

  loadDetailedMeterData(): DetailedMeterData[] | null {
    return this.loadData<DetailedMeterData>(this.DETAILED_METER_DATA_KEY, 'detailed meter data');
  }

  // Detailed Plant Data
  storeDetailedPlantData(data: DetailedPlantData[]): void {
    this.storeData(this.DETAILED_PLANT_DATA_KEY, data, 'detailed plant data');
  }

  loadDetailedPlantData(): DetailedPlantData[] | null {
    return this.loadData<DetailedPlantData>(this.DETAILED_PLANT_DATA_KEY, 'detailed plant data');
  }

  // Utility Methods
  clearAllData(): void {
    const keys = [
      this.INVERTER_DATA_KEY,
      this.METER_DATA_KEY,
      this.PLANT_DATA_KEY,
      this.DETAILED_INVERTER_DATA_KEY,
      this.DETAILED_METER_DATA_KEY,
      this.DETAILED_PLANT_DATA_KEY
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ All stored energy data cleared');
  }

  clearSettings(): void {
    const keys = [
      this.MONTH_STORAGE_KEY,
      this.YEAR_STORAGE_KEY,
      this.DETAILED_DATE_RANGE_KEY,
      this.DETAILED_PLANT_DATE_KEY
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ All stored settings cleared');
  }
}
