import { Injectable } from '@angular/core';
import { 
  EnergyData, 
  MeterEnergyData, 
  PlantData, 
  DetailedDeviceData, 
  DetailedMeterData,
  DeviceResponse 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class DataTransformService {

  constructor() {}

  /**
   * Get the number of days in a given month/year
   */
  private getDaysInMonth(month: string, year: string): number {
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  }

  /**
   * Fill missing days in data array with default values
   */
  fillMissingDays<T extends { date: string; day: string }>(
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

  /**
   * Transform API response to inverter data
   */
  transformInverterData(response: DeviceResponse, month: string, year: string): EnergyData[] {
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
      month,
      year,
      (day: number, dateStr: string) => ({
        date: dateStr,
        value: 0,
        day: day.toString().padStart(2, '0')
      })
    );
  }

  /**
   * Transform API response to meter data
   */
  transformMeterData(response: DeviceResponse, month: string, year: string): MeterEnergyData[] {
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
      month,
      year,
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

  /**
   * Transform API response to plant data
   */
  transformPlantData(response: DeviceResponse, month: string, year: string): PlantData[] {
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
      month,
      year,
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

  /**
   * Transform detailed device data (no month filling needed)
   */
  transformDetailedInverterData(response: DeviceResponse): DetailedDeviceData[] {
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

  /**
   * Transform detailed meter data (no month filling needed)
   */
  transformDetailedMeterData(response: DeviceResponse): DetailedMeterData[] {
    return response.summary.map(item => {
      const date = new Date(item.date);
      const dayNumber = date.getDate().toString().padStart(2, '0');
      
      // Transform API response to match DetailedMeterData interface
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

  /**
   * Create fallback data for a given month/year
   */
  createFallbackInverterData(month: string, year: string): EnergyData[] {
    return this.fillMissingDays(
      [],
      month,
      year,
      (day: number, dateStr: string) => ({
        date: dateStr,
        value: 0,
        day: day.toString().padStart(2, '0')
      })
    );
  }

  /**
   * Create fallback meter data for a given month/year
   */
  createFallbackMeterData(month: string, year: string): MeterEnergyData[] {
    return this.fillMissingDays(
      [],
      month,
      year,
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

  /**
   * Create fallback plant data for a given month/year
   */
  createFallbackPlantData(month: string, year: string): PlantData[] {
    return this.fillMissingDays(
      [],
      month,
      year,
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
